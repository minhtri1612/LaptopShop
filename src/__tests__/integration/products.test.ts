import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { prismaMock, resetMocks } from '../setup';
import { mockProduct, mockProducts } from '../fixtures/testData';
import { createApiApp } from '../helpers/apiApp';

const app = createApiApp();

describe('products API', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('lists products with pagination', async () => {
    prismaMock.product.findMany.mockResolvedValue(mockProducts);
    prismaMock.product.count.mockResolvedValue(mockProducts.length);

    const response = await request(app).get('/api/products');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(3);
    expect(response.body.pagination).toMatchObject({
      page: 1,
      pageSize: 8,
      totalItems: 3,
      totalPages: 1,
    });
  });

  it('filters products by factory', async () => {
    prismaMock.product.findMany.mockResolvedValue([mockProduct]);
    prismaMock.product.count.mockResolvedValue(1);

    const response = await request(app).get('/api/products?factory=DELL');

    expect(response.status).toBe(200);
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
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
      })
    );
  });

  it('returns one product', async () => {
    prismaMock.product.findUnique.mockResolvedValue(mockProduct);

    const response = await request(app).get('/api/products/1');

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe(mockProduct.name);
  });

  it('returns 404 when the product does not exist', async () => {
    prismaMock.product.findUnique.mockResolvedValue(null);

    const response = await request(app).get('/api/products/99');

    expect(response.status).toBe(404);
  });

  it('returns 400 for a non-numeric product id', async () => {
    const response = await request(app).get('/api/products/abc');

    expect(response.status).toBe(400);
    expect(prismaMock.product.findUnique).not.toHaveBeenCalled();
  });
});
