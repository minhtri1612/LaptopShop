import { compare } from "bcrypt";
import { prisma } from "config/client";
import { ACCOUNT_TYPE } from "config/constant";
import { hashPassword } from "services/user.service";


const isEmailExist = async (email: string): Promise<boolean> => {
    const user = await prisma.user.findUnique({
        where: { username: email }
    });
    if (user) return true;
    return false;
};

const registerNewUser = async(
    fullName: string,
    email: string,
    hashedPassword: string
) => {
    const newPassword = await hashPassword(hashedPassword);
    
    const userRole = await prisma.role.findUnique({
        where: { name: "user" }
    });


    if(userRole) {
        await prisma.user.create({
            data: {
                username: email,
                password: newPassword,
                fullName: fullName,
                accountType: ACCOUNT_TYPE.SYSTEM,
                roleId: userRole.id
            }
        });
    }
};

const getUserWithRoleById = async(id: string) => {
    const user = await prisma.user.findUnique({
        where: { id: +id },
        include: { role: true },
        omit: {
            password: true
        }
    });
    return user;
};


const getUserSumCart = async(id: string) => {
    const user = await prisma.cart.findUnique({
        where: { userId: +id },
    });
    return user?.sum ?? 0;
};


export { isEmailExist, registerNewUser, getUserWithRoleById, getUserSumCart };

/// src/routes/web.ts