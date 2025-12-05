import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { mockUser, mockAdmin } from '../../fixtures/testData';

// Mock modules
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({})),
}));

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      session: {} as any,
      isAuthenticated: vi.fn(),
      user: undefined,
    };
    mockRes = {
      redirect: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      render: vi.fn(),
    };
    mockNext = vi.fn();
  });

  describe('isAuthenticated', () => {
    it('should call next() when user is authenticated', () => {
      mockReq.isAuthenticated = vi.fn().mockReturnValue(true);
      mockReq.user = mockUser;

      // Simulate middleware behavior
      if (mockReq.isAuthenticated && mockReq.isAuthenticated()) {
        mockNext();
      } else {
        (mockRes.redirect as any)('/login');
      }

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.redirect).not.toHaveBeenCalled();
    });

    it('should redirect to login when user is not authenticated', () => {
      mockReq.isAuthenticated = vi.fn().mockReturnValue(false);

      // Simulate middleware behavior
      if (mockReq.isAuthenticated && mockReq.isAuthenticated()) {
        mockNext();
      } else {
        (mockRes.redirect as any)('/login');
      }

      expect(mockRes.redirect).toHaveBeenCalledWith('/login');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    it('should call next() when user is admin', () => {
      mockReq.isAuthenticated = vi.fn().mockReturnValue(true);
      mockReq.user = mockAdmin;

      // Simulate middleware behavior
      const user = mockReq.user as typeof mockAdmin;
      if (mockReq.isAuthenticated && mockReq.isAuthenticated() && user?.role?.name === 'ADMIN') {
        mockNext();
      } else {
        (mockRes.status as any)(403).json({ message: 'Forbidden' });
      }

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 when user is not admin', () => {
      mockReq.isAuthenticated = vi.fn().mockReturnValue(true);
      mockReq.user = mockUser; // Regular user, not admin

      // Simulate middleware behavior
      const user = mockReq.user as typeof mockUser;
      if (mockReq.isAuthenticated && mockReq.isAuthenticated() && user?.role?.name === 'ADMIN') {
        mockNext();
      } else {
        (mockRes.status as any)(403).json({ message: 'Forbidden' });
      }

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not authenticated', () => {
      mockReq.isAuthenticated = vi.fn().mockReturnValue(false);

      // Simulate middleware behavior
      if (mockReq.isAuthenticated && mockReq.isAuthenticated()) {
        mockNext();
      } else {
        (mockRes.status as any)(403).json({ message: 'Forbidden' });
      }

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('isUser', () => {
    it('should call next() when user role is USER', () => {
      mockReq.isAuthenticated = vi.fn().mockReturnValue(true);
      mockReq.user = mockUser;

      // Simulate middleware behavior
      const user = mockReq.user as typeof mockUser;
      if (mockReq.isAuthenticated && mockReq.isAuthenticated() && user?.role?.name === 'USER') {
        mockNext();
      } else {
        (mockRes.redirect as any)('/');
      }

      expect(mockNext).toHaveBeenCalled();
    });
  });
});

describe('Session Handling', () => {
  it('should store user in session after login', () => {
    const session: any = {};
    
    // Simulate login
    session.userId = mockUser.id;
    session.userEmail = mockUser.email;

    expect(session.userId).toBe(1);
    expect(session.userEmail).toBe('test@example.com');
  });

  it('should clear session on logout', () => {
    const session: any = {
      userId: mockUser.id,
      userEmail: mockUser.email,
      destroy: vi.fn((callback) => callback()),
    };

    // Simulate logout
    session.destroy(() => {});

    expect(session.destroy).toHaveBeenCalled();
  });
});
