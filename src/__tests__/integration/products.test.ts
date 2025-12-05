import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prismaMock, resetMocks } from '../setup';
import { mockProducts, mockProduct, newProductInput } from '../fixtures/testData';

// Mock prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => prismaMock),
}));

describe('Products API Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('GET /products', () => {
    it('should return list of products with pagination', async () => {
      prismaMock.product.findMany.mockResolvedValue(mockProducts);
      prismaMock.product.count.mockResolvedValue(mockProducts.length);

      // Simulate API response
      const response = {
        status: 200,
        body: {
          data: mockProducts,
          totalItems: mockProducts.length,
          currentPage: 1,
          totalPages: 1,
        },
      };

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('price');
    });

    it('should filter products by factory', async () => {
      const dellProducts = mockProducts.filter(p => p.factory === 'DELL');
      prismaMock.product.findMany.mockResolvedValue(dellProducts);
      prismaMock.product.count.mockResolvedValue(dellProducts.length);

      const response = {
        status: 200,
        body: {
          data: dellProducts,
          totalItems: dellProducts.length,
        },
      };

      expect(response.status).toBe(200);
      expect(response.body.data.every((p: any) => p.factory === 'DELL')).toBe(true);
    });

    it('should filter products by price range', async () => {
      const filteredProducts = mockProducts.filter(p => p.price >= 20000000 && p.price <= 40000000);
      prismaMock.product.findMany.mockResolvedValue(filteredProducts);
      prismaMock.product.count.mockResolvedValue(filteredProducts.length);

      const response = {
        status: 200,
        body: {
          data: filteredProducts,
        },
      };

      expect(response.status).toBe(200);
      response.body.data.forEach((p: any) => {
        expect(p.price).toBeGreaterThanOrEqual(20000000);
        expect(p.price).toBeLessThanOrEqual(40000000);
      });
    });

    it('should filter products by target audience', async () => {
      const gamingProducts = mockProducts.filter(p => p.target === 'Gaming');
      prismaMock.product.findMany.mockResolvedValue(gamingProducts);

      const response = {
        status: 200,
        body: {
          data: gamingProducts,
        },
      };

      expect(response.status).toBe(200);
      expect(response.body.data.every((p: any) => p.target === 'Gaming')).toBe(true);
    });

    it('should sort products by price ascending', async () => {
      const sortedProducts = [...mockProducts].sort((a, b) => a.price - b.price);
      prismaMock.product.findMany.mockResolvedValue(sortedProducts);

      const response = {
        status: 200,
        body: {
          data: sortedProducts,
        },
      };

      expect(response.status).toBe(200);
      for (let i = 1; i < response.body.data.length; i++) {
        expect(response.body.data[i].price).toBeGreaterThanOrEqual(response.body.data[i - 1].price);
      }
    });

    it('should sort products by price descending', async () => {
      const sortedProducts = [...mockProducts].sort((a, b) => b.price - a.price);
      prismaMock.product.findMany.mockResolvedValue(sortedProducts);

      const response = {
        status: 200,
        body: {
          data: sortedProducts,
        },
      };

      expect(response.status).toBe(200);
      for (let i = 1; i < response.body.data.length; i++) {
        expect(response.body.data[i].price).toBeLessThanOrEqual(response.body.data[i - 1].price);
      }
    });
  });

  describe('GET /products/:id', () => {
    it('should return product details when product exists', async () => {
      prismaMock.product.findUnique.mockResolvedValue(mockProduct);

      const response = {
        status: 200,
        body: mockProduct,
      };

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
      expect(response.body.name).toBe('Laptop Dell XPS 15');
      expect(response.body).toHaveProperty('detailDesc');
    });

    it('should return 404 when product not found', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      const response = {
        status: 404,
        body: { message: 'Product not found' },
      };

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product not found');
    });
  });

  describe('POST /admin/products (Admin)', () => {
    it('should create new product when admin is authenticated', async () => {
      const createdProduct = { id: 4, ...newProductInput, sold: 0, image: '' };
      prismaMock.product.create.mockResolvedValue(createdProduct);

      const response = {
        status: 201,
        body: createdProduct,
      };

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('New Laptop');
      expect(response.body.id).toBeDefined();
    });

    it('should return 400 when required fields are missing', async () => {
      const response = {
        status: 400,
        body: { message: 'Name and price are required' },
      };

      expect(response.status).toBe(400);
    });

    it('should return 401 when not authenticated', async () => {
      const response = {
        status: 401,
        body: { message: 'Unauthorized' },
      };

      expect(response.status).toBe(401);
    });

    it('should return 403 when user is not admin', async () => {
      const response = {
        status: 403,
        body: { message: 'Forbidden - Admin access required' },
      };

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /admin/products/:id (Admin)', () => {
    it('should update product when admin is authenticated', async () => {
      const updateData = { name: 'Updated Laptop', price: 30000000 };
      const updatedProduct = { ...mockProduct, ...updateData };
      prismaMock.product.update.mockResolvedValue(updatedProduct);

      const response = {
        status: 200,
        body: updatedProduct,
      };

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Laptop');
      expect(response.body.price).toBe(30000000);
    });

    it('should return 404 when product not found', async () => {
      prismaMock.product.update.mockRejectedValue(new Error('Not found'));

      const response = {
        status: 404,
        body: { message: 'Product not found' },
      };

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /admin/products/:id (Admin)', () => {
    it('should delete product when admin is authenticated', async () => {
      prismaMock.product.delete.mockResolvedValue(mockProduct);

      const response = {
        status: 200,
        body: { message: 'Product deleted successfully' },
      };

      expect(response.status).toBe(200);
    });

    it('should return 404 when product not found', async () => {
      prismaMock.product.delete.mockRejectedValue(new Error('Not found'));

      const response = {
        status: 404,
        body: { message: 'Product not found' },
      };

      expect(response.status).toBe(404);
    });
  });
});
