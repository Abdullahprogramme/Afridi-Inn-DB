// =============================================================================
// Domain Models and View Types for Afridi Inn
// =============================================================================

export type EmployeeRole =
  | 'OWNER'
  | 'MANAGER'
  | 'FB_MANAGER'
  | 'GRO'
  | 'ORDER_TAKER'
  | 'WAITER'
  | 'CASHIER'
  | 'CHEF'
  | 'BUTCHER'
  | 'DISPATCH';

export type StaffLevel = 'Senior' | 'Junior';

export type OrderChannel = 'DINE_IN' | 'ONLINE';

export type OrderStatus =
  | 'PLACED'
  | 'AT_BUTCHER'
  | 'AT_CHEF'
  | 'READY'
  | 'DISPATCHED'
  | 'BILLED'
  | 'COMPLETED'
  | 'CANCELLED';

export type LineStatus =
  | 'PENDING'
  | 'AT_BUTCHER'
  | 'BUTCHER_DONE'
  | 'COOKING'
  | 'READY'
  | 'CANCELLED';

export type TableStatus = 'Available' | 'Occupied' | 'Reserved' | 'Billing';

export type PaymentMethod = 'Cash' | 'Card' | 'Online';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed';

// -----------------------------------------------------------------------------
// Database Entities
// -----------------------------------------------------------------------------

export interface Branch {
  branch_id: number;
  branch_code: string;
  branch_name: string;
  phone: string;
  address: string;
  is_active: boolean;
}

export interface Employee {
  employee_id: number;
  branch_id: number | null;
  full_name: string;
  nic: string;
  role: EmployeeRole;
  staff_level: StaffLevel;
  username: string;
  is_active: boolean;
}

export interface MenuCategory {
  category_id: number;
  category_name: string;
  description?: string | null;
  is_active: boolean;
}

export interface MenuItem {
  menu_item_id: number;
  category_id: number;
  item_name: string;
  description?: string | null;
  requires_butcher: boolean;
  is_available: boolean;
  sizes?: MenuItemSize[];
}

export interface MenuItemSize {
  size_id: number;
  menu_item_id: number;
  size_label: string;
  price: number;
}

export interface AddOn {
  add_on_id: number;
  add_on_name: string;
  price: number;
  is_available: boolean;
}

export interface RestaurantTable {
  table_id: number;
  branch_id: number;
  table_no: number;
  capacity: number;
  status: TableStatus;
}

export interface Customer {
  customer_id: number;
  customer_name: string;
  phone: string;
  created_at: string;
}

export interface CustomerOrder {
  order_id: number;
  branch_id: number;
  customer_id?: number | null;
  table_id?: number | null;
  created_by_employee_id?: number | null;
  assigned_butcher_id?: number | null;
  assigned_chef_id?: number | null;
  dispatched_by_employee_id?: number | null;
  cashier_employee_id?: number | null;
  approved_by_employee_id?: number | null;
  order_channel: OrderChannel;
  order_date: string;
  daily_order_number: number;
  bill_number: string;
  tracking_token?: string | null;
  order_status: OrderStatus;
  special_instructions?: string | null;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
  // Joins & Details
  customer_name?: string;
  customer_phone?: string;
  table_no?: number | null;
  branch_code?: string;
  items?: OrderItem[];
  totals?: OrderTotals;
}

export interface OrderItem {
  order_item_id: number;
  order_id: number;
  size_id: number;
  quantity: number;
  unit_price_at_order: number;
  line_status: LineStatus;
  item_notes?: string | null;
  item_name?: string;
  size_label?: string;
  requires_butcher?: boolean;
  add_ons?: OrderItemAddOn[];
}

export interface OrderItemAddOn {
  order_item_id: number;
  add_on_id: number;
  quantity: number;
  unit_price_at_order: number;
  add_on_name?: string;
}

export interface Payment {
  payment_id: number;
  order_id: number;
  method_name: PaymentMethod;
  payment_status: PaymentStatus;
  amount: number;
  paid_at?: string | null;
}

export interface CustomerFeedback {
  feedback_id: number;
  customer_id: number;
  order_id?: number | null;
  rating: number; // 1 to 5
  comments?: string | null;
  submitted_at: string;
}

// -----------------------------------------------------------------------------
// Database View Representations
// -----------------------------------------------------------------------------

export interface OrderTotals {
  order_id: number;
  items_total: number;
  add_ons_total: number;
  grand_total: number;
}

export interface FullMenuItem {
  category_id: number;
  category_name: string;
  category_is_active: boolean;
  menu_item_id: number;
  item_name: string;
  item_description?: string | null;
  size_id: number;
  size_label: string;
  price: number;
  requires_butcher: boolean;
  is_available: boolean;
}

export interface ButcherQueueItem {
  order_item_id: number;
  order_id: number;
  branch_id: number;
  bill_number: string;
  order_channel: OrderChannel;
  table_id?: number | null;
  table_no?: number | null;
  item_name: string;
  size_label: string;
  quantity: number;
  item_notes?: string | null;
  line_status: LineStatus;
  created_at: string;
  waiting_minutes: number;
}

export interface KitchenQueueItem {
  order_item_id: number;
  order_id: number;
  branch_id: number;
  bill_number: string;
  order_channel: OrderChannel;
  table_id?: number | null;
  table_no?: number | null;
  item_name: string;
  size_label: string;
  quantity: number;
  item_notes?: string | null;
  line_status: LineStatus;
  requires_butcher: boolean;
  created_at: string;
  waiting_minutes: number;
}

export interface SalesReportItem {
  order_date: string;
  branch_id: number;
  branch_code: string;
  branch_name: string;
  order_channel: OrderChannel;
  category_name: string;
  item_name: string;
  size_label: string;
  quantity_sold: number;
  item_revenue: number;
  add_ons_revenue: number;
  total_revenue: number;
}

export interface OrderTrackingInfo {
  order_id: number;
  branch_id: number;
  bill_number: string;
  tracking_token?: string | null;
  order_status: OrderStatus;
  order_channel: OrderChannel;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Client & Form Inputs
// -----------------------------------------------------------------------------

export interface PlaceOrderAddOnInput {
  add_on_id: number;
  quantity: number;
}

export interface PlaceOrderItemInput {
  size_id: number;
  quantity: number;
  notes?: string;
  add_ons?: PlaceOrderAddOnInput[];
}

export interface PlaceOrderInput {
  branch_id: number;
  channel: OrderChannel;
  table_id?: number | null;
  customer_name?: string;
  customer_phone?: string;
  employee_id?: number | null;
  instructions?: string;
  items: PlaceOrderItemInput[];
}
