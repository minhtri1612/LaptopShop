import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

const { createProduct, updateProduct, getPresignedUploadUrl } = vi.hoisted(() => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  getPresignedUploadUrl: vi.fn(),
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
  getPresignedUploadUrl,
}));

import { postAdminCreateProduct, postProductUploadUrl, postUpdateProduct } from 'controllers/admin/product.controller';

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
    process.env.AWS_S3_BUCKET_NAME = 'test-bucket';
    process.env.AWS_REGION = 'ap-southeast-2';
    createProduct.mockReset();
    updateProduct.mockReset();
    getPresignedUploadUrl.mockReset();
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

  it('stores a presigned product image url', async () => {
    const imageUrl = 'https://test-bucket.s3.ap-southeast-2.amazonaws.com/products/a.png';
    req.body = { ...validBody, imageUrl };
    await postAdminCreateProduct(req as Request, res as Response);

    expect(createProduct).toHaveBeenCalledWith(expect.objectContaining({ imageUpload: imageUrl }));
  });

  it('rejects an image url outside the products prefix', async () => {
    req.body = { ...validBody, imageUrl: 'https://evil.example/products/a.png' };
    await postAdminCreateProduct(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(createProduct).not.toHaveBeenCalled();
  });

  it('returns a presigned upload url for a png', async () => {
    getPresignedUploadUrl.mockResolvedValue({
      uploadUrl: 'https://s3.example/put',
      key: 'products/a.png',
      publicUrl: 'https://test-bucket.s3.ap-southeast-2.amazonaws.com/products/a.png',
    });
    req.body = { contentType: 'image/png', size: 1200 };
    res.json = vi.fn();

    await postProductUploadUrl(req as Request, res as Response);

    expect(getPresignedUploadUrl).toHaveBeenCalledWith('image.png', 'image/png', 'products');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ contentType: 'image/png' }));
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
