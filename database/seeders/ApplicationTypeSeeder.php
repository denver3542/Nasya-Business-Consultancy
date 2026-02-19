<?php

namespace Database\Seeders;

use App\Models\ApplicationType;
use App\Models\FormField;
use App\Models\FormFieldOption;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class ApplicationTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'name' => 'NCLEX Services',
                'slug' => 'nclex',
                'description' => 'National Council Licensure Examination for Registered Nurses. This exam is required for anyone who wants to work as a registered nurse in the United States.',
                'base_fee' => 15000.00,
                'estimated_processing_days' => 60,
                'icon' => 'fa-user-nurse',
                'color' => 'blue',
                'display_order' => 1,
                'required_documents' => [
                    'Birth Certificate (PSA)',
                    'Valid Passport',
                    'Nursing Diploma',
                    'Transcript of Records',
                    'PRC License',
                    'Board Rating',
                    'Passport-sized Photo (2x2)',
                ],
                'requirements' => [
                    'Must be a registered nurse in the Philippines',
                    'Must have a valid PRC license',
                    'Must have completed a 4-year nursing program',
                    'English proficiency may be required',
                ],
                'form_fields' => [
                    [
                        'name' => 'first_name',
                        'label' => 'First Name',
                        'type' => 'text',
                        'required' => true,
                        'placeholder' => 'Enter your first name',
                    ],
                    [
                        'name' => 'middle_name',
                        'label' => 'Middle Name',
                        'type' => 'text',
                        'required' => false,
                        'placeholder' => 'Enter your middle name',
                    ],
                    [
                        'name' => 'last_name',
                        'label' => 'Last Name',
                        'type' => 'text',
                        'required' => true,
                        'placeholder' => 'Enter your last name',
                    ],
                    [
                        'name' => 'date_of_birth',
                        'label' => 'Date of Birth',
                        'type' => 'date',
                        'required' => true,
                    ],
                    [
                        'name' => 'passport_number',
                        'label' => 'Passport Number',
                        'type' => 'text',
                        'required' => true,
                        'placeholder' => 'Enter passport number',
                    ],
                    [
                        'name' => 'prc_license_number',
                        'label' => 'PRC License Number',
                        'type' => 'text',
                        'required' => true,
                        'placeholder' => 'Enter PRC license number',
                    ],
                    [
                        'name' => 'nursing_school',
                        'label' => 'Nursing School Attended',
                        'type' => 'text',
                        'required' => true,
                        'placeholder' => 'Name of nursing school',
                    ],
                    [
                        'name' => 'graduation_date',
                        'label' => 'Graduation Date',
                        'type' => 'date',
                        'required' => true,
                    ],
                    [
                        'name' => 'preferred_exam_state',
                        'label' => 'Preferred Exam State',
                        'type' => 'select',
                        'required' => true,
                        'options' => [
                            'california' => 'California',
                            'new_york' => 'New York',
                            'texas' => 'Texas',
                            'florida' => 'Florida',
                            'illinois' => 'Illinois',
                        ],
                    ],
                    [
                        'name' => 'contact_number',
                        'label' => 'Contact Number',
                        'type' => 'tel',
                        'required' => true,
                        'placeholder' => '+63 XXX XXX XXXX',
                    ],
                    [
                        'name' => 'email',
                        'label' => 'Email Address',
                        'type' => 'email',
                        'required' => true,
                        'placeholder' => 'your.email@example.com',
                    ],
                ],
            ],
            [
                'name' => 'VisaScreen',
                'slug' => 'visascreen',
                'description' => 'VisaScreen certification is required for healthcare professionals seeking U.S. permanent or temporary occupational visas.',
                'base_fee' => 12000.00,
                'estimated_processing_days' => 45,
                'icon' => 'fa-passport',
                'color' => 'green',
                'display_order' => 2,
                'required_documents' => [
                    'Valid Passport',
                    'Nursing License',
                    'Academic Records',
                    'CGFNS Certificate (if applicable)',
                    'English Proficiency Test Results',
                ],
                'requirements' => [
                    'Must have completed nursing education',
                    'Must have passed NCLEX or equivalent',
                    'English proficiency required (IELTS/TOEFL)',
                ],
                'form_fields' => [
                    [
                        'name' => 'full_name',
                        'label' => 'Full Name',
                        'type' => 'text',
                        'required' => true,
                    ],
                    [
                        'name' => 'passport_number',
                        'label' => 'Passport Number',
                        'type' => 'text',
                        'required' => true,
                    ],
                    [
                        'name' => 'license_number',
                        'label' => 'Nursing License Number',
                        'type' => 'text',
                        'required' => true,
                    ],
                    [
                        'name' => 'cgfns_id',
                        'label' => 'CGFNS ID Number',
                        'type' => 'text',
                        'required' => false,
                    ],
                    [
                        'name' => 'english_test_type',
                        'label' => 'English Proficiency Test',
                        'type' => 'select',
                        'required' => true,
                        'options' => [
                            'ielts' => 'IELTS',
                            'toefl' => 'TOEFL',
                            'oet' => 'OET',
                        ],
                    ],
                    [
                        'name' => 'test_score',
                        'label' => 'Test Score',
                        'type' => 'text',
                        'required' => true,
                    ],
                ],
            ],
            [
                'name' => 'USRN License Endorsement',
                'slug' => 'usrn-endorsement',
                'description' => 'Transfer your nursing license from one U.S. state to another through endorsement.',
                'base_fee' => 10000.00,
                'estimated_processing_days' => 30,
                'icon' => 'fa-certificate',
                'color' => 'purple',
                'display_order' => 3,
                'required_documents' => [
                    'Current Nursing License',
                    'NCLEX Results',
                    'Social Security Number',
                    'Employment Verification',
                ],
                'requirements' => [
                    'Must hold active RN license in current state',
                    'No disciplinary actions on record',
                    'Must have passed NCLEX',
                ],
                'form_fields' => [
                    [
                        'name' => 'current_state',
                        'label' => 'Current License State',
                        'type' => 'text',
                        'required' => true,
                    ],
                    [
                        'name' => 'current_license_number',
                        'label' => 'Current License Number',
                        'type' => 'text',
                        'required' => true,
                    ],
                    [
                        'name' => 'target_state',
                        'label' => 'State for Endorsement',
                        'type' => 'text',
                        'required' => true,
                    ],
                    [
                        'name' => 'ssn',
                        'label' => 'Social Security Number',
                        'type' => 'text',
                        'required' => true,
                    ],
                ],
            ],
            [
                'name' => 'USRN License Renewal',
                'slug' => 'usrn-renewal',
                'description' => 'Renew your U.S. Registered Nurse license (typically every 2-3 years depending on state).',
                'base_fee' => 8000.00,
                'estimated_processing_days' => 21,
                'icon' => 'fa-sync',
                'color' => 'orange',
                'display_order' => 4,
                'required_documents' => [
                    'Current License',
                    'Continuing Education Certificates',
                    'Employment Verification (if required)',
                ],
                'requirements' => [
                    'Must have active license',
                    'Continuing education hours must be completed',
                    'No outstanding fees or penalties',
                ],
                'form_fields' => [
                    [
                        'name' => 'license_state',
                        'label' => 'License State',
                        'type' => 'text',
                        'required' => true,
                    ],
                    [
                        'name' => 'license_number',
                        'label' => 'License Number',
                        'type' => 'text',
                        'required' => true,
                    ],
                    [
                        'name' => 'expiration_date',
                        'label' => 'Current Expiration Date',
                        'type' => 'date',
                        'required' => true,
                    ],
                    [
                        'name' => 'ce_hours_completed',
                        'label' => 'Continuing Education Hours Completed',
                        'type' => 'number',
                        'required' => true,
                    ],
                ],
            ],
            [
                'name' => 'Student Visa Application',
                'slug' => 'student-visa',
                'description' => 'Apply for a student visa to pursue nursing or healthcare education abroad.',
                'base_fee' => 18000.00,
                'estimated_processing_days' => 90,
                'icon' => 'fa-graduation-cap',
                'color' => 'indigo',
                'display_order' => 5,
                'required_documents' => [
                    'Passport',
                    'Admission Letter from Institution',
                    'Financial Proof',
                    'Academic Transcripts',
                    'English Proficiency Results',
                ],
                'requirements' => [
                    'Must have admission to accredited institution',
                    'Proof of financial capacity',
                    'English proficiency required',
                ],
                'form_fields' => [
                    [
                        'name' => 'destination_country',
                        'label' => 'Destination Country',
                        'type' => 'select',
                        'required' => true,
                        'options' => [
                            'usa' => 'United States',
                            'canada' => 'Canada',
                            'australia' => 'Australia',
                            'uk' => 'United Kingdom',
                        ],
                    ],
                    [
                        'name' => 'institution_name',
                        'label' => 'Institution Name',
                        'type' => 'text',
                        'required' => true,
                    ],
                    [
                        'name' => 'program',
                        'label' => 'Program/Course',
                        'type' => 'text',
                        'required' => true,
                    ],
                    [
                        'name' => 'intake_date',
                        'label' => 'Intended Intake Date',
                        'type' => 'date',
                        'required' => true,
                    ],
                ],
            ],
            [
                'name' => 'Middle East Exam Services',
                'slug' => 'middle-east-exam',
                'description' => 'Licensing exams for Middle East countries (UAE, Saudi Arabia, Qatar, etc.).',
                'base_fee' => 8000.00,
                'estimated_processing_days' => 30,
                'icon' => 'fa-globe-asia',
                'color' => 'yellow',
                'display_order' => 6,
                'required_documents' => [
                    'Passport',
                    'Nursing Credentials',
                    'Work Experience Letters',
                    'PRC License',
                ],
                'requirements' => [
                    'Must be a registered nurse',
                    'Work experience may be required',
                    'Country-specific requirements apply',
                ],
                'form_fields' => [
                    [
                        'name' => 'target_country',
                        'label' => 'Target Country',
                        'type' => 'select',
                        'required' => true,
                        'options' => [
                            'uae' => 'United Arab Emirates',
                            'saudi' => 'Saudi Arabia',
                            'qatar' => 'Qatar',
                            'oman' => 'Oman',
                            'kuwait' => 'Kuwait',
                        ],
                    ],
                    [
                        'name' => 'years_experience',
                        'label' => 'Years of Nursing Experience',
                        'type' => 'number',
                        'required' => true,
                    ],
                ],
            ],
            [
                'name' => 'CGFNS Certification Program',
                'slug' => 'cgfns',
                'description' => 'Commission on Graduates of Foreign Nursing Schools Certification.',
                'base_fee' => 14000.00,
                'estimated_processing_days' => 60,
                'icon' => 'fa-stamp',
                'color' => 'teal',
                'display_order' => 7,
                'required_documents' => [
                    'Nursing Diploma',
                    'Transcript of Records',
                    'PRC License',
                    'English Proficiency Test',
                ],
                'requirements' => [
                    'Nursing education must meet CGFNS standards',
                    'English proficiency required',
                ],
                'form_fields' => [
                    [
                        'name' => 'nursing_school',
                        'label' => 'Nursing School',
                        'type' => 'text',
                        'required' => true,
                    ],
                    [
                        'name' => 'graduation_year',
                        'label' => 'Year of Graduation',
                        'type' => 'number',
                        'required' => true,
                    ],
                ],
            ],
            [
                'name' => 'Pass Letter',
                'slug' => 'pass-letter',
                'description' => 'Obtain official pass letter/certificate for exam results.',
                'base_fee' => 3000.00,
                'estimated_processing_days' => 14,
                'icon' => 'fa-file-alt',
                'color' => 'pink',
                'display_order' => 8,
                'required_documents' => [
                    'Exam Results',
                    'Valid ID',
                ],
                'requirements' => [
                    'Must have passed the exam',
                ],
                'form_fields' => [
                    [
                        'name' => 'exam_type',
                        'label' => 'Exam Type',
                        'type' => 'text',
                        'required' => true,
                    ],
                    [
                        'name' => 'exam_date',
                        'label' => 'Exam Date',
                        'type' => 'date',
                        'required' => true,
                    ],
                ],
            ],
            [
                'name' => 'Documents Verification & Requisition',
                'slug' => 'document-verification',
                'description' => 'Verification and requisition of Philippine documents for international use.',
                'base_fee' => 5000.00,
                'estimated_processing_days' => 21,
                'icon' => 'fa-file-check',
                'color' => 'gray',
                'display_order' => 9,
                'required_documents' => [
                    'Original Documents',
                    'Valid ID',
                ],
                'requirements' => [
                    'Documents must be authentic',
                    'Red ribbon/apostille may be required',
                ],
                'form_fields' => [
                    [
                        'name' => 'document_type',
                        'label' => 'Document Type',
                        'type' => 'select',
                        'required' => true,
                        'options' => [
                            'birth_cert' => 'Birth Certificate',
                            'diploma' => 'Diploma',
                            'transcript' => 'Transcript of Records',
                            'tor' => 'TOR',
                            'license' => 'Professional License',
                        ],
                    ],
                    [
                        'name' => 'quantity',
                        'label' => 'Number of Copies Needed',
                        'type' => 'number',
                        'required' => true,
                    ],
                    [
                        'name' => 'authentication_type',
                        'label' => 'Authentication Type',
                        'type' => 'select',
                        'required' => true,
                        'options' => [
                            'red_ribbon' => 'Red Ribbon',
                            'apostille' => 'Apostille',
                            'both' => 'Both',
                        ],
                    ],
                ],
            ],
        ];

        foreach ($types as $type) {
            $formFields = Arr::get($type, 'form_fields', []);
            unset($type['form_fields']);

            $applicationType = ApplicationType::create($type);
            $this->syncFormFields($applicationType, $formFields);
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $formFields
     */
    private function syncFormFields(ApplicationType $applicationType, array $formFields): void
    {
        foreach ($formFields as $index => $fieldDefinition) {
            $fieldName = (string) Arr::get($fieldDefinition, 'name', '');
            if ($fieldName === '') {
                continue;
            }

            $normalizedName = Str::of($fieldName)
                ->lower()
                ->replaceMatches('/[^a-z0-9_]+/', '_')
                ->replaceMatches('/_+/', '_')
                ->trim('_')
                ->value();

            if ($normalizedName === '') {
                continue;
            }

            $fieldType = $this->mapFieldType((string) Arr::get($fieldDefinition, 'type', 'text'));

            $field = FormField::query()->firstOrCreate(
                ['name' => $normalizedName],
                [
                    'label' => (string) Arr::get($fieldDefinition, 'label', Str::headline($normalizedName)),
                    'type' => $fieldType,
                    'placeholder' => Arr::get($fieldDefinition, 'placeholder'),
                    'validation_rules' => null,
                    'is_active' => true,
                ],
            );

            $applicationType->formFields()->syncWithoutDetaching([
                $field->id => [
                    'is_required' => (bool) Arr::get($fieldDefinition, 'required', false),
                    'display_order' => $index + 1,
                    'section' => null,
                ],
            ]);

            $options = Arr::get($fieldDefinition, 'options', []);
            if (! is_array($options) || ! in_array($fieldType, ['select', 'radio', 'checkbox'], true)) {
                continue;
            }

            $displayOrder = 0;
            foreach ($options as $value => $label) {
                FormFieldOption::query()->updateOrCreate(
                    ['form_field_id' => $field->id, 'value' => (string) $value],
                    [
                        'label' => (string) $label,
                        'display_order' => $displayOrder,
                    ],
                );
                $displayOrder++;
            }
        }
    }

    private function mapFieldType(string $legacyType): string
    {
        return match (strtolower(trim($legacyType))) {
            'textarea' => 'textarea',
            'dropdown', 'select' => 'select',
            'date' => 'date',
            'email' => 'email',
            'number' => 'number',
            'file' => 'file',
            'checkbox' => 'checkbox',
            'radio' => 'radio',
            default => 'text',
        };
    }
}
