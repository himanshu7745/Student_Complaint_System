CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE departments (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    authority_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE complaints (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    area VARCHAR(255) NOT NULL,
    complaint_date DATE NOT NULL,
    ai_severity VARCHAR(20) NOT NULL,
    ai_department_id UUID NULL REFERENCES departments(id),
    assigned_department_id UUID NULL REFERENCES departments(id),
    assigned_by_admin_id UUID NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL,
    email_sent_at TIMESTAMPTZ NULL,
    sla_due_at TIMESTAMPTZ NULL,
    ack_received_at TIMESTAMPTZ NULL,
    student_resolved_at TIMESTAMPTZ NULL,
    escalated_at TIMESTAMPTZ NULL,
    ai_raw_response_json TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE complaint_images (
    id UUID PRIMARY KEY,
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    delete_hash VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE complaint_events (
    id UUID PRIMARY KEY,
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    created_by VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_complaints_student_id ON complaints(student_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_ai_severity ON complaints(ai_severity);
CREATE INDEX idx_complaints_assigned_department_id ON complaints(assigned_department_id);
CREATE INDEX idx_complaints_sla_due_at ON complaints(sla_due_at);
CREATE INDEX idx_complaint_events_complaint_id ON complaint_events(complaint_id);
CREATE INDEX idx_complaint_images_complaint_id ON complaint_images(complaint_id);
