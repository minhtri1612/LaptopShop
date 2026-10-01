import { beforeEach, describe, expect, it, vi } from 'vitest';

const { send } = vi.hoisted(() => {
  process.env.AWS_S3_BUCKET_NAME = 'test-bucket';
  process.env.AWS_REGION = 'ap-southeast-2';
  return { send: vi.fn() };
});

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    send = send;
  },
  PutObjectCommand: class {
    constructor(public input: unknown) {}
  },
  DeleteObjectCommand: class {
    constructor(public input: unknown) {}
  },
  GetObjectCommand: class {
    constructor(public input: unknown) {}
  },
}));

import { deleteFile, uploadFile } from 'services/s3.service';

describe('s3.service', () => {
  beforeEach(() => {
    send.mockReset();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('uploads a base64 image and returns its key', async () => {
    send.mockResolvedValue({});

    const result = await uploadFile('data:image/png;base64,aGVsbG8=', {
      folder: 'product',
      customFileName: 'laptop.png',
    });

    expect(send).toHaveBeenCalledOnce();
    expect(result.key).toBe('product/laptop.png');
    expect(result.url).toBe('https://test-bucket.s3.ap-southeast-2.amazonaws.com/product/laptop.png');
  });

  it('returns false when a delete fails', async () => {
    send.mockRejectedValue(new Error('denied'));

    await expect(deleteFile('product/laptop.png')).resolves.toBe(false);
  });
});
