import mysql from 'mysql2/promise';

const getConnection = async () => {
    const connection = await mysql.createConnection({
        port: 3306,
        // Use IPv4 loopback to avoid ::1 resolution issues on some Linux distros
        host: '127.0.0.1',
        user: 'root',
        database: 'nodejspro',
        password: 'Minhchau3112...'
    });
    return connection;
}

export default getConnection;