-- Demo dataset for frontend integration verification (user dashboard, detail, admin inbox, review queue, analytics).
-- Safe to apply once via Flyway. Uses stable complaint codes and joins by seeded user emails.

WITH seed_complaints (
    complaint_code,
    created_by_email,
    title,
    description,
    status,
    priority,
    hostel_name,
    building_name,
    room_name,
    preferred_visit_slot,
    anonymous,
    needs_review,
    review_reason,
    owner_email,
    resolved_at,
    closed_at,
    reopened_count,
    acknowledge_due_at,
    resolve_due_at,
    feedback_rating,
    feedback_comment,
    feedback_at,
    created_at,
    updated_at
) AS (
    VALUES
    (
        'CMP-2026-1001',
        'student@campus.local',
        'Frequent sparks from hostel switchboard',
        'Sparks are coming from the room switchboard when the geyser is turned on. Burning smell noticed twice since last night. Please inspect urgently for safety.',
        'IN_PROGRESS',
        'CRITICAL',
        'Maple Hall',
        'Block A',
        'Room 204',
        'Today 5-7 PM',
        FALSE,
        FALSE,
        NULL,
        'electrical@campus.local',
        NULL,
        NULL,
        0,
        now() - interval '1 day',
        now() - interval '2 hours',
        NULL,
        NULL,
        NULL,
        now() - interval '8 days',
        now() - interval '90 minutes'
    ),
    (
        'CMP-2026-1002',
        'student@campus.local',
        'No water in hostel washroom line',
        'Water supply is unavailable in the second floor washroom line since morning. Nearby rooms are also affected. Please send maintenance support.',
        'NEEDS_INFO',
        'HIGH',
        'Pine Hostel',
        'Block B',
        '2nd Floor Washroom',
        NULL,
        FALSE,
        FALSE,
        NULL,
        'warden@campus.local',
        NULL,
        NULL,
        0,
        now() - interval '4 days',
        now() + interval '8 hours',
        NULL,
        NULL,
        NULL,
        now() - interval '5 days',
        now() - interval '6 hours'
    ),
    (
        'CMP-2026-1003',
        'student@campus.local',
        'Campus Wi-Fi drops repeatedly in lab',
        'Internet keeps disconnecting in Main Academic Block C computer lab during classes. Unsure if it is router or local cabling. Needs review before routing.',
        'NEW',
        'HIGH',
        NULL,
        'Main Academic',
        'Lab 3',
        NULL,
        FALSE,
        TRUE,
        'Low confidence below threshold',
        NULL,
        NULL,
        NULL,
        0,
        now() + interval '20 minutes',
        now() + interval '18 hours',
        NULL,
        NULL,
        NULL,
        now() - interval '1 day',
        now() - interval '1 hour'
    ),
    (
        'CMP-2026-1004',
        'student@campus.local',
        'Serious harassment concern near hostel corridor',
        'Student reported repeated intimidation and threatening behavior near the hostel corridor at night. Sensitive complaint needs human review before final routing.',
        'ACKNOWLEDGED',
        'CRITICAL',
        'Oak Residence',
        'Cedar Block',
        'First Floor Corridor',
        NULL,
        TRUE,
        TRUE,
        'Sensitive content requires manual review',
        'reviewer@campus.local',
        NULL,
        NULL,
        0,
        now() - interval '8 hours',
        now() + interval '3 hours',
        NULL,
        NULL,
        NULL,
        now() - interval '14 hours',
        now() - interval '3 hours'
    ),
    (
        'CMP-2026-1005',
        'student@campus.local',
        'Garbage not cleared near classroom block',
        'Waste bins near Classroom Block B were overflowing for two days and smell was spreading into the corridor. Cleanup was requested by multiple students.',
        'RESOLVED',
        'MEDIUM',
        NULL,
        'Block B',
        'Classroom Corridor',
        NULL,
        FALSE,
        FALSE,
        NULL,
        'facilities@campus.local',
        now() - interval '2 days',
        NULL,
        0,
        now() - interval '6 days',
        now() - interval '3 days',
        4,
        'Area was cleaned and bins replaced, but response could be faster.',
        now() - interval '36 hours',
        now() - interval '6 days',
        now() - interval '30 hours'
    ),
    (
        'CMP-2026-1006',
        'student@campus.local',
        'Bus route timing mismatch at transport desk',
        'Transport notice board timings do not match the actual shuttle departure. Students missed the morning shuttle due to outdated route information.',
        'CLOSED',
        'LOW',
        NULL,
        'Transport Office',
        'Help Desk',
        NULL,
        FALSE,
        FALSE,
        NULL,
        'superadmin@campus.local',
        now() - interval '3 days',
        now() - interval '2 days',
        0,
        now() - interval '10 days',
        now() - interval '4 days',
        5,
        'Timing chart corrected and route notices updated.',
        now() - interval '40 hours',
        now() - interval '10 days',
        now() - interval '2 days'
    ),
    (
        'CMP-2026-1007',
        'student@campus.local',
        'Projector socket is loose in classroom',
        'Projector power socket in Classroom 12 is loose and power cuts off during lectures. Needs electrical inspection before it damages equipment.',
        'NEW',
        'MEDIUM',
        NULL,
        'Main Academic',
        'Classroom 12',
        NULL,
        FALSE,
        FALSE,
        NULL,
        NULL,
        NULL,
        NULL,
        0,
        now() + interval '2 hours',
        now() + interval '2 days',
        NULL,
        NULL,
        NULL,
        now() - interval '10 hours',
        now() - interval '20 minutes'
    ),
    (
        'CMP-2026-1008',
        'student@campus.local',
        'Campus bus route delay and missed stop',
        'Evening shuttle arrived late and skipped one usual stop near Sports Complex yesterday. Students need route confirmation and transport update.',
        'IN_PROGRESS',
        'MEDIUM',
        NULL,
        'Sports Complex',
        'Shuttle Stop 2',
        NULL,
        FALSE,
        FALSE,
        NULL,
        'facilities@campus.local',
        NULL,
        NULL,
        0,
        now() - interval '1 day',
        now() + interval '1 day',
        NULL,
        NULL,
        NULL,
        now() - interval '3 days',
        now() - interval '4 hours'
    ),
    (
        'CMP-2026-1009',
        'student@campus.local',
        'Poster approval request is not clearly categorized',
        'Need clarification about where to submit approval for a campus event poster. Request spans administration and general support, AI prediction failed.',
        'NEW',
        'LOW',
        NULL,
        'Administration Block',
        'Reception',
        NULL,
        FALSE,
        TRUE,
        'Prediction failed; manual review required',
        NULL,
        NULL,
        NULL,
        0,
        now() + interval '4 hours',
        now() + interval '4 days',
        NULL,
        NULL,
        NULL,
        now() - interval '18 hours',
        now() - interval '2 hours'
    ),
    (
        'CMP-2026-1010',
        'student@campus.local',
        'Leakage resumed in hostel washroom after repair',
        'Water leakage has started again from the same pipeline in the hostel washroom after a previous repair. Reopening the issue because the fix did not hold.',
        'REOPENED',
        'HIGH',
        'Maple Hall',
        'Block A',
        'Washroom Line',
        'Tomorrow 9-11 AM',
        FALSE,
        FALSE,
        NULL,
        'warden@campus.local',
        NULL,
        NULL,
        1,
        now() - interval '12 hours',
        now() + interval '12 hours',
        NULL,
        NULL,
        NULL,
        now() - interval '4 days',
        now() - interval '50 minutes'
    )
)
INSERT INTO complaints (
    complaint_code,
    created_by,
    title,
    description,
    status,
    priority,
    hostel_name,
    building_name,
    room_name,
    preferred_visit_slot,
    anonymous,
    needs_review,
    review_reason,
    owner_user_id,
    resolved_at,
    closed_at,
    reopened_count,
    acknowledge_due_at,
    resolve_due_at,
    feedback_rating,
    feedback_comment,
    feedback_at,
    created_at,
    updated_at
)
SELECT
    s.complaint_code,
    creator.id,
    s.title,
    s.description,
    s.status,
    s.priority,
    s.hostel_name,
    s.building_name,
    s.room_name,
    s.preferred_visit_slot,
    s.anonymous,
    s.needs_review,
    s.review_reason,
    owner.id,
    s.resolved_at,
    s.closed_at,
    s.reopened_count,
    s.acknowledge_due_at,
    s.resolve_due_at,
    s.feedback_rating,
    s.feedback_comment,
    s.feedback_at,
    s.created_at,
    s.updated_at
FROM seed_complaints s
JOIN users creator ON creator.email = s.created_by_email
LEFT JOIN users owner ON owner.email = s.owner_email
ON CONFLICT (complaint_code) DO NOTHING;

WITH seed_categories(complaint_code, category, is_primary, confidence) AS (
    VALUES
    ('CMP-2026-1001', 'ELECTRICAL', TRUE, 0.97),
    ('CMP-2026-1001', 'HOSTEL', FALSE, 0.91),
    ('CMP-2026-1002', 'PLUMBING', TRUE, 0.88),
    ('CMP-2026-1002', 'HOSTEL', FALSE, 0.79),
    ('CMP-2026-1003', 'INTERNET', TRUE, 0.58),
    ('CMP-2026-1003', 'CLASSROOM', FALSE, 0.52),
    ('CMP-2026-1004', 'HARASSMENT', TRUE, 0.66),
    ('CMP-2026-1004', 'SECURITY', FALSE, 0.61),
    ('CMP-2026-1004', 'HOSTEL', FALSE, 0.44),
    ('CMP-2026-1005', 'SANITATION', TRUE, 0.92),
    ('CMP-2026-1005', 'CLASSROOM', FALSE, 0.68),
    ('CMP-2026-1006', 'TRANSPORT', TRUE, 0.89),
    ('CMP-2026-1006', 'ADMINISTRATION', FALSE, 0.74),
    ('CMP-2026-1007', 'CLASSROOM', TRUE, 0.76),
    ('CMP-2026-1007', 'ELECTRICAL', FALSE, 0.71),
    ('CMP-2026-1008', 'TRANSPORT', TRUE, 0.83),
    ('CMP-2026-1008', 'ADMINISTRATION', FALSE, 0.64),
    ('CMP-2026-1009', 'OTHERS', TRUE, 0.00),
    ('CMP-2026-1009', 'ADMINISTRATION', FALSE, 0.00),
    ('CMP-2026-1010', 'PLUMBING', TRUE, 0.86),
    ('CMP-2026-1010', 'HOSTEL', FALSE, 0.81)
)
INSERT INTO complaint_categories (complaint_id, category, is_primary, confidence)
SELECT c.id, s.category, s.is_primary, s.confidence
FROM seed_categories s
JOIN complaints c ON c.complaint_code = s.complaint_code
LEFT JOIN complaint_categories existing
    ON existing.complaint_id = c.id AND existing.category = s.category
WHERE existing.id IS NULL;

WITH seed_predictions(complaint_code, model_version, overall_confidence, severity_score, raw_json, predicted_at, success, failure_reason) AS (
    VALUES
    ('CMP-2026-1001', 'demo-model-v1', 0.95, 0.93, '{"seed":true,"note":"high confidence electrical"}', now() - interval '8 days' + interval '5 minutes', TRUE, NULL),
    ('CMP-2026-1002', 'demo-model-v1', 0.84, 0.71, '{"seed":true,"note":"plumbing hostel"}', now() - interval '5 days' + interval '3 minutes', TRUE, NULL),
    ('CMP-2026-1003', 'demo-model-v1', 0.58, 0.69, '{"seed":true,"note":"low confidence internet/classroom"}', now() - interval '1 day' + interval '2 minutes', TRUE, NULL),
    ('CMP-2026-1004', 'demo-model-v1', 0.66, 0.91, '{"seed":true,"note":"sensitive content"}', now() - interval '14 hours' + interval '1 minute', TRUE, NULL),
    ('CMP-2026-1005', 'demo-model-v1', 0.92, 0.41, '{"seed":true,"note":"sanitation"}', now() - interval '6 days' + interval '4 minutes', TRUE, NULL),
    ('CMP-2026-1006', 'demo-model-v1', 0.89, 0.22, '{"seed":true,"note":"transport administration"}', now() - interval '10 days' + interval '4 minutes', TRUE, NULL),
    ('CMP-2026-1007', 'demo-model-v1', 0.76, 0.48, '{"seed":true,"note":"classroom electrical"}', now() - interval '10 hours' + interval '2 minutes', TRUE, NULL),
    ('CMP-2026-1008', 'demo-model-v1', 0.83, 0.45, '{"seed":true,"note":"transport route delay"}', now() - interval '3 days' + interval '2 minutes', TRUE, NULL),
    ('CMP-2026-1009', 'demo-model-v1', 0.00, 0.25, '{"seed":true,"note":"prediction failure fallback"}', now() - interval '18 hours' + interval '2 minutes', FALSE, 'Prediction service unavailable'),
    ('CMP-2026-1010', 'demo-model-v1', 0.86, 0.74, '{"seed":true,"note":"reopened plumbing hostel"}', now() - interval '4 days' + interval '2 minutes', TRUE, NULL)
)
INSERT INTO complaint_predictions (complaint_id, model_version, overall_confidence, severity_score, raw_json, predicted_at, success, failure_reason)
SELECT c.id, s.model_version, s.overall_confidence, s.severity_score, s.raw_json, s.predicted_at, s.success, s.failure_reason
FROM seed_predictions s
JOIN complaints c ON c.complaint_code = s.complaint_code
WHERE NOT EXISTS (
    SELECT 1 FROM complaint_predictions p WHERE p.complaint_id = c.id
);

-- Owner assignments mirrored from complaints.owner_user_id
INSERT INTO complaint_assignments (complaint_id, user_id, assignment_type, created_at, updated_at)
SELECT c.id, c.owner_user_id, 'OWNER', c.created_at + interval '10 minutes', c.created_at + interval '10 minutes'
FROM complaints c
LEFT JOIN complaint_assignments a ON a.complaint_id = c.id AND a.assignment_type = 'OWNER'
WHERE c.complaint_code LIKE 'CMP-2026-10__'
  AND c.owner_user_id IS NOT NULL
  AND a.id IS NULL;

WITH seed_collab(complaint_code, user_email, assignment_type, created_at) AS (
    VALUES
    ('CMP-2026-1001', 'warden@campus.local', 'COLLABORATOR', now() - interval '8 days' + interval '12 minutes'),
    ('CMP-2026-1001', 'facilities@campus.local', 'COLLABORATOR', now() - interval '8 days' + interval '12 minutes'),
    ('CMP-2026-1002', 'facilities@campus.local', 'COLLABORATOR', now() - interval '5 days' + interval '15 minutes'),
    ('CMP-2026-1004', 'security@campus.local', 'COLLABORATOR', now() - interval '14 hours' + interval '15 minutes'),
    ('CMP-2026-1008', 'superadmin@campus.local', 'COLLABORATOR', now() - interval '3 days' + interval '20 minutes'),
    ('CMP-2026-1010', 'facilities@campus.local', 'COLLABORATOR', now() - interval '4 days' + interval '20 minutes')
)
INSERT INTO complaint_assignments (complaint_id, user_id, assignment_type, created_at, updated_at)
SELECT c.id, u.id, s.assignment_type, s.created_at, s.created_at
FROM seed_collab s
JOIN complaints c ON c.complaint_code = s.complaint_code
JOIN users u ON u.email = s.user_email
LEFT JOIN complaint_assignments existing
    ON existing.complaint_id = c.id AND existing.user_id = u.id AND existing.assignment_type = s.assignment_type
WHERE existing.id IS NULL;

WITH seed_messages(complaint_code, sender_email, message, is_internal, created_at) AS (
    VALUES
    ('CMP-2026-1001', 'student@campus.local', 'Issue is getting worse when the geyser is switched on. Please prioritize.', FALSE, now() - interval '7 days'),
    ('CMP-2026-1001', 'electrical@campus.local', 'Temporary isolation done. Full panel inspection is in progress.', FALSE, now() - interval '6 days'),
    ('CMP-2026-1001', 'electrical@campus.local', 'Internal: likely load issue in shared line, check panel replacement stock.', TRUE, now() - interval '5 days'),
    ('CMP-2026-1002', 'warden@campus.local', 'Please share a photo/video of the affected line and confirm if all rooms are impacted.', FALSE, now() - interval '8 hours'),
    ('CMP-2026-1005', 'facilities@campus.local', 'Area cleaned, bins replaced, and sanitation schedule updated for this block.', FALSE, now() - interval '2 days'),
    ('CMP-2026-1006', 'superadmin@campus.local', 'Route timings were corrected and printed notices replaced. Closing this ticket.', FALSE, now() - interval '2 days'),
    ('CMP-2026-1008', 'facilities@campus.local', 'Transport contractor contacted. We are validating route timing and missed stop logs.', FALSE, now() - interval '6 hours'),
    ('CMP-2026-1010', 'student@campus.local', 'Reopening because leakage returned after the earlier repair.', FALSE, now() - interval '2 hours')
)
INSERT INTO complaint_messages (complaint_id, sender_id, message, is_internal, created_at, updated_at)
SELECT c.id, u.id, s.message, s.is_internal, s.created_at, s.created_at
FROM seed_messages s
JOIN complaints c ON c.complaint_code = s.complaint_code
JOIN users u ON u.email = s.sender_email
WHERE NOT EXISTS (
    SELECT 1 FROM complaint_messages m
    WHERE m.complaint_id = c.id
      AND m.sender_id = u.id
      AND m.message = s.message
      AND m.created_at = s.created_at
);

WITH seed_attachments(complaint_code, uploader_email, file_name, mime_type, size_bytes, storage_path, public_url, created_at) AS (
    VALUES
    ('CMP-2026-1001', 'student@campus.local', 'switchboard-sparks.jpg', 'image/jpeg', 184320, '/tmp/seed/switchboard-sparks.jpg', 'http://localhost:8080/api/files/switchboard-sparks.jpg', now() - interval '7 days'),
    ('CMP-2026-1001', 'electrical@campus.local', 'inspection-note.pdf', 'application/pdf', 94321, '/tmp/seed/inspection-note.pdf', 'http://localhost:8080/api/files/inspection-note.pdf', now() - interval '5 days'),
    ('CMP-2026-1005', 'student@campus.local', 'overflow-bins.jpg', 'image/jpeg', 165210, '/tmp/seed/overflow-bins.jpg', 'http://localhost:8080/api/files/overflow-bins.jpg', now() - interval '6 days'),
    ('CMP-2026-1010', 'student@campus.local', 'leakage-return.mp4', 'video/mp4', 1258291, '/tmp/seed/leakage-return.mp4', 'http://localhost:8080/api/files/leakage-return.mp4', now() - interval '3 hours')
)
INSERT INTO complaint_attachments (complaint_id, uploader_id, file_name, mime_type, size, storage_path, public_url, created_at, updated_at)
SELECT c.id, u.id, s.file_name, s.mime_type, s.size_bytes, s.storage_path, s.public_url, s.created_at, s.created_at
FROM seed_attachments s
JOIN complaints c ON c.complaint_code = s.complaint_code
JOIN users u ON u.email = s.uploader_email
WHERE NOT EXISTS (
    SELECT 1 FROM complaint_attachments a
    WHERE a.complaint_id = c.id
      AND a.file_name = s.file_name
      AND a.created_at = s.created_at
);

-- Generic timeline baseline entries for all demo complaints.
INSERT INTO complaint_timeline (complaint_id, event_type, old_value, new_value, actor_id, detail, created_at, updated_at)
SELECT c.id, 'CREATED', NULL, c.status, c.created_by, 'Complaint submitted (seed data)', c.created_at, c.created_at
FROM complaints c
WHERE c.complaint_code LIKE 'CMP-2026-10__'
  AND NOT EXISTS (
      SELECT 1 FROM complaint_timeline t WHERE t.complaint_id = c.id AND t.event_type = 'CREATED'
  );

INSERT INTO complaint_timeline (complaint_id, event_type, old_value, new_value, actor_id, detail, created_at, updated_at)
SELECT c.id,
       CASE WHEN p.success THEN 'PREDICTION_COMPLETED' ELSE 'PREDICTION_FAILED' END,
       NULL,
       NULL,
       NULL,
       CASE WHEN p.success THEN 'AI prediction stored' ELSE COALESCE(p.failure_reason, 'Prediction failed') END,
       p.predicted_at,
       p.predicted_at
FROM complaints c
JOIN complaint_predictions p ON p.complaint_id = c.id
WHERE c.complaint_code LIKE 'CMP-2026-10__'
  AND NOT EXISTS (
      SELECT 1 FROM complaint_timeline t
      WHERE t.complaint_id = c.id
        AND t.event_type IN ('PREDICTION_COMPLETED', 'PREDICTION_FAILED')
  );

INSERT INTO complaint_timeline (complaint_id, event_type, old_value, new_value, actor_id, detail, created_at, updated_at)
SELECT c.id, 'ASSIGNED', NULL, c.owner_user_id::text, c.owner_user_id, 'Owner assigned for handling', c.created_at + interval '10 minutes', c.created_at + interval '10 minutes'
FROM complaints c
WHERE c.complaint_code LIKE 'CMP-2026-10__'
  AND c.owner_user_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM complaint_timeline t WHERE t.complaint_id = c.id AND t.event_type = 'ASSIGNED'
  );

INSERT INTO complaint_timeline (complaint_id, event_type, old_value, new_value, actor_id, detail, created_at, updated_at)
SELECT c.id, 'REVIEW_REQUIRED', NULL, c.review_reason, NULL, 'Placed in manual review queue', c.created_at + interval '7 minutes', c.created_at + interval '7 minutes'
FROM complaints c
WHERE c.complaint_code LIKE 'CMP-2026-10__'
  AND c.needs_review = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM complaint_timeline t WHERE t.complaint_id = c.id AND t.event_type = 'REVIEW_REQUIRED'
  );

INSERT INTO complaint_timeline (complaint_id, event_type, old_value, new_value, actor_id, detail, created_at, updated_at)
SELECT c.id, 'STATUS_CHANGED', 'NEW', c.status, c.owner_user_id, 'Seeded status progression', c.updated_at, c.updated_at
FROM complaints c
WHERE c.complaint_code LIKE 'CMP-2026-10__'
  AND c.status <> 'NEW'
  AND NOT EXISTS (
      SELECT 1 FROM complaint_timeline t WHERE t.complaint_id = c.id AND t.event_type = 'STATUS_CHANGED'
  );

WITH seed_timeline(complaint_code, event_type, old_value, new_value, actor_email, detail, created_at) AS (
    VALUES
    ('CMP-2026-1001', 'ATTACHMENT_ADDED', NULL, NULL, 'student@campus.local', 'Initial photo evidence uploaded', now() - interval '7 days'),
    ('CMP-2026-1001', 'MESSAGE_ADDED', NULL, NULL, 'electrical@campus.local', 'Inspection update posted', now() - interval '6 days'),
    ('CMP-2026-1001', 'ESCALATED', NULL, 'RESOLVE_OVERDUE', 'superadmin@campus.local', 'Escalated due to SLA breach risk', now() - interval '3 hours'),
    ('CMP-2026-1002', 'MESSAGE_ADDED', NULL, NULL, 'warden@campus.local', 'Requested more information from complainant', now() - interval '8 hours'),
    ('CMP-2026-1005', 'RESOLVED', 'IN_PROGRESS', 'RESOLVED', 'facilities@campus.local', 'Cleanup completed and schedule updated', now() - interval '2 days'),
    ('CMP-2026-1005', 'FEEDBACK_ADDED', NULL, '4', 'student@campus.local', 'User submitted resolution feedback', now() - interval '36 hours'),
    ('CMP-2026-1006', 'RESOLVED', 'IN_PROGRESS', 'RESOLVED', 'superadmin@campus.local', 'Issue fixed with notice update', now() - interval '3 days'),
    ('CMP-2026-1006', 'CLOSED', 'RESOLVED', 'CLOSED', 'superadmin@campus.local', 'Closed after confirmation', now() - interval '2 days'),
    ('CMP-2026-1010', 'REOPENED', 'RESOLVED', 'REOPENED', 'student@campus.local', 'Issue reopened after recurring leakage', now() - interval '2 hours')
)
INSERT INTO complaint_timeline (complaint_id, event_type, old_value, new_value, actor_id, detail, created_at, updated_at)
SELECT c.id, s.event_type, s.old_value, s.new_value, u.id, s.detail, s.created_at, s.created_at
FROM seed_timeline s
JOIN complaints c ON c.complaint_code = s.complaint_code
LEFT JOIN users u ON u.email = s.actor_email
WHERE NOT EXISTS (
    SELECT 1 FROM complaint_timeline t
    WHERE t.complaint_id = c.id
      AND t.event_type = s.event_type
      AND t.created_at = s.created_at
);

WITH seed_escalations(complaint_code, level, escalated_to_role, escalated_to_user_email, reason, created_at) AS (
    VALUES
    ('CMP-2026-1001', 'RESOLVE_OVERDUE', 'ROLE_SUPER_ADMIN', 'superadmin@campus.local', 'Critical electrical complaint exceeded resolve SLA window', now() - interval '3 hours')
)
INSERT INTO escalations (complaint_id, level, escalated_to_user_id, escalated_to_role, reason, created_at, updated_at)
SELECT c.id, s.level, u.id, s.escalated_to_role, s.reason, s.created_at, s.created_at
FROM seed_escalations s
JOIN complaints c ON c.complaint_code = s.complaint_code
LEFT JOIN users u ON u.email = s.escalated_to_user_email
WHERE NOT EXISTS (
    SELECT 1 FROM escalations e
    WHERE e.complaint_id = c.id
      AND e.level = s.level
      AND e.created_at = s.created_at
);
