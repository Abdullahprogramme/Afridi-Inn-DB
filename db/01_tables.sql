-- =============================================================================
-- AFRIDI INN - RESTAURANT MANAGEMENT AND ONLINE ORDER TRACKING SYSTEM
-- File    : db/01_tables.sql
-- Step    : 1 of the database build (tables, constraints, indexes ONLY)
-- Engine  : PostgreSQL 14+ (written for pgAdmin 4 Query Tool)
-- Source  : CS 341 Milestone 1 - 13 entities, 3NF
--
-- HOW TO RUN (pgAdmin 4)
--   1. Create a database named  afridi_inn  (Servers > PostgreSQL > Databases
--      > right-click > Create > Database).
--   2. Right-click afridi_inn > Query Tool > open this file > press F5.
--   3. Run once, outside this script, so dates use Pakistan time:
--        ALTER DATABASE afridi_inn SET timezone TO 'Asia/Karachi';
--      then disconnect / reconnect the Query Tool.
--
-- NOTES
--   * daily_order_number and bill_number are NOT NULL. They are filled by a
--     BEFORE INSERT trigger created in db/02_triggers_functions.sql, so do not
--     insert into customer_order until that step is done.
--   * Additions to the Milestone 1 schema (small, deliberate):
--       employee.username, employee.password_hash   -> staff login
--       payment.amount, payment.paid_at             -> simulated payment amount
--       UNIQUE(branch_id, table_no) on restaurant_table
--       UNIQUE(menu_item_id, size_label) on menu_item_size
--     Everything else matches the Milestone 1 relational schema.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- DEV RESET (safe to re-run during development; DESTROYS ALL DATA)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS
    payment,
    customer_feedback,
    order_item_add_on,
    order_item,
    customer_order,
    customer,
    restaurant_table,
    add_on,
    menu_item_size,
    menu_item,
    menu_category,
    employee,
    branch
CASCADE;


-- -----------------------------------------------------------------------------
-- 1. branch
-- -----------------------------------------------------------------------------
CREATE TABLE branch (
    branch_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    branch_code  VARCHAR(10)  NOT NULL,
    branch_name  VARCHAR(100) NOT NULL,
    phone        VARCHAR(20)  NOT NULL,
    address      VARCHAR(255) NOT NULL,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_branch_code UNIQUE (branch_code),
    CONSTRAINT chk_branch_code_format CHECK (branch_code ~ '^[A-Z0-9]+$')
);


-- -----------------------------------------------------------------------------
-- 2. employee
--    branch_id is NULL for the owner and head-office staff.
-- -----------------------------------------------------------------------------
CREATE TABLE employee (
    employee_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    branch_id      INT          NULL,
    full_name      VARCHAR(100) NOT NULL,
    nic            CHAR(13)     NOT NULL,
    role           VARCHAR(20)  NOT NULL,
    staff_level    VARCHAR(6)   NOT NULL DEFAULT 'Junior',
    username       VARCHAR(30)  NOT NULL,
    password_hash  VARCHAR(100) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_employee_branch
        FOREIGN KEY (branch_id) REFERENCES branch (branch_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT uq_employee_nic      UNIQUE (nic),
    CONSTRAINT uq_employee_username UNIQUE (username),
    CONSTRAINT chk_employee_nic     CHECK (nic ~ '^[0-9]{13}$'),
    CONSTRAINT chk_employee_role    CHECK (role IN (
        'OWNER', 'MANAGER', 'FB_MANAGER', 'GRO', 'ORDER_TAKER',
        'WAITER', 'CASHIER', 'CHEF', 'BUTCHER', 'DISPATCH')),
    CONSTRAINT chk_employee_level   CHECK (staff_level IN ('Senior', 'Junior'))
);


-- -----------------------------------------------------------------------------
-- 3. menu_category
-- -----------------------------------------------------------------------------
CREATE TABLE menu_category (
    category_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_name  VARCHAR(50)  NOT NULL,
    description    VARCHAR(255),
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_category_name UNIQUE (category_name)
);


-- -----------------------------------------------------------------------------
-- 4. menu_item
-- -----------------------------------------------------------------------------
CREATE TABLE menu_item (
    menu_item_id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id       INT          NOT NULL,
    item_name         VARCHAR(100) NOT NULL,
    description       VARCHAR(255),
    requires_butcher  BOOLEAN      NOT NULL DEFAULT FALSE,
    is_available      BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_menu_item_category
        FOREIGN KEY (category_id) REFERENCES menu_category (category_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT uq_menu_item_name_per_category UNIQUE (category_id, item_name)
);


-- -----------------------------------------------------------------------------
-- 5. menu_item_size   (dependent table: carries the price)
-- -----------------------------------------------------------------------------
CREATE TABLE menu_item_size (
    size_id       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    menu_item_id  INT           NOT NULL,
    size_label    VARCHAR(30)   NOT NULL,
    price         NUMERIC(10,2) NOT NULL,

    CONSTRAINT fk_size_menu_item
        FOREIGN KEY (menu_item_id) REFERENCES menu_item (menu_item_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT uq_size_label_per_item UNIQUE (menu_item_id, size_label),
    CONSTRAINT chk_size_price CHECK (price >= 0)
);


-- -----------------------------------------------------------------------------
-- 6. add_on
-- -----------------------------------------------------------------------------
CREATE TABLE add_on (
    add_on_id     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    add_on_name   VARCHAR(50)   NOT NULL,
    price         NUMERIC(10,2) NOT NULL,
    is_available  BOOLEAN       NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_add_on_name  UNIQUE (add_on_name),
    CONSTRAINT chk_add_on_price CHECK (price >= 0)
);


-- -----------------------------------------------------------------------------
-- 7. restaurant_table
--    Business rule (interview): table numbers that are multiples of 10 are
--    never used.
-- -----------------------------------------------------------------------------
CREATE TABLE restaurant_table (
    table_id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    branch_id  INT         NOT NULL,
    table_no   INT         NOT NULL,
    capacity   INT         NOT NULL,
    status     VARCHAR(10) NOT NULL DEFAULT 'Available',

    CONSTRAINT fk_table_branch
        FOREIGN KEY (branch_id) REFERENCES branch (branch_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT uq_table_no_per_branch UNIQUE (branch_id, table_no),
    CONSTRAINT chk_table_no     CHECK (table_no > 0 AND table_no % 10 <> 0),
    CONSTRAINT chk_table_cap    CHECK (capacity > 0),
    CONSTRAINT chk_table_status CHECK (status IN
        ('Available', 'Occupied', 'Reserved', 'Billing'))
);


-- -----------------------------------------------------------------------------
-- 8. customer
-- -----------------------------------------------------------------------------
CREATE TABLE customer (
    customer_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_name  VARCHAR(100) NOT NULL,
    phone          VARCHAR(20)  NOT NULL,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_customer_phone UNIQUE (phone)
);


-- -----------------------------------------------------------------------------
-- 9. customer_order
--    Six optional employee links, one per workflow role.
--    daily_order_number, bill_number and tracking_token are generated by the
--    trigger in 02_triggers_functions.sql.
-- -----------------------------------------------------------------------------
CREATE TABLE customer_order (
    order_id                   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    branch_id                  INT          NOT NULL,
    customer_id                INT          NULL,
    table_id                   INT          NULL,
    created_by_employee_id     INT          NULL,
    assigned_butcher_id        INT          NULL,
    assigned_chef_id           INT          NULL,
    dispatched_by_employee_id  INT          NULL,
    cashier_employee_id        INT          NULL,
    approved_by_employee_id    INT          NULL,
    order_channel              VARCHAR(10)  NOT NULL,
    order_date                 DATE         NOT NULL DEFAULT CURRENT_DATE,
    daily_order_number         INT          NOT NULL,
    bill_number                VARCHAR(30)  NOT NULL,
    tracking_token             VARCHAR(40)  NULL,
    order_status               VARCHAR(15)  NOT NULL DEFAULT 'PLACED',
    special_instructions       VARCHAR(255),
    cancellation_reason        VARCHAR(255),
    created_at                 TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                 TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_branch   FOREIGN KEY (branch_id)
        REFERENCES branch (branch_id)            ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_order_customer FOREIGN KEY (customer_id)
        REFERENCES customer (customer_id)        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_order_table    FOREIGN KEY (table_id)
        REFERENCES restaurant_table (table_id)   ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_order_created_by FOREIGN KEY (created_by_employee_id)
        REFERENCES employee (employee_id)        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_order_butcher  FOREIGN KEY (assigned_butcher_id)
        REFERENCES employee (employee_id)        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_order_chef     FOREIGN KEY (assigned_chef_id)
        REFERENCES employee (employee_id)        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_order_dispatch FOREIGN KEY (dispatched_by_employee_id)
        REFERENCES employee (employee_id)        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_order_cashier  FOREIGN KEY (cashier_employee_id)
        REFERENCES employee (employee_id)        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_order_approver FOREIGN KEY (approved_by_employee_id)
        REFERENCES employee (employee_id)        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT uq_order_bill_number   UNIQUE (bill_number),
    CONSTRAINT uq_order_tracking      UNIQUE (tracking_token),
    CONSTRAINT uq_order_branch_date_seq
        UNIQUE (branch_id, order_date, daily_order_number),

    CONSTRAINT chk_order_channel CHECK (order_channel IN ('DINE_IN', 'ONLINE')),
    CONSTRAINT chk_order_status  CHECK (order_status IN (
        'PLACED', 'AT_BUTCHER', 'AT_CHEF', 'READY',
        'DISPATCHED', 'BILLED', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_daily_number_positive CHECK (daily_order_number > 0),

    -- dine-in needs a table; online must not have one
    CONSTRAINT chk_channel_table CHECK (
        (order_channel = 'DINE_IN' AND table_id IS NOT NULL) OR
        (order_channel = 'ONLINE'  AND table_id IS NULL)),
    -- online orders need a customer (contact details) and a tracking token
    CONSTRAINT chk_online_customer CHECK (
        order_channel = 'DINE_IN' OR customer_id IS NOT NULL),
    CONSTRAINT chk_online_token CHECK (
        order_channel = 'DINE_IN' OR tracking_token IS NOT NULL),
    -- cancellation requires an approver and a reason
    CONSTRAINT chk_cancel_approval CHECK (
        order_status <> 'CANCELLED' OR
        (approved_by_employee_id IS NOT NULL
         AND cancellation_reason IS NOT NULL
         AND length(trim(cancellation_reason)) > 0))
);


-- -----------------------------------------------------------------------------
-- 10. order_item   (dependent table)
-- -----------------------------------------------------------------------------
CREATE TABLE order_item (
    order_item_id        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id             INT           NOT NULL,
    size_id              INT           NOT NULL,
    quantity             INT           NOT NULL,
    unit_price_at_order  NUMERIC(10,2) NOT NULL,
    line_status          VARCHAR(15)   NOT NULL DEFAULT 'PENDING',
    item_notes           VARCHAR(255),

    CONSTRAINT fk_item_order FOREIGN KEY (order_id)
        REFERENCES customer_order (order_id)  ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_item_size  FOREIGN KEY (size_id)
        REFERENCES menu_item_size (size_id)   ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT chk_item_quantity CHECK (quantity > 0),
    CONSTRAINT chk_item_price    CHECK (unit_price_at_order >= 0),
    CONSTRAINT chk_line_status   CHECK (line_status IN (
        'PENDING', 'AT_BUTCHER', 'BUTCHER_DONE', 'COOKING', 'READY', 'CANCELLED'))
);


-- -----------------------------------------------------------------------------
-- 11. order_item_add_on   (associative table, composite primary key)
-- -----------------------------------------------------------------------------
CREATE TABLE order_item_add_on (
    order_item_id        INT           NOT NULL,
    add_on_id            INT           NOT NULL,
    quantity             INT           NOT NULL DEFAULT 1,
    unit_price_at_order  NUMERIC(10,2) NOT NULL,

    CONSTRAINT pk_order_item_add_on PRIMARY KEY (order_item_id, add_on_id),
    CONSTRAINT fk_oia_item   FOREIGN KEY (order_item_id)
        REFERENCES order_item (order_item_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_oia_add_on FOREIGN KEY (add_on_id)
        REFERENCES add_on (add_on_id)         ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT chk_oia_quantity CHECK (quantity > 0),
    CONSTRAINT chk_oia_price    CHECK (unit_price_at_order >= 0)
);


-- -----------------------------------------------------------------------------
-- 12. customer_feedback   (rating is a proposed extension)
-- -----------------------------------------------------------------------------
CREATE TABLE customer_feedback (
    feedback_id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id   INT          NOT NULL,
    order_id      INT          NULL,
    rating        INT          NOT NULL,
    comments      VARCHAR(500),
    submitted_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_feedback_customer FOREIGN KEY (customer_id)
        REFERENCES customer (customer_id)       ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_feedback_order    FOREIGN KEY (order_id)
        REFERENCES customer_order (order_id)    ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT chk_feedback_rating CHECK (rating BETWEEN 1 AND 5),
    -- one feedback per customer per order (NULL order_id rows are not limited)
    CONSTRAINT uq_feedback_customer_order UNIQUE (customer_id, order_id)
);


-- -----------------------------------------------------------------------------
-- 13. payment   (SIMULATED - no gateway, no card data; amount is a dummy value
--     copied from the order total when the cashier records the payment)
-- -----------------------------------------------------------------------------
CREATE TABLE payment (
    payment_id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id        INT           NOT NULL,
    method_name     VARCHAR(20)   NOT NULL,
    payment_status  VARCHAR(15)   NOT NULL DEFAULT 'Pending',
    amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
    paid_at         TIMESTAMP     NULL,

    CONSTRAINT fk_payment_order FOREIGN KEY (order_id)
        REFERENCES customer_order (order_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT uq_payment_order UNIQUE (order_id),            -- at most one per order
    CONSTRAINT chk_payment_method CHECK (method_name IN ('Cash', 'Card', 'Online')),
    CONSTRAINT chk_payment_status CHECK (payment_status IN ('Pending', 'Paid', 'Failed')),
    CONSTRAINT chk_payment_amount CHECK (amount >= 0),
    CONSTRAINT chk_payment_paid_at CHECK (payment_status <> 'Paid' OR paid_at IS NOT NULL)
);


-- -----------------------------------------------------------------------------
-- INDEXES (primary keys and UNIQUE constraints are already indexed)
-- -----------------------------------------------------------------------------
CREATE INDEX idx_employee_branch        ON employee (branch_id);
CREATE INDEX idx_menu_item_category     ON menu_item (category_id);
CREATE INDEX idx_order_branch_date      ON customer_order (branch_id, order_date);
CREATE INDEX idx_order_status           ON customer_order (order_status);
CREATE INDEX idx_order_customer         ON customer_order (customer_id);
CREATE INDEX idx_order_table            ON customer_order (table_id);
CREATE INDEX idx_order_item_order       ON order_item (order_id);
CREATE INDEX idx_order_item_size        ON order_item (size_id);
CREATE INDEX idx_oia_add_on             ON order_item_add_on (add_on_id);
CREATE INDEX idx_feedback_order         ON customer_feedback (order_id);


-- -----------------------------------------------------------------------------
-- VERIFY: should list exactly 13 tables
-- -----------------------------------------------------------------------------
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
