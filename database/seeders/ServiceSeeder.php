<?php

namespace Database\Seeders;

use App\Models\FormField;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $serviceTemplates = [
            [
                'name' => 'NCLEX Journey',
                'description' => 'Track requirements and document prep for NCLEX clients.',
                'color' => '#3b82f6',
            ],
            [
                'name' => 'Visa Processing',
                'description' => 'Manage visa-related milestones and paperwork.',
                'color' => '#10b981',
            ],
        ];

        $defaultStages = [
            ['name' => 'To Do', 'color' => '#6b7280'],
            ['name' => 'In Progress', 'color' => '#3b82f6'],
            ['name' => 'Done', 'color' => '#10b981'],
        ];

        $availableFieldIds = FormField::query()
            ->active()
            ->pluck('id')
            ->values()
            ->all();

        $clients = User::query()
            ->role('client')
            ->where('is_active', true)
            ->get();

        foreach ($clients as $client) {
            foreach ($serviceTemplates as $index => $template) {
                $service = Service::query()->updateOrCreate(
                    [
                        'user_id' => $client->id,
                        'name' => $template['name'],
                    ],
                    [
                        'description' => $template['description'],
                        'color' => $template['color'],
                        'position' => $index,
                    ],
                );

                foreach ($defaultStages as $stageIndex => $stage) {
                    $service->stages()->updateOrCreate(
                        ['name' => $stage['name']],
                        [
                            'color' => $stage['color'],
                            'position' => $stageIndex,
                        ],
                    );
                }

                if (count($availableFieldIds) > 0) {
                    $service->formFields()->sync($availableFieldIds);
                }
            }
        }
    }
}
