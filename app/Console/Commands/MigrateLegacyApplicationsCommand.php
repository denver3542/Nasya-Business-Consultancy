<?php

namespace App\Console\Commands;

use App\Actions\Legacy\LegacyApplicationTransformer;
use App\Models\Application;
use App\Models\ApplicationStatus;
use App\Models\ApplicationTimeline;
use App\Models\ApplicationType;
use App\Models\FormField;
use App\Models\FormFieldOption;
use App\Models\Payment;
use App\Models\Service;
use App\Models\ServiceStage;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Database\Connection;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MigrateLegacyApplicationsCommand extends Command
{
    protected $signature = 'legacy:migrate-applications
        {--legacy-connection=legacy_mysql : Legacy database connection name}
        {--chunk=200 : Chunk size for task processing}
        {--limit=0 : Optional maximum number of tasks}
        {--list-id= : Optional legacy list_id filter}
        {--task-id= : Optional single legacy task_id filter}
        {--dry-run : Analyze and report without writing}
        {--skip-payments : Skip importing legacy payments}';

    protected $description = 'Migrate legacy tasks and dynamic z* table data into normalized applications.';

    /**
     * @var array<string, int>
     */
    private array $applicationTypeMap = [];

    /**
     * @var array<string, int>
     */
    private array $serviceMap = [];

    /**
     * @var array<string, int>
     */
    private array $serviceStageMap = [];

    /**
     * @var array<string, int>
     */
    private array $applicationStatusMap = [];

    /**
     * @var array<int, int>
     */
    private array $clientUserMap = [];

    /**
     * @var array<int, int>
     */
    private array $staffUserMap = [];

    /**
     * @var array<int, bool>
     */
    private array $applicationTypeFieldsSynced = [];

    private int $nextDryId = 900000;

    private LegacyApplicationTransformer $transformer;

    public function __construct()
    {
        parent::__construct();

        $this->transformer = new LegacyApplicationTransformer;
    }

    public function handle(): int
    {
        $legacyConnection = (string) $this->option('legacy-connection');
        $dryRun = (bool) $this->option('dry-run');
        $skipPayments = (bool) $this->option('skip-payments');
        $chunkSize = max(1, (int) $this->option('chunk'));
        $limit = max(0, (int) $this->option('limit'));
        $legacyListFilter = $this->option('list-id');
        $legacyTaskFilter = $this->option('task-id');

        $legacy = DB::connection($legacyConnection);
        $this->ensureLegacyTablesExist($legacy);

        $spaceMap = $this->loadSpaceMap($legacy);
        $listMap = $this->loadListMap($legacy);
        $statusMap = $this->loadStatusMap($legacy);
        $spaceFieldMap = $this->loadSpaceFieldMap($legacy);
        $fieldOptionsMap = $this->loadFieldOptionsMap($legacy);
        $dynamicTableColumns = $this->loadDynamicTableColumns($legacy, array_values($spaceMap));

        $this->line(sprintf('Legacy connection: %s', $legacyConnection));
        $this->line(sprintf('Found %d dynamic service tables.', count($dynamicTableColumns)));

        $stats = [
            'seen' => 0,
            'created' => 0,
            'skipped' => 0,
            'payment_rows' => 0,
            'missing_dynamic' => 0,
            'missing_list' => 0,
            'missing_space' => 0,
            'errors' => 0,
        ];

        $query = $legacy->table('task')->orderBy('task_id');
        if ($legacyTaskFilter !== null) {
            $query->where('task_id', (int) $legacyTaskFilter);
        }
        if ($legacyListFilter !== null) {
            $query->where('task_list_id', (string) $legacyListFilter);
        }
        if ($limit > 0) {
            $query->limit($limit);
        }

        $query->chunkById($chunkSize, function ($tasks) use (
            &$stats,
            $legacy,
            $dryRun,
            $skipPayments,
            $listMap,
            $spaceMap,
            $statusMap,
            $spaceFieldMap,
            $fieldOptionsMap,
            $dynamicTableColumns
        ): void {
            foreach ($tasks as $task) {
                $stats['seen']++;

                $legacyTaskId = (int) $task->task_id;
                $legacyListId = (string) $task->task_list_id;

                $listRow = $listMap[$legacyListId] ?? null;
                if ($listRow === null) {
                    $stats['missing_list']++;
                    $stats['skipped']++;
                    $this->warn("Skipping task {$legacyTaskId}: missing list {$legacyListId}.");

                    continue;
                }

                $legacySpaceId = (string) Arr::get($listRow, 'list_space_id');
                $dynamicTable = $spaceMap[$legacySpaceId] ?? null;
                if ($dynamicTable === null || ! isset($dynamicTableColumns[$dynamicTable])) {
                    $stats['missing_space']++;
                    $stats['skipped']++;
                    $this->warn("Skipping task {$legacyTaskId}: missing dynamic table for space {$legacySpaceId}.");

                    continue;
                }

                $dynamicRow = $legacy->table($dynamicTable)->where('task_id', $legacyTaskId)->first();
                $formData = [];
                if ($dynamicRow !== null) {
                    $formData = $this->transformer->buildFormData((array) $dynamicRow);
                } else {
                    $stats['missing_dynamic']++;
                }

                try {
                    $result = $this->migrateTask(
                        legacy: $legacy,
                        task: (array) $task,
                        listRow: $listRow,
                        statusMap: $statusMap,
                        spaceFieldMap: $spaceFieldMap,
                        fieldOptionsMap: $fieldOptionsMap,
                        formData: $formData,
                        dynamicTable: $dynamicTable,
                        dryRun: $dryRun,
                        skipPayments: $skipPayments,
                    );

                    if ($result['created']) {
                        $stats['created']++;
                    } else {
                        $stats['skipped']++;
                    }

                    $stats['payment_rows'] += $result['payment_rows'];
                } catch (\Throwable $exception) {
                    $stats['errors']++;
                    report($exception);
                    $this->error("Task {$legacyTaskId} failed: {$exception->getMessage()}");
                }
            }
        }, 'task_id');

        $this->newLine();
        $this->table(['Metric', 'Count'], collect($stats)->map(fn (int $count, string $metric): array => [$metric, (string) $count]));
        if ($dryRun) {
            $this->info('Dry-run completed: no records were written.');
        } else {
            $this->info('Migration completed.');
        }

        return self::SUCCESS;
    }

    private function ensureLegacyTablesExist(Connection $legacy): void
    {
        foreach (['task', 'list', 'space', 'status', 'contact', 'user', 'field'] as $tableName) {
            if (! $legacy->getSchemaBuilder()->hasTable($tableName)) {
                throw new \RuntimeException("Required legacy table [{$tableName}] does not exist.");
            }
        }
    }

    /**
     * @return array<string, string>
     */
    private function loadSpaceMap(Connection $legacy): array
    {
        return $legacy->table('space')
            ->select(['space_id', 'space_db_table'])
            ->get()
            ->mapWithKeys(function ($row): array {
                return [(string) $row->space_id => (string) $row->space_db_table];
            })
            ->all();
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function loadListMap(Connection $legacy): array
    {
        return $legacy->table('list')
            ->select(['list_id', 'list_name', 'list_space_id'])
            ->get()
            ->mapWithKeys(function ($row): array {
                return [(string) $row->list_id => (array) $row];
            })
            ->all();
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function loadStatusMap(Connection $legacy): array
    {
        return $legacy->table('status')
            ->select(['status_id', 'status_name', 'status_list_id'])
            ->get()
            ->mapWithKeys(function ($row): array {
                return [(string) $row->status_id => (array) $row];
            })
            ->all();
    }

    /**
     * @return array<string, array<int, array<string, mixed>>>
     */
    private function loadSpaceFieldMap(Connection $legacy): array
    {
        return $legacy->table('field')
            ->select([
                'field_id',
                'field_order',
                'field_space_id',
                'field_type',
                'field_name',
                'field_col_name',
                'field_assign_to',
            ])
            ->orderBy('field_space_id')
            ->orderBy('field_order')
            ->orderBy('field_id')
            ->get()
            ->groupBy(fn ($row): string => (string) $row->field_space_id)
            ->map(function ($rows): array {
                return $rows->map(fn ($row): array => (array) $row)->values()->all();
            })
            ->all();
    }

    /**
     * @return array<int, array<int, array{label: string, value: string, display_order: int}>>
     */
    private function loadFieldOptionsMap(Connection $legacy): array
    {
        if (! $legacy->getSchemaBuilder()->hasTable('child')) {
            return [];
        }

        return $legacy->table('child')
            ->select(['child_id', 'child_order', 'child_name', 'child_field_id'])
            ->orderBy('child_field_id')
            ->orderBy('child_order')
            ->orderBy('child_id')
            ->get()
            ->groupBy(fn ($row): int => (int) $row->child_field_id)
            ->map(function ($rows): array {
                return $rows->map(function ($row): array {
                    return [
                        'label' => trim((string) $row->child_name),
                        'value' => (string) $row->child_id,
                        'display_order' => (int) ($row->child_order ?? 0),
                    ];
                })->values()->all();
            })
            ->all();
    }

    /**
     * @param  array<int, string>  $dynamicTables
     * @return array<string, array<int, string>>
     */
    private function loadDynamicTableColumns(Connection $legacy, array $dynamicTables): array
    {
        $schema = $legacy->getSchemaBuilder();
        $result = [];

        foreach (array_unique($dynamicTables) as $tableName) {
            if ($tableName === '' || ! $schema->hasTable($tableName)) {
                continue;
            }

            $result[$tableName] = $schema->getColumnListing($tableName);
        }

        return $result;
    }

    /**
     * @param  array<string, mixed>  $task
     * @param  array<string, mixed>  $listRow
     * @param  array<string, array<string, mixed>>  $statusMap
     * @param  array<string, array<int, array<string, mixed>>>  $spaceFieldMap
     * @param  array<int, array<int, array{label: string, value: string, display_order: int}>>  $fieldOptionsMap
     * @param  array<string, mixed>  $formData
     * @return array{created: bool, payment_rows: int}
     */
    private function migrateTask(
        Connection $legacy,
        array $task,
        array $listRow,
        array $statusMap,
        array $spaceFieldMap,
        array $fieldOptionsMap,
        array $formData,
        string $dynamicTable,
        bool $dryRun,
        bool $skipPayments,
    ): array {
        $legacyTaskId = (int) $task['task_id'];
        $legacyListId = (string) $task['task_list_id'];
        $legacyStatusId = (string) $task['task_status_id'];
        $legacySpaceId = (string) ($listRow['list_space_id'] ?? '');

        $applicationTypeId = $this->resolveApplicationTypeId((string) $listRow['list_name'], $legacyListId, $dryRun);
        $this->syncApplicationTypeFormFields(
            applicationTypeId: $applicationTypeId,
            legacySpaceId: $legacySpaceId,
            spaceFieldMap: $spaceFieldMap,
            fieldOptionsMap: $fieldOptionsMap,
            dryRun: $dryRun,
        );
        $applicationStatusId = $this->resolveApplicationStatusId($legacyStatusId, $statusMap, $dryRun);
        $serviceId = $this->resolveServiceId((string) $listRow['list_name'], $legacySpaceId, $dryRun);
        $serviceStageId = $this->resolveServiceStageId($serviceId, (string) ($statusMap[$legacyStatusId]['status_name'] ?? 'Unknown'), $dryRun);

        $assigneeUserId = $this->resolveAssigneeUserId($legacy, (string) ($task['task_assign_to'] ?? ''), $dryRun);
        $clientUserId = $this->resolveClientUserId($legacy, (string) ($task['task_contact'] ?? ''), (string) ($task['task_name'] ?? 'Legacy Client'), $dryRun);

        $applicationNumber = $this->transformer->generateApplicationNumber(
            applicationTypeSlug: (string) ($listRow['list_name'] ?? 'legacy-application'),
            legacyTaskId: $legacyTaskId,
        );

        if (Application::query()->where('application_number', $applicationNumber)->exists()) {
            return ['created' => false, 'payment_rows' => 0];
        }

        if ($dryRun) {
            return ['created' => true, 'payment_rows' => 0];
        }

        $submittedAt = $this->toDateTimeOrNull((string) ($task['task_date_created'] ?? ''));
        $dueDate = $this->toDateTimeOrNull((string) ($task['task_due_date'] ?? ''));
        $priority = $this->transformer->mapPriority((string) ($task['task_priority'] ?? ''));
        $tags = $this->transformer->parseCsvIds((string) ($task['task_tag'] ?? ''));

        $application = Application::query()->create([
            'application_number' => $applicationNumber,
            'user_id' => $clientUserId,
            'application_type_id' => $applicationTypeId,
            'application_status_id' => $applicationStatusId,
            'assigned_to' => $assigneeUserId,
            'custom_fields' => array_merge(
                $formData,
                [
                    '__legacy' => [
                        'task_id' => $legacyTaskId,
                        'list_id' => $legacyListId,
                        'status_id' => $legacyStatusId,
                        'space_id' => $legacySpaceId,
                        'dynamic_table' => $dynamicTable,
                    ],
                ],
            ),
            'client_notes' => $this->nullableString((string) ($task['note'] ?? '')),
            'staff_notes' => $this->nullableString((string) ($task['remarks'] ?? '')),
            'priority' => $priority,
            'tags' => $tags,
            'submitted_at' => $submittedAt,
            'due_date' => $dueDate,
            'service_id' => $serviceId,
            'service_stage_id' => $serviceStageId,
            'service_position' => 0,
            'position' => 0,
        ]);

        ApplicationTimeline::query()->create([
            'application_id' => $application->id,
            'user_id' => $assigneeUserId,
            'action' => 'migrated',
            'description' => 'Migrated from legacy task data.',
            'metadata' => [
                'legacy_task_id' => $legacyTaskId,
                'legacy_dynamic_table' => $dynamicTable,
            ],
            'created_at' => now(),
        ]);

        $paymentRows = 0;
        if (! $skipPayments) {
            $paymentRows = $this->importPayments($legacy, $application, $legacyTaskId);
        }

        return ['created' => true, 'payment_rows' => $paymentRows];
    }

    private function resolveApplicationTypeId(string $legacyListName, string $legacyListId, bool $dryRun): int
    {
        $cacheKey = $legacyListId;
        if (isset($this->applicationTypeMap[$cacheKey])) {
            return $this->applicationTypeMap[$cacheKey];
        }

        if ($dryRun) {
            $this->applicationTypeMap[$cacheKey] = $this->nextDryId++;

            return $this->applicationTypeMap[$cacheKey];
        }

        $name = $legacyListName !== '' ? $legacyListName : "Legacy List {$legacyListId}";
        $slug = Str::slug($name);

        $type = ApplicationType::query()->firstOrCreate(
            ['slug' => $slug],
            ['name' => $name, 'is_active' => true]
        );

        $this->applicationTypeMap[$cacheKey] = $type->id;

        return $type->id;
    }

    /**
     * @param  array<string, array<int, array<string, mixed>>>  $spaceFieldMap
     * @param  array<int, array<int, array{label: string, value: string, display_order: int}>>  $fieldOptionsMap
     */
    private function syncApplicationTypeFormFields(
        int $applicationTypeId,
        string $legacySpaceId,
        array $spaceFieldMap,
        array $fieldOptionsMap,
        bool $dryRun
    ): void {
        if ($dryRun || $legacySpaceId === '' || isset($this->applicationTypeFieldsSynced[$applicationTypeId])) {
            return;
        }

        $fieldRows = $spaceFieldMap[$legacySpaceId] ?? [];
        if ($fieldRows === []) {
            $this->applicationTypeFieldsSynced[$applicationTypeId] = true;

            return;
        }

        $applicationType = ApplicationType::query()->find($applicationTypeId);
        if ($applicationType === null) {
            return;
        }

        $applicationType->loadMissing('formFields');
        $usedNames = $applicationType->formFields->pluck('name')->flip()->all();

        foreach ($fieldRows as $index => $fieldRow) {
            $rawColumnName = (string) ($fieldRow['field_col_name'] ?? '');
            $fieldName = $this->transformer->normalizeFieldKey($rawColumnName);
            if ($fieldName === '') {
                continue;
            }

            $resolvedFieldName = $fieldName;
            $collisionIndex = 1;
            while (isset($usedNames[$resolvedFieldName])) {
                $resolvedFieldName = $fieldName.'_'.$collisionIndex;
                $collisionIndex++;
            }
            $usedNames[$resolvedFieldName] = true;

            $fieldType = $this->mapLegacyFieldType((string) ($fieldRow['field_type'] ?? ''));
            $fieldLabel = $this->nullableString((string) ($fieldRow['field_name'] ?? '')) ?? Str::headline($resolvedFieldName);

            $formField = FormField::query()->firstOrCreate(
                ['name' => $resolvedFieldName],
                [
                    'label' => $fieldLabel,
                    'type' => $fieldType,
                    'placeholder' => null,
                    'help_text' => null,
                    'validation_rules' => null,
                    'is_active' => true,
                ],
            );

            $applicationType->formFields()->syncWithoutDetaching([
                $formField->id => [
                    'is_required' => $this->inferRequiredFromLegacyRow($fieldRow),
                    'display_order' => (int) ($fieldRow['field_order'] ?? ($index + 1)),
                    'section' => null,
                ],
            ]);

            if (! in_array($fieldType, ['select', 'radio', 'checkbox'], true)) {
                continue;
            }

            $legacyFieldId = (int) ($fieldRow['field_id'] ?? 0);
            foreach ($fieldOptionsMap[$legacyFieldId] ?? [] as $option) {
                FormFieldOption::query()->updateOrCreate(
                    [
                        'form_field_id' => $formField->id,
                        'value' => $option['value'],
                    ],
                    [
                        'label' => $option['label'],
                        'display_order' => $option['display_order'],
                    ],
                );
            }
        }

        $this->applicationTypeFieldsSynced[$applicationTypeId] = true;
    }

    /**
     * @param  array<string, mixed>  $fieldRow
     */
    private function inferRequiredFromLegacyRow(array $fieldRow): bool
    {
        $assignTo = $this->nullableString((string) ($fieldRow['field_assign_to'] ?? ''));

        return $assignTo !== null;
    }

    private function mapLegacyFieldType(string $legacyType): string
    {
        return match (strtolower(trim($legacyType))) {
            'dropdown', 'select' => 'select',
            'textarea' => 'textarea',
            'date' => 'date',
            'email' => 'email',
            'number', 'numeric' => 'number',
            'file' => 'file',
            'checkbox' => 'checkbox',
            'radio' => 'radio',
            default => 'text',
        };
    }

    /**
     * @param  array<string, array<string, mixed>>  $statusMap
     */
    private function resolveApplicationStatusId(string $legacyStatusId, array $statusMap, bool $dryRun): int
    {
        if (isset($this->applicationStatusMap[$legacyStatusId])) {
            return $this->applicationStatusMap[$legacyStatusId];
        }

        if ($dryRun) {
            $this->applicationStatusMap[$legacyStatusId] = $this->nextDryId++;

            return $this->applicationStatusMap[$legacyStatusId];
        }

        $legacyName = (string) ($statusMap[$legacyStatusId]['status_name'] ?? 'Unknown');
        $name = trim($legacyName) !== '' ? trim($legacyName) : "Legacy Status {$legacyStatusId}";
        $slug = Str::slug($name);

        $status = ApplicationStatus::query()->firstOrCreate(
            ['slug' => $slug],
            ['name' => $name, 'color' => 'gray', 'visible_to_client' => true]
        );

        $this->applicationStatusMap[$legacyStatusId] = $status->id;

        return $status->id;
    }

    private function resolveServiceId(string $legacyListName, string $legacySpaceId, bool $dryRun): int
    {
        if (isset($this->serviceMap[$legacySpaceId])) {
            return $this->serviceMap[$legacySpaceId];
        }

        if ($dryRun) {
            $this->serviceMap[$legacySpaceId] = $this->nextDryId++;

            return $this->serviceMap[$legacySpaceId];
        }

        // Avoid depending on role tables during migration bootstrap.
        $owner = User::query()->orderBy('id')->first();
        if ($owner === null) {
            throw new \RuntimeException('At least one user record is required before running migration.');
        }

        $service = Service::query()->firstOrCreate(
            ['user_id' => $owner->id, 'name' => $legacyListName],
            ['color' => '#6b7280']
        );

        $this->serviceMap[$legacySpaceId] = $service->id;

        return $service->id;
    }

    private function resolveServiceStageId(int $serviceId, string $stageName, bool $dryRun): int
    {
        $key = $serviceId.'-'.$stageName;
        if (isset($this->serviceStageMap[$key])) {
            return $this->serviceStageMap[$key];
        }

        if ($dryRun) {
            $this->serviceStageMap[$key] = $this->nextDryId++;

            return $this->serviceStageMap[$key];
        }

        $serviceStage = ServiceStage::query()->firstOrCreate(
            ['service_id' => $serviceId, 'name' => $stageName],
            ['color' => '#6b7280', 'position' => 0]
        );

        $this->serviceStageMap[$key] = $serviceStage->id;

        return $serviceStage->id;
    }

    private function resolveClientUserId(Connection $legacy, string $legacyContactId, string $fallbackName, bool $dryRun): int
    {
        $legacyId = (int) $legacyContactId;
        if ($legacyId > 0 && isset($this->clientUserMap[$legacyId])) {
            return $this->clientUserMap[$legacyId];
        }

        if ($dryRun) {
            if ($legacyId > 0) {
                $this->clientUserMap[$legacyId] = $this->nextDryId++;

                return $this->clientUserMap[$legacyId];
            }

            return $this->nextDryId++;
        }

        $legacyContact = $legacyId > 0
            ? $legacy->table('contact')->where('contact_id', $legacyId)->first()
            : null;

        $email = $this->nullableString((string) ($legacyContact->contact_email ?? ''));
        $nameParts = [
            (string) ($legacyContact->contact_fname ?? ''),
            (string) ($legacyContact->contact_mname ?? ''),
            (string) ($legacyContact->contact_lname ?? ''),
        ];
        $resolvedName = trim(implode(' ', array_filter(array_map('trim', $nameParts))));
        if ($resolvedName === '') {
            $resolvedName = trim($fallbackName) !== '' ? trim($fallbackName) : "Legacy Client {$legacyContactId}";
        }

        $user = null;
        if ($email !== null) {
            $user = User::query()->where('email', $email)->first();
        }

        if ($user === null) {
            $user = User::query()->create([
                'name' => $resolvedName,
                'email' => $email ?? "legacy-contact-{$legacyContactId}@legacy.local",
                'password' => Str::random(32),
                'phone' => $this->nullableString((string) ($legacyContact->contact_cpnum ?? '')),
                'profile_completed' => false,
            ]);
        }

        if ($legacyId > 0) {
            $this->clientUserMap[$legacyId] = $user->id;
        }

        return $user->id;
    }

    private function resolveAssigneeUserId(Connection $legacy, string $legacyAssignCsv, bool $dryRun): ?int
    {
        $legacyIds = $this->transformer->parseCsvIds($legacyAssignCsv);
        if ($legacyIds === []) {
            return null;
        }

        $primaryLegacyId = (int) $legacyIds[0];
        if (isset($this->staffUserMap[$primaryLegacyId])) {
            return $this->staffUserMap[$primaryLegacyId];
        }

        if ($dryRun) {
            $this->staffUserMap[$primaryLegacyId] = $this->nextDryId++;

            return $this->staffUserMap[$primaryLegacyId];
        }

        $legacyStaff = $legacy->table('user')->where('user_id', $primaryLegacyId)->first();
        if ($legacyStaff === null) {
            return null;
        }

        $email = $this->nullableString((string) ($legacyStaff->email ?? ''));
        $nameParts = [
            (string) ($legacyStaff->fname ?? ''),
            (string) ($legacyStaff->mname ?? ''),
            (string) ($legacyStaff->lname ?? ''),
        ];
        $name = trim(implode(' ', array_filter(array_map('trim', $nameParts))));
        if ($name === '') {
            $name = "Legacy Staff {$primaryLegacyId}";
        }

        $user = null;
        if ($email !== null) {
            $user = User::query()->where('email', $email)->first();
        }

        if ($user === null) {
            $user = User::query()->create([
                'name' => $name,
                'email' => $email ?? "legacy-staff-{$primaryLegacyId}@legacy.local",
                'password' => Str::random(32),
                'phone' => $this->nullableString((string) ($legacyStaff->contact_number ?? '')),
                'profile_completed' => false,
            ]);
        }

        $this->staffUserMap[$primaryLegacyId] = $user->id;

        return $user->id;
    }

    private function importPayments(Connection $legacy, Application $application, int $legacyTaskId): int
    {
        if (! $legacy->getSchemaBuilder()->hasTable('finance_transaction')) {
            return 0;
        }

        $count = 0;
        $payments = $legacy->table('finance_transaction')
            ->where('val_assign_to', (string) $legacyTaskId)
            ->orderBy('val_id')
            ->get();

        foreach ($payments as $legacyPayment) {
            $legacyPaymentId = (int) $legacyPayment->val_id;
            $paymentReference = 'legacy-finance-'.$legacyPaymentId;

            $exists = Payment::query()
                ->where('application_id', $application->id)
                ->where('payment_reference', $paymentReference)
                ->exists();
            if ($exists) {
                continue;
            }

            $amount = (float) ($legacyPayment->val_amount ?? 0);
            $amount = max($amount, 0);

            Payment::query()->create([
                'application_id' => $application->id,
                'amount' => $amount,
                'payment_method' => $this->nullableString((string) ($legacyPayment->val_method ?? '')) ?? 'legacy',
                'payment_reference' => $paymentReference,
                'payment_status' => 'completed',
                'payment_date' => $this->toDateTimeOrNull((string) ($legacyPayment->val_date ?? '')),
                'notes' => $this->nullableString((string) ($legacyPayment->val_note ?? '')),
            ]);

            $count++;
        }

        if ($count > 0) {
            $application->amount_paid = (string) $application->payments()->sum('amount');
            $application->is_paid = (float) $application->amount_paid >= (float) $application->total_fee;
            $application->save();
        }

        return $count;
    }

    private function nullableString(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim($value);
        if ($trimmed === '' || strtolower($trimmed) === 'utf8') {
            return null;
        }

        return $trimmed;
    }

    private function toDateTimeOrNull(?string $value): ?string
    {
        $normalized = $this->nullableString($value);
        if ($normalized === null || $normalized === '0000-00-00' || $normalized === '0000-00-00 00:00:00') {
            return null;
        }

        try {
            return Carbon::parse($normalized)->toDateTimeString();
        } catch (\Throwable) {
            return null;
        }
    }
}
