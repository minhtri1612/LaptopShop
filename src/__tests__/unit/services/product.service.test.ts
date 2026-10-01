import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../../setup';
import { mockProduct, mockProducts } from '../../fixtures/testData';
import { getProductList, getProductId, handleDeleteProduct } from 'services/admin/product.service';
import { productFilterService, countFilteredProducts } from 'services/client/product.filter';

describe('product services', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('pages the admin product list', async () => {
    prismaMock.product.findMany.mockResolvedValue(mockProducts);

    const products = await getProductList(2);

    expect(prismaMock.product.findMany).toHaveBeenCalledWith({ skip: 3, take: 3 });
    expect(products).toEqual(mockProducts);
  });

  it('loads and deletes a product by id', async () => {
    prismaMock.product.findUnique.mockResolvedValue(mockProduct);
    prismaMock.product.delete.mockResolvedValue(mockProduct);

    await expect(getProductId(1)).resolves.toEqual(mockProduct);
    await handleDeleteProduct(1);

    expect(prismaMock.product.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('filters by factory and sorts by ascending price', async () => {
    prismaMock.product.findMany.mockResolvedValue([mockProduct]);

    await productFilterService(1, 8, 'DELL', undefined, undefined, 'gia-tang-dan');

    expect(prismaMock.product.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          {
            AND: [
              { factory: { in: ['DELL'] } },
              { factory: { not: null } },
            ],
          },
        ],
      },
      orderBy: { price: 'asc' },
      skip: 0,
      take: 8,
    });
  });

  it('counts products inside a price bucket', async () => {
    prismaMock.product.count.mockResolvedValue(2);

    const total = await countFilteredProducts(undefined, undefined, '10-15-trieu');

    expect(total).toBe(2);
    expect(prismaMock.product.count).toHaveBeenCalledWith({
      where: {
        AND: [
          {
            OR: [
              { price: { gte: 10000000, lte: 15000000 } },
            ],
          },
        ],
      },
    });
  });
});
