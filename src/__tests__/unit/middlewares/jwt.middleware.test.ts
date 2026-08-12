import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

vi.mock('dotenv/config', () => ({}));

describe('checkValidJWT', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  const secret = 'test-jwt-secret-phase1';

  beforeEach(() => {
    process.env.JWT_SECRET = secret;
    mockReq = {
      headers: {},
      path: '/account',
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.resetModules();
    delete process.env.JWT_SECRET;
  });

  it('should return 401 when Authorization header is missing', async () => {
    const { checkValidJWT } = await import('src/middleware/jwt.middleware');

    checkValidJWT(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid or missing token' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 for an invalid token', async () => {
    mockReq.headers = { authorization: 'Bearer not-a-valid-token' };
    const { checkValidJWT } = await import('src/middleware/jwt.middleware');

    checkValidJWT(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should attach user and call next() for a valid Bearer token', async () => {
    const token = jwt.sign(
      {
        id: 1,
        username: 'user@example.com',
        roleId: 2,
        role: { id: 2, name: 'USER' },
        accountType: 'SYSTEM',
        avatar: null,
      },
      secret,
      { expiresIn: '1h' }
    );
    mockReq.headers = { authorization: `Bearer ${token}` };
    const { checkValidJWT } = await import('src/middleware/jwt.middleware');

    checkValidJWT(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toMatchObject({
      id: 1,
      username: 'user@example.com',
      role: { name: 'USER' },
    });
  });

  it('should return 500 when JWT_SECRET is not configured', async () => {
    delete process.env.JWT_SECRET;
    mockReq.headers = { authorization: 'Bearer anything' };
    const { checkValidJWT } = await import('src/middleware/jwt.middleware');

    checkValidJWT(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Server authentication misconfigured',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
