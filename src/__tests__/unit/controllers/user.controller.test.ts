import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

const { updateUserById, uploadMulterFile } = vi.hoisted(() => ({
  updateUserById: vi.fn(),
  uploadMulterFile: vi.fn(),
}));

vi.mock('services/user.service', () => ({
  getAllUser: vi.fn(),
  handleCreateUser: vi.fn(),
  handleDeleteUser: vi.fn(),
  getUserById: vi.fn(),
  updateUserById,
  getAllRoles: vi.fn(),
}));

vi.mock('services/client/item.service', () => ({
  getProducts: vi.fn(),
  countTotalProductClientPages: vi.fn(),
}));

vi.mock('services/client/product.filter', () => ({
  productFilterService: vi.fn(),
  countFilteredProducts: vi.fn(),
}));

vi.mock('services/s3.service', () => ({
  uploadMulterFile,
}));

import { postUpdateUser } from 'controllers/user.controller';

describe('postUpdateUser', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    updateUserById.mockReset().mockResolvedValue({});
    uploadMulterFile.mockReset();
    req = {
      body: {
        id: '5',
        fullName: 'Nguyen Van A',
        phone: '0900000000',
        role: '1',
        address: 'HCM',
      },
      file: undefined,
    };
    res = {
      redirect: vi.fn(),
    };
  });

  it('updates the user from the form body without username and redirects', async () => {
    await postUpdateUser(req as Request, res as Response);

    expect(updateUserById).toHaveBeenCalledWith(
      '5',
      'Nguyen Van A',
      '0900000000',
      '1',
      'HCM',
      undefined
    );
    expect(uploadMulterFile).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('/admin/user');
  });
});
