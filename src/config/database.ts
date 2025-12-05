import mysql from 'mysql2/promise';

const getConnection = async () => {
    // Parse DATABASE_URL if available, otherwise use defaults
    const dbUrl = process.env.DATABASE_URL;
    
    if (dbUrl) {
        // Parse mysql://user:password@host:port/database
        const url = new URL(dbUrl);
        const connection = await mysql.createConnection({
            host: url.hostname,
            port: parseInt(url.port) || 3306,
            user: url.username,
            password: url.password,
            database: url.pathname.slice(1), // Remove leading '/'
        });
        return connection;
    }
    
    // Fallback for local development
    const connection = await mysql.createConnection({
        port: 3306,
        host: '127.0.0.1',
        user: 'root',
        database: 'nodejspro',
        password: 'Minhchau3112...'
    });
    return connection;
}

export default getConnection;