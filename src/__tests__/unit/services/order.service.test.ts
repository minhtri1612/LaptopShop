import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../../setup';
import { mockOrders } from '../../fixtures/testData';
import {
  getOrderAdmin,
  getOrderDetailAdmin,
  countTotalOrderPages,
} from 'services/admin/order.service';

describe('admin order.service', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('pages orders and includes the user', async () => {
    prismaMock.order.findMany.mockResolvedValue(mockOrders);

    const orders = await getOrderAdmin(2);

    expect(prismaMock.order.findMany).toHaveBeenCalledWith({
      skip: 3,
      take: 3,
      include: { user: true },
    });
    expect(orders).toEqual(mockOrders);
  });

  it('loads order lines for one order', async () => {
    prismaMock.orderDetail.findMany.mockResolvedValue([{ id: 1, orderId: 5 }]);

    await getOrderDetailAdmin(5);

    expect(prismaMock.orderDetail.findMany).toHaveBeenCalledWith({
      where: { orderId: 5 },
      include: { product: true },
    });
  });

  it('counts order pages from the page size', async () => {
    prismaMock.order.count.mockResolvedValue(4);

    await expect(countTotalOrderPages()).resolves.toBe(2);
  });
});
