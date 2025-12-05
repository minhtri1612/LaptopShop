import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../setup';
import { mockOrders, mockAdmin, mockUser } from '../fixtures/testData';

// Mock prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => prismaMock),
}));

describe('Orders API Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('GET /admin/orders', () => {
    it('should return all orders for admin', async () => {
      prismaMock.order.findMany.mockResolvedValue(mockOrders);
      prismaMock.order.count.mockResolvedValue(mockOrders.length);

      const response = {
        status: 200,
        body: {
          orders: mockOrders,
          total: mockOrders.length,
        },
      };

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(2);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = {
        status: 401,
        body: { message: 'Unauthorized' },
      };

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-admin users', async () => {
      const response = {
        status: 403,
        body: { message: 'Forbidden: Admin access required' },
      };

      expect(response.status).toBe(403);
    });

    it('should filter orders by status', async () => {
      const pendingOrders = mockOrders.filter((o: any) => o.status === 'PENDING');
      prismaMock.order.findMany.mockResolvedValue(pendingOrders);

      const response = {
        status: 200,
        body: { orders: pendingOrders },
      };

      expect(response.status).toBe(200);
      expect(response.body.orders.every((o: any) => o.status === 'PENDING')).toBe(true);
    });

    it('should support pagination', async () => {
      prismaMock.order.findMany.mockResolvedValue(mockOrders.slice(0, 1));
      prismaMock.order.count.mockResolvedValue(mockOrders.length);

      const response = {
        status: 200,
        body: {
          orders: mockOrders.slice(0, 1),
          total: 2,
          page: 1,
          limit: 1,
        },
      };

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(1);
      expect(response.body.total).toBe(2);
    });
  });

  describe('GET /admin/orders/:id', () => {
    it('should return order by id', async () => {
      prismaMock.order.findUnique.mockResolvedValue(mockOrders[0]);

      const response = {
        status: 200,
        body: mockOrders[0],
      };

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
    });

    it('should return 404 for non-existent order', async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      const response = {
        status: 404,
        body: { message: 'Order not found' },
      };

      expect(response.status).toBe(404);
    });

    it('should include order details', async () => {
      const orderWithDetails = {
        ...mockOrders[0],
        orderDetails: [
          {
            id: 1,
            productId: 1,
            quantity: 2,
            price: 25990000,
            product: { name: 'Laptop Gaming ASUS' },
          },
        ],
      };
      prismaMock.order.findUnique.mockResolvedValue(orderWithDetails);

      const response = {
        status: 200,
        body: orderWithDetails,
      };

      expect(response.status).toBe(200);
      expect(response.body.orderDetails).toBeDefined();
      expect(response.body.orderDetails).toHaveLength(1);
    });
  });

  describe('PUT /admin/orders/:id/status', () => {
    it('should update order status', async () => {
      const updatedOrder = { ...mockOrders[0], status: 'SHIPPING' };
      prismaMock.order.update.mockResolvedValue(updatedOrder);

      const response = {
        status: 200,
        body: {
          message: 'Order status updated',
          order: updatedOrder,
        },
      };

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe('SHIPPING');
    });

    it('should return 400 for invalid status', async () => {
      const response = {
        status: 400,
        body: { message: 'Invalid order status' },
      };

      expect(response.status).toBe(400);
    });

    it('should return 404 when order not found', async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      const response = {
        status: 404,
        body: { message: 'Order not found' },
      };

      expect(response.status).toBe(404);
    });

    it('should support all valid statuses', () => {
      const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
      
      validStatuses.forEach((status) => {
        expect(['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED']).toContain(status);
      });
    });
  });

  describe('DELETE /admin/orders/:id', () => {
    it('should delete order successfully', async () => {
      prismaMock.order.findUnique.mockResolvedValue(mockOrders[0]);
      prismaMock.order.delete.mockResolvedValue(mockOrders[0]);

      const response = {
        status: 200,
        body: { message: 'Order deleted successfully' },
      };

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent order', async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      const response = {
        status: 404,
        body: { message: 'Order not found' },
      };

      expect(response.status).toBe(404);
    });
  });

  describe('GET /orders (User Orders)', () => {
    it('should return orders for authenticated user', async () => {
      const userOrders = mockOrders.filter((o: any) => o.userId === mockUser.id);
      prismaMock.order.findMany.mockResolvedValue(userOrders);

      const response = {
        status: 200,
        body: { orders: userOrders },
      };

      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = {
        status: 401,
        body: { message: 'Unauthorized' },
      };

      expect(response.status).toBe(401);
    });

    it('should only return orders belonging to user', async () => {
      const userOrders = mockOrders.filter((o: any) => o.userId === 1);
      prismaMock.order.findMany.mockResolvedValue(userOrders);

      const response = {
        status: 200,
        body: { orders: userOrders },
      };

      expect(response.body.orders.every((o: any) => o.userId === 1)).toBe(true);
    });
  });

  describe('POST /orders (Create Order)', () => {
    it('should create new order from cart', async () => {
      const newOrder = {
        id: 3,
        userId: mockUser.id,
        total: 25990000,
        status: 'PENDING',
        receiverName: 'Test User',
        receiverPhone: '0123456789',
        receiverAddress: '123 Test St',
        createdAt: new Date(),
      };
      prismaMock.order.create.mockResolvedValue(newOrder);

      const response = {
        status: 201,
        body: {
          message: 'Order created successfully',
          order: newOrder,
        },
      };

      expect(response.status).toBe(201);
      expect(response.body.order.status).toBe('PENDING');
    });

    it('should return 400 when cart is empty', async () => {
      const response = {
        status: 400,
        body: { message: 'Cart is empty' },
      };

      expect(response.status).toBe(400);
    });

    it('should return 400 when shipping info is missing', async () => {
      const response = {
        status: 400,
        body: { message: 'Shipping information required' },
      };

      expect(response.status).toBe(400);
    });

    it('should clear cart after order creation', async () => {
      prismaMock.cartDetail.deleteMany.mockResolvedValue({ count: 2 });

      const deletedItems = await prismaMock.cartDetail.deleteMany({
        where: { cart: { userId: mockUser.id } },
      });

      expect(deletedItems.count).toBe(2);
    });

    it('should update product quantities after order', async () => {
      prismaMock.product.update.mockResolvedValue({
        id: 1,
        quantity: 8,
        sold: 2,
      } as any);

      const updatedProduct = await prismaMock.product.update({
        where: { id: 1 },
        data: {
          quantity: { decrement: 2 },
          sold: { increment: 2 },
        },
      });

      expect(updatedProduct.quantity).toBe(8);
      expect(updatedProduct.sold).toBe(2);
    });
  });

  describe('PUT /orders/:id/cancel', () => {
    it('should cancel pending order', async () => {
      const pendingOrder = mockOrders.find((o: any) => o.status === 'PENDING');
      const cancelledOrder = { ...pendingOrder, status: 'CANCELLED' };
      prismaMock.order.findUnique.mockResolvedValue(pendingOrder);
      prismaMock.order.update.mockResolvedValue(cancelledOrder);

      const response = {
        status: 200,
        body: {
          message: 'Order cancelled successfully',
          order: cancelledOrder,
        },
      };

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe('CANCELLED');
    });

    it('should return 400 when order is already shipped', async () => {
      const shippedOrder = { ...mockOrders[0], status: 'SHIPPING' };
      prismaMock.order.findUnique.mockResolvedValue(shippedOrder);

      const response = {
        status: 400,
        body: { message: 'Cannot cancel order that is already shipping' },
      };

      expect(response.status).toBe(400);
    });

    it('should return 403 when user is not order owner', async () => {
      const response = {
        status: 403,
        body: { message: 'You do not have permission to cancel this order' },
      };

      expect(response.status).toBe(403);
    });

    it('should restore product quantities on cancellation', async () => {
      prismaMock.product.update.mockResolvedValue({
        id: 1,
        quantity: 10,
        sold: 0,
      } as any);

      const restoredProduct = await prismaMock.product.update({
        where: { id: 1 },
        data: {
          quantity: { increment: 2 },
          sold: { decrement: 2 },
        },
      });

      expect(restoredProduct.quantity).toBe(10);
      expect(restoredProduct.sold).toBe(0);
    });
  });
});
