import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { prismaMock, resetMocks } from '../setup';
import { mockProduct } from '../fixtures/testData';
import { createApiApp, userToken } from '../helpers/apiApp';

const app = createApiApp();
const auth = { Authorization: `Bearer ${userToken()}` };

const cartWithItem = {
  id: 1,
  userId: 1,
  sum: 1,
  cartDetails: [
    {
      id: 5,
      cartId: 1,
      productId: 1,
      quantity: 1,
      price: mockProduct.price,
      product: mockProduct,
    },
  ],
};

describe('cart API', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('rejects an anonymous cart request', async () => {
    const response = await request(app).get('/api/cart');

    expect(response.status).toBe(401);
  });

  it('returns the cart and its total', async () => {
    prismaMock.cart.findUnique.mockResolvedValue(cartWithItem);

    const response = await request(app).get('/api/cart').set(auth);

    expect(response.status).toBe(200);
    expect(response.body.data.sum).toBe(1);
    expect(response.body.data.totalPrice).toBe(mockProduct.price);
    expect(response.body.data.cartDetails).toHaveLength(1);
  });

  it('returns an empty cart when the user has none', async () => {
    prismaMock.cart.findUnique.mockResolvedValue(null);

    const response = await request(app).get('/api/cart').set(auth);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      cart: null,
      cartDetails: [],
      sum: 0,
      totalPrice: 0,
    });
  });

  it('rejects an add-to-cart body without a product', async () => {
    const response = await request(app).post('/api/cart/items').set(auth).send({ quantity: 1 });

    expect(response.status).toBe(400);
    expect(prismaMock.cart.create).not.toHaveBeenCalled();
  });

  it('adds a product to an existing cart', async () => {
    prismaMock.cart.findUnique
      .mockResolvedValueOnce({ id: 1, userId: 1, sum: 1 })
      .mockResolvedValueOnce(cartWithItem);
    prismaMock.product.findUnique.mockResolvedValue(mockProduct);
    prismaMock.cart.update.mockResolvedValue({});
    prismaMock.cartDetail.findFirst.mockResolvedValue(null);
    prismaMock.cartDetail.upsert.mockResolvedValue({});

    const response = await request(app)
      .post('/api/cart/items')
      .set(auth)
      .send({ productId: 1, quantity: 1 });

    expect(response.status).toBe(200);
    expect(prismaMock.cartDetail.upsert).toHaveBeenCalled();
    expect(response.body.data.sum).toBe(1);
  });

  it('returns 404 when deleting an item that is not in the cart', async () => {
    prismaMock.cart.findUnique.mockResolvedValue(cartWithItem);

    const response = await request(app).delete('/api/cart/items/99').set(auth);

    expect(response.status).toBe(404);
    expect(prismaMock.cartDetail.delete).not.toHaveBeenCalled();
  });

  it('updates item quantities', async () => {
    prismaMock.cartDetail.update.mockResolvedValue({});
    prismaMock.cartDetail.findUnique.mockResolvedValue({ id: 5, cartId: 1 });
    prismaMock.cart.update.mockResolvedValue({});
    prismaMock.cart.findUnique.mockResolvedValue({
      id: 1,
      userId: 1,
      sum: 2,
      cartDetails: [{ id: 5, quantity: 2, price: 10, product: mockProduct }],
    });

    const response = await request(app)
      .put('/api/cart/items')
      .set(auth)
      .send({ cartDetails: [{ id: '5', quantity: '2' }] });

    expect(response.status).toBe(200);
    expect(prismaMock.cartDetail.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { quantity: 2 },
    });
    expect(response.body.data.sum).toBe(2);
  });

  it('removes an item that belongs to the user', async () => {
    prismaMock.cart.findUnique
      .mockResolvedValueOnce(cartWithItem)
      .mockResolvedValueOnce(null);
    prismaMock.cartDetail.findUnique.mockResolvedValue({ id: 5, quantity: 1 });
    prismaMock.cartDetail.delete.mockResolvedValue({});
    prismaMock.cart.delete.mockResolvedValue({});

    const response = await request(app).delete('/api/cart/items/5').set(auth);

    expect(response.status).toBe(200);
    expect(prismaMock.cartDetail.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(prismaMock.cart.delete).toHaveBeenCalledWith({ where: { userId: 1 } });
  });
});
