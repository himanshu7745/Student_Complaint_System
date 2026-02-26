INSERT INTO users(name, email, password_hash, role, department, active)
VALUES
('Student User', 'student@campus.local', '$2a$10$2b2tPjP2sMxWc4iV8vCFwOCg3h7KyYVJZZzKzbwQ6VykBLL8GMDIS', 'ROLE_USER', 'GENERAL', TRUE),
('Electrical Supervisor', 'electrical@campus.local', '$2a$10$2b2tPjP2sMxWc4iV8vCFwOCg3h7KyYVJZZzKzbwQ6VykBLL8GMDIS', 'ROLE_RESOLVER', 'ELECTRICAL', TRUE),
('Hostel Warden', 'warden@campus.local', '$2a$10$2b2tPjP2sMxWc4iV8vCFwOCg3h7KyYVJZZzKzbwQ6VykBLL8GMDIS', 'ROLE_DEPT_ADMIN', 'HOSTEL', TRUE),
('Facilities Manager', 'facilities@campus.local', '$2a$10$2b2tPjP2sMxWc4iV8vCFwOCg3h7KyYVJZZzKzbwQ6VykBLL8GMDIS', 'ROLE_DEPT_ADMIN', 'FACILITIES', TRUE),
('IT Support', 'itdesk@campus.local', '$2a$10$2b2tPjP2sMxWc4iV8vCFwOCg3h7KyYVJZZzKzbwQ6VykBLL8GMDIS', 'ROLE_RESOLVER', 'IT', TRUE),
('Security Office', 'security@campus.local', '$2a$10$2b2tPjP2sMxWc4iV8vCFwOCg3h7KyYVJZZzKzbwQ6VykBLL8GMDIS', 'ROLE_RESOLVER', 'SECURITY', TRUE),
('Manual Reviewer', 'reviewer@campus.local', '$2a$10$2b2tPjP2sMxWc4iV8vCFwOCg3h7KyYVJZZzKzbwQ6VykBLL8GMDIS', 'ROLE_REVIEWER', 'GENERAL', TRUE),
('Super Admin', 'superadmin@campus.local', '$2a$10$2b2tPjP2sMxWc4iV8vCFwOCg3h7KyYVJZZzKzbwQ6VykBLL8GMDIS', 'ROLE_SUPER_ADMIN', 'GENERAL', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO sla_rules(priority, acknowledge_within_minutes, resolve_within_minutes, active)
VALUES
('CRITICAL', 15, 240, TRUE),
('HIGH', 60, 720, TRUE),
('MEDIUM', 240, 2880, TRUE),
('LOW', 720, 10080, TRUE)
ON CONFLICT (priority) DO NOTHING;

INSERT INTO routing_rules(category, owner_role, collaborator_roles, active)
VALUES
('ELECTRICAL', 'ROLE_RESOLVER', 'ROLE_DEPT_ADMIN', TRUE),
('PLUMBING', 'ROLE_DEPT_ADMIN', 'ROLE_RESOLVER', TRUE),
('HOSTEL', 'ROLE_DEPT_ADMIN', 'ROLE_RESOLVER', TRUE),
('INTERNET', 'ROLE_RESOLVER', 'ROLE_DEPT_ADMIN', TRUE),
('SECURITY', 'ROLE_RESOLVER', 'ROLE_DEPT_ADMIN', TRUE),
('SANITATION', 'ROLE_DEPT_ADMIN', NULL, TRUE),
('CLASSROOM', 'ROLE_DEPT_ADMIN', 'ROLE_RESOLVER', TRUE),
('LIBRARY', 'ROLE_DEPT_ADMIN', NULL, TRUE),
('MESS', 'ROLE_DEPT_ADMIN', NULL, TRUE),
('TRANSPORT', 'ROLE_DEPT_ADMIN', NULL, TRUE),
('ADMINISTRATION', 'ROLE_DEPT_ADMIN', NULL, TRUE),
('HARASSMENT', 'ROLE_DEPT_ADMIN', 'ROLE_RESOLVER', TRUE);

INSERT INTO app_settings(setting_key, setting_value)
VALUES ('prediction.threshold', '0.72')
ON CONFLICT (setting_key) DO NOTHING;
