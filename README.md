# Afridi Inn — Restaurant Management & Online Order Tracking System

> **Course:** CS 341 Database Systems (Fall 2026)  
> **Instructor:** Abeera Tariq  
> **Institution:** IBA Karachi  

---

## 👥 Team & Roles

| Member | Roll Number | Track | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Abdullah Tariq** | 29123 | **Person 1 (Frontend)** | Next.js App Router, Tailwind v4, Design System, Screens & UI Components |
| **Fatima Rizwan Lakhani** | 30614 | **Person 2 (Backend A)** | Orders, Kitchen & Dispatch Workflows, Queue Endpoints, Status Transitions |
| **Huzaifa Iqbal** | 31563 | **Person 3 (Backend B)** | Auth, Platform Queries, Billing, Simulated Payments, Tables, Sales Reports |

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, React 19)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with custom CSS design tokens
- **Database:** [PostgreSQL 14+](https://www.postgresql.org/) (pgAdmin 4, 13 normalized tables in 3NF)
- **Database Driver:** `node-postgres` (`pg`) using raw parameterized SQL & connection pooling
- **Testing:** [Vitest](https://vitest.dev/) for unit & utility testing
- **Icons & UI:** [Lucide React](https://lucide.dev/), [Sonner](https://sonner.emilkowal.ski/) (Toasts)

---

## 📋 Features

1. **Customer Experience**:
   - **Interactive Menu:** Browse traditional dishes, Shinwari karahis, and charcoal BBQ by category with live search.
   - **Online Ordering:** Select portion sizes, customize add-ons (raita, fresh salad, desi ghee), specify special instructions, and view a live cart.
   - **Live Order Tracking:** Public-safe order tracker with a 6-stage status stepper (`Received` → `Preparing` → `Ready` → `On the way` → `Billed` → `Completed`) with auto-refresh every 10s.
   - **Customer Feedback:** 5-star rating system and review submission upon order completion.

2. **Staff Portal**:
   - **Role-Based Home:** Tailored views for Managers, Cashiers, Order Takers, Chefs, Butchers, Dispatchers, and GROs.
   - **Kitchen Stations:** Live queue cards for the Butcher preparation station and Chef cooking station.
   - **Floor & Table Management:** Live table status tracking (`Available`, `Occupied`, `Reserved`, `Billing`) respecting business constraints (e.g., table numbers that are multiples of 10 are never used).
   - **Billing & Simulated Payments:** Bill generation, payment recording (Cash, Card, Online), and print-ready bill receipts.
   - **Manager Reports:** Daily revenue analytics, category sales, item popularity, and ratings.

---

## 🗄️ Database Setup Instructions

The database scripts are located in the `db/` folder and must be executed sequentially on PostgreSQL using **pgAdmin 4 Query Tool** or `psql`:

### 1. Create Database & Configure Timezone
Open pgAdmin 4 (or `psql`) and run:
```sql
CREATE DATABASE afridi_inn;

-- Set timezone to Pakistan Standard Time (PKT)
ALTER DATABASE afridi_inn SET timezone TO 'Asia/Karachi';
```

### 2. Run Database Scripts in Order
1. **`db/01_tables.sql`**:
   - Creates the 13 relational tables in Third Normal Form (3NF).
   - Enforces primary keys, foreign keys, unique constraints, and check constraints (e.g. valid Pakistani NIC, table number rules, status enums).
2. **`db/02_triggers_functions.sql`**:
   - `trg_assign_order_number`: Generates daily bill numbers (`BRANCH-YYYYMMDD-NNNN`) using transaction-level advisory locks (`pg_advisory_xact_lock`) to guarantee uniqueness under concurrency.
   - `trg_check_cancel_approver`: Enforces that cancellations are approved strictly by an active `MANAGER` or `GRO`.
   - `trg_set_updated_at`: Maintains `updated_at` timestamps.
   - `trg_block_edit_after_bill`: Locks order items from modification once billed, completed, or cancelled.
3. **`db/03_procedures_views.sql`**:
   - **Views:** `v_order_totals`, `v_menu_full`, `v_butcher_queue`, `v_kitchen_queue`, `v_sales_report`, and `v_order_tracking`.
   - **Stored Procedures:** `sp_place_order`, `sp_confirm_online_order`, `sp_advance_line`, `sp_dispatch_order`, `sp_generate_bill`, `sp_record_payment`, and `sp_cancel_order`.

---

## 💻 Running the Application Locally

### Prerequisites
- **Node.js**: v18.18+ or v20+ (Node v24 supported)
- **PostgreSQL**: v14 or newer
- **Git**

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Abdullahprogramme/Afridi-Inn-DB.git
   cd Afridi-Inn-DB
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your database credentials:
   ```env
   # PostgreSQL Connection String
   DATABASE_URL=postgresql://afridi:afridi123@localhost:5432/afridi_inn

   # JWT Session Secret (32+ characters)
   SESSION_SECRET=supersecretmustbe32characterslongforjwt

   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Default Branch
   DEFAULT_BRANCH_CODE=KHI1

   # Mocks Switch: set to 'true' for standalone UI mock mode, or 'false' to call backend APIs
   NEXT_PUBLIC_USE_MOCKS=true
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Run Tests**:
   ```bash
   npm test
   ```

6. **Build for Production**:
   ```bash
   npm run build
   npm run start
   ```

---

## 🗂️ Project Directory Structure

```text
afridi-inn/
├── db/
│   ├── 01_tables.sql               # Tables, constraints, indexes
│   ├── 02_triggers_functions.sql   # Advisory lock triggers & functions
│   ├── 03_procedures_views.sql     # Stored procedures & views
│   ├── 04_seed.sql                 # Reference seed data (Person 3)
│   ├── 04b_seed_orders.sql         # Order lifecycle seed data (Person 2)
│   └── patches/                    # Numbered schema bug fixes
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── page.tsx                # Customer landing page
│   │   ├── menu/page.tsx           # Full restaurant menu
│   │   ├── order/page.tsx          # Online ordering & cart
│   │   ├── track/page.tsx          # Order tracking & live stepper
│   │   ├── feedback/page.tsx       # Rating & feedback submission
│   │   ├── staff/                  # Staff portal & workflow stations
│   │   └── api/                    # Server-side API endpoints
│   ├── components/
│   │   ├── layout/                 # PublicHeader, PublicFooter, StaffSidebar, MobileTabBar
│   │   ├── ui/                     # Button, Card, Badge, Input, Select, Dialog, Tabs, Table
│   │   └── shared/                 # StatusBadge, EmptyState, Skeleton, SimulatedPaymentBadge
│   ├── hooks/                      # useCart, usePolling
│   ├── lib/
│   │   ├── api-client.ts           # Unified API client with mock toggle
│   │   ├── constants.ts            # Status maps, role definitions, formatMoney()
│   │   ├── utils.ts                # Validation (Pakistani phone, CNIC), cn() helper
│   │   ├── mocks/                  # Standalone mock datasets
│   │   └── db/pool.ts              # PostgreSQL connection pool (pg)
│   ├── styles/globals.css          # Design system tokens & Tailwind v4
│   └── types/index.ts              # TypeScript domain and view interfaces
├── tests/
│   └── unit/                       # Vitest unit & utility tests
├── instructions.txt                # Comprehensive project specifications & work order
├── package.json
└── tsconfig.json
```

---

## 🌿 Branching Strategy

- **`main`**: Production-ready, stable codebase.
- **`Abdullah`**: Person 1 working branch (Frontend, UI, Mocks, Pages).
- **`Fatimah`**: Person 2 working branch (Backend A: Orders, Queues, Workflows).
- **`Huzaifa`**: Person 3 working branch (Backend B: Platform, Billing, Auth, Reports).

---

## 📜 Academic Integrity Note

This project is submitted for the **CS 341 Database Systems** course at IBA Karachi. All database schemas, stored procedures, triggers, constraints, views, and application source code are authored for educational demonstration. Payments are strictly simulated for demonstration purposes.
