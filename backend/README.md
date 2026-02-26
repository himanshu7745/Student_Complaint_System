# Complaint Routing Backend (Spring Boot 3 + PostgreSQL)

Production-oriented backend for the campus “AI Complaint Classification & Auto Routing” system.

## Stack
- Spring Boot 3.x (Java 17+)
- Spring Web / Validation / Security / JPA
- PostgreSQL
- Flyway migrations
- JWT auth (roles)
- OpenAPI/Swagger (`/swagger-ui`)
- Scheduled SLA escalation checks

## Key Features Implemented
- Authentication + JWT roles (`ROLE_USER`, `ROLE_REVIEWER`, `ROLE_RESOLVER`, `ROLE_DEPT_ADMIN`, `ROLE_SUPER_ADMIN`)
- Complaint lifecycle + transition validation
- External prediction API integration (`GET http://localhost:8090/complaintFeatures/` with request body)
- Prediction persistence (raw + parsed confidences/severity)
- Manual review queue fallback (low confidence / prediction failure / missing routing)
- Multi-label categories (primary + secondary)
- Routing rules + owner/collaborators assignments
- SLA rule-based due times + scheduled escalations
- Timeline/audit log + message thread + attachments metadata
- Admin inbox filters + analytics endpoints
- Settings endpoints (routing rules, SLA rules, threshold, categories)
- Structured error format + correlation ID header (`X-Correlation-Id`)

## Run Locally
### Option A: local JVM + local Postgres
1. Start PostgreSQL and create DB `complaints`
2. Configure env vars (or use defaults in `application.yml`)
3. Run:
```bash
mvn -q -DskipTests compile
mvn spring-boot:run
```

### Option B: Docker Compose
```bash
cd backend
docker compose up --build
```

## API Docs
- OpenAPI JSON: `http://localhost:8080/api-docs`
- Swagger UI: `http://localhost:8080/swagger-ui`

## Demo Users (seeded)
All seeded users use password: `Password@123`
- `student@campus.local`
- `reviewer@campus.local`
- `electrical@campus.local`
- `warden@campus.local`
- `facilities@campus.local`
- `itdesk@campus.local`
- `security@campus.local`
- `superadmin@campus.local`

## Prediction API Contract (Backend Integration)
Backend calls:
- `GET http://localhost:8090/complaintFeatures/`
- Body: `[ { title, description, images: [] } ]`

If prediction fails/unreachable:
- complaint creation still succeeds
- complaint is marked `needsReview=true`
- manual review queue entry is implicit via complaint flag

## Important Notes
- Attachment storage is local filesystem (`./data/attachments`) for demo/dev.
- File download endpoint is authenticated (`/api/files/{fileName}`).
- Confidence-level filtering in admin inbox is applied in service layer using latest stored prediction.
- The prediction algorithm itself is intentionally not implemented here.

## Supporting Docs
- `docs/curl-examples.md`
- `docs/postman/ComplaintRoutingBackend.postman_collection.json`
