/// <reference path="./types/index.d.ts" />

import express from 'express';
import dotenv from 'dotenv';
import 'dotenv/config';
import webRoutes from './routes/web';
import passport from 'passport';
import configPassportLocal from 'src/middleware/passport.local';
import { prismaPrimary } from 'config/client';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { PrismaClient } from '@prisma/client';
import apiRoutes from './routes/api';
import cors from 'cors';
import { requireEnv } from './config/secrets';
import statusRoutes from './routes/status';

dotenv.config();

const app = express();
const sessionSecret = requireEnv('SESSION_SECRET');

app.use(cors());

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));
app.use('/images/product', express.static('public/image/product'));

// PrismaSessionStore queries the database as soon as it is constructed.
// Tests use express-session's MemoryStore instead.
const sessionStore = process.env.NODE_ENV === 'test'
    ? undefined
    : new PrismaSessionStore(prismaPrimary, {
        checkPeriod: 2 * 60 * 1000,
        dbRecordIdIsSessionId: true,
        dbRecordIdFunction: undefined,
    });

app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000
    },
    store: sessionStore
}));

app.use(passport.initialize());
app.use(passport.authenticate('session'));
configPassportLocal();

app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

statusRoutes(app);
webRoutes(app);
apiRoutes(app);

app.use((req, res) => {
    res.status(404).render('status/404');
});

export default app;
