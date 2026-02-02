<?php

namespace Database\Seeders;

use App\Models\ApplicationStatus;
use Illuminate\Database\Seeder;

class ApplicationStatusSeeder extends Seeder
{
    public function run()
    {
        $statuses = [
            [
                'name' => 'Draft',
                'slug' => 'draft',
                'description' => 'Application is being prepared',
                'color' => 'gray',
                'icon' => 'fa-pencil-alt',
                'is_final' => false,
                'visible_to_client' => true,
                'display_order' => 1,
            ],
            [
                'name' => 'Submitted',
                'slug' => 'submitted',
                'description' => 'Application has been submitted',
                'color' => 'blue',
                'icon' => 'fa-paper-plane',
                'is_final' => false,
                'visible_to_client' => true,
                'display_order' => 2,
            ],
            [
                'name' => 'Under Review',
                'slug' => 'under-review',
                'description' => 'Application is being reviewed by staff',
                'color' => 'yellow',
                'icon' => 'fa-eye',
                'is_final' => false,
                'visible_to_client' => true,
                'display_order' => 3,
            ],
            [
                'name' => 'Documents Required',
                'slug' => 'documents-required',
                'description' => 'Additional documents are needed',
                'color' => 'orange',
                'icon' => 'fa-file-upload',
                'is_final' => false,
                'visible_to_client' => true,
                'display_order' => 4,
            ],
            [
                'name' => 'Processing',
                'slug' => 'processing',
                'description' => 'Application is being processed',
                'color' => 'indigo',
                'icon' => 'fa-spinner',
                'is_final' => false,
                'visible_to_client' => true,
                'display_order' => 5,
            ],
            [
                'name' => 'Approved',
                'slug' => 'approved',
                'description' => 'Application has been approved',
                'color' => 'green',
                'icon' => 'fa-check-circle',
                'is_final' => false,
                'visible_to_client' => true,
                'display_order' => 6,
            ],
            [
                'name' => 'Rejected',
                'slug' => 'rejected',
                'description' => 'Application has been rejected',
                'color' => 'red',
                'icon' => 'fa-times-circle',
                'is_final' => true,
                'visible_to_client' => true,
                'display_order' => 7,
            ],
            [
                'name' => 'Completed',
                'slug' => 'completed',
                'description' => 'Application process is complete',
                'color' => 'green',
                'icon' => 'fa-flag-checkered',
                'is_final' => true,
                'visible_to_client' => true,
                'display_order' => 8,
            ],
            [
                'name' => 'Cancelled',
                'slug' => 'cancelled',
                'description' => 'Application was cancelled',
                'color' => 'gray',
                'icon' => 'fa-ban',
                'is_final' => true,
                'visible_to_client' => true,
                'display_order' => 9,
            ],
        ];

        foreach ($statuses as $status) {
            ApplicationStatus::create($status);
        }
    }
}
