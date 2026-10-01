import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

const { updateUserById, uploadMulterFile, getPresignedUploadUrl } = vi.hoisted(() => ({
  updateUserById: vi.fn(),
  uploadMulterFile: vi.fn(),
  getPresignedUploadUrl: vi.fn(),
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
  getPresignedUploadUrl,
}));

import { postAvatarUploadUrl, postUpdateUser } from 'controllers/user.controller';

describe('postUpdateUser', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    process.env.AWS_S3_BUCKET_NAME = 'test-bucket';
    process.env.AWS_REGION = 'ap-southeast-2';
    updateUserById.mockReset().mockResolvedValue({});
    uploadMulterFile.mockReset();
    getPresignedUploadUrl.mockReset();
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

  it('stores a presigned avatar url', async () => {
    const avatarUrl = 'https://test-bucket.s3.ap-southeast-2.amazonaws.com/avatars/a.png';
    req.body.avatarUrl = avatarUrl;
    await postUpdateUser(req as Request, res as Response);

    expect(updateUserById).toHaveBeenCalledWith(
      '5',
      'Nguyen Van A',
      '0900000000',
      '1',
      'HCM',
      avatarUrl
    );
    expect(uploadMulterFile).not.toHaveBeenCalled();
  });

  it('rejects an avatar url outside the avatars prefix', async () => {
    req.body.avatarUrl = 'https://evil.example/avatars/a.png';
    res.status = vi.fn().mockReturnThis();
    res.send = vi.fn();
    await postUpdateUser(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it('returns a presigned upload url for an avatar', async () => {
    getPresignedUploadUrl.mockResolvedValue({
      uploadUrl: 'https://s3.example/put',
      key: 'avatars/a.png',
      publicUrl: 'https://test-bucket.s3.ap-southeast-2.amazonaws.com/avatars/a.png',
    });
    req.body = { contentType: 'image/png', size: 1200 };
    res.json = vi.fn();

    await postAvatarUploadUrl(req as Request, res as Response);

    expect(getPresignedUploadUrl).toHaveBeenCalledWith('image.png', 'image/png', 'avatars');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ contentType: 'image/png' }));
  });
});
