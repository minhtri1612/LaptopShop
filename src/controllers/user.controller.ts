import { Request, Response } from 'express';
import { getAllUser, handleCreateUser, handleDeleteUser, getUserById, updateUserById, getAllRoles } from '../services/user.service';
import { getProducts, countTotalProductClientPages } from 'services/client/item.service';
import { productFilterService, countFilteredProducts } from 'services/client/product.filter';

const getHomePage = async (req: Request, res: Response) => {
    const { page } = req.query;
    let currentPage = page ? +page : 1;
    if (currentPage <= 0) currentPage = 1;

    const totalPages = await countTotalProductClientPages(8);
    const products = await getProducts(currentPage, 8);
    return res.render('client/home/show.ejs', { 
        products, 
        totalPages: +totalPages, 
        page: +currentPage 
    });
};

const getProductFilterPage = async (req: Request, res: Response) => {
    // Bước 1: Lấy ra tham số từ query string
    const { page, factory, target, price, sort } = req.query as {
        page?: string;
        factory?: string;
        target?: string;
        price?: string;
        sort?: string;
    };

    console.log("=== FILTER DEBUG ===");
    console.log("factory:", factory);
    console.log("target:", target);
    console.log("price:", price);
    console.log("sort:", sort);

    let currentPage = page ? +page : 1;
    if (currentPage <= 0) currentPage = 1;

    const pageSize = 6;

    // Bước 2: Gọi service với filter và sort parameters
    const products = await productFilterService(
        currentPage,
        pageSize,
        factory,
        target,
        price,
        sort
    );

    console.log("Products found:", products.length);
    products.forEach((p: any) => console.log(`- ${p.name} | factory: ${p.factory}`));

    // Count total filtered products for pagination
    const totalFilteredProducts = await countFilteredProducts(factory, target, price);
    const totalPages = Math.ceil(totalFilteredProducts / pageSize);

    return res.render('client/product/filter.ejs', { 
        products, 
        totalPages: totalPages || 1, 
        page: +currentPage 
    });
};
const getCreateUserPage = async (req: Request, res: Response) => {
    const roles = await getAllRoles();
    return res.render('admin/user/create.ejs', { roles: roles || [] });
};

const getUserPage = async (req: Request, res: Response) => {
    // alias to the create page for public route
    const roles = await getAllRoles();
    return res.render('admin/user/create.ejs', { roles: roles || [] });
};

const postUserPage = async (req: Request, res: Response) => {
    const { fullName, username, phone, role, address, password } = req.body;
    const file = req.file;
    const avatar = file ? file.filename : '';
    await handleCreateUser(fullName, username, address, phone, avatar, role, password);
    return res.redirect('/admin/user');
};

const postDeleteUser = async (req: Request, res: Response) => {
    const id = req.params.id;
    await handleDeleteUser(id);
    return res.redirect('/admin/user');
};

const getViewUser = async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await getUserById(id);
    const roles = await getAllRoles();

    let userObj: any = result;
    if (Array.isArray(result)) {
        userObj = result[0];
        if (Array.isArray(userObj) && userObj.length) {
            userObj = userObj[0];
        }
    }

    return res.render('admin/user/detail.ejs', {
        id: id,
        user: userObj,
        roles: roles || []
    });
};

const postUpdateUser = async (req: Request, res: Response) => {
    const { id, fullName, username, phone, role, address } = req.body;
    const file = req.file;
    const avatar = file?.filename ?? undefined;
    await updateUserById(id, fullName, phone, role, address, avatar);
    return res.redirect('/admin/user');
};

export { 
    getHomePage, getUserPage, postUserPage, postDeleteUser, 
    getViewUser, postUpdateUser, getCreateUserPage, getProductFilterPage };
