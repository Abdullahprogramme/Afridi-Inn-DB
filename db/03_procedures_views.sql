-- =============================================================================
-- AFRIDI INN - RESTAURANT MANAGEMENT AND ONLINE ORDER TRACKING SYSTEM
-- File    : db/03_procedures_views.sql
-- Step    : 3 of the database build (views, stored procedures & workflow functions)
-- Engine  : PostgreSQL 14+ (written for pgAdmin 4 Query Tool)
--
-- HOW TO RUN (pgAdmin 4)
--   1. Ensure db/01_tables.sql and db/02_triggers_functions.sql have already run.
--   2. In pgAdmin 4: right-click database afridi_inn > Query Tool.
--   3. Open this file (03_procedures_views.sql) and press F5 (or click Execute).
--   4. Verify the output grids confirm all views and stored functions were created.
--
-- COVERS (per instructions.txt Step 4 / Procedures & Views section):
--   VIEWS:
--     1. v_order_totals          - order_id, items_total, add_ons_total, grand_total
--     2. v_menu_full             - category, item, size, price, requires_butcher, available
--     3. v_butcher_queue         - order lines at AT_BUTCHER with order/table info
--     4. v_kitchen_queue         - order lines needing the chef (non-meat & butcher-done)
--     5. v_sales_report          - date, branch, item, size, qty sold, revenue (COMPLETED)
--     6. v_order_tracking        - public-safe columns only (no customer phone / staff data)
--
--   STORED PROCEDURES / FUNCTIONS:
--     1. sp_place_order          - atomic placement of dine-in / online order with price snapshot
--     2. sp_confirm_online_order - cashier confirms online PLACED order -> routes to kitchen
--     3. sp_advance_line         - butcher/chef updates line item status & rolls up order status
--     4. sp_dispatch_order       - dispatch staff hands over order (READY -> DISPATCHED)
--     5. sp_generate_bill        - cashier bills order (DISPATCHED/READY -> BILLED, table 'Billing')
--     6. sp_record_payment       - records payment (BILLED -> COMPLETED, table 'Available')
--     7. sp_cancel_order         - authorized cancellation (MANAGER/GRO only, lines CANCELLED)
-- =============================================================================


-- -----------------------------------------------------------------------------
-- DEV RESET (safe to re-run during development)
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS v_order_tracking CASCADE;
DROP VIEW IF EXISTS v_sales_report CASCADE;
DROP VIEW IF EXISTS v_kitchen_queue CASCADE;
DROP VIEW IF EXISTS v_butcher_queue CASCADE;
DROP VIEW IF EXISTS v_menu_full CASCADE;
DROP VIEW IF EXISTS v_order_totals CASCADE;

DROP FUNCTION IF EXISTS sp_place_order(INT, VARCHAR, INT, VARCHAR, VARCHAR, INT, VARCHAR, JSONB) CASCADE;
DROP FUNCTION IF EXISTS sp_confirm_online_order(INT, INT) CASCADE;
DROP FUNCTION IF EXISTS sp_advance_line(INT, VARCHAR, INT) CASCADE;
DROP FUNCTION IF EXISTS sp_dispatch_order(INT, INT) CASCADE;
DROP FUNCTION IF EXISTS sp_generate_bill(INT, INT) CASCADE;
DROP FUNCTION IF EXISTS sp_record_payment(INT, VARCHAR, INT) CASCADE;
DROP FUNCTION IF EXISTS sp_cancel_order(INT, INT, VARCHAR) CASCADE;


-- =============================================================================
-- SECTION 1: VIEWS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. v_order_totals
--    Calculates items total, add-ons total, and grand total for each order.
--    Omits CANCELLED line items from totals.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_order_totals AS
WITH item_calc AS (
    SELECT
        oi.order_id,
        COALESCE(SUM(oi.quantity * oi.unit_price_at_order), 0.00)::NUMERIC(10,2) AS items_total
    FROM order_item oi
    WHERE oi.line_status <> 'CANCELLED'
    GROUP BY oi.order_id
),
addon_calc AS (
    SELECT
        oi.order_id,
        COALESCE(SUM(oia.quantity * oia.unit_price_at_order), 0.00)::NUMERIC(10,2) AS add_ons_total
    FROM order_item_add_on oia
    JOIN order_item oi ON oi.order_item_id = oia.order_item_id
    WHERE oi.line_status <> 'CANCELLED'
    GROUP BY oi.order_id
)
SELECT
    co.order_id,
    COALESCE(ic.items_total, 0.00)::NUMERIC(10,2) AS items_total,
    COALESCE(ac.add_ons_total, 0.00)::NUMERIC(10,2) AS add_ons_total,
    (COALESCE(ic.items_total, 0.00) + COALESCE(ac.add_ons_total, 0.00))::NUMERIC(10,2) AS grand_total
FROM customer_order co
LEFT JOIN item_calc ic ON ic.order_id = co.order_id
LEFT JOIN addon_calc ac ON ac.order_id = co.order_id;


-- -----------------------------------------------------------------------------
-- 2. v_menu_full
--    Hierarchical view of categories, items, sizes, prices, butcher flags,
--    and availability status for public menu and staff order entry.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_menu_full AS
SELECT
    c.category_id,
    c.category_name,
    c.is_active AS category_is_active,
    m.menu_item_id,
    m.item_name,
    m.description AS item_description,
    s.size_id,
    s.size_label,
    s.price,
    m.requires_butcher,
    (c.is_active AND m.is_available) AS is_available
FROM menu_category c
JOIN menu_item m ON m.category_id = c.category_id
JOIN menu_item_size s ON s.menu_item_id = m.menu_item_id
ORDER BY c.category_id, m.menu_item_id, s.price ASC;


-- -----------------------------------------------------------------------------
-- 3. v_butcher_queue
--    Displays lines awaiting butcher processing (requires_butcher items at
--    AT_BUTCHER status) with table/order context and elapsed wait time.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_butcher_queue AS
SELECT
    oi.order_item_id,
    co.order_id,
    co.branch_id,
    co.bill_number,
    co.order_channel,
    co.table_id,
    rt.table_no,
    mi.item_name,
    mis.size_label,
    oi.quantity,
    oi.item_notes,
    oi.line_status,
    co.created_at,
    ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - co.created_at)) / 60)::INT AS waiting_minutes
FROM order_item oi
JOIN customer_order co ON co.order_id = oi.order_id
JOIN menu_item_size mis ON mis.size_id = oi.size_id
JOIN menu_item mi ON mi.menu_item_id = mis.menu_item_id
LEFT JOIN restaurant_table rt ON rt.table_id = co.table_id
WHERE oi.line_status = 'AT_BUTCHER'
  AND co.order_status = 'AT_BUTCHER'
ORDER BY co.created_at ASC, oi.order_item_id ASC;


-- -----------------------------------------------------------------------------
-- 4. v_kitchen_queue
--    Displays lines ready for the chef:
--    - Non-meat lines ready immediately (PENDING or COOKING)
--    - Meat lines after the butcher is done (BUTCHER_DONE or COOKING)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_kitchen_queue AS
SELECT
    oi.order_item_id,
    co.order_id,
    co.branch_id,
    co.bill_number,
    co.order_channel,
    co.table_id,
    rt.table_no,
    mi.item_name,
    mis.size_label,
    oi.quantity,
    oi.item_notes,
    oi.line_status,
    mi.requires_butcher,
    co.created_at,
    ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - co.created_at)) / 60)::INT AS waiting_minutes
FROM order_item oi
JOIN customer_order co ON co.order_id = oi.order_id
JOIN menu_item_size mis ON mis.size_id = oi.size_id
JOIN menu_item mi ON mi.menu_item_id = mis.menu_item_id
LEFT JOIN restaurant_table rt ON rt.table_id = co.table_id
WHERE (
    (mi.requires_butcher = FALSE AND oi.line_status IN ('PENDING', 'COOKING')) OR
    (mi.requires_butcher = TRUE  AND oi.line_status IN ('BUTCHER_DONE', 'COOKING'))
)
AND co.order_status IN ('AT_BUTCHER', 'AT_CHEF')
ORDER BY co.created_at ASC, oi.order_item_id ASC;


-- -----------------------------------------------------------------------------
-- 5. v_sales_report
--    Aggregates completed sales by date, branch, channel, category, item,
--    and size, including line item revenue and add-on revenue.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_sales_report AS
WITH item_addon_rev AS (
    SELECT
        oi.order_item_id,
        COALESCE(SUM(oia.quantity * oia.unit_price_at_order), 0.00)::NUMERIC(10,2) AS addon_revenue
    FROM order_item_add_on oia
    JOIN order_item oi ON oi.order_item_id = oia.order_item_id
    GROUP BY oi.order_item_id
)
SELECT
    co.order_date,
    co.branch_id,
    b.branch_code,
    b.branch_name,
    co.order_channel,
    mc.category_name,
    mi.item_name,
    mis.size_label,
    SUM(oi.quantity)::INT AS quantity_sold,
    SUM(oi.quantity * oi.unit_price_at_order)::NUMERIC(10,2) AS item_revenue,
    COALESCE(SUM(iar.addon_revenue), 0.00)::NUMERIC(10,2) AS add_ons_revenue,
    (SUM(oi.quantity * oi.unit_price_at_order) + COALESCE(SUM(iar.addon_revenue), 0.00))::NUMERIC(10,2) AS total_revenue
FROM customer_order co
JOIN branch b ON b.branch_id = co.branch_id
JOIN order_item oi ON oi.order_id = co.order_id
JOIN menu_item_size mis ON mis.size_id = oi.size_id
JOIN menu_item mi ON mi.menu_item_id = mis.menu_item_id
JOIN menu_category mc ON mc.category_id = mi.category_id
LEFT JOIN item_addon_rev iar ON iar.order_item_id = oi.order_item_id
WHERE co.order_status = 'COMPLETED'
  AND oi.line_status <> 'CANCELLED'
GROUP BY
    co.order_date,
    co.branch_id,
    b.branch_code,
    b.branch_name,
    co.order_channel,
    mc.category_name,
    mi.item_name,
    mis.size_label;


-- -----------------------------------------------------------------------------
-- 6. v_order_tracking
--    Public-safe view for customer order tracking. Exposes ONLY safe fields:
--    no customer phone number, no employee IDs or names.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_order_tracking AS
SELECT
    co.order_id,
    co.branch_id,
    co.bill_number,
    co.tracking_token,
    co.order_status,
    co.order_channel,
    co.cancellation_reason,
    co.created_at,
    co.updated_at
FROM customer_order co;



-- =============================================================================
-- SECTION 2: STORED PROCEDURES / FUNCTIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. sp_place_order
--    Atomically creates a dine-in or online order.
--    - Upserts customer by phone
--    - Snapshots unit prices from menu_item_size and add_on tables
--    - Sets table status to Occupied for dine-in
--    - Routes order to PLACED (online), AT_BUTCHER (meat items), or AT_CHEF
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_place_order(
    p_branch_id        INT,
    p_order_channel    VARCHAR(10),
    p_table_id         INT,
    p_customer_name    VARCHAR(100),
    p_customer_phone   VARCHAR(20),
    p_employee_id      INT,
    p_instructions     VARCHAR(255),
    p_items            JSONB
) RETURNS INT AS $$
DECLARE
    v_customer_id          INT;
    v_order_id             INT;
    v_order_item_id        INT;
    v_table_status         VARCHAR(10);
    v_branch_active        BOOLEAN;
    v_has_butcher          BOOLEAN := FALSE;
    v_initial_order_status VARCHAR(15);
    v_line_status          VARCHAR(15);
    v_item                 JSONB;
    v_addon                JSONB;
    v_size_id              INT;
    v_quantity             INT;
    v_item_notes           VARCHAR(255);
    v_unit_price           NUMERIC(10,2);
    v_requires_butcher     BOOLEAN;
    v_is_available         BOOLEAN;
    v_addon_id             INT;
    v_addon_qty            INT;
    v_addon_price          NUMERIC(10,2);
    v_addon_available      BOOLEAN;
BEGIN
    -- 1. Validate branch
    SELECT is_active INTO v_branch_active FROM branch WHERE branch_id = p_branch_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Branch ID % does not exist.', p_branch_id;
    END IF;
    IF NOT v_branch_active THEN
        RAISE EXCEPTION 'Branch ID % is currently inactive.', p_branch_id;
    END IF;

    -- 2. Validate channel
    IF p_order_channel NOT IN ('DINE_IN', 'ONLINE') THEN
        RAISE EXCEPTION 'Invalid order channel: %. Must be DINE_IN or ONLINE.', p_order_channel;
    END IF;

    -- 3. Validate channel-specific rules & customer upsert
    IF p_order_channel = 'ONLINE' THEN
        IF p_table_id IS NOT NULL THEN
            RAISE EXCEPTION 'Online orders cannot specify a table.';
        END IF;

        IF p_customer_phone IS NULL OR trim(p_customer_phone) = '' THEN
            RAISE EXCEPTION 'Customer phone number is required for online orders.';
        END IF;

        -- Upsert customer by unique phone number
        INSERT INTO customer (customer_name, phone)
        VALUES (
            COALESCE(NULLIF(trim(p_customer_name), ''), 'Online Customer'),
            trim(p_customer_phone)
        )
        ON CONFLICT (phone) DO UPDATE
        SET customer_name = COALESCE(NULLIF(EXCLUDED.customer_name, 'Online Customer'), customer.customer_name)
        RETURNING customer_id INTO v_customer_id;

    ELSE -- DINE_IN
        IF p_table_id IS NULL THEN
            RAISE EXCEPTION 'Table is required for dine-in orders.';
        END IF;

        SELECT status INTO v_table_status
        FROM restaurant_table
        WHERE table_id = p_table_id AND branch_id = p_branch_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Table ID % does not exist in branch %.', p_table_id, p_branch_id;
        END IF;

        IF v_table_status <> 'Available' THEN
            RAISE EXCEPTION 'Table % is not available (current status: %).', p_table_id, v_table_status;
        END IF;

        -- Reserve/occupy the table
        UPDATE restaurant_table
        SET status = 'Occupied'
        WHERE table_id = p_table_id;

        -- Optional customer for dine-in
        IF p_customer_phone IS NOT NULL AND trim(p_customer_phone) <> '' THEN
            INSERT INTO customer (customer_name, phone)
            VALUES (
                COALESCE(NULLIF(trim(p_customer_name), ''), 'Dine-in Customer'),
                trim(p_customer_phone)
            )
            ON CONFLICT (phone) DO UPDATE
            SET customer_name = COALESCE(NULLIF(EXCLUDED.customer_name, 'Dine-in Customer'), customer.customer_name)
            RETURNING customer_id INTO v_customer_id;
        ELSE
            v_customer_id := NULL;
        END IF;
    END IF;

    -- 4. Validate items array
    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Order must contain at least one item.';
    END IF;

    -- 5. Check if any line requires butcher processing
    SELECT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(p_items) AS elem
        JOIN menu_item_size mis ON mis.size_id = (elem->>'size_id')::INT
        JOIN menu_item mi ON mi.menu_item_id = mis.menu_item_id
        WHERE mi.requires_butcher = TRUE
    ) INTO v_has_butcher;

    -- 6. Determine initial order status
    IF p_order_channel = 'ONLINE' THEN
        v_initial_order_status := 'PLACED';
    ELSIF v_has_butcher THEN
        v_initial_order_status := 'AT_BUTCHER';
    ELSE
        v_initial_order_status := 'AT_CHEF';
    END IF;

    -- 7. Insert customer_order (triggers assign daily_order_number, bill_number, tracking_token)
    INSERT INTO customer_order (
        branch_id,
        customer_id,
        table_id,
        created_by_employee_id,
        order_channel,
        order_status,
        special_instructions
    ) VALUES (
        p_branch_id,
        v_customer_id,
        p_table_id,
        p_employee_id,
        p_order_channel,
        v_initial_order_status,
        p_instructions
    ) RETURNING order_id INTO v_order_id;

    -- 8. Insert order items & add-ons with current price snapshots
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_size_id    := (v_item->>'size_id')::INT;
        v_quantity   := COALESCE((v_item->>'quantity')::INT, 1);
        v_item_notes := v_item->>'notes';

        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'Item quantity must be greater than zero.';
        END IF;

        -- Snapshot item price & butcher requirement
        SELECT mis.price, mi.requires_butcher, mi.is_available
        INTO v_unit_price, v_requires_butcher, v_is_available
        FROM menu_item_size mis
        JOIN menu_item mi ON mi.menu_item_id = mis.menu_item_id
        WHERE mis.size_id = v_size_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Menu item size ID % not found.', v_size_id;
        END IF;

        IF NOT v_is_available THEN
            RAISE EXCEPTION 'Menu item size ID % is currently unavailable.', v_size_id;
        END IF;

        -- Initial line status:
        -- Online: lines remain PENDING until cashier confirms
        -- Dine-in: meat lines go to AT_BUTCHER; non-meat lines start PENDING
        IF p_order_channel = 'ONLINE' THEN
            v_line_status := 'PENDING';
        ELSIF v_requires_butcher THEN
            v_line_status := 'AT_BUTCHER';
        ELSE
            v_line_status := 'PENDING';
        END IF;

        INSERT INTO order_item (
            order_id,
            size_id,
            quantity,
            unit_price_at_order,
            line_status,
            item_notes
        ) VALUES (
            v_order_id,
            v_size_id,
            v_quantity,
            v_unit_price,
            v_line_status,
            v_item_notes
        ) RETURNING order_item_id INTO v_order_item_id;

        -- Add-ons iteration
        IF v_item ? 'add_ons' AND jsonb_typeof(v_item->'add_ons') = 'array' THEN
            FOR v_addon IN SELECT * FROM jsonb_array_elements(v_item->'add_ons')
            LOOP
                v_addon_id  := (v_addon->>'add_on_id')::INT;
                v_addon_qty := COALESCE((v_addon->>'quantity')::INT, 1);

                IF v_addon_qty <= 0 THEN
                    RAISE EXCEPTION 'Add-on quantity must be greater than zero.';
                END IF;

                -- Snapshot add-on price
                SELECT price, is_available
                INTO v_addon_price, v_addon_available
                FROM add_on
                WHERE add_on_id = v_addon_id;

                IF NOT FOUND THEN
                    RAISE EXCEPTION 'Add-on ID % not found.', v_addon_id;
                END IF;

                IF NOT v_addon_available THEN
                    RAISE EXCEPTION 'Add-on ID % is currently unavailable.', v_addon_id;
                END IF;

                INSERT INTO order_item_add_on (
                    order_item_id,
                    add_on_id,
                    quantity,
                    unit_price_at_order
                ) VALUES (
                    v_order_item_id,
                    v_addon_id,
                    v_addon_qty,
                    v_addon_price
                );
            END LOOP;
        END IF;
    END LOOP;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;


-- -----------------------------------------------------------------------------
-- 2. sp_confirm_online_order
--    Cashier reviews and confirms an incoming online order (PLACED status).
--    Transitions order to AT_BUTCHER (if meat items) or AT_CHEF.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_confirm_online_order(
    p_order_id   INT,
    p_cashier_id INT
) RETURNS VOID AS $$
DECLARE
    v_order_status      VARCHAR(15);
    v_channel           VARCHAR(10);
    v_emp_active        BOOLEAN;
    v_has_butcher       BOOLEAN;
    v_next_order_status VARCHAR(15);
BEGIN
    -- Verify cashier
    SELECT is_active INTO v_emp_active
    FROM employee
    WHERE employee_id = p_cashier_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Employee ID % not found.', p_cashier_id;
    END IF;
    IF NOT v_emp_active THEN
        RAISE EXCEPTION 'Employee ID % is inactive.', p_cashier_id;
    END IF;

    -- Verify order
    SELECT order_status, order_channel INTO v_order_status, v_channel
    FROM customer_order
    WHERE order_id = p_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order ID % not found.', p_order_id;
    END IF;

    IF v_channel <> 'ONLINE' THEN
        RAISE EXCEPTION 'Order % is not an online order.', p_order_id;
    END IF;

    IF v_order_status <> 'PLACED' THEN
        RAISE EXCEPTION 'Cannot confirm order %: current status is % (expected PLACED).',
            p_order_id, v_order_status;
    END IF;

    -- Check if order has meat lines
    SELECT EXISTS (
        SELECT 1
        FROM order_item oi
        JOIN menu_item_size mis ON mis.size_id = oi.size_id
        JOIN menu_item mi ON mi.menu_item_id = mis.menu_item_id
        WHERE oi.order_id = p_order_id
          AND mi.requires_butcher = TRUE
          AND oi.line_status <> 'CANCELLED'
    ) INTO v_has_butcher;

    IF v_has_butcher THEN
        v_next_order_status := 'AT_BUTCHER';

        -- Advance meat lines to AT_BUTCHER
        UPDATE order_item oi
        SET line_status = 'AT_BUTCHER'
        FROM menu_item_size mis, menu_item mi
        WHERE oi.order_id = p_order_id
          AND oi.size_id = mis.size_id
          AND mis.menu_item_id = mi.menu_item_id
          AND mi.requires_butcher = TRUE
          AND oi.line_status = 'PENDING';
    ELSE
        v_next_order_status := 'AT_CHEF';
    END IF;

    UPDATE customer_order
    SET order_status = v_next_order_status,
        cashier_employee_id = p_cashier_id
    WHERE order_id = p_order_id;
END;
$$ LANGUAGE plpgsql;


-- -----------------------------------------------------------------------------
-- 3. sp_advance_line
--    Advances the status of a single order_item line (e.g. AT_BUTCHER ->
--    BUTCHER_DONE, or COOKING -> READY), records the staff member, and
--    automatically rolls up the parent order status.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_advance_line(
    p_order_item_id INT,
    p_new_status    VARCHAR(15),
    p_employee_id   INT
) RETURNS VOID AS $$
DECLARE
    v_order_id           INT;
    v_cur_line_status    VARCHAR(15);
    v_requires_butcher   BOOLEAN;
    v_cur_order_status   VARCHAR(15);
    v_emp_active         BOOLEAN;
    v_any_at_butcher     BOOLEAN;
    v_total_active_lines INT;
    v_ready_lines        INT;
    v_rolled_status      VARCHAR(15);
BEGIN
    -- 1. Verify employee
    SELECT is_active INTO v_emp_active
    FROM employee
    WHERE employee_id = p_employee_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Employee ID % not found.', p_employee_id;
    END IF;
    IF NOT v_emp_active THEN
        RAISE EXCEPTION 'Employee ID % is inactive.', p_employee_id;
    END IF;

    -- 2. Verify line item and current state
    SELECT oi.order_id, oi.line_status, mi.requires_butcher, co.order_status
    INTO v_order_id, v_cur_line_status, v_requires_butcher, v_cur_order_status
    FROM order_item oi
    JOIN customer_order co ON co.order_id = oi.order_id
    JOIN menu_item_size mis ON mis.size_id = oi.size_id
    JOIN menu_item mi ON mi.menu_item_id = mis.menu_item_id
    WHERE oi.order_item_id = p_order_item_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order item ID % not found.', p_order_item_id;
    END IF;

    IF v_cur_order_status IN ('CANCELLED', 'BILLED', 'COMPLETED') THEN
        RAISE EXCEPTION 'Cannot advance item for order %: order is in % status.',
            v_order_id, v_cur_order_status;
    END IF;

    -- 3. Validate transition
    -- requires_butcher: PENDING -> AT_BUTCHER -> BUTCHER_DONE -> COOKING -> READY
    -- other lines:     PENDING -> COOKING -> READY
    IF v_requires_butcher THEN
        IF NOT (
            (v_cur_line_status = 'PENDING'      AND p_new_status = 'AT_BUTCHER')   OR
            (v_cur_line_status = 'AT_BUTCHER'   AND p_new_status = 'BUTCHER_DONE') OR
            (v_cur_line_status = 'BUTCHER_DONE' AND p_new_status = 'COOKING')      OR
            (v_cur_line_status = 'COOKING'      AND p_new_status = 'READY')        OR
            (p_new_status = 'CANCELLED')
        ) THEN
            RAISE EXCEPTION 'Invalid line status transition from % to % for meat item %.',
                v_cur_line_status, p_new_status, p_order_item_id;
        END IF;
    ELSE
        IF NOT (
            (v_cur_line_status = 'PENDING' AND p_new_status = 'COOKING') OR
            (v_cur_line_status = 'PENDING' AND p_new_status = 'READY')   OR
            (v_cur_line_status = 'COOKING' AND p_new_status = 'READY')   OR
            (p_new_status = 'CANCELLED')
        ) THEN
            RAISE EXCEPTION 'Invalid line status transition from % to % for item %.',
                v_cur_line_status, p_new_status, p_order_item_id;
        END IF;
    END IF;

    -- 4. Record assigned staff role on order
    IF p_new_status IN ('AT_BUTCHER', 'BUTCHER_DONE') THEN
        UPDATE customer_order
        SET assigned_butcher_id = COALESCE(assigned_butcher_id, p_employee_id)
        WHERE order_id = v_order_id;
    ELSIF p_new_status IN ('COOKING', 'READY') THEN
        UPDATE customer_order
        SET assigned_chef_id = COALESCE(assigned_chef_id, p_employee_id)
        WHERE order_id = v_order_id;
    END IF;

    -- 5. Update line status
    UPDATE order_item
    SET line_status = p_new_status
    WHERE order_item_id = p_order_item_id;

    -- 6. Roll up overall order status
    SELECT EXISTS (
        SELECT 1 FROM order_item
        WHERE order_id = v_order_id AND line_status = 'AT_BUTCHER'
    ) INTO v_any_at_butcher;

    SELECT
        COUNT(*) FILTER (WHERE line_status <> 'CANCELLED'),
        COUNT(*) FILTER (WHERE line_status = 'READY')
    INTO v_total_active_lines, v_ready_lines
    FROM order_item
    WHERE order_id = v_order_id;

    IF v_total_active_lines > 0 AND v_total_active_lines = v_ready_lines THEN
        v_rolled_status := 'READY';
    ELSIF v_any_at_butcher THEN
        v_rolled_status := 'AT_BUTCHER';
    ELSE
        v_rolled_status := 'AT_CHEF';
    END IF;

    -- Advance order status forward if not already dispatched or beyond
    IF v_cur_order_status IN ('PLACED', 'AT_BUTCHER', 'AT_CHEF') THEN
        UPDATE customer_order
        SET order_status = v_rolled_status
        WHERE order_id = v_order_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- -----------------------------------------------------------------------------
-- 4. sp_dispatch_order
--    Dispatch staff marks an order as handed over (READY -> DISPATCHED).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_dispatch_order(
    p_order_id    INT,
    p_employee_id INT
) RETURNS VOID AS $$
DECLARE
    v_cur_order_status VARCHAR(15);
    v_emp_active       BOOLEAN;
BEGIN
    SELECT is_active INTO v_emp_active
    FROM employee
    WHERE employee_id = p_employee_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Employee ID % not found.', p_employee_id;
    END IF;
    IF NOT v_emp_active THEN
        RAISE EXCEPTION 'Employee ID % is inactive.', p_employee_id;
    END IF;

    SELECT order_status INTO v_cur_order_status
    FROM customer_order
    WHERE order_id = p_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order ID % not found.', p_order_id;
    END IF;

    IF v_cur_order_status <> 'READY' THEN
        RAISE EXCEPTION 'Cannot dispatch order %: current status is % (expected READY).',
            p_order_id, v_cur_order_status;
    END IF;

    UPDATE customer_order
    SET order_status = 'DISPATCHED',
        dispatched_by_employee_id = p_employee_id
    WHERE order_id = p_order_id;
END;
$$ LANGUAGE plpgsql;


-- -----------------------------------------------------------------------------
-- 5. sp_generate_bill
--    Cashier marks the order as BILLED and updates the restaurant table to
--    'Billing' status so the floor staff knows checkout is underway.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_generate_bill(
    p_order_id   INT,
    p_cashier_id INT
) RETURNS VOID AS $$
DECLARE
    v_cur_order_status VARCHAR(15);
    v_table_id         INT;
    v_emp_active       BOOLEAN;
BEGIN
    SELECT is_active INTO v_emp_active
    FROM employee
    WHERE employee_id = p_cashier_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cashier employee ID % not found.', p_cashier_id;
    END IF;
    IF NOT v_emp_active THEN
        RAISE EXCEPTION 'Cashier employee ID % is inactive.', p_cashier_id;
    END IF;

    SELECT order_status, table_id INTO v_cur_order_status, v_table_id
    FROM customer_order
    WHERE order_id = p_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order ID % not found.', p_order_id;
    END IF;

    IF v_cur_order_status NOT IN ('DISPATCHED', 'READY') THEN
        RAISE EXCEPTION 'Cannot generate bill for order %: order status is % (expected DISPATCHED or READY).',
            p_order_id, v_cur_order_status;
    END IF;

    UPDATE customer_order
    SET order_status = 'BILLED',
        cashier_employee_id = p_cashier_id
    WHERE order_id = p_order_id;

    IF v_table_id IS NOT NULL THEN
        UPDATE restaurant_table
        SET status = 'Billing'
        WHERE table_id = v_table_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- -----------------------------------------------------------------------------
-- 6. sp_record_payment
--    Cashier records customer payment (Cash, Card, Online).
--    - Fetches total from v_order_totals
--    - Inserts or updates payment record with status Paid
--    - Completes the order (order_status = 'COMPLETED')
--    - Frees the dine-in table (status = 'Available')
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_record_payment(
    p_order_id   INT,
    p_method     VARCHAR(20),
    p_cashier_id INT
) RETURNS VOID AS $$
DECLARE
    v_cur_order_status VARCHAR(15);
    v_table_id         INT;
    v_grand_total      NUMERIC(10,2);
    v_emp_active       BOOLEAN;
BEGIN
    IF p_method NOT IN ('Cash', 'Card', 'Online') THEN
        RAISE EXCEPTION 'Invalid payment method: %. Must be Cash, Card, or Online.', p_method;
    END IF;

    IF p_cashier_id IS NOT NULL THEN
        SELECT is_active INTO v_emp_active
        FROM employee
        WHERE employee_id = p_cashier_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Cashier employee ID % not found.', p_cashier_id;
        END IF;
        IF NOT v_emp_active THEN
            RAISE EXCEPTION 'Cashier employee ID % is inactive.', p_cashier_id;
        END IF;
    END IF;

    SELECT order_status, table_id INTO v_cur_order_status, v_table_id
    FROM customer_order
    WHERE order_id = p_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order ID % not found.', p_order_id;
    END IF;

    IF v_cur_order_status NOT IN ('BILLED', 'DISPATCHED') THEN
        RAISE EXCEPTION 'Cannot record payment for order %: order status is % (expected BILLED).',
            p_order_id, v_cur_order_status;
    END IF;

    -- Fetch calculated grand total from v_order_totals
    SELECT grand_total INTO v_grand_total
    FROM v_order_totals
    WHERE order_id = p_order_id;

    -- Upsert payment record
    INSERT INTO payment (order_id, method_name, payment_status, amount, paid_at)
    VALUES (p_order_id, p_method, 'Paid', COALESCE(v_grand_total, 0.00), CURRENT_TIMESTAMP)
    ON CONFLICT (order_id) DO UPDATE
    SET method_name = EXCLUDED.method_name,
        payment_status = 'Paid',
        amount = EXCLUDED.amount,
        paid_at = CURRENT_TIMESTAMP;

    -- Update order to COMPLETED
    UPDATE customer_order
    SET order_status = 'COMPLETED',
        cashier_employee_id = COALESCE(p_cashier_id, cashier_employee_id)
    WHERE order_id = p_order_id;

    -- Free table if dine-in
    IF v_table_id IS NOT NULL THEN
        UPDATE restaurant_table
        SET status = 'Available'
        WHERE table_id = v_table_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- -----------------------------------------------------------------------------
-- 7. sp_cancel_order
--    Cancels an active order.
--    - Requires approval by an active MANAGER or GRO
--    - Requires a documented reason (min 5 chars)
--    - Cancels all active line items
--    - Frees the table if dine-in
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_cancel_order(
    p_order_id    INT,
    p_approver_id INT,
    p_reason      VARCHAR(255)
) RETURNS VOID AS $$
DECLARE
    v_role             VARCHAR(20);
    v_emp_active       BOOLEAN;
    v_cur_order_status VARCHAR(15);
    v_table_id         INT;
BEGIN
    IF p_reason IS NULL OR length(trim(p_reason)) < 5 THEN
        RAISE EXCEPTION 'Cancellation reason must be at least 5 characters.';
    END IF;

    -- Validate approver role
    SELECT role, is_active INTO v_role, v_emp_active
    FROM employee
    WHERE employee_id = p_approver_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Approving employee ID % does not exist.', p_approver_id;
    END IF;

    IF NOT v_emp_active THEN
        RAISE EXCEPTION 'Approving employee % is inactive.', p_approver_id;
    END IF;

    IF v_role NOT IN ('MANAGER', 'GRO') THEN
        RAISE EXCEPTION 'Permission denied: Only a MANAGER or GRO can approve cancellation. Employee % has role %.',
            p_approver_id, v_role;
    END IF;

    SELECT order_status, table_id INTO v_cur_order_status, v_table_id
    FROM customer_order
    WHERE order_id = p_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order ID % does not exist.', p_order_id;
    END IF;

    IF v_cur_order_status IN ('COMPLETED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Cannot cancel order %: order is already %.', p_order_id, v_cur_order_status;
    END IF;

    -- 1. Cancel active order lines
    UPDATE order_item
    SET line_status = 'CANCELLED'
    WHERE order_id = p_order_id
      AND line_status <> 'CANCELLED';

    -- 2. Mark order CANCELLED with approver and reason
    UPDATE customer_order
    SET order_status = 'CANCELLED',
        approved_by_employee_id = p_approver_id,
        cancellation_reason = trim(p_reason)
    WHERE order_id = p_order_id;

    -- 3. Free table if dine-in
    IF v_table_id IS NOT NULL THEN
        UPDATE restaurant_table
        SET status = 'Available'
        WHERE table_id = v_table_id;
    END IF;
END;
$$ LANGUAGE plpgsql;



-- =============================================================================
-- SECTION 3: VERIFICATION QUERIES
-- =============================================================================

-- Verify all 6 views exist
SELECT table_name AS view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verify all 7 stored procedures/functions exist
SELECT
    routine_name AS function_name,
    data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'sp_%'
ORDER BY routine_name;
