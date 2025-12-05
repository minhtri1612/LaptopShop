"use strict";
/// <reference path="./types/index.d.ts" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
require("dotenv/config");
const web_1 = __importDefault(require("./routes/web"));
const database_1 = __importDefault(require("./config/database"));
const seed_1 = __importDefault(require("./config/seed"));
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = __importDefault(require("./middleware/passport.local"));
const client_1 = require("./config/client");
const express_session_1 = __importDefault(require("express-session"));
const prisma_session_store_1 = require("@quixo3/prisma-session-store");
const api_1 = __importDefault(require("./routes/api"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Enable CORS for all routes
app.use((0, cors_1.default)());
// config view engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
// config req.body
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// config static files
app.use(express_1.default.static('public'));
// Serve /image/product for /images/product as well (legacy path support)
app.use('/images/product', express_1.default.static('public/image/product'));
// config session
app.use((0, express_session_1.default)({
    // session secret - set via env var in production
    secret: process.env.SESSION_SECRET || 'change_this_in_production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    },
    store: new prisma_session_store_1.PrismaSessionStore(client_1.prisma, {
        checkPeriod: 2 * 60 * 1000, //ms
        dbRecordIdIsSessionId: true,
        dbRecordIdFunction: undefined,
    })
}));
// config passport
app.use(passport_1.default.initialize());
app.use(passport_1.default.authenticate('session'));
(0, passport_local_1.default)();
//config global
app.use((req, res, next) => {
    res.locals.user = req.user || null; // Pass user object to all views
    next();
});
// config routes
(0, web_1.default)(app);
// api routes
(0, api_1.default)(app);
// Initialize database connection and seed data (non-blocking)
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, database_1.default)();
        yield (0, seed_1.default)();
        console.log('Database initialized successfully');
    }
    catch (error) {
        console.error('Database initialization error:', error);
    }
}))();
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
//# sourceMappingURL=app.js.map