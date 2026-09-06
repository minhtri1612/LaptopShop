import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import passport from 'passport';

const { getUserWithRoleById, getUserSumCart } = vi.hoisted(() => ({
  getUserWithRoleById: vi.fn(),
  getUserSumCart: vi.fn(),
}));

vi.mock('services/client/auth.service', () => ({
  getUserWithRoleById,
  getUserSumCart,
}));

vi.mock('services/user.service', () => ({
  getUserById: vi.fn(),
}));

vi.mock('config/database', () => ({
  default: vi.fn(),
}));

vi.mock('bcrypt', () => ({
  default: { compare: vi.fn() },
  compare: vi.fn(),
}));

import configPassportLocal from 'src/middleware/passport.local';

describe('passport deserializeUser', () => {
  beforeAll(() => {
    configPassportLocal();
  });

  beforeEach(() => {
    getUserWithRoleById.mockReset();
    getUserSumCart.mockReset();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('loads the user by session id and ignores unused username', async () => {
    getUserWithRoleById.mockResolvedValue({ id: 4, username: 'a@test.com' });
    getUserSumCart.mockResolvedValue(3);

    const deserialize = (passport as any)._deserializers[0] as (
      user: { id: number; username?: string },
      cb: (err: unknown, user?: unknown) => void
    ) => void;

    const result = await new Promise<any>((resolve, reject) => {
      deserialize({ id: 4, username: 'unused' }, (err, user) => {
        if (err) reject(err);
        else resolve(user);
      });
    });

    expect(getUserWithRoleById).toHaveBeenCalledWith(4);
    expect(getUserSumCart).toHaveBeenCalledWith(4);
    expect(result).toEqual({ id: 4, username: 'a@test.com', sumCart: 3 });
  });
});
