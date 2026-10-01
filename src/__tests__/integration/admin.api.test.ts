import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { prismaMock, resetMocks } from '../setup';
import { mockProduct } from '../fixtures/testData';
import { adminToken, createApiApp, userToken } from '../helpers/apiApp';

const app = createApiApp();

describe('admin API', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('returns dashboard counts for an admin', async () => {
    prismaMock.user.count.mockResolvedValue(2);
    prismaMock.product.count.mockResolvedValue(5);
    prismaMock.order.count.mockResolvedValue(9);

    const response = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      countUser: 2,
      countProduct: 5,
      countOrder: 9,
    });
  });

  it('lists admin products', async () => {
    prismaMock.product.findMany.mockResolvedValue([mockProduct]);
    prismaMock.product.count.mockResolvedValue(1);

    const response = await request(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.pagination.totalItems).toBe(1);
  });

  it('deletes a product and rejects a missing one', async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(mockProduct).mockResolvedValueOnce(null);
    prismaMock.product.delete.mockResolvedValue(mockProduct);

    const deleted = await request(app)
      .delete('/api/admin/products/1')
      .set('Authorization', `Bearer ${adminToken()}`);
    const missing = await request(app)
      .delete('/api/admin/products/9')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(deleted.status).toBe(200);
    expect(prismaMock.product.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(missing.status).toBe(404);
  });

  it('lists users without passwords', async () => {
    prismaMock.user.findMany.mockResolvedValue([
      { id: 1, username: 'user@example.com', password: 'secret', role: { name: 'USER' } },
    ]);
    prismaMock.user.count.mockResolvedValue(1);

    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.data[0].password).toBeUndefined();
    expect(response.body.data[0].username).toBe('user@example.com');
  });

  it('deletes a user and blocks a non-admin', async () => {
    prismaMock.user.delete.mockResolvedValue({ id: 4 });

    const forbidden = await request(app)
      .delete('/api/admin/users/4')
      .set('Authorization', `Bearer ${userToken()}`);
    const deleted = await request(app)
      .delete('/api/admin/users/4')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(forbidden.status).toBe(403);
    expect(deleted.status).toBe(200);
    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 4 } });
  });
});
