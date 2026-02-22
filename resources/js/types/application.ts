export interface ApplicationUser {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    avatar?: string;
    profile?: {
        address?: string | null;
        city?: string | null;
        state?: string | null;
        country?: string | null;
        postal_code?: string | null;
    };
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
    approved_at?: string | null;
    completed_at?: string | null;
    created_at: string;
    updated_at: string;
    client_notes?: string | null;
    staff_notes?: string | null;

    // Relationships
    user: ApplicationUser;
    application_type: ApplicationType;
    status: ApplicationStatus;
    assigned_staff: ApplicationUser | null;
    watchers: ApplicationUser[];

    // Computed
    priority_label: string;
    priority_color: string;
    is_overdue: boolean;
    days_until_due: number | null;
    formatted_total_fee: string;
    remaining_balance?: number;
    can_edit: boolean;
    can_submit: boolean;
}

export interface ApplicationComment {
    id: number;
    application_id: number;
    user_id: number;
    parent_id: number | null;
    comment: string;
    attachments: string[] | null;
    likes: number[] | null;
    mentions: number[] | null;
    created_at: string;
    user: ApplicationUser;
    replies: ApplicationComment[];
}

export interface ApplicationDocument {
    id: number;
    application_id: number;
    document_type: string;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    verification_status: string;
    created_at: string;
}

export interface ApplicationTimeline {
    id: number;
    action: string;
    description: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
    user?: ApplicationUser | null;
}

export interface Payment {
    id: number;
    amount: number;
    payment_date: string;
    payment_method?: string;
    reference_number?: string;
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
