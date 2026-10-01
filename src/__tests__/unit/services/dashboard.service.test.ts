import { beforeEach, describe, expect, it } from 'vitest';
import { prismaMock, resetMocks } from '../../setup';
import { getDashboardInfo } from 'services/admin/dashboard.service';

describe('dashboard.service', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('counts users, products, and orders', async () => {
    prismaMock.user.count.mockResolvedValue(2);
    prismaMock.product.count.mockResolvedValue(5);
    prismaMock.order.count.mockResolvedValue(9);

    await expect(getDashboardInfo()).resolves.toEqual({
      countUser: 2,
      countProduct: 5,
      countOrder: 9,
    });
  });
});
