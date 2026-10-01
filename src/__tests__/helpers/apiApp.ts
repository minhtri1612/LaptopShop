import express from 'express';
import jwt from 'jsonwebtoken';
import apiRoutes from 'src/routes/api';

export const JWT_SECRET = 'test-jwt-secret';

export const createApiApp = () => {
  process.env.JWT_SECRET = JWT_SECRET;
  const app = express();
  app.use(express.json());
  apiRoutes(app);
  return app;
};

export const signToken = (user: {
  id: number;
  username: string;
  roleId: number;
  role: { id: number; name: string };
}) =>
  jwt.sign(
    {
      id: user.id,
      username: user.username,
      roleId: user.roleId,
      role: user.role,
      accountType: 'SYSTEM',
      avatar: null,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

export const userToken = () =>
  signToken({
    id: 1,
    username: 'test@example.com',
    roleId: 2,
    role: { id: 2, name: 'USER' },
  });

export const adminToken = () =>
  signToken({
    id: 2,
    username: 'admin@example.com',
    roleId: 1,
    role: { id: 1, name: 'ADMIN' },
  });
