import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcrypt';
import request from 'supertest';
import app from '../../app';
import { prismaMock, resetMocks } from '../setup';

const password = 'secret';
let passwordHash = '';

const userAccount = () => ({
  id: 1,
  username: 'user@example.com',
  password: passwordHash,
  fullName: 'Test User',
  address: 'HCM',
  avatar: null,
  roleId: 2,
  role: { id: 2, name: 'USER' },
  accountType: 'SYSTEM',
});

const adminAccount = () => ({
  ...userAccount(),
  id: 2,
  username: 'admin@example.com',
  roleId: 1,
  role: { id: 1, name: 'ADMIN' },
});

describe('web pages', () => {
  beforeAll(async () => {
    passwordHash = await bcrypt.hash(password, 4);
  });

  beforeEach(() => {
    resetMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    prismaMock.cart.findUnique.mockResolvedValue({ id: 1, userId: 1, sum: 0 });
    prismaMock.cartDetail.findMany.mockResolvedValue([]);
    prismaMock.user.count.mockResolvedValue(1);
    prismaMock.product.count.mockResolvedValue(1);
    prismaMock.order.count.mockResolvedValue(1);
  });

  it('renders the login page', async () => {
    const response = await request(app).get('/login');

    expect(response.status).toBe(200);
    expect(response.type).toBe('text/html');
    expect(response.text).toContain('Login - Laptopshop');
  });

  it('sends an anonymous checkout visit to login', async () => {
    const response = await request(app).get('/checkout');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/login');
  });

  it('sends an anonymous admin visit to the 403 page', async () => {
    const response = await request(app).get('/admin').redirects(1);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/status/403');
  });

  it('renders checkout after a user logs in', async () => {
    prismaMock.user.findUnique.mockResolvedValue(userAccount());
    const agent = request.agent(app);

    const login = await agent.post('/login').send({
      username: 'user@example.com',
      password,
    });

    expect(login.status).toBe(302);
    expect(login.headers.location).toBe('/success-redirect');

    const checkout = await agent.get('/checkout');

    expect(checkout.status).toBe(200);
    expect(checkout.text).toContain('Thanh Toán Giỏ Hàng');
  });

  it('renders the admin dashboard after an admin logs in', async () => {
    prismaMock.user.findUnique.mockResolvedValue(adminAccount());
    const agent = request.agent(app);

    const login = await agent.post('/login').send({
      username: 'admin@example.com',
      password,
    });

    expect(login.status).toBe(302);

    const dashboard = await agent.get('/admin').redirects(1);

    expect(dashboard.status).toBe(200);
    expect(dashboard.text).toContain('Users (1)');
  });

  it('rejects a wrong password', async () => {
    prismaMock.user.findUnique.mockResolvedValue(userAccount());

    const response = await request(app).post('/login').send({
      username: 'user@example.com',
      password: 'wrong',
    });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/login');
  });
});
