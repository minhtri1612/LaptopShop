import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../../setup';
import { createProduct, updateProduct } from 'services/admin/product.service';
import { mockProduct } from '../../fixtures/testData';

describe('admin product.service (real module)', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('createProduct maps object fields onto prisma.product.create', async () => {
    prismaMock.product.create.mockResolvedValue(mockProduct);

    await createProduct({
      name: 'Laptop Asus',
      price: 17490000,
      detailDesc: 'Gaming laptop',
      shortDesc: 'i5 11400H',
      quantity: 10,
      factory: 'ASUS',
      target: 'GAMING',
      imageUpload: 'asus.png',
    });

    expect(prismaMock.product.create).toHaveBeenCalledWith({
      data: {
        name: 'Laptop Asus',
        price: 17490000,
        detailDesc: 'Gaming laptop',
        shortDesc: 'i5 11400H',
        quantity: 10,
        factory: 'ASUS',
        target: 'GAMING',
        image: 'asus.png',
      },
    });
  });

  it('updateProduct maps object fields and skips empty image', async () => {
    prismaMock.product.update.mockResolvedValue(mockProduct);

    await updateProduct({
      id: 1,
      name: 'Laptop Asus',
      price: 18000000,
      detailDesc: 'Updated',
      shortDesc: null,
      quantity: 8,
      factory: null,
      target: null,
      imageUpload: null,
    });

    expect(prismaMock.product.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        name: 'Laptop Asus',
        price: 18000000,
        detailDesc: 'Updated',
        shortDesc: null,
        quantity: 8,
        factory: null,
        target: null,
        image: undefined,
      },
    });
  });
});
