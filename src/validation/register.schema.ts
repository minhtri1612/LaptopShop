import { z } from "zod";
import { isEmailExist } from 'services/client/auth.service';


const passwordSchema = z.string().min(3,"Password must be at least 3 characters long").max(255, "Password must be at most 255 characters long")

const emailShcema = z.string().email("Invalid email address").refine(async (email) => {
    const existingUser = await isEmailExist(email);
    return !existingUser;
}, {
    message: "Email already in use",
});

export const RegisterSchema = z.object({
    fullname: z.string().min(3, "Fullname must be at least 3 characters long").max(255, "Fullname must be at most 255 characters long"),
    email: emailShcema,
    password: passwordSchema,
    confirmPassword: z.string().min(3,"Confirm Password must be at least 3 characters long").max(255, "Confirm Password must be at most 255 characters long"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
}); 