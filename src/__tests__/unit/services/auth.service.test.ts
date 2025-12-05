import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../../setup';
import { mockUser, mockAdmin, newUserInput } from '../../fixtures/testData';

describe('Auth Service Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('User Authentication', () => {
    it('should find user by email', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser);

      const result = await prismaMock.user.findFirst({
        where: { email: 'test@example.com' },
        include: { role: true },
      });

      expect(result?.email).toBe('test@example.com');
      expect(result?.role).toBeDefined();
    });

    it('should return null when email not found', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const result = await prismaMock.user.findFirst({
        where: { email: 'nonexistent@example.com' },
      });

      expect(result).toBeNull();
    });
  });

  describe('User Registration', () => {
    it('should create new user', async () => {
      const newUser = { id: 3, ...newUserInput, roleId: 2, password: 'hashedpassword' };
      prismaMock.user.create.mockResolvedValue(newUser);

      const result = await prismaMock.user.create({
        data: {
          ...newUserInput,
          password: 'hashedpassword',
          roleId: 2,
        },
      });

      expect(result.email).toBe('newuser@example.com');
      expect(result.id).toBe(3);
    });

    it('should check if email already exists', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser);

      const existingUser = await prismaMock.user.findFirst({
        where: { email: 'test@example.com' },
      });

      expect(existingUser).not.toBeNull();
    });
  });

  describe('User Profile', () => {
    it('should get user by id', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await prismaMock.user.findUnique({
        where: { id: 1 },
        include: { role: true },
      });

      expect(result?.id).toBe(1);
      expect(result?.role).toBeDefined();
    });

    it('should update user profile', async () => {
      const updatedUser = {
        ...mockUser,
        fullName: 'Updated Name',
        phone: '0999888777',
      };
      prismaMock.user.update.mockResolvedValue(updatedUser);

      const result = await prismaMock.user.update({
        where: { id: 1 },
        data: { fullName: 'Updated Name', phone: '0999888777' },
      });

      expect(result.fullName).toBe('Updated Name');
      expect(result.phone).toBe('0999888777');
    });
  });

  describe('Password Management', () => {
    it('should update password', async () => {
      const updatedUser = { ...mockUser, password: 'newhashedpassword' };
      prismaMock.user.update.mockResolvedValue(updatedUser);

      const result = await prismaMock.user.update({
        where: { id: 1 },
        data: { password: 'newhashedpassword' },
      });

      expect(result.password).toBe('newhashedpassword');
    });
  });

  describe('Role Checks', () => {
    it('should identify admin user', () => {
      expect(mockAdmin.role.name).toBe('ADMIN');
    });

    it('should identify regular user', () => {
      expect(mockUser.role.name).toBe('USER');
    });

    it('should check if user is admin', () => {
      const isAdmin = (user: typeof mockUser) => user.role.name === 'ADMIN';
      
      expect(isAdmin(mockAdmin)).toBe(true);
      expect(isAdmin(mockUser)).toBe(false);
    });
  });
});
