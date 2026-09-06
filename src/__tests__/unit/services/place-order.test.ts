import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetMocks } from '../../setup';
import { handlerPlaceOrder } from 'services/client/item.service';

describe('handlerPlaceOrder', () => {
  const cartDetail = {
    id: 1,
    productId: 10,
    quantity: 2,
    price: 100,
    cartId: 1,
  };

  beforeEach(() => {
    resetMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('creates an order after validating stock', async () => {
    prismaMock.cart.findUnique.mockResolvedValue({
      id: 1,
      userId: 1,
      sum: 2,
      cartDetails: [cartDetail],
    });
    prismaMock.product.findUnique.mockResolvedValue({
      id: 10,
      name: 'Laptop',
      quantity: 5,
      sold: '3',
    });
    prismaMock.order.create.mockResolvedValue({ id: 99 });
    prismaMock.product.update.mockResolvedValue({});
    prismaMock.cartDetail.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.cart.delete.mockResolvedValue({});

    await handlerPlaceOrder(1, 'An', 'HCM', '0900000000', 200);

    expect(prismaMock.order.create).toHaveBeenCalled();
    expect(prismaMock.product.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: {
        quantity: { decrement: 2 },
        sold: '5',
      },
    });
    expect(prismaMock.cart.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('throws when the cart is missing', async () => {
    prismaMock.cart.findUnique.mockResolvedValue(null);

    await expect(
      handlerPlaceOrder(1, 'An', 'HCM', '0900000000', 0)
    ).rejects.toThrow('Cart not found');
  });

  it('throws when a cart product does not exist', async () => {
    prismaMock.cart.findUnique.mockResolvedValue({
      id: 1,
      userId: 1,
      cartDetails: [cartDetail],
    });
    prismaMock.product.findUnique.mockResolvedValue(null);

    await expect(
      handlerPlaceOrder(1, 'An', 'HCM', '0900000000', 200)
    ).rejects.toThrow('Product with ID 10 does not exist.');
  });

  it('throws when requested quantity exceeds stock', async () => {
    prismaMock.cart.findUnique.mockResolvedValue({
      id: 1,
      userId: 1,
      cartDetails: [cartDetail],
    });
    prismaMock.product.findUnique.mockResolvedValue({
      id: 10,
      name: 'Laptop',
      quantity: 1,
      sold: '0',
    });

    await expect(
      handlerPlaceOrder(1, 'An', 'HCM', '0900000000', 200)
    ).rejects.toThrow('only has 1 in stock');
  });
});
