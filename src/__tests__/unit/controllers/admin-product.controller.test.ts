import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

const { createProduct, updateProduct } = vi.hoisted(() => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
}));

vi.mock('services/admin/product.service', () => ({
  createProduct,
  updateProduct,
  handleDeleteProduct: vi.fn(),
  getProductId: vi.fn(),
  getProductList: vi.fn(),
}));

vi.mock('services/s3.service', () => ({
  uploadMulterFile: vi.fn(),
}));

import { postAdminCreateProduct, postUpdateProduct } from 'controllers/admin/product.controller';

const validBody = {
  name: 'Laptop Asus',
  price: '17490000',
  detailDesc: 'Gaming laptop',
  shortDesc: 'i5 11400H',
  quantity: '10',
  factory: 'ASUS',
  target: 'GAMING',
};

describe('admin product.controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    createProduct.mockReset();
    updateProduct.mockReset();
    req = { body: { ...validBody }, file: undefined };
    res = {
      redirect: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
  });

  it('creates a product with an object payload and redirects', async () => {
    await postAdminCreateProduct(req as Request, res as Response);

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
    expect(res.redirect).toHaveBeenCalledWith('/admin/product');
  });

  it('rejects invalid create payload', async () => {
    req.body = { name: '' };
    await postAdminCreateProduct(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(createProduct).not.toHaveBeenCalled();
  });

  it('updates a product with an object payload and redirects', async () => {
    req.body = { ...validBody, id: '7' };
    await postUpdateProduct(req as Request, res as Response);

    expect(updateProduct).toHaveBeenCalledWith({
      id: 7,
      name: 'Laptop Asus',
      price: 17490000,
      detailDesc: 'Gaming laptop',
      shortDesc: 'i5 11400H',
      quantity: 10,
      factory: 'ASUS',
      target: 'GAMING',
      imageUpload: null,
    });
    expect(res.redirect).toHaveBeenCalledWith('/admin/product');
  });
});
