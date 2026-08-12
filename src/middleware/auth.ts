import { Request, Response, NextFunction } from 'express';

/** Web-only: redirect authenticated users away from login/register pages. */
const isLogin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        res.redirect('/')
        return;
    }
    else {
        return next();
    }

};

/** Web-only: guard /admin* pages with EJS redirect on failure. */
const isAdmin = (req: any, res: any, next: any) => {
    if (!req.path.startsWith('/admin')) {
        // Non-admin routes bypass the admin guard
        return next();
    }

    const user = req.user as any;

    if (user?.role?.name === 'ADMIN') {
        return next();
    }

    return res.redirect('/status/403.ejs');
};

/** API: 401 JSON if no authenticated user on the request. */
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    return next();
};

/** API: 403 JSON unless role is ADMIN (run after JWT / auth middleware). */
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as Express.User | undefined;
    if (user?.role?.name !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
};

export { isLogin, isAdmin, requireAuth, requireAdmin };
