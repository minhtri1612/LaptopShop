import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { requireEnv } from "src/config/secrets";

/**
 * Require a valid Bearer JWT and attach the decoded user to req.user.
 * Public routes must not use this middleware (wire them without it in api.ts).
 */
const checkValidJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : authHeader?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Invalid or missing token" });
    }

    try {
        const secret = requireEnv("JWT_SECRET");
        const dataDecoded: any = jwt.verify(token, secret);
        req.user = {
            id: dataDecoded.id,
            username: dataDecoded.username,
            password: "",
            fullName: "",
            phone: "",
            address: "",
            accountType: dataDecoded.accountType,
            avatar: dataDecoded.avatar,
            roleId: dataDecoded.roleId,
            role: dataDecoded.role,
        };
        return next();
    } catch (err) {
        if (err instanceof Error && err.message.includes("JWT_SECRET")) {
            console.error("JWT configuration error:", err.message);
            return res.status(500).json({ message: "Server authentication misconfigured" });
        }
        return res.status(401).json({ message: "Invalid or missing token" });
    }
};

export { checkValidJWT };
