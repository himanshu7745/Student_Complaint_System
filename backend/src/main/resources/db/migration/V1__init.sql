CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(80) NOT NULL,
    campus_id VARCHAR(64),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE complaints (
    id BIGSERIAL PRIMARY KEY,
    complaint_code VARCHAR(32) NOT NULL UNIQUE,
    created_by BIGINT NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(32) NOT NULL,
    priority VARCHAR(16) NOT NULL,
    hostel_name VARCHAR(200),
    building_name VARCHAR(200),
    room_name VARCHAR(200),
    preferred_visit_slot VARCHAR(255),
    anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    needs_review BOOLEAN NOT NULL DEFAULT FALSE,
    review_reason VARCHAR(255),
    owner_user_id BIGINT REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    reopened_count INTEGER NOT NULL DEFAULT 0,
    acknowledge_due_at TIMESTAMPTZ,
    resolve_due_at TIMESTAMPTZ,
    feedback_rating INTEGER,
    feedback_comment TEXT,
    feedback_at TIMESTAMPTZ,
    campus_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_priority ON complaints(priority);
CREATE INDEX idx_complaints_needs_review ON complaints(needs_review);
CREATE INDEX idx_complaints_created_by ON complaints(created_by);
CREATE INDEX idx_complaints_owner_user ON complaints(owner_user_id);
CREATE INDEX idx_complaints_updated_at ON complaints(updated_at DESC);

CREATE TABLE complaint_categories (
    id BIGSERIAL PRIMARY KEY,
    complaint_id BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    category VARCHAR(80) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    confidence DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_complaint_categories_complaint ON complaint_categories(complaint_id);
CREATE INDEX idx_complaint_categories_category ON complaint_categories(category);

CREATE TABLE complaint_predictions (
    id BIGSERIAL PRIMARY KEY,
    complaint_id BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    model_version VARCHAR(100),
    overall_confidence DOUBLE PRECISION,
    severity_score DOUBLE PRECISION,
    raw_json TEXT,
    predicted_at TIMESTAMPTZ NOT NULL,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    failure_reason VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_complaint_predictions_complaint ON complaint_predictions(complaint_id, predicted_at DESC);

CREATE TABLE complaint_assignments (
    id BIGSERIAL PRIMARY KEY,
    complaint_id BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    assignment_type VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_complaint_assignments_complaint ON complaint_assignments(complaint_id);
CREATE INDEX idx_complaint_assignments_user ON complaint_assignments(user_id);

CREATE TABLE complaint_messages (
    id BIGSERIAL PRIMARY KEY,
    complaint_id BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_complaint_messages_complaint ON complaint_messages(complaint_id, created_at ASC);

CREATE TABLE complaint_attachments (
    id BIGSERIAL PRIMARY KEY,
    complaint_id BIGINT REFERENCES complaints(id) ON DELETE CASCADE,
    uploader_id BIGINT NOT NULL REFERENCES users(id),
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_complaint_attachments_complaint ON complaint_attachments(complaint_id);

CREATE TABLE complaint_timeline (
    id BIGSERIAL PRIMARY KEY,
    complaint_id BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    actor_id BIGINT REFERENCES users(id),
    detail TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_complaint_timeline_complaint ON complaint_timeline(complaint_id, created_at ASC);

CREATE TABLE routing_rules (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(80) NOT NULL,
    hostel_name VARCHAR(200),
    building_name VARCHAR(200),
    owner_role VARCHAR(50),
    owner_user_id BIGINT REFERENCES users(id),
    collaborator_roles TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_routing_rules_category_active ON routing_rules(category, active);

CREATE TABLE sla_rules (
    id BIGSERIAL PRIMARY KEY,
    priority VARCHAR(16) NOT NULL UNIQUE,
    acknowledge_within_minutes INTEGER NOT NULL,
    resolve_within_minutes INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE escalations (
    id BIGSERIAL PRIMARY KEY,
    complaint_id BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    level VARCHAR(64) NOT NULL,
    escalated_to_user_id BIGINT REFERENCES users(id),
    escalated_to_role VARCHAR(50),
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_escalations_complaint ON escalations(complaint_id, created_at ASC);

CREATE TABLE app_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(120) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
