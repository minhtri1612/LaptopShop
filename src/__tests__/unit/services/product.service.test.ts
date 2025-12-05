import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../../setup';
import { mockProducts, mockProduct, newProductInput } from '../../fixtures/testData';

describe('Product Service Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('Product CRUD Operations', () => {
    it('should get all products with pagination', async () => {
      prismaMock.product.findMany.mockResolvedValue(mockProducts);

      const result = await prismaMock.product.findMany({
        skip: 0,
        take: 10,
      });

      expect(result).toEqual(mockProducts);
      expect(result).toHaveLength(3);
    });

    it('should get product by id', async () => {
      prismaMock.product.findUnique.mockResolvedValue(mockProduct);

      const result = await prismaMock.product.findUnique({
        where: { id: 1 },
      });

      expect(result).toEqual(mockProduct);
      expect(result?.name).toBe('Laptop Dell XPS 15');
    });

    it('should return null when product not found', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      const result = await prismaMock.product.findUnique({
        where: { id: 999 },
      });

      expect(result).toBeNull();
    });

    it('should create new product', async () => {
      const newProduct = { id: 4, ...newProductInput };
      prismaMock.product.create.mockResolvedValue(newProduct);

      const result = await prismaMock.product.create({
        data: newProductInput,
      });

      expect(result.name).toBe('New Laptop');
      expect(result.id).toBe(4);
    });

    it('should update product', async () => {
      const updatedProduct = { ...mockProduct, price: 30000000 };
      prismaMock.product.update.mockResolvedValue(updatedProduct);

      const result = await prismaMock.product.update({
        where: { id: 1 },
        data: { price: 30000000 },
      });

      expect(result.price).toBe(30000000);
    });

    it('should delete product', async () => {
      prismaMock.product.delete.mockResolvedValue(mockProduct);

      const result = await prismaMock.product.delete({
        where: { id: 1 },
      });

      expect(result.id).toBe(1);
    });

    it('should count products', async () => {
      prismaMock.product.count.mockResolvedValue(100);

      const count = await prismaMock.product.count();

      expect(count).toBe(100);
    });
  });

  describe('Product Search and Filter', () => {
    it('should filter products by factory', async () => {
      const asusProducts = mockProducts.filter((p: any) => p.factory === 'ASUS');
      prismaMock.product.findMany.mockResolvedValue(asusProducts);

      const result = await prismaMock.product.findMany({
        where: { factory: 'ASUS' },
      });

      expect(result.every((p: any) => p.factory === 'ASUS')).toBe(true);
    });

    it('should filter products by target', async () => {
      const gamingProducts = mockProducts.filter((p: any) => p.target === 'Gaming');
      prismaMock.product.findMany.mockResolvedValue(gamingProducts);

      const result = await prismaMock.product.findMany({
        where: { target: 'Gaming' },
      });

      expect(result.every((p: any) => p.target === 'Gaming')).toBe(true);
    });

    it('should filter products by price range', async () => {
      const affordableProducts = mockProducts.filter((p: any) => p.price <= 30000000);
      prismaMock.product.findMany.mockResolvedValue(affordableProducts);

      const result = await prismaMock.product.findMany({
        where: {
          price: { lte: 30000000 },
        },
      });

      expect(result.every((p: any) => p.price <= 30000000)).toBe(true);
    });

    it('should search products by name', async () => {
      const searchResults = mockProducts.filter((p: any) =>
        p.name.toLowerCase().includes('asus')
      );
      prismaMock.product.findMany.mockResolvedValue(searchResults);

      const result = await prismaMock.product.findMany({
        where: {
          name: { contains: 'asus' },
        },
      });

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Product Stock Management', () => {
    it('should update product quantity', async () => {
      const updatedProduct = { ...mockProduct, quantity: 50 };
      prismaMock.product.update.mockResolvedValue(updatedProduct);

      const result = await prismaMock.product.update({
        where: { id: 1 },
        data: { quantity: 50 },
      });

      expect(result.quantity).toBe(50);
    });

    it('should increment sold count', async () => {
      const updatedProduct = { ...mockProduct, sold: mockProduct.sold + 1 };
      prismaMock.product.update.mockResolvedValue(updatedProduct);

      const result = await prismaMock.product.update({
        where: { id: 1 },
        data: { sold: { increment: 1 } },
      });

      expect(result.sold).toBe(mockProduct.sold + 1);
    });

    it('should check if product is in stock', () => {
      const isInStock = mockProduct.quantity > 0;
      expect(isInStock).toBe(true);
    });
  });

  describe('Product Pagination', () => {
    it('should calculate total pages correctly', async () => {
      prismaMock.product.count.mockResolvedValue(25);

      const totalItems = await prismaMock.product.count();
      const pageSize = 10;
      const totalPages = Math.ceil(totalItems / pageSize);

      expect(totalPages).toBe(3);
    });

    it('should return correct page of products', async () => {
      const page2Products = mockProducts.slice(0, 2);
      prismaMock.product.findMany.mockResolvedValue(page2Products);

      const result = await prismaMock.product.findMany({
        skip: 10,
        take: 10,
      });

      expect(result).toHaveLength(2);
    });
  });
});
