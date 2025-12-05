import { Request, Response, NextFunction } from 'express';
import { User } from '@prisma/client';
const isLogin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        res.redirect('/')
        return;
    }
    else {
        return next();
    }

};

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



export { isLogin, isAdmin };