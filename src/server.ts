import app from './app';
import getConnection from './config/database';
import initDatabase from 'config/seed';

const PORT = process.env.PORT || 3000;

async function start() {
    try {
        await getConnection();
        await initDatabase();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
    }

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

start();
