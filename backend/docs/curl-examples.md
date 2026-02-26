# curl Examples

Base URL: `http://localhost:8080`

Demo credentials (seeded):
- `student@campus.local` / `Password@123`
- `reviewer@campus.local` / `Password@123`
- `superadmin@campus.local` / `Password@123`

## 1) Login
```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"student@campus.local","password":"Password@123"}'
```

## 2) Create Complaint
```bash
TOKEN="<JWT>"
curl -s -X POST http://localhost:8080/api/complaints \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "title":"Sparks from switchboard in hostel room",
    "description":"When turning on the study lamp, sparks came from the switchboard and the socket feels warm.",
    "hostel":"Maple Hall",
    "building":"Block B",
    "room":"204",
    "preferredVisitSlot":"Today 4-6 PM",
    "anonymous":false
  }'
```

## 3) List My Complaints
```bash
curl -s "http://localhost:8080/api/complaints?mine=true&status=NEW&page=0&size=20" \
  -H "Authorization: Bearer $TOKEN"
```

## 4) Get Complaint Detail
```bash
curl -s http://localhost:8080/api/complaints/CMP-2026-1001 \
  -H "Authorization: Bearer $TOKEN"
```

## 5) Add Message
```bash
curl -s -X POST http://localhost:8080/api/complaints/CMP-2026-1001/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"message":"Please check this urgently"}'
```

## 6) Upload Attachment (multipart)
```bash
curl -s -X POST "http://localhost:8080/api/complaints/CMP-2026-1001/attachments?rerunPrediction=true" \
  -H "Authorization: Bearer $TOKEN" \
  -F 'files=@/path/to/photo.jpg'
```

## 7) Admin Inbox
```bash
ADMIN_TOKEN="<JWT>"
curl -s "http://localhost:8080/api/admin/inbox?status=NEW&category=ELECTRICAL&confidenceLevel=LOW" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## 8) Review Queue (Reviewer)
```bash
REVIEWER_TOKEN="<JWT>"
curl -s http://localhost:8080/api/admin/review-queue?page=0&size=20 \
  -H "Authorization: Bearer $REVIEWER_TOKEN"
```

## 9) Edit + Route Manual Review
```bash
curl -s -X POST http://localhost:8080/api/admin/review-queue/CMP-2026-1001/edit \
  -H "Authorization: Bearer $REVIEWER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "categories":["ELECTRICAL","HOSTEL"],
    "primaryCategory":"ELECTRICAL",
    "priority":"CRITICAL",
    "ownerUserId":2,
    "collaboratorUserIds":[3],
    "internalNotes":"Confirmed electrical safety issue. Routing to Electrical + Hostel Warden."
  }'
```

## 10) Approve Manual Review
```bash
curl -s -X POST http://localhost:8080/api/admin/review-queue/CMP-2026-1001/approve \
  -H "Authorization: Bearer $REVIEWER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"internalNotes":"Approved routing"}'
```

## 11) Change Status / Assign / Escalate / Resolve
```bash
curl -s -X POST http://localhost:8080/api/admin/complaints/CMP-2026-1001/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"status":"IN_PROGRESS","comment":"Technician dispatched"}'

curl -s -X POST http://localhost:8080/api/admin/complaints/CMP-2026-1001/assign \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"ownerUserId":2,"collaboratorUserIds":[3],"reason":"Electrical + hostel joint handling"}'

curl -s -X POST http://localhost:8080/api/admin/complaints/CMP-2026-1001/escalate \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"level":"RESOLVE_OVERDUE","escalatedToRole":"ROLE_SUPER_ADMIN","reason":"Urgent safety incident pending beyond SLA"}'

curl -s -X POST http://localhost:8080/api/admin/complaints/CMP-2026-1001/resolve \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"resolutionNote":"Switchboard replaced and wiring inspected. Safe to use now."}'
```
