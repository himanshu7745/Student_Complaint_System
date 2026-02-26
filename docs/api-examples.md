# API Examples (JSON)

Base URL: `http://localhost:8080`

## 1) Signup (Student/Admin)

### Request
```json
POST /api/auth/signup
{
  "name": "Aarav Sharma",
  "email": "aarav.sharma@college.edu",
  "password": "StrongPass123!",
  "role": "STUDENT"
}
```

### Response
```json
{
  "success": true,
  "message": "Signup successful",
  "data": {
    "accessToken": "<jwt>",
    "user": {
      "id": "b33e9afe-47c0-4d9e-8d48-6f43798fe971",
      "name": "Aarav Sharma",
      "email": "aarav.sharma@college.edu",
      "role": "STUDENT",
      "createdAt": "2026-02-26T17:22:31.523Z"
    }
  },
  "timestamp": "2026-02-26T17:22:31.721Z"
}
```

## 2) Upload Images (backend-mediated imgbb)

### Request
`POST /api/uploads/images` (`multipart/form-data`, `files[]`)

### Response
```json
{
  "success": true,
  "message": "Images uploaded",
  "data": {
    "imageUrls": [
      "https://i.ibb.co/abcd1234/leak1.jpg",
      "https://i.ibb.co/efgh5678/leak2.jpg"
    ],
    "images": [
      {
        "url": "https://i.ibb.co/abcd1234/leak1.jpg",
        "deleteHash": "R4nd0mHashOne"
      },
      {
        "url": "https://i.ibb.co/efgh5678/leak2.jpg",
        "deleteHash": "R4nd0mHashTwo"
      }
    ]
  },
  "timestamp": "2026-02-26T17:25:19.211Z"
}
```

## 3) Create Complaint (Student)

### Request
```json
POST /api/student/complaints
Authorization: Bearer <jwt>
{
  "title": "Water leakage in hostel corridor",
  "description": "Continuous leakage near room 213 causing slippery floor and smell.",
  "area": "Hostel A - 2nd Floor",
  "complaintDate": "2026-02-26",
  "images": [
    {
      "url": "https://i.ibb.co/abcd1234/leak1.jpg",
      "deleteHash": "R4nd0mHashOne"
    }
  ]
}
```

### Response (AI suggests department + email sent)
```json
{
  "success": true,
  "message": "Complaint created",
  "data": {
    "id": "9f6f0f2d-e05a-4833-8d1f-f95f42c61e0d",
    "referenceId": "CMP-9f6f0f2d-e05a-4833-8d1f-f95f42c61e0d",
    "student": {
      "id": "b33e9afe-47c0-4d9e-8d48-6f43798fe971",
      "name": "Aarav Sharma",
      "email": "aarav.sharma@college.edu"
    },
    "title": "Water leakage in hostel corridor",
    "description": "Continuous leakage near room 213 causing slippery floor and smell.",
    "area": "Hostel A - 2nd Floor",
    "complaintDate": "2026-02-26",
    "aiSeverity": "HIGH",
    "aiSuggestedDepartment": {
      "id": "4dbf0eb9-08b6-4d3d-a58f-86d7b067d778",
      "name": "Plumbing",
      "authorityEmail": "plumbing.authority@college.edu"
    },
    "assignedDepartment": {
      "id": "4dbf0eb9-08b6-4d3d-a58f-86d7b067d778",
      "name": "Plumbing",
      "authorityEmail": "plumbing.authority@college.edu"
    },
    "assignedByAdmin": null,
    "status": "EMAIL_SENT",
    "emailSentAt": "2026-02-26T17:29:12.432Z",
    "slaDueAt": "2026-03-05T17:29:12.432Z",
    "ackReceivedAt": null,
    "studentResolvedAt": null,
    "escalatedAt": null,
    "createdAt": "2026-02-26T17:29:10.101Z",
    "updatedAt": "2026-02-26T17:29:12.433Z",
    "overdue": false,
    "aiRawResponseJson": "{\"severity\":\"HIGH\",\"departmentSuggestion\":\"Plumbing\"}",
    "images": [
      {
        "id": "737ff4f2-d939-43b7-aef8-5676dd39b2b2",
        "imageUrl": "https://i.ibb.co/abcd1234/leak1.jpg",
        "deleteHash": "R4nd0mHashOne",
        "createdAt": "2026-02-26T17:29:10.102Z"
      }
    ],
    "timeline": []
  },
  "timestamp": "2026-02-26T17:29:12.511Z"
}
```

## 4) Admin Assign Department

### Request
```json
POST /api/admin/complaints/{complaintId}/assign-department
Authorization: Bearer <admin-jwt>
{
  "departmentId": "4dbf0eb9-08b6-4d3d-a58f-86d7b067d778",
  "note": "AI did not return a department. Assigned manually after review."
}
```

## 5) Department Acknowledgement (secure token)

### Request
```json
POST /api/complaints/{complaintId}/acknowledge
{
  "token": "<ack-jwt-token>",
  "message": "Complaint received and work order created."
}
```

### Response
```json
{
  "success": true,
  "message": "Acknowledgement received",
  "data": {
    "id": "9f6f0f2d-e05a-4833-8d1f-f95f42c61e0d",
    "status": "ACK_RECEIVED",
    "ackReceivedAt": "2026-02-27T10:03:17.220Z",
    "overdue": false
  },
  "timestamp": "2026-02-27T10:03:17.228Z"
}
```

## 6) Student Escalate to Director

### Request
```json
POST /api/student/complaints/{complaintId}/escalate
Authorization: Bearer <student-jwt>
{
  "reason": "No acknowledgement within SLA window. Escalating to Director."
}
```

## 7) List Complaints (Admin with filters + pagination)

### Request
```json
GET /api/admin/complaints?page=0&size=10&status=PENDING_ADMIN_ASSIGNMENT&severity=HIGH&search=hostel
Authorization: Bearer <admin-jwt>
```

### Response (shape)
```json
{
  "success": true,
  "message": "Request successful",
  "data": {
    "items": [
      {
        "id": "9f6f0f2d-e05a-4833-8d1f-f95f42c61e0d",
        "referenceId": "CMP-9f6f0f2d-e05a-4833-8d1f-f95f42c61e0d",
        "title": "Water leakage in hostel corridor",
        "area": "Hostel A - 2nd Floor",
        "complaintDate": "2026-02-26",
        "aiSeverity": "HIGH",
        "status": "PENDING_ADMIN_ASSIGNMENT",
        "overdue": false,
        "assignedDepartment": null,
        "slaDueAt": null,
        "createdAt": "2026-02-26T17:29:10.101Z",
        "student": {
          "id": "b33e9afe-47c0-4d9e-8d48-6f43798fe971",
          "name": "Aarav Sharma",
          "email": "aarav.sharma@college.edu"
        }
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "page": 0,
    "size": 10,
    "first": true,
    "last": true
  },
  "timestamp": "2026-02-26T17:31:45.201Z"
}
```
