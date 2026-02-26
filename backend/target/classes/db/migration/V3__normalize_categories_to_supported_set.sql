-- Collapse legacy categories into OTHERS so enum/category lists stay aligned with the UI.
UPDATE complaint_categories
SET category = 'OTHERS'
WHERE category IN ('LIBRARY', 'MESS');

UPDATE routing_rules
SET category = 'OTHERS'
WHERE category IN ('LIBRARY', 'MESS');

-- Ensure a generic fallback routing rule exists for OTHERS.
INSERT INTO routing_rules(category, owner_role, collaborator_roles, active)
SELECT 'OTHERS', 'ROLE_DEPT_ADMIN', 'ROLE_REVIEWER', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM routing_rules WHERE category = 'OTHERS' AND active = TRUE
);
