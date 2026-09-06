import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

const { createProduct, updateProduct, getProductId } = vi.hoisted(() => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  getProductId: vi.fn(),
}));

vi.mock('services/admin/product.service', () => ({
  createProduct,
  updateProduct,
  getProductId,
  getProductList: vi.fn(),
  handleDeleteProduct: vi.fn(),
}));

vi.mock('services/admin/dashboard.service', () => ({
  getDashboardInfo: vi.fn(),
}));

vi.mock('services/admin/order.service', () => ({
  getOrderAdmin: vi.fn(),
  getOrderDetailAdmin: vi.fn(),
  countTotalOrderPages: vi.fn(),
}));

vi.mock('services/user.service', () => ({
  getAllUser: vi.fn(),
  countTotalUserPages: vi.fn(),
  handleDeleteUser: vi.fn(),
}));

import { createAdminProductAPI, updateAdminProductAPI } from 'src/controllers/client/api/admin.controller';
import { mockProduct } from '../../fixtures/testData';

const validBody = {
  name: 'Laptop Asus',
  price: 17490000,
  detailDesc: 'Gaming laptop',
  shortDesc: 'i5 11400H',
  quantity: 10,
  factory: 'ASUS',
  target: 'GAMING',
};

describe('admin product API', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    createProduct.mockReset();
    updateProduct.mockReset();
    getProductId.mockReset();
    req = { body: { ...validBody }, params: {}, query: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('creates a product via object payload', async () => {
    await createAdminProductAPI(req as Request, res as Response);

    expect(createProduct).toHaveBeenCalledWith({
      name: 'Laptop Asus',
      price: 17490000,
      detailDesc: 'Gaming laptop',
      shortDesc: 'i5 11400H',
      quantity: 10,
      factory: 'ASUS',
      target: 'GAMING',
      imageUpload: '',
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updates a product via object payload', async () => {
    req.params = { id: '3' };
    getProductId.mockResolvedValue(mockProduct);

    await updateAdminProductAPI(req as Request, res as Response);

    expect(updateProduct).toHaveBeenCalledWith({
      id: 3,
      name: 'Laptop Asus',
      price: 17490000,
      detailDesc: 'Gaming laptop',
      shortDesc: 'i5 11400H',
      quantity: 10,
      factory: 'ASUS',
      target: 'GAMING',
      imageUpload: mockProduct.image,
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
