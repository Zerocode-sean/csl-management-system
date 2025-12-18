CREATE OR REPLACE FUNCTION log_certificate_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, new_values)
        VALUES (NEW.issued_by_admin_id, 'CREATE', 'certificate', NEW.csl_number, row_to_json(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, old_values, new_values)
        VALUES (
            COALESCE(NEW.revoked_by_admin_id, NEW.issued_by_admin_id),
            'UPDATE',
            'certificate',
            NEW.csl_number,
            row_to_json(OLD),
            row_to_json(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, old_values)
        VALUES (NULL, 'DELETE', 'certificate', OLD.csl_number, row_to_json(OLD));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
