import type { User } from './auth';

export type ApplicationStatus = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    color: string;
    icon: string | null;
    is_final: boolean;
    visible_to_client: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
};

export type FormFieldOption = {
    id?: number;
    label: string;
    value: string;
};

export type FormField = {
    id?: number;
    name: string;
    label: string;
    type:
        | 'text'
        | 'email'
        | 'number'
        | 'textarea'
        | 'select'
        | 'date'
        | 'file'
        | 'checkbox'
        | 'radio';
    required: boolean;
    placeholder?: string;
    options?: FormFieldOption[];
    validation?: string | Record<string, unknown> | null;
    help_text?: string;
    section?: string;
    is_active?: boolean;
};

export type ApplicationType = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    base_fee: string;
    required_documents: string[] | null;
    form_fields: FormField[] | null;
    form_fields_array?: FormField[];
    requirements: string[] | null;
    estimated_processing_days: number | null;
    icon: string | null;
    color: string;
    is_active: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
    formatted_fee?: string;
    estimated_duration?: string;
};

export type ApplicationDocument = {
    id: number;
    application_id: number;
    document_type: string;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    verification_status: 'pending' | 'verified' | 'rejected';
    verification_notes: string | null;
    verified_by: number | null;
    verified_at: string | null;
    version: number;
    created_at: string;
    updated_at: string;
    file_size_formatted?: string;
    download_url?: string;
    verification_badge?: string;
    verified_by_user?: User;
};

export type ApplicationTimeline = {
    id: number;
    application_id: number;
    user_id: number | null;
    action: string;
    description: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
    user?: User;
    icon?: string;
    color?: string;
};

export type Payment = {
    id: number;
    application_id: number;
    amount: string;
    payment_method: string;
    payment_reference: string | null;
    payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
    payment_date: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type Application = {
    id: number;
    application_number: string;
    user_id: number;
    application_type_id: number;
    application_status_id: number;
    assigned_to: number | null;
    form_data: Record<string, unknown> | null;
    total_fee: string;
    amount_paid: string;
    is_paid: boolean;
    client_notes: string | null;
    staff_notes: string | null;
    rejection_reason: string | null;
    completion_percentage: number;
    submitted_at: string | null;
    approved_at: string | null;
    rejected_at: string | null;
    completed_at: string | null;
    deadline: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    // Relationships
    user?: User;
    application_type?: ApplicationType;
    status?: ApplicationStatus;
    assigned_staff?: User;
    documents?: ApplicationDocument[];
    timeline?: ApplicationTimeline[];
    payments?: Payment[];
    // Computed attributes
    status_color?: string;
    status_badge?: string;
    is_draft?: boolean;
    is_submitted?: boolean;
    can_edit?: boolean;
    can_submit?: boolean;
    remaining_balance?: string;
    formatted_total_fee?: string;
    formatted_amount_paid?: string;
    formatted_remaining_balance?: string;
};

export type PaginatedApplications = {
    data: Application[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

export type ApplicationFilters = {
    search?: string;
    status?: string;
    type?: string;
    date_from?: string;
    date_to?: string;
    sort?: string;
    direction?: string;
};
