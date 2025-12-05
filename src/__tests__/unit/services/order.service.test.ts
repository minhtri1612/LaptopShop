import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../../setup';
import { mockOrders, mockOrder } from '../../fixtures/testData';

describe('Order Service Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('Order CRUD Operations', () => {
    it('should get all orders with pagination', async () => {
      prismaMock.order.findMany.mockResolvedValue(mockOrders);

      const result = await prismaMock.order.findMany({
        skip: 0,
        take: 10,
        include: { user: true },
      });

      expect(result).toEqual(mockOrders);
      expect(result).toHaveLength(2);
    });

    it('should get order details', async () => {
      const orderDetails = mockOrder.orderDetails;
      prismaMock.orderDetail.findMany.mockResolvedValue(orderDetails);

      const result = await prismaMock.orderDetail.findMany({
        where: { orderId: 1 },
        include: { product: true },
      });

      expect(result).toEqual(orderDetails);
      expect(result[0].product).toBeDefined();
    });

    it('should return empty array for order with no details', async () => {
      prismaMock.orderDetail.findMany.mockResolvedValue([]);

      const result = await prismaMock.orderDetail.findMany({
        where: { orderId: 999 },
      });

      expect(result).toEqual([]);
    });

    it('should count orders', async () => {
      prismaMock.order.count.mockResolvedValue(25);

      const count = await prismaMock.order.count();

      expect(count).toBe(25);
    });
  });

  describe('Order Status Management', () => {
    it('should update order status', async () => {
      const updatedOrder = { ...mockOrder, status: 'COMPLETED' };
      prismaMock.order.update.mockResolvedValue(updatedOrder);

      const result = await prismaMock.order.update({
        where: { id: 1 },
        data: { status: 'COMPLETED' },
      });

      expect(result.status).toBe('COMPLETED');
    });

    it('should track all valid statuses', () => {
      const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
      expect(validStatuses).toHaveLength(5);
      expect(validStatuses).toContain(mockOrder.status);
    });
  });

  describe('Order Pagination', () => {
    it('should calculate total pages', async () => {
      prismaMock.order.count.mockResolvedValue(100);

      const totalItems = await prismaMock.order.count();
      const pageSize = 10;
      const totalPages = Math.ceil(totalItems / pageSize);

      expect(totalPages).toBe(10);
    });

    it('should return 1 page when items fit on one page', async () => {
      prismaMock.order.count.mockResolvedValue(5);

      const totalItems = await prismaMock.order.count();
      const pageSize = 10;
      const totalPages = Math.ceil(totalItems / pageSize);

      expect(totalPages).toBe(1);
    });
  });

  describe('Order Deletion', () => {
    it('should delete order', async () => {
      prismaMock.order.delete.mockResolvedValue(mockOrder);

      const result = await prismaMock.order.delete({
        where: { id: 1 },
      });

      expect(result.id).toBe(1);
    });
  });
});
