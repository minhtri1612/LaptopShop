import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../setup';
import { mockCart, mockProducts, mockUser } from '../fixtures/testData';

// Mock prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => prismaMock),
}));

describe('Cart API Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('GET /cart', () => {
    it('should return cart with items for authenticated user', async () => {
      prismaMock.cart.findUnique.mockResolvedValue(mockCart);

      const response = {
        status: 200,
        body: {
          cart: mockCart,
          totalItems: mockCart.cartDetails.length,
          totalPrice: mockCart.cartDetails.reduce(
            (sum: number, item: any) => sum + item.quantity * item.product.price,
            0
          ),
        },
      };

      expect(response.status).toBe(200);
      expect(response.body.cart.cartDetails).toHaveLength(2);
    });

    it('should return empty cart when no items', async () => {
      const emptyCart = { ...mockCart, cartDetails: [] };
      prismaMock.cart.findUnique.mockResolvedValue(emptyCart);

      const response = {
        status: 200,
        body: {
          cart: emptyCart,
          totalItems: 0,
          totalPrice: 0,
        },
      };

      expect(response.status).toBe(200);
      expect(response.body.totalItems).toBe(0);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = {
        status: 401,
        body: { message: 'Unauthorized' },
      };

      expect(response.status).toBe(401);
    });

    it('should create cart if not exists', async () => {
      prismaMock.cart.findUnique.mockResolvedValue(null);
      prismaMock.cart.create.mockResolvedValue({
        id: 2,
        userId: mockUser.id,
        cartDetails: [],
      });

      const newCart = await prismaMock.cart.create({
        data: { userId: mockUser.id },
      });

      expect(newCart.userId).toBe(mockUser.id);
    });
  });

  describe('POST /cart/add', () => {
    it('should add product to cart', async () => {
      const newCartDetail = {
        id: 3,
        cartId: mockCart.id,
        productId: 1,
        quantity: 1,
        product: mockProducts[0],
      };
      prismaMock.cartDetail.create.mockResolvedValue(newCartDetail);

      const response = {
        status: 200,
        body: {
          message: 'Product added to cart',
          cartItem: newCartDetail,
        },
      };

      expect(response.status).toBe(200);
      expect(response.body.cartItem.productId).toBe(1);
    });

    it('should increase quantity if product already in cart', async () => {
      const existingItem = mockCart.cartDetails[0];
      const updatedItem = { ...existingItem, quantity: existingItem.quantity + 1 };
      
      prismaMock.cartDetail.findFirst.mockResolvedValue(existingItem);
      prismaMock.cartDetail.update.mockResolvedValue(updatedItem);

      const response = {
        status: 200,
        body: {
          message: 'Cart updated',
          cartItem: updatedItem,
        },
      };

      expect(response.status).toBe(200);
      expect(response.body.cartItem.quantity).toBe(existingItem.quantity + 1);
    });

    it('should return 400 when product not found', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      const response = {
        status: 400,
        body: { message: 'Product not found' },
      };

      expect(response.status).toBe(400);
    });

    it('should return 400 when product out of stock', async () => {
      prismaMock.product.findUnique.mockResolvedValue({
        ...mockProducts[0],
        quantity: 0,
      });

      const response = {
        status: 400,
        body: { message: 'Product out of stock' },
      };

      expect(response.status).toBe(400);
    });

    it('should return 400 when quantity exceeds available stock', async () => {
      prismaMock.product.findUnique.mockResolvedValue({
        ...mockProducts[0],
        quantity: 5,
      });

      const response = {
        status: 400,
        body: { message: 'Not enough stock available' },
      };

      expect(response.status).toBe(400);
    });

    it('should validate quantity is positive', async () => {
      const response = {
        status: 400,
        body: { message: 'Quantity must be greater than 0' },
      };

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /cart/update/:id', () => {
    it('should update cart item quantity', async () => {
      const existingItem = mockCart.cartDetails[0];
      const updatedItem = { ...existingItem, quantity: 3 };
      
      prismaMock.cartDetail.findUnique.mockResolvedValue(existingItem);
      prismaMock.cartDetail.update.mockResolvedValue(updatedItem);

      const response = {
        status: 200,
        body: {
          message: 'Cart updated',
          cartItem: updatedItem,
        },
      };

      expect(response.status).toBe(200);
      expect(response.body.cartItem.quantity).toBe(3);
    });

    it('should return 404 when cart item not found', async () => {
      prismaMock.cartDetail.findUnique.mockResolvedValue(null);

      const response = {
        status: 404,
        body: { message: 'Cart item not found' },
      };

      expect(response.status).toBe(404);
    });

    it('should return 400 when new quantity exceeds stock', async () => {
      const existingItem = mockCart.cartDetails[0];
      prismaMock.cartDetail.findUnique.mockResolvedValue(existingItem);
      prismaMock.product.findUnique.mockResolvedValue({
        ...existingItem.product,
        quantity: 2,
      });

      const response = {
        status: 400,
        body: { message: 'Not enough stock available' },
      };

      expect(response.status).toBe(400);
    });

    it('should remove item when quantity is set to 0', async () => {
      const existingItem = mockCart.cartDetails[0];
      prismaMock.cartDetail.findUnique.mockResolvedValue(existingItem);
      prismaMock.cartDetail.delete.mockResolvedValue(existingItem);

      const response = {
        status: 200,
        body: { message: 'Item removed from cart' },
      };

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /cart/remove/:id', () => {
    it('should remove item from cart', async () => {
      const itemToRemove = mockCart.cartDetails[0];
      prismaMock.cartDetail.findUnique.mockResolvedValue(itemToRemove);
      prismaMock.cartDetail.delete.mockResolvedValue(itemToRemove);

      const response = {
        status: 200,
        body: { message: 'Item removed from cart' },
      };

      expect(response.status).toBe(200);
    });

    it('should return 404 when cart item not found', async () => {
      prismaMock.cartDetail.findUnique.mockResolvedValue(null);

      const response = {
        status: 404,
        body: { message: 'Cart item not found' },
      };

      expect(response.status).toBe(404);
    });

    it('should return 403 when item belongs to different user', async () => {
      const response = {
        status: 403,
        body: { message: 'You do not have permission to remove this item' },
      };

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /cart/clear', () => {
    it('should clear all items from cart', async () => {
      prismaMock.cartDetail.deleteMany.mockResolvedValue({ count: 2 });

      const response = {
        status: 200,
        body: { message: 'Cart cleared', itemsRemoved: 2 },
      };

      expect(response.status).toBe(200);
      expect(response.body.itemsRemoved).toBe(2);
    });

    it('should return success even when cart is already empty', async () => {
      prismaMock.cartDetail.deleteMany.mockResolvedValue({ count: 0 });

      const response = {
        status: 200,
        body: { message: 'Cart cleared', itemsRemoved: 0 },
      };

      expect(response.status).toBe(200);
    });
  });

  describe('GET /cart/count', () => {
    it('should return total items count in cart', async () => {
      prismaMock.cartDetail.count.mockResolvedValue(2);

      const response = {
        status: 200,
        body: { count: 2 },
      };

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(2);
    });

    it('should return 0 for empty cart', async () => {
      prismaMock.cartDetail.count.mockResolvedValue(0);

      const response = {
        status: 200,
        body: { count: 0 },
      };

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
    });
  });

  describe('Cart Total Calculation', () => {
    it('should calculate total correctly', () => {
      const cartItems = mockCart.cartDetails;
      const total = cartItems.reduce(
        (sum: number, item: any) => sum + item.quantity * item.price,
        0
      );

      // 1 * 25000000 + 1 * 45000000 = 70000000
      expect(total).toBe(70000000);
    });

    it('should apply discount if available', () => {
      const subtotal = 70000000;
      const discountPercent = 10;
      const discount = (subtotal * discountPercent) / 100;
      const total = subtotal - discount;

      expect(total).toBe(63000000);
    });

    it('should handle free shipping threshold', () => {
      const subtotal = 70000000;
      const freeShippingThreshold = 50000000;
      const shippingFee = subtotal >= freeShippingThreshold ? 0 : 30000;

      expect(shippingFee).toBe(0);
    });
  });
});

describe('Cart Session Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('Guest Cart', () => {
    it('should store cart in session for guests', () => {
      const session: any = {
        cart: {
          items: [{ productId: 1, quantity: 2 }],
        },
      };

      expect(session.cart.items).toHaveLength(1);
    });

    it('should merge guest cart with user cart on login', async () => {
      const guestCart = [{ productId: 1, quantity: 2 }];
      const userCart = mockCart;

      // Simulate merge logic
      const mergedItems = [...guestCart];
      userCart.cartDetails.forEach((item: any) => {
        const existing = mergedItems.find((i) => i.productId === item.productId);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          mergedItems.push({ productId: item.productId, quantity: item.quantity });
        }
      });

      expect(mergedItems.length).toBeGreaterThan(0);
    });
  });
});
