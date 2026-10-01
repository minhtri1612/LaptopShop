import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../../setup';
import { mockUsers } from '../../fixtures/testData';

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('config/database', () => ({
  default: vi.fn(),
}));

import {
  handleCreateUser,
  getAllUser,
  countTotalUserPages,
  getAllRoles,
  handleDeleteUser,
  getUserById,
  updateUserById,
} from 'services/user.service';

describe('user.service', () => {
  beforeEach(() => {
    resetMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('hashes the password and stores username as the email', async () => {
    prismaMock.user.create.mockResolvedValue({ id: 3 });

    await handleCreateUser('New User', 'new@example.com', 'HCM', '0900', 'a.png', '2', 'secret');

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fullName: 'New User',
        username: 'new@example.com',
        address: 'HCM',
        phone: '0900',
        avatar: 'a.png',
        password: 'hashed-password',
        accountType: 'SYSTEM',
        roleId: 2,
      }),
    });
  });

  it('pages users with the role included', async () => {
    prismaMock.user.findMany.mockResolvedValue(mockUsers);

    const users = await getAllUser(2);

    expect(prismaMock.user.findMany).toHaveBeenCalledWith({
      skip: 3,
      take: 3,
      include: { role: true },
    });
    expect(users).toEqual(mockUsers);
  });

  it('counts user pages from the page size', async () => {
    prismaMock.user.count.mockResolvedValue(7);

    await expect(countTotalUserPages()).resolves.toBe(3);
  });

  it('returns an empty role list when the query fails', async () => {
    prismaMock.role.findMany.mockRejectedValue(new Error('db down'));

    await expect(getAllRoles()).resolves.toEqual([]);
  });

  it('deletes and loads a user by numeric id', async () => {
    prismaMock.user.delete.mockResolvedValue({ id: 4 });
    prismaMock.user.findUnique.mockResolvedValue({ id: 4 });

    await handleDeleteUser('4');
    await getUserById('4');

    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 4 } });
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id: 4 } });
  });

  it('omits an empty avatar when updating a user', async () => {
    prismaMock.user.update.mockResolvedValue({ id: 4 });

    await updateUserById('4', 'Name', '0900', '2', 'HCM', '');

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: {
        fullName: 'Name',
        phone: '0900',
        roleId: 2,
        address: 'HCM',
      },
    });
  });
});
