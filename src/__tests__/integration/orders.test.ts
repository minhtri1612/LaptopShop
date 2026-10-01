import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { prismaMock, resetMocks } from '../setup';
import { mockOrder, mockOrders } from '../fixtures/testData';
import { adminToken, createApiApp, userToken } from '../helpers/apiApp';

const app = createApiApp();
const auth = { Authorization: `Bearer ${userToken()}` };

describe('orders API', () => {
  beforeEach(() => {
    resetMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('rejects an anonymous order list', async () => {
    const response = await request(app).get('/api/orders');

    expect(response.status).toBe(401);
  });

  it('lists the signed-in user orders', async () => {
    prismaMock.order.findMany.mockResolvedValue(mockOrders);

    const response = await request(app).get('/api/orders').set(auth);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(prismaMock.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 1 } })
    );
  });

  it('returns an order the user owns', async () => {
    prismaMock.order.findUnique.mockResolvedValue(mockOrder);

    const response = await request(app).get('/api/orders/1').set(auth);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(1);
  });

  it('hides another user order', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ ...mockOrder, userId: 9 });

    const response = await request(app).get('/api/orders/1').set(auth);

    expect(response.status).toBe(403);
  });

  it('lets an admin read another user order', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ ...mockOrder, userId: 9 });

    const response = await request(app)
      .get('/api/orders/1')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
  });

  it('returns 404 for a missing order', async () => {
    prismaMock.order.findUnique.mockResolvedValue(null);

    const response = await request(app).get('/api/orders/9').set(auth);

    expect(response.status).toBe(404);
  });

  it('returns 400 for a non-numeric order id', async () => {
    const response = await request(app).get('/api/orders/abc').set(auth);

    expect(response.status).toBe(400);
  });

  it('rejects a place-order body without a receiver', async () => {
    const response = await request(app).post('/api/orders').set(auth).send({});

    expect(response.status).toBe(400);
  });

  it('places an order from the current cart', async () => {
    prismaMock.cart.findUnique.mockResolvedValue({
      id: 1,
      userId: 1,
      cartDetails: [{ productId: 10, quantity: 1, price: 100 }],
    });
    prismaMock.product.findUnique.mockResolvedValue({
      id: 10,
      name: 'Laptop',
      quantity: 5,
      sold: '1',
    });
    prismaMock.order.create.mockResolvedValue({ id: 9 });
    prismaMock.product.update.mockResolvedValue({});
    prismaMock.cartDetail.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.cart.delete.mockResolvedValue({});

    const response = await request(app).post('/api/orders').set(auth).send({
      receiverName: 'An',
      receiverAddress: 'HCM',
      receiverPhone: '0900000000',
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
      status: 'PENDING',
    });
    expect(prismaMock.order.create).toHaveBeenCalled();
  });

  it('returns 400 when the user has no cart', async () => {
    prismaMock.cart.findUnique.mockResolvedValue(null);

    const response = await request(app).post('/api/orders').set(auth).send({
      receiverName: 'An',
      receiverAddress: 'HCM',
      receiverPhone: '0900000000',
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Cart not found/);
  });

  it('lets an admin list orders and blocks a normal user', async () => {
    prismaMock.order.findMany.mockResolvedValue(mockOrders);
    prismaMock.order.count.mockResolvedValue(2);

    const forbidden = await request(app)
      .get('/api/admin/orders')
      .set(auth);
    const allowed = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(forbidden.status).toBe(403);
    expect(allowed.status).toBe(200);
    expect(allowed.body.data).toHaveLength(2);
    expect(allowed.body.pagination.totalPages).toBe(1);
  });
});
