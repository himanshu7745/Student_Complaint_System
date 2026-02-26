# Student Complaint Management System (Spring Boot + React)

This repository now contains a full-stack SCMS implementation designed around:
- Spring Boot 3 (MVC, JWT security, JPA/Hibernate, Flyway, Scheduler, Swagger)
- PostgreSQL
- React (JS only) + Tailwind + shadcn-style UI components + React Router + TanStack Query
- Backend-mediated `imgbb` uploads
- External AI/VLM classification integration (severity + optional department suggestion)
- Email acknowledgement + 7-day SLA workflow

## Project Structure

- `backend/` - Spring Boot API
- `frontend/` - React application (Vite)
- `docs/schema-api-route-map.md` - DB schema + route map + workflow contract
- `docs/api-examples.md` - example JSON requests/responses

## Backend Setup (No Docker)

### 1) Prerequisites
- Java 17+ (tested compile path in this workspace)
- Maven 3.9+
- PostgreSQL 14+
- SMTP credentials (for outbound email)
- imgbb API key
- External AI API endpoint (or fallback behavior will be used)

### 2) Create PostgreSQL DB
```sql
CREATE DATABASE scms;
```

### 3) Configure backend
Edit `backend/src/main/resources/application.yml`:
- `spring.datasource.*`
- `app.jwt.secret` (32+ bytes)
- `spring.mail.*`
- `app.imgbb.api-key`
- `app.ai.base-url`, `app.ai.endpoint`, `app.ai.api-key` (if needed)
- `app.public-urls.backend-base-url`, `app.public-urls.frontend-base-url`

### 4) Run backend
```bash
cd backend
mvn spring-boot:run
```

### 5) API docs
- Swagger UI: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- OpenAPI JSON: [http://localhost:8080/api-docs](http://localhost:8080/api-docs)

## Frontend Setup (No Docker)

### 1) Prerequisites
- Node.js 18+
- npm 9+

### 2) Configure frontend env
Create `frontend/.env`:
```bash
VITE_API_BASE_URL=http://localhost:8080
```

### 3) Install and run frontend
```bash
cd frontend
npm install
npm run dev
```

### 4) Open app
- [http://localhost:5173](http://localhost:5173)

## Implemented Workflow Coverage

- Student/Admin signup/login with JWT + BCrypt
- Role-protected backend routes and frontend protected pages
- Complaint creation with image URLs from backend upload endpoint
- AI classification with fallback (`MEDIUM`, no department on failure)
- Auto-assignment when AI suggests a matching department
- Admin manual assignment for pending complaints
- Department email send and SLA start (`emailSentAt`, `slaDueAt = +7 days`)
- Secure tokenized acknowledgement endpoint/link
- Student resolve or escalate to Director (overdue or unsatisfied after ack/action)
- Scheduler to flag overdue complaints via timeline event
- Complaint timeline/audit trail
- Department CRUD
- Admin queue filters + pagination

## Notes / Future Scope Hooks

The design keeps room for:
- chatbot module (FAQ + tracking)
- department portal role/module
- notifications subsystem
- event-driven integrations based on `complaint_events`

## Validation / Tests Run in This Workspace

Backend:
- `mvn -q -DskipTests compile` ✅
- `mvn -q test` ✅ (with Mockito subclass mock-maker config for Java 25 runtime)

Frontend:
- Source scaffolded and wired end-to-end, but `npm install` / build was not executed in this environment.
