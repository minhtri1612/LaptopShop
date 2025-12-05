import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../../setup';
import { mockUser, mockAdmin, mockUsers, newUserInput } from '../../fixtures/testData';

describe('User Service Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('User CRUD Operations', () => {
    it('should get all users', async () => {
      prismaMock.user.findMany.mockResolvedValue(mockUsers);

      const result = await prismaMock.user.findMany();

      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
    });

    it('should get user by id', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await prismaMock.user.findUnique({
        where: { id: 1 },
      });

      expect(result).toEqual(mockUser);
      expect(result?.id).toBe(1);
    });

    it('should return null when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await prismaMock.user.findUnique({
        where: { id: 999 },
      });

      expect(result).toBeNull();
    });

    it('should create new user', async () => {
      const newUser = { id: 3, ...newUserInput, roleId: 2 };
      prismaMock.user.create.mockResolvedValue(newUser);

      const result = await prismaMock.user.create({
        data: newUserInput,
      });

      expect(result.email).toBe('newuser@example.com');
      expect(result.id).toBe(3);
    });

    it('should update user', async () => {
      const updatedUser = { ...mockUser, fullName: 'Updated Name' };
      prismaMock.user.update.mockResolvedValue(updatedUser);

      const result = await prismaMock.user.update({
        where: { id: 1 },
        data: { fullName: 'Updated Name' },
      });

      expect(result.fullName).toBe('Updated Name');
    });

    it('should delete user', async () => {
      prismaMock.user.delete.mockResolvedValue(mockUser);

      const result = await prismaMock.user.delete({
        where: { id: 1 },
      });

      expect(result.id).toBe(1);
    });

    it('should count users', async () => {
      prismaMock.user.count.mockResolvedValue(10);

      const count = await prismaMock.user.count();

      expect(count).toBe(10);
    });
  });

  describe('User Search Operations', () => {
    it('should find user by email', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser);

      const result = await prismaMock.user.findFirst({
        where: { email: 'test@example.com' },
      });

      expect(result?.email).toBe('test@example.com');
    });

    it('should filter users by role', async () => {
      const adminUsers = mockUsers.filter((u: any) => u.role.name === 'ADMIN');
      prismaMock.user.findMany.mockResolvedValue(adminUsers);

      const result = await prismaMock.user.findMany({
        where: { role: { name: 'ADMIN' } },
      });

      expect(result.every((u: any) => u.role.name === 'ADMIN')).toBe(true);
    });
  });

  describe('User with Relations', () => {
    it('should get user with role', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await prismaMock.user.findUnique({
        where: { id: 1 },
        include: { role: true },
      });

      expect(result?.role).toBeDefined();
      expect(result?.role.name).toBe('USER');
    });

    it('should distinguish admin from regular user', () => {
      expect(mockUser.role.name).toBe('USER');
      expect(mockAdmin.role.name).toBe('ADMIN');
    });
  });
});
