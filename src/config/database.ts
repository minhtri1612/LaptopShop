import mysql from 'mysql2/promise';
import { requireEnv } from './secrets';

const getConnection = async () => {
    const dbUrl = requireEnv('DATABASE_URL');
    const url = new URL(dbUrl);
    const connection = await mysql.createConnection({
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.slice(1),
    });
    return connection;
};

export default getConnection;
