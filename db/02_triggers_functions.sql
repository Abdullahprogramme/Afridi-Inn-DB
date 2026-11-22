-- =============================================================================
-- AFRIDI INN - RESTAURANT MANAGEMENT AND ONLINE ORDER TRACKING SYSTEM
-- File    : db/02_triggers_functions.sql
-- Step    : 2 of the database build (triggers and trigger functions)
-- Engine  : PostgreSQL 14+ (written for pgAdmin 4 Query Tool)
--
-- HOW TO RUN (pgAdmin 4)
--   1. Ensure db/01_tables.sql has already been run on database  afridi_inn .
--   2. In pgAdmin 4: right-click database afridi_inn > Query Tool.
--   3. Open this file (02_triggers_functions.sql) and press F5 (or click Execute).
--   4. Verify the output grid at the bottom lists all 4 created triggers.
--
-- COVERS (per instructions.txt Step 3 / Triggers section):
--   1. trg_assign_order_number   (BEFORE INSERT on customer_order)
--      - Takes transaction-level advisory lock: pg_advisory_xact_lock(branch_id, YYYYMMDD)
--        to prevent race conditions / duplicate numbers during concurrent orders.
--      - Auto-calculates daily_order_number = MAX(...) + 1 per branch per day.
--      - Formats bill_number = BRANCHCODE-YYYYMMDD-NNNN (e.g. KHI1-20261106-0001).
--      - Generates hex tracking_token for ONLINE orders via gen_random_uuid().
--
--   2. trg_check_cancel_approver (BEFORE INSERT OR UPDATE on customer_order)
--      - Enforces that if approved_by_employee_id is set (or order is CANCELLED),
--        the approving staff member must exist, be ACTIVE, and hold role
--        MANAGER or GRO.
--
--   3. trg_set_updated_at        (BEFORE UPDATE on customer_order)
--      - Automatically sets updated_at to CURRENT_TIMESTAMP on any modification.
--
--   4. trg_block_edit_after_bill (BEFORE INSERT/UPDATE/DELETE on order_item)
--      - Blocks any line item additions, quantity/price modifications, or
--        deletions once an order has reached BILLED, COMPLETED, or CANCELLED status.
--      - Companion trigger trg_block_addon_edit_after_bill protects order_item_add_on.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- DEV RESET / CLEANUP (safe to re-run during development)
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_assign_order_number ON customer_order;
DROP TRIGGER IF EXISTS trg_check_cancel_approver ON customer_order;
DROP TRIGGER IF EXISTS trg_set_updated_at ON customer_order;
DROP TRIGGER IF EXISTS trg_block_edit_after_bill ON order_item;
DROP TRIGGER IF EXISTS trg_block_addon_edit_after_bill ON order_item_add_on;

DROP FUNCTION IF EXISTS fn_assign_order_number() CASCADE;
DROP FUNCTION IF EXISTS fn_check_cancel_approver() CASCADE;
DROP FUNCTION IF EXISTS fn_set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS fn_block_edit_after_bill() CASCADE;
DROP FUNCTION IF EXISTS fn_block_addon_edit_after_bill() CASCADE;


-- -----------------------------------------------------------------------------
-- 1. Daily Order Number & Bill Number Assignment (Advisory Lock Protected)
-- -----------------------------------------------------------------------------
-- Business Rule:
--   Bill numbers restart at 1 every day per branch (e.g., KHI1-20261106-0001).
--   To guarantee zero duplicate numbers under heavy concurrent cashier/online
--   activity, an advisory transaction lock is acquired on (branch_id, yyyymmdd).
--   The lock is held until the transaction commits or rolls back.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_assign_order_number()
RETURNS TRIGGER AS $$
DECLARE
    v_branch_code VARCHAR(10);
    v_date_int    INT;
    v_date_str    VARCHAR(8);
    v_next_num    INT;
BEGIN
    -- Ensure order_date has a value (defaults to current date in branch timezone)
    IF NEW.order_date IS NULL THEN
        NEW.order_date := CURRENT_DATE;
    END IF;

    -- Lookup branch code to build bill_number prefix
    SELECT branch_code INTO v_branch_code
    FROM branch
    WHERE branch_id = NEW.branch_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Branch with ID % does not exist.', NEW.branch_id;
    END IF;

    -- Compute integer representation of date: YYYYMMDD (e.g., 20261117)
    v_date_str := to_char(NEW.order_date, 'YYYYMMDD');
    v_date_int := v_date_str::INT;

    -- Acquire an exclusive transaction-level advisory lock for this (branch, date) pair.
    -- Any concurrent transaction attempting to insert for the same branch and day
    -- will wait until this transaction completes before reading MAX(daily_order_number).
    PERFORM pg_advisory_xact_lock(NEW.branch_id, v_date_int);

    -- Compute the next sequence number for this branch on this date
    SELECT COALESCE(MAX(daily_order_number), 0) + 1
    INTO v_next_num
    FROM customer_order
    WHERE branch_id = NEW.branch_id
      AND order_date = NEW.order_date;

    NEW.daily_order_number := v_next_num;

    -- Format bill_number: BRANCHCODE-YYYYMMDD-NNNN (e.g. KHI1-20261106-0001)
    NEW.bill_number := v_branch_code || '-' || v_date_str || '-' || lpad(v_next_num::TEXT, 4, '0');

    -- Auto-generate tracking token for ONLINE orders if not already provided
    IF NEW.order_channel = 'ONLINE' AND (NEW.tracking_token IS NULL OR trim(NEW.tracking_token) = '') THEN
        NEW.tracking_token := replace(gen_random_uuid()::TEXT, '-', '');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_assign_order_number
    BEFORE INSERT ON customer_order
    FOR EACH ROW
    EXECUTE FUNCTION fn_assign_order_number();


-- -----------------------------------------------------------------------------
-- 2. Cancellation Approver Validation
-- -----------------------------------------------------------------------------
-- Business Rule:
--   Cancellation requires approval by an active MANAGER or GRO.
--   When approved_by_employee_id is assigned or when order_status = 'CANCELLED',
--   the trigger verifies that the staff member exists, is active, and possesses
--   an authorized role (MANAGER or GRO).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_check_cancel_approver()
RETURNS TRIGGER AS $$
DECLARE
    v_role      VARCHAR(20);
    v_is_active BOOLEAN;
BEGIN
    -- If an order is marked CANCELLED, an approver ID must be present
    IF NEW.order_status = 'CANCELLED' AND NEW.approved_by_employee_id IS NULL THEN
        RAISE EXCEPTION 'Order cancellation requires an approving employee (MANAGER or GRO).';
    END IF;

    -- Whenever an approver employee ID is supplied, validate role & active status
    IF NEW.approved_by_employee_id IS NOT NULL THEN
        SELECT role, is_active
        INTO v_role, v_is_active
        FROM employee
        WHERE employee_id = NEW.approved_by_employee_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Approving employee ID % does not exist.', NEW.approved_by_employee_id;
        END IF;

        IF NOT v_is_active THEN
            RAISE EXCEPTION 'Approving employee % is inactive. Inactive employees cannot approve cancellations.',
                NEW.approved_by_employee_id;
        END IF;

        IF v_role NOT IN ('MANAGER', 'GRO') THEN
            RAISE EXCEPTION 'Permission denied: Only a MANAGER or GRO can approve an order cancellation. Employee % has role %.',
                NEW.approved_by_employee_id, v_role;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_cancel_approver
    BEFORE INSERT OR UPDATE ON customer_order
    FOR EACH ROW
    EXECUTE FUNCTION fn_check_cancel_approver();


-- -----------------------------------------------------------------------------
-- 3. Automatic updated_at Timestamp Maintenance
-- -----------------------------------------------------------------------------
-- Business Rule:
--   Keep updated_at current whenever any customer_order row is updated.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_updated_at
    BEFORE UPDATE ON customer_order
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_updated_at();


-- -----------------------------------------------------------------------------
-- 4. Lock on Editing Order Items After Billing / Completion / Cancellation
-- -----------------------------------------------------------------------------
-- Business Rule:
--   Line items cannot be added, changed, or deleted once the customer_order
--   is in BILLED, COMPLETED, or CANCELLED status.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_block_edit_after_bill()
RETURNS TRIGGER AS $$
DECLARE
    v_order_id     INT;
    v_order_status VARCHAR(15);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_order_id := OLD.order_id;
    ELSE
        v_order_id := NEW.order_id;
    END IF;

    SELECT order_status INTO v_order_status
    FROM customer_order
    WHERE order_id = v_order_id;

    -- If parent order exists and is in a finalized state, reject modification
    IF v_order_status IS NOT NULL AND v_order_status IN ('BILLED', 'COMPLETED', 'CANCELLED') THEN
        -- Allow setting line_status to CANCELLED during order cancellation
        IF TG_OP = 'UPDATE' AND NEW.line_status = 'CANCELLED' THEN
            RETURN NEW;
        END IF;

        RAISE EXCEPTION 'Cannot % line item: Order % is already in % status.',
            TG_OP, v_order_id, v_order_status;
    END IF;

    -- If UPDATE changes order_id, also verify the original order was not finalized
    IF TG_OP = 'UPDATE' AND OLD.order_id <> NEW.order_id THEN
        SELECT order_status INTO v_order_status
        FROM customer_order
        WHERE order_id = OLD.order_id;

        IF v_order_status IS NOT NULL AND v_order_status IN ('BILLED', 'COMPLETED', 'CANCELLED') THEN
            RAISE EXCEPTION 'Cannot move line item from Order % because it is already in % status.',
                OLD.order_id, v_order_status;
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_edit_after_bill
    BEFORE INSERT OR UPDATE OR DELETE ON order_item
    FOR EACH ROW
    EXECUTE FUNCTION fn_block_edit_after_bill();


-- -----------------------------------------------------------------------------
-- 4b. Lock on Editing Add-Ons After Billing / Completion / Cancellation
-- -----------------------------------------------------------------------------
-- Business Rule:
--   Extends the lock to order_item_add_on so item add-on modifiers cannot be
--   tampered with after billing or completion.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_block_addon_edit_after_bill()
RETURNS TRIGGER AS $$
DECLARE
    v_item_id      INT;
    v_order_id     INT;
    v_order_status VARCHAR(15);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_item_id := OLD.order_item_id;
    ELSE
        v_item_id := NEW.order_item_id;
    END IF;

    SELECT co.order_id, co.order_status
    INTO v_order_id, v_order_status
    FROM order_item oi
    JOIN customer_order co ON co.order_id = oi.order_id
    WHERE oi.order_item_id = v_item_id;

    IF v_order_status IS NOT NULL AND v_order_status IN ('BILLED', 'COMPLETED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Cannot % add-on: Order % is already in % status.',
            TG_OP, v_order_id, v_order_status;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_addon_edit_after_bill
    BEFORE INSERT OR UPDATE OR DELETE ON order_item_add_on
    FOR EACH ROW
    EXECUTE FUNCTION fn_block_addon_edit_after_bill();


-- -----------------------------------------------------------------------------
-- VERIFY: Displays all active triggers and functions created by this script
-- -----------------------------------------------------------------------------
SELECT
    event_object_table AS target_table,
    trigger_name,
    action_timing,
    event_manipulation AS event,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
      'trg_assign_order_number',
      'trg_check_cancel_approver',
      'trg_set_updated_at',
      'trg_block_edit_after_bill',
      'trg_block_addon_edit_after_bill'
  )
ORDER BY target_table, trigger_name;
