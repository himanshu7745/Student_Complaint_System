package com.codex.scms.domain.enums;

public enum ComplaintStatus {
    NEW,
    AI_CLASSIFIED,
    PENDING_ADMIN_ASSIGNMENT,
    ASSIGNED_TO_DEPARTMENT,
    EMAIL_SENT,
    ACK_RECEIVED,
    ACTION_TAKEN,
    RESOLVED_BY_STUDENT,
    ESCALATED_TO_DIRECTOR,
    CLOSED
}
