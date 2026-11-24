import {
  FullMenuItem,
  RestaurantTable,
  CustomerOrder,
  PlaceOrderInput,
  ButcherQueueItem,
  KitchenQueueItem,
  SalesReportItem,
  OrderTrackingInfo,
} from '@/types';
import {
  mockMenuItems,
  mockTables,
  mockOrders,
  mockButcherQueue,
  mockKitchenQueue,
  mockSalesReport,
} from '@/lib/mocks';

/**
 * Universal API Client with automatic Mock Data fallback.
 * By default uses mocks during initial frontend development until backend endpoints are ready.
 */
const USE_MOCKS =
  process.env.NEXT_PUBLIC_USE_MOCKS !== 'false';

export const apiClient = {
  async getMenu(): Promise<FullMenuItem[]> {
    if (USE_MOCKS) return Promise.resolve(mockMenuItems);
    const res = await fetch('/api/menu');
    return res.json();
  },

  async getTables(branchId: number = 1): Promise<RestaurantTable[]> {
    if (USE_MOCKS) {
      return Promise.resolve(mockTables.filter((t) => t.branch_id === branchId));
    }
    const res = await fetch(`/api/tables?branchId=${branchId}`);
    return res.json();
  },

  async getOrders(branchId: number = 1, status?: string): Promise<CustomerOrder[]> {
    if (USE_MOCKS) {
      let orders = mockOrders.filter((o) => o.branch_id === branchId);
      if (status) orders = orders.filter((o) => o.order_status === status);
      return Promise.resolve(orders);
    }
    const url = `/api/orders?branchId=${branchId}${status ? `&status=${status}` : ''}`;
    const res = await fetch(url);
    return res.json();
  },

  async getOrderById(orderId: number): Promise<CustomerOrder | null> {
    if (USE_MOCKS) {
      const order = mockOrders.find((o) => o.order_id === orderId) || null;
      return Promise.resolve(order);
    }
    const res = await fetch(`/api/orders/${orderId}`);
    return res.json();
  },

  async getOrderByTrackingToken(token: string): Promise<OrderTrackingInfo | null> {
    if (USE_MOCKS) {
      const order = mockOrders.find((o) => o.tracking_token === token);
      if (!order) return Promise.resolve(null);
      return Promise.resolve({
        order_id: order.order_id,
        branch_id: order.branch_id,
        bill_number: order.bill_number,
        tracking_token: order.tracking_token,
        order_status: order.order_status,
        order_channel: order.order_channel,
        cancellation_reason: order.cancellation_reason,
        created_at: order.created_at,
        updated_at: order.updated_at,
      });
    }
    const res = await fetch(`/api/tracking/${token}`);
    return res.json();
  },

  async placeOrder(input: PlaceOrderInput): Promise<{ order_id: number; tracking_token?: string }> {
    if (USE_MOCKS) {
      const newId = 100 + mockOrders.length + 1;
      return Promise.resolve({
        order_id: newId,
        tracking_token: input.channel === 'ONLINE' ? 'mock-token-' + Date.now() : undefined,
      });
    }
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return res.json();
  },

  async getButcherQueue(branchId: number = 1): Promise<ButcherQueueItem[]> {
    if (USE_MOCKS) {
      return Promise.resolve(mockButcherQueue.filter((q) => q.branch_id === branchId));
    }
    const res = await fetch(`/api/queues/butcher?branchId=${branchId}`);
    return res.json();
  },

  async getKitchenQueue(branchId: number = 1): Promise<KitchenQueueItem[]> {
    if (USE_MOCKS) {
      return Promise.resolve(mockKitchenQueue.filter((q) => q.branch_id === branchId));
    }
    const res = await fetch(`/api/queues/kitchen?branchId=${branchId}`);
    return res.json();
  },

  async getSalesReport(branchId: number = 1): Promise<SalesReportItem[]> {
    if (USE_MOCKS) {
      return Promise.resolve(mockSalesReport.filter((r) => r.branch_id === branchId));
    }
    const res = await fetch(`/api/reports/sales?branchId=${branchId}`);
    return res.json();
  },
};
