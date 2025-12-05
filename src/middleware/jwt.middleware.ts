import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";
const checkValidJWT = (req: Request, res: Response, next: NextFunction) => {

    const path = req.path;
    const whiteList = [
        "/add-product-to-cart",
        "/login",
        "/users"
    ]

    const isWhileListed = whiteList.find(route => route === path);
    if(isWhileListed){
        return next();
    }



    const token = req.headers['authorization']?.split(' ')[1]; 
    console.log("JWT Token:", token); // Debugging line
    try{
        const dataDecoded: any = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
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
            role: dataDecoded.role
        }
        next();
    }
    catch(err){
        console.error("JWT Verification Error:", err);
        return res.status(401).json({ message: 'Invalid or missing token' });
    }

};
export { checkValidJWT };