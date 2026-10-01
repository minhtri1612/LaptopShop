import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../../setup';

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn(),
  },
}));

import {
  isEmailExist,
  registerNewUser,
  getUserWithRoleById,
  getUserSumCart,
} from 'services/client/auth.service';

describe('auth.service', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('reports whether a username is already taken', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(null);

    await expect(isEmailExist('taken@example.com')).resolves.toBe(true);
    await expect(isEmailExist('free@example.com')).resolves.toBe(false);
  });

  it('creates a USER account with a hashed password', async () => {
    prismaMock.role.findUnique.mockResolvedValue({ id: 2, name: 'USER' });
    prismaMock.user.create.mockResolvedValue({ id: 9 });

    await registerNewUser('New User', 'new@example.com', 'secret');

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        username: 'new@example.com',
        password: 'hashed-password',
        fullName: 'New User',
        accountType: 'SYSTEM',
        roleId: 2,
      },
    });
  });

  it('does not create a user when the USER role is missing', async () => {
    prismaMock.role.findUnique.mockResolvedValue(null);

    await registerNewUser('New User', 'new@example.com', 'secret');

    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('loads a user with the role and without the password', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 1, role: { name: 'USER' } });

    await getUserWithRoleById('1');

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: { role: true },
      omit: { password: true },
    });
  });

  it('returns the cart sum, or 0 when the user has no cart', async () => {
    prismaMock.cart.findUnique.mockResolvedValueOnce({ sum: 4 }).mockResolvedValueOnce(null);

    await expect(getUserSumCart('1')).resolves.toBe(4);
    await expect(getUserSumCart('1')).resolves.toBe(0);
  });
});
