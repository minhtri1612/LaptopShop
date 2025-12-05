import { NextFunction, Request, Response } from "express";
import { z } from 'zod';
import { prisma } from 'config/client';
import { hashPassword } from 'services/user.service';
import { ACCOUNT_TYPE } from 'config/constant';

// Zod schema for register
const RegisterSchema = z.object({
    fullName: z.string().min(2, { message: 'Full name is required' }),
    username: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
});

const getLoginPage = async (req: Request, res: Response) => {
    const user = req.user as any;
    const session = (req as any).session;
    const messages = session?.messages ?? [];
    if (messages && messages.length) {
        delete session.messages;
    }
    if (user) {
        return res.redirect('/');
    }
    console.log('Rendering login, messages:', messages);
    return res.render("client/auth/login.ejs", { messages });
};

const getRegisterPage = async (req: Request, res: Response) => {
    return res.render("client/auth/register.ejs");
};

const postRegister = async (req: Request, res: Response) => {
    // normalize names from form (some templates use fullName/username)
    const body = {
        fullName: req.body.fullName || req.body.fullname || '',
        username: req.body.username || req.body.email || '',
        password: req.body.password || '',
        confirmPassword: req.body.confirmPassword || req.body.confirmpassword || ''
    };

    const validate = await RegisterSchema.safeParseAsync(body);
    if (!validate.success) {
        const errorsZod = validate.error.issues;
        const errors = errorsZod?.map(item => `${item.path.join('.')}: ${item.message}`);

        const oldData = { fullName: body.fullName, username: body.username };
        return res.status(400).render("client/auth/register.ejs", { errors, oldData });
    }

    const { fullName, username, password } = validate.data;

    try {
        // Check unique username (email)
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) {
            const errors = ['username: Email already in use'];
            const oldData = { fullName, username };
            return res.status(400).render("client/auth/register.ejs", { errors, oldData });
        }

        // Hash password
        const hashed = await hashPassword(password);

        // find USER role id
        const userRole = await prisma.role.findFirst({ where: { name: 'USER' } });
        const roleId = userRole ? userRole.id : 1; // fallback to 1 if not found

        // create user
        await prisma.user.create({
            data: {
                fullName,
                username,
                password: hashed,
                accountType: ACCOUNT_TYPE.SYSTEM,
                roleId
            }
        });

        // redirect to login page on success
        return res.redirect('/login');

    } catch (error) {
        console.error('Register error:', error);
        const errors = ['server: Could not create user'];
        const oldData = { fullName: body.fullName, username: body.username };
        return res.status(500).render("client/auth/register.ejs", { errors, oldData });
    }
}

const getSuccessRedirectPage = async (req: Request, res: Response) => {
    const user = req.user as any;

    if (user && user.role && user.role.name === 'ADMIN') {
        res.redirect('/admin');
    }
    else { 
        return res.redirect('/'); 
    }
};


const postLogout = async (req: Request, res: Response, next: NextFunction) => {

    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
};


export { getLoginPage, getRegisterPage, postRegister, getSuccessRedirectPage, postLogout };