import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requireAuth, requireAdmin, isAdmin } from 'src/middleware/auth';
import { mockUser, mockAdmin } from '../../fixtures/testData';

describe('Auth Middleware (API)', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      user: undefined,
      path: '/',
    };
    mockRes = {
      redirect: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  describe('requireAuth', () => {
    it('should call next() when req.user is set', () => {
      mockReq.user = mockUser as Express.User;

      requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 401 JSON when req.user is missing', () => {
      requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should call next() when user role is ADMIN', () => {
      mockReq.user = mockAdmin as Express.User;

      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 JSON when user is not admin', () => {
      mockReq.user = mockUser as Express.User;

      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Forbidden' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 JSON when user is missing', () => {
      requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

describe('Auth Middleware (Web isAdmin)', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = { path: '/admin', user: undefined };
    mockRes = {
      redirect: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  it('should call next() for admin on /admin path', () => {
    mockReq.user = mockAdmin as Express.User;

    isAdmin(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should redirect to 403 page for non-admin on /admin path', () => {
    mockReq.user = mockUser as Express.User;

    isAdmin(mockReq, mockRes, mockNext);

    expect(mockRes.redirect).toHaveBeenCalledWith('/status/403.ejs');
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should bypass guard for non-admin paths', () => {
    mockReq.path = '/cart';
    mockReq.user = mockUser as Express.User;

    isAdmin(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
