/// <reference path="./types/index.d.ts" />


import express from 'express';
import dotenv from 'dotenv';
import 'dotenv/config';
import webRoutes from './routes/web';
import getConnection from './config/database';
import initDatabase from 'config/seed';
import passport from 'passport';
import configPassportLocal from 'src/middleware/passport.local';
import { prisma } from 'config/client';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { PrismaClient } from '@prisma/client';
import apiRoutes from './routes/api';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// config view engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views'); 

// config req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// config static files
app.use(express.static('public'));
// Serve /image/product for /images/product as well (legacy path support)
app.use('/images/product', express.static('public/image/product'));

// config session
app.use(session({
    // session secret - set via env var in production
    secret: process.env.SESSION_SECRET || 'change_this_in_production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    },
    store: new PrismaSessionStore(
        prisma,
        {
            checkPeriod: 2 * 60 * 1000, //ms
            dbRecordIdIsSessionId: true,
            dbRecordIdFunction: undefined,
        }
    )
}));

// config passport
app.use(passport.initialize());
app.use(passport.authenticate('session'));
configPassportLocal();

//config global

app.use((req, res, next) => {
    res.locals.user = req.user || null; // Pass user object to all views
    next();
});

// config routes
webRoutes(app);

// api routes
apiRoutes(app);

// Initialize database connection and seed data (non-blocking)
(async () => {
    try {
        await getConnection();
        await initDatabase();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
})();

// Note: seeding is already invoked above in the async initializer.
// Avoid calling initDatabase() again here to prevent double work on every restart.

//handle 404 not found
app.use((req, res) => {
    res.send('status/404.ejs');
});

// start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});