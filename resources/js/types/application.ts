export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
}

export interface ApplicationType {
    id: number;
    name: string;
    slug: string;
    icon: string;
    color: string;
}

export interface ApplicationStatus {
    id: number;
    name: string;
    slug: string;
    color: string;
    icon: string;
}

export interface Application {
    id: number;
    application_number: string;
    user_id: number;
    application_type_id: number;
    application_status_id: number;
    assigned_to: number | null;
    priority: number;
    tags: string[];
    position: number;
    is_starred: boolean;
    is_archived: boolean;
    due_date: string | null;
    start_date: string | null;
    completion_percentage: number;
    total_fee: number;
    amount_paid: number;
    is_paid: boolean;
    submitted_at: string | null;
    created_at: string;
    updated_at: string;

    // Relationships
    user: User;
    application_type: ApplicationType;
    status: ApplicationStatus;
    assigned_staff: User | null;
    watchers: User[];

    // Computed
    priority_label: string;
    priority_color: string;
    is_overdue: boolean;
    days_until_due: number | null;
    formatted_total_fee: string;
    can_edit: boolean;
    can_submit: boolean;
}

export interface Board {
    [statusSlug: string]: Application[];
}

export interface UserService {
    id: number;
    user_id: number;
    name: string;
    description: string | null;
    color: string;
    is_starred: boolean;
    position: number;
    created_at: string;
    updated_at: string;
    stages_count?: number;
    applications_count?: number;
    stages?: ServiceStage[];
}

export interface ServiceStage {
    id: number;
    service_id: number;
    name: string;
    color: string | null;
    position: number;
    created_at: string;
    updated_at: string;
    applications_count?: number;
    applications?: Application[];
}

export interface FilterOptions {
    types: ApplicationType[];
    statuses: ApplicationStatus[];
    priorities: { value: number; label: string }[];
    dueDateOptions: { value: string; label: string }[];
}

export interface Stats {
    total: number;
    pending: number;
    overdue: number;
    due_today: number;
    starred: number;
}
