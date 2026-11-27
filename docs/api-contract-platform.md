# Afridi Inn — Platform, Money & Insight API Contract (Person 3)

**Owner:** Person 3 (Backend B)
**Scope:** Authentication, Menu Administration, Restaurant Tables, Billing & Simulated Payments, Customer Feedback, Sales Reports, Employees, and Branches.

## Global Conventions
- **Content-Type:** application/json
- **Authentication:** httpOnly, SameSite=Lax cookie named afridi_session containing a signed JWT ({ employee_id, role, branch_id }, 8h expiry).
- **Branch Scoping:** Non-owner staff (branch_id != null) are scoped to their session branch_id. Owners (branch_id == null) may pass ?branchId=<id> or omit it for all branches.
- **Standard Error Format:** { "error": { "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | RATE_LIMITED | INTERNAL_ERROR", "message": "string" } }

## 1. Authentication
- **POST /api/auth/login** (Public, rate-limited 5 fails/10m): Body { username, password } -> 200 { employee: Employee } + sets afridi_session cookie. Errors: 400, 401 ("Incorrect username or password"), 429.
- **POST /api/auth/logout** (Public/Auth): -> 200 { success: true } + clears cookie.

## 2. Menu & Add-Ons
- **GET /api/menu** (Public; ?includeInactive=true for OWNER): -> 200 FullMenuItem[] (top-level array matching apiClient.getMenu()).
- **GET /api/menu/categories** (Public): -> 200 MenuCategory[]
- **POST /api/menu/categories** (OWNER): Body { category_name, description? } -> 201 { category: MenuCategory }. Errors: 400, 401, 403, 409.
- **PATCH /api/menu/categories** (OWNER): Body { category_id, category_name?, description?, is_active? } -> 200 { category: MenuCategory }.
- **GET /api/menu/items** (Public): -> 200 MenuItem[]
- **POST /api/menu/items** (OWNER): Body { category_id, item_name, description?, requires_butcher, sizes: [{ size_label, price }] } -> 201 { item: MenuItem }.
- **PATCH /api/menu/items** (OWNER): Body { menu_item_id, category_id?, item_name?, description?, requires_butcher?, is_available? } -> 200 { item: MenuItem }.
- **POST /api/menu/sizes** (OWNER): Body { menu_item_id, size_label, price } -> 201 { size: MenuItemSize }.
- **PATCH /api/menu/sizes** (OWNER): Body { size_id, size_label?, price? } -> 200 { size: MenuItemSize }.
- **GET /api/menu/add-ons** (Public; ?includeInactive=true for OWNER): -> 200 AddOn[]
- **POST /api/menu/add-ons** (OWNER): Body { add_on_name, price } -> 201 { add_on: AddOn }.
- **PATCH /api/menu/add-ons** (OWNER): Body { add_on_id, add_on_name?, price?, is_available? } -> 200 { add_on: AddOn }.

## 3. Restaurant Tables
- **GET /api/tables** (OWNER, MANAGER, FB_MANAGER, GRO, CASHIER, ORDER_TAKER, WAITER): Query ?branchId=1 (OWNER) -> 200 RestaurantTable[] (top-level array matching apiClient.getTables()).
- **POST /api/tables** (OWNER, GRO): Body { branch_id?, table_no, capacity } -> 201 { table: RestaurantTable }. Rejects table_no <= 0 or table_no % 10 === 0 (400) and duplicates (409).
- **PATCH /api/tables** (OWNER, GRO): Body { table_id, capacity?, status?: "Available" | "Reserved" } -> 200 { table: RestaurantTable }.

## 4. Billing & Simulated Payments
- **POST /api/orders/[id]/bill** (OWNER, MANAGER, CASHIER): Executes sp_generate_bill(order_id, cashier_id) -> 200 { order_id, order_status: "BILLED", totals: OrderTotals }.
- **POST /api/orders/[id]/pay** (OWNER, MANAGER, CASHIER): Body { method_name: "Cash" | "Card" | "Online" }. Executes sp_record_payment -> 200 { simulated: true, payment: Payment, order_status: "COMPLETED" }.

## 5. Customer Feedback
- **POST /api/feedback** (Public): Body { tracking_token, rating: 1..5, comments? } -> 201 { feedback: CustomerFeedback }. Requires COMPLETED order; 409 on duplicate.
- **GET /api/feedback** (OWNER, MANAGER, FB_MANAGER): Query ?branchId=1 -> 200 { summary: { average_rating, total_reviews }, feedback: CustomerFeedback[] }.

## 6. Sales Reports
- **GET /api/reports/sales** (OWNER, MANAGER, FB_MANAGER): Query ?branchId=1&from=YYYY-MM-DD&to=YYYY-MM-DD&channel=ONLINE|DINE_IN&category=string -> 200 SalesReportItem[] (top-level array matching apiClient.getSalesReport()).

## 7. Employees & Branches (Owner Only)
- **GET /api/employees** (OWNER): Query ?branchId=1 -> 200 Employee[] (omits password_hash).
- **POST /api/employees** (OWNER): Body { branch_id, full_name, nic, role, staff_level, username, password } -> 201 { employee: Employee }.
- **PATCH /api/employees** (OWNER): Body { employee_id, branch_id?, full_name?, role?, staff_level?, is_active?, password? } -> 200 { employee: Employee }.
- **GET /api/branches** (OWNER): -> 200 Branch[]
- **POST /api/branches** (OWNER): Body { branch_code, branch_name, phone, address } -> 201 { branch: Branch }.
- **PATCH /api/branches** (OWNER): Body { branch_id, branch_name?, phone?, address?, is_active? } -> 200 { branch: Branch }.
