import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('mysql2/promise', () => {
  const createConnection = vi.fn();
  return {
    default: { createConnection },
    createConnection,
  };
});

describe('getConnection', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it('parses DATABASE_URL and opens a mysql connection', async () => {
    process.env.DATABASE_URL = 'mysql://root:p%40ss@127.0.0.1:3307/nodejspro';
    const mysql = await import('mysql2/promise');
    const fakeConn = { threadId: 1 };
    const createConnection = mysql.default.createConnection;
    vi.mocked(createConnection).mockResolvedValue(fakeConn as never);

    const getConnection = (await import('src/config/database')).default;
    const conn = await getConnection();

    expect(conn).toBe(fakeConn);
    expect(createConnection).toHaveBeenCalledWith({
      host: '127.0.0.1',
      port: 3307,
      user: 'root',
      password: 'p@ss',
      database: 'nodejspro',
    });
  });

  it('defaults port to 3306 when DATABASE_URL has no port', async () => {
    process.env.DATABASE_URL = 'mysql://app:secret@dbhost/shop';
    const mysql = await import('mysql2/promise');
    vi.mocked(mysql.default.createConnection).mockResolvedValue({} as never);

    const getConnection = (await import('src/config/database')).default;
    await getConnection();

    expect(mysql.default.createConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'dbhost',
        port: 3306,
        user: 'app',
        password: 'secret',
        database: 'shop',
      })
    );
  });

  it('throws when DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;
    const getConnection = (await import('src/config/database')).default;

    await expect(getConnection()).rejects.toThrow('DATABASE_URL environment variable is required');
  });
});
