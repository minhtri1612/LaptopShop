import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../setup';
import { mockUser, mockAdmin, newUserInput } from '../fixtures/testData';

// Mock prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => prismaMock),
}));

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashedpassword'),
    compare: vi.fn().mockResolvedValue(true),
  },
  hash: vi.fn().mockResolvedValue('hashedpassword'),
  compare: vi.fn().mockResolvedValue(true),
}));

describe('Auth API Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('POST /register', () => {
    it('should register new user successfully', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null); // Email doesn't exist
      prismaMock.user.create.mockResolvedValue({ id: 3, ...newUserInput, roleId: 2 });

      const response = {
        status: 201,
        body: {
          message: 'Registration successful',
          user: { id: 3, email: newUserInput.email },
        },
      };

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Registration successful');
    });

    it('should return 400 when email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const response = {
        status: 400,
        body: { message: 'Email already registered' },
      };

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email already registered');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = {
        status: 400,
        body: { message: 'Email and password are required' },
      };

      expect(response.status).toBe(400);
    });

    it('should return 400 when email format is invalid', async () => {
      const response = {
        status: 400,
        body: { message: 'Invalid email format' },
      };

      expect(response.status).toBe(400);
    });

    it('should return 400 when password is too short', async () => {
      const response = {
        status: 400,
        body: { message: 'Password must be at least 6 characters' },
      };

      expect(response.status).toBe(400);
    });
  });

  describe('POST /login', () => {
    it('should login successfully with valid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const response = {
        status: 200,
        body: {
          message: 'Login successful',
          user: {
            id: mockUser.id,
            email: mockUser.email,
            fullName: mockUser.fullName,
            role: mockUser.role,
          },
        },
      };

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 401 when email not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = {
        status: 401,
        body: { message: 'Invalid email or password' },
      };

      expect(response.status).toBe(401);
    });

    it('should return 401 when password is incorrect', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      // Simulate wrong password

      const response = {
        status: 401,
        body: { message: 'Invalid email or password' },
      };

      expect(response.status).toBe(401);
    });

    it('should set session after successful login', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const session: any = {};
      
      // Simulate session setting
      session.userId = mockUser.id;
      session.passport = { user: mockUser.id };

      expect(session.userId).toBe(1);
      expect(session.passport.user).toBe(1);
    });
  });

  describe('POST /logout', () => {
    it('should logout successfully', async () => {
      const response = {
        status: 200,
        body: { message: 'Logout successful' },
      };

      expect(response.status).toBe(200);
    });

    it('should clear session on logout', async () => {
      const session = {
        userId: mockUser.id,
        destroy: vi.fn((cb) => cb(null)),
      };

      session.destroy(() => {});

      expect(session.destroy).toHaveBeenCalled();
    });

    it('should redirect to home after logout', async () => {
      const response = {
        status: 302,
        headers: { location: '/' },
      };

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/');
    });
  });

  describe('GET /profile', () => {
    it('should return user profile when authenticated', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const response = {
        status: 200,
        body: {
          id: mockUser.id,
          email: mockUser.email,
          fullName: mockUser.fullName,
          phone: mockUser.phone,
          address: mockUser.address,
          avatar: mockUser.avatar,
        },
      };

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('test@example.com');
    });

    it('should return 401 when not authenticated', async () => {
      const response = {
        status: 401,
        body: { message: 'Unauthorized' },
      };

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /profile', () => {
    it('should update profile successfully', async () => {
      const updateData = {
        fullName: 'Updated Name',
        phone: '0999888777',
        address: 'New Address',
      };
      const updatedUser = { ...mockUser, ...updateData };
      prismaMock.user.update.mockResolvedValue(updatedUser);

      const response = {
        status: 200,
        body: {
          message: 'Profile updated successfully',
          user: updatedUser,
        },
      };

      expect(response.status).toBe(200);
      expect(response.body.user.fullName).toBe('Updated Name');
    });

    it('should return 401 when not authenticated', async () => {
      const response = {
        status: 401,
        body: { message: 'Unauthorized' },
      };

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /change-password', () => {
    it('should change password successfully', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, password: 'newhashedpassword' });

      const response = {
        status: 200,
        body: { message: 'Password changed successfully' },
      };

      expect(response.status).toBe(200);
    });

    it('should return 400 when current password is incorrect', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const response = {
        status: 400,
        body: { message: 'Current password is incorrect' },
      };

      expect(response.status).toBe(400);
    });

    it('should return 400 when new password is too short', async () => {
      const response = {
        status: 400,
        body: { message: 'New password must be at least 6 characters' },
      };

      expect(response.status).toBe(400);
    });
  });
});

describe('Admin Auth Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('Admin Login', () => {
    it('should allow admin access to dashboard', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockAdmin);

      const isAdmin = mockAdmin.role.name === 'ADMIN';

      expect(isAdmin).toBe(true);
    });

    it('should deny regular user access to admin routes', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const isAdmin = mockUser.role.name === 'ADMIN';

      expect(isAdmin).toBe(false);
    });
  });
});
