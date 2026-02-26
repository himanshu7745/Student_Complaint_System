# Student Complaint Management System - DB Schema, API Contracts, Route Map

## 1. Domain Model (PostgreSQL / JPA)

### Enums
- `user_role`: `STUDENT`, `ADMIN`
- `complaint_severity`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `complaint_status`:
  - `NEW`
  - `AI_CLASSIFIED`
  - `PENDING_ADMIN_ASSIGNMENT`
  - `ASSIGNED_TO_DEPARTMENT`
  - `EMAIL_SENT`
  - `ACK_RECEIVED`
  - `ACTION_TAKEN`
  - `RESOLVED_BY_STUDENT`
  - `ESCALATED_TO_DIRECTOR`
  - `CLOSED`
- `complaint_event_type`:
  - `STATUS_CHANGE`
  - `EMAIL_SENT`
  - `ACK_RECEIVED`
  - `ADMIN_ASSIGNED`
  - `ESCALATED`
  - `COMMENT`
  - `AI_CLASSIFIED`
- `event_actor_type`: `STUDENT`, `ADMIN`, `SYSTEM`

### Tables

#### `users`
- `id UUID PK`
- `name VARCHAR(150) NOT NULL`
- `email VARCHAR(255) UNIQUE NOT NULL`
- `password_hash VARCHAR(255) NOT NULL`
- `role VARCHAR(20) NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

#### `departments`
- `id UUID PK`
- `name VARCHAR(120) NOT NULL UNIQUE`
- `authority_email VARCHAR(255) NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

#### `complaints`
- `id UUID PK`
- `student_id UUID FK -> users(id)`
- `title TEXT NOT NULL`
- `description TEXT NOT NULL`
- `area VARCHAR(255) NOT NULL`
- `complaint_date DATE NOT NULL`
- `ai_severity VARCHAR(20) NOT NULL`
- `ai_department_id UUID NULL FK -> departments(id)`
- `assigned_department_id UUID NULL FK -> departments(id)`
- `assigned_by_admin_id UUID NULL FK -> users(id)`
- `status VARCHAR(50) NOT NULL`
- `email_sent_at TIMESTAMPTZ NULL`
- `sla_due_at TIMESTAMPTZ NULL`
- `ack_received_at TIMESTAMPTZ NULL`
- `student_resolved_at TIMESTAMPTZ NULL`
- `escalated_at TIMESTAMPTZ NULL`
- `ai_raw_response_json TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

#### `complaint_images`
- `id UUID PK`
- `complaint_id UUID FK -> complaints(id)`
- `image_url TEXT NOT NULL`
- `delete_hash VARCHAR(255) NULL`
- `created_at TIMESTAMPTZ NOT NULL`

#### `complaint_events`
- `id UUID PK`
- `complaint_id UUID FK -> complaints(id)`
- `event_type VARCHAR(50) NOT NULL`
- `message TEXT NOT NULL`
- `created_by VARCHAR(20) NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`

## 2. Must-Follow Workflow (Status Transitions)

1. Student creates complaint (`NEW`).
2. Backend calls AI/VLM classifier.
3. AI success:
   - save severity
   - optional department suggestion
   - status -> `AI_CLASSIFIED`
4. If AI suggests department:
   - assign department automatically
   - status -> `ASSIGNED_TO_DEPARTMENT`
   - send department email
   - status -> `EMAIL_SENT`
   - set `emailSentAt`, `slaDueAt = +7 days`
5. If AI does not suggest department (or AI fails):
   - status -> `PENDING_ADMIN_ASSIGNMENT`
6. Admin assigns department:
   - status -> `ASSIGNED_TO_DEPARTMENT`
   - send department email
   - status -> `EMAIL_SENT`
7. Department acknowledges via secure tokenized link/endpoint:
   - status -> `ACK_RECEIVED`
8. Student decision:
   - satisfied -> `RESOLVED_BY_STUDENT` -> `CLOSED`
   - not satisfied / overdue -> `ESCALATED_TO_DIRECTOR`
9. Scheduler flags overdue complaints (computed overdue + timeline event).

## 3. REST Route Map

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Uploads (JWT protected)
- `POST /api/uploads/images` (`multipart/form-data`, `files[]`)

### Student Complaint APIs (ROLE_STUDENT)
- `POST /api/student/complaints`
- `GET /api/student/complaints`
- `GET /api/student/complaints/{id}`
- `POST /api/student/complaints/{id}/resolve`
- `POST /api/student/complaints/{id}/escalate`

### Admin Complaint APIs (ROLE_ADMIN)
- `GET /api/admin/complaints`
- `GET /api/admin/complaints/{id}`
- `POST /api/admin/complaints/{id}/assign-department`
- `POST /api/admin/complaints/{id}/override-ai`
- `POST /api/admin/complaints/{id}/resend-email`
- `POST /api/admin/complaints/{id}/acknowledge-manual`
- `POST /api/admin/complaints/{id}/action-taken`
- `POST /api/admin/complaints/{id}/internal-note`
- `GET /api/admin/complaints/overdue`
- `GET /api/admin/dashboard/kpis`

### Departments (ROLE_ADMIN)
- `POST /api/admin/departments`
- `GET /api/admin/departments`
- `GET /api/admin/departments/{id}`
- `PUT /api/admin/departments/{id}`
- `DELETE /api/admin/departments/{id}`

### Department Acknowledgement (token-based; public endpoint)
- `POST /api/complaints/{id}/acknowledge`

## 4. Core Contract Shapes (Summary)

### `POST /api/student/complaints`
Request:
- `title`, `description`, `area`, `complaintDate`, `images[{url, deleteHash}]`

Response:
- complaint detail payload including:
  - `aiSeverity`
  - `aiSuggestedDepartment`
  - `assignedDepartment`
  - `status`
  - `slaDueAt`
  - `overdue`
  - `timeline[]`

### `POST /api/uploads/images`
Response:
- `imageUrls: string[]`
- `images: [{ url, deleteHash }]`

### `POST /api/complaints/{id}/acknowledge`
Request:
- `token`
- `message` (optional)

Response:
- updated complaint summary + acknowledgement timestamp

## 5. Frontend Route Map

### Public
- `/login`
- `/signup`

### Student
- `/student/dashboard`
- `/student/complaints/new`
- `/student/complaints`
- `/student/complaints/:id`

### Admin
- `/admin/dashboard`
- `/admin/complaints`
- `/admin/complaints/:id`
- `/admin/departments`

## 6. Extensibility (Future Chatbot)

Design hooks reserved:
- `notification_events` table (future)
- `chat_sessions` / `chat_messages` modules (future)
- `department_portal` role expansion (`DEPARTMENT_AUTHORITY`) without breaking complaint workflow
- event-driven integrations based on `complaint_events`
