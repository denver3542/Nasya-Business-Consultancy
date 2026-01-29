<?php

namespace Database\Seeders;

use App\Models\Partner;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Admin User
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@nasya.com',
            'password' => Hash::make('password'),
            'phone' => '+1234567890',
            'is_active' => true,
            'profile_completed' => true,
            'email_verified_at' => now(),
        ]);
        $admin->assignRole('admin');
        UserProfile::create([
            'user_id' => $admin->id,
            'date_of_birth' => '1985-05-15',
            'gender' => 'male',
            'address' => '123 Admin Street',
            'city' => 'New York',
            'state' => 'NY',
            'country' => 'USA',
            'postal_code' => '10001',
        ]);

        // Create Staff Users
        for ($i = 1; $i <= 2; $i++) {
            $staff = User::create([
                'name' => "Staff Member {$i}",
                'email' => "staff{$i}@nasya.com",
                'password' => Hash::make('password'),
                'phone' => '+123456789'.$i,
                'is_active' => true,
                'profile_completed' => true,
                'email_verified_at' => now(),
            ]);
            $staff->assignRole('staff');
            UserProfile::create([
                'user_id' => $staff->id,
                'date_of_birth' => '1990-0'.$i.'-10',
                'gender' => $i % 2 === 0 ? 'female' : 'male',
                'address' => "{$i}00 Staff Avenue",
                'city' => 'Los Angeles',
                'state' => 'CA',
                'country' => 'USA',
                'postal_code' => '9000'.$i,
            ]);
        }

        // Create Client Users
        for ($i = 1; $i <= 5; $i++) {
            $client = User::create([
                'name' => "Client User {$i}",
                'email' => "client{$i}@example.com",
                'password' => Hash::make('password'),
                'phone' => '+987654321'.$i,
                'is_active' => $i <= 4, // One inactive client
                'profile_completed' => $i <= 3,
                'email_verified_at' => now(),
            ]);
            $client->assignRole('client');
            UserProfile::create([
                'user_id' => $client->id,
                'date_of_birth' => '199'.$i.'-0'.$i.'-15',
                'gender' => $i % 2 === 0 ? 'female' : 'male',
                'address' => "{$i}00 Client Road",
                'city' => 'Chicago',
                'state' => 'IL',
                'country' => 'USA',
                'postal_code' => '6000'.$i,
                'emergency_contact_name' => "Emergency Contact {$i}",
                'emergency_contact_phone' => '+111222333'.$i,
                'emergency_contact_relationship' => 'Spouse',
            ]);
        }

        // Create Partner Users
        for ($i = 1; $i <= 2; $i++) {
            $partner = User::create([
                'name' => "Partner User {$i}",
                'email' => "partner{$i}@company.com",
                'password' => Hash::make('password'),
                'phone' => '+555666777'.$i,
                'is_active' => true,
                'profile_completed' => true,
                'email_verified_at' => now(),
            ]);
            $partner->assignRole('partner');
            UserProfile::create([
                'user_id' => $partner->id,
                'date_of_birth' => '198'.$i.'-0'.$i.'-20',
                'gender' => $i % 2 === 0 ? 'female' : 'male',
                'address' => "{$i}00 Partner Boulevard",
                'city' => 'Houston',
                'state' => 'TX',
                'country' => 'USA',
                'postal_code' => '7700'.$i,
                'id_type' => 'Passport',
                'id_number' => 'P123456'.$i,
                'id_expiry_date' => now()->addYears(5),
            ]);
            Partner::create([
                'user_id' => $partner->id,
                'company_name' => "Partner Company {$i}",
                'company_type' => $i === 1 ? 'llc' : 'corporation',
                'license_number' => 'LIC-'.str_pad($i, 6, '0', STR_PAD_LEFT),
                'commission_rate' => 10.00 + ($i * 2.5),
                'is_verified' => $i === 1,
                'notes' => "This is a sample partner company {$i}.",
            ]);
        }
    }
}
