import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { prismaMock, resetMocks } from '../setup';
import { createApiApp, userToken } from '../helpers/apiApp';

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn(),
  },
}));

vi.mock('config/database', () => ({
  default: vi.fn(),
}));

const app = createApiApp();

const dbUser = {
  id: 1,
  username: 'test@example.com',
  password: 'stored-hash',
  fullName: 'Test User',
  phone: '0123456789',
  address: '123 Test Street',
  accountType: 'SYSTEM',
  avatar: null,
  roleId: 2,
  role: { id: 2, name: 'USER' },
};

describe('auth API', () => {
  beforeEach(() => {
    resetMocks();
    vi.mocked(bcrypt.compare).mockReset();
  });

  it('registers a new user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.role.findUnique.mockResolvedValue({ id: 2, name: 'USER' });
    prismaMock.user.create.mockResolvedValue({ id: 3 });

    const response = await request(app).post('/api/users').send({
      fullName: 'New User',
      email: 'new@example.com',
      password: 'secret',
      confirmPassword: 'secret',
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User created successfully');
    expect(prismaMock.user.create).toHaveBeenCalled();
  });

  it('rejects an email that is already registered', async () => {
    prismaMock.user.findUnique.mockResolvedValue(dbUser);

    const response = await request(app).post('/api/users').send({
      fullName: 'New User',
      email: 'test@example.com',
      password: 'secret',
      confirmPassword: 'secret',
    });

    expect(response.status).toBe(400);
    expect(response.body.errors.join(' ')).toMatch(/already in use/i);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('rejects a registration whose passwords do not match', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const response = await request(app).post('/api/users').send({
      fullName: 'New User',
      email: 'new@example.com',
      password: 'secret',
      confirmPassword: 'other',
    });

    expect(response.status).toBe(400);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('returns a token for a valid login', async () => {
    prismaMock.user.findUnique.mockResolvedValue(dbUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const response = await request(app).post('/api/login').send({
      username: 'test@example.com',
      password: 'secret',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.access_token).toEqual(expect.any(String));
  });

  it('rejects a wrong password', async () => {
    prismaMock.user.findUnique.mockResolvedValue(dbUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const response = await request(app).post('/api/login').send({
      username: 'test@example.com',
      password: 'wrong',
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Username/password invalid');
  });

  it('rejects an unknown user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const response = await request(app).post('/api/login').send({
      username: 'missing@example.com',
      password: 'secret',
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/User not found/);
  });

  it('requires a token to read the account', async () => {
    const response = await request(app).get('/api/account');

    expect(response.status).toBe(401);
  });

  it('returns the account from a valid token', async () => {
    const response = await request(app)
      .get('/api/account')
      .set('Authorization', `Bearer ${userToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: 1,
      username: 'test@example.com',
      role: { name: 'USER' },
    });
  });
});
