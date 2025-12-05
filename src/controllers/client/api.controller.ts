import { Request, Response } from "express";
import { addProductToCart, getCartByUserId } from "services/client/item.service";
import {handleGetAllUser, handleGetUserById, handleUpdateUserById, handleDeleteUserById, handleUserLoginn} from "services/client/api.service";
import { RegisterSchema } from "../../validation/register.schema";
import { registerNewUser } from "services/client/auth.service";

const postAddProductToCartAPI = async (req: Request, res: Response) => {
    const { quantity, productId } = req.body;
    const user = req.user;

    await addProductToCart(+quantity, +productId, user as Express.User);

    // Get updated cart sum after adding product
    const cart = await getCartByUserId(user.id);
    const newSum = cart?.sum ?? 0;

    return res.status(200).json({ 
        message: "Product added to cart successfully", 
        data: newSum 
    });
}


const getAllUsersAPI = async (req: Request, res: Response) => {
    const users = await handleGetAllUser();
    const user = req.user;
    console.log("Current user:", user);
    return res.status(200).json({ 
        message: "Users retrieved successfully", 
        data: users 
    });
}

const getUserByIdAPI = async (req: Request, res: Response) => {
    const {id} = req.params;
    // Assuming you have a service function to get user by ID
    const user = await handleGetUserById(+id);

    if (!user) {
        return res.status(404).json({ 
            message: "User not found" 
        });
    }

    return res.status(200).json({ 
        message: "User retrieved successfully", 
        data: user 
    });
}

const createUsersAPI = async (req: Request, res: Response) => {
    const { fullName, email, password, confirmPassword } = req.body;
    
    const validate = await RegisterSchema.safeParseAsync({
        fullname: fullName, 
        email, 
        password, 
        confirmPassword
    });

    if (!validate.success) {
        const errorsZod = validate.error.issues;
        const errors = errorsZod?.map(item => `${item.path.join('.')}: ${item.message}`);
        return res.status(400).json({ errors });
    }
    
    await registerNewUser(fullName, email, password); 

    return res.status(201).json({ message: "User created successfully" });
}

const updateUserByIdAPI = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { fullName, address, phone } = req.body;

    await handleUpdateUserById(+id, fullName, address, phone);

    return res.status(200).json({ 
        message: "User updated successfully" 
    });
}

const deleteUserByIdAPI = async (req: Request, res: Response) => {
    const { id } = req.params;

    await handleDeleteUserById(+id);

    return res.status(200).json({ 
        message: "User deleted successfully" 
    });
}

const loginAPI = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    try {
        const access_token = await handleUserLoginn(username, password);
        return res.status(200).json({ 
            message: "Login successful", 
            data: access_token 
        });
    } catch (error: any) {
        return res.status(401).json({ message: error.message || "Login failed" });
    }

}

const fetchAccountAPI = async (req: Request, res: Response) => {
    const user = req.user;
    return res.status(200).json({
        message: "Account fetched successfully",
        data: user
    });
}


export { 
    postAddProductToCartAPI, getAllUsersAPI, getUserByIdAPI, 
    createUsersAPI, updateUserByIdAPI, deleteUserByIdAPI,
    loginAPI, fetchAccountAPI
};
   