import { Request, Response } from "express";
import { get } from "http";
import { getDashboardInfo } from "services/admin/dashboard.service";
import { getOrderAdmin, getOrderDetailAdmin, countTotalOrderPages } from "services/admin/order.service";
import { getProductList } from "services/admin/product.service";
import { countTotalUserPages, getAllUser } from "services/user.service";
import { countTotalProductPages } from "./product.controller";
const getDashboardPage = async (req: Request, res: Response) => {
    const info = await getDashboardInfo();

    return res.render("admin/dashboard/show.ejs", { info });
};

const getAdminUserPage = async (req: Request, res: Response) => {

    const { page } = req.query;

    let currentPage = page ? +page :1 ;
    if (currentPage <= 0 ) currentPage =1;
    const users =await getAllUser(currentPage);
    const totalPages = await countTotalUserPages();
    return res.render("admin/user/show.ejs", {
        users: users,
        totalPages: +totalPages,
        page: +currentPage
});
};

const getAdminProductPage = async (req: Request, res: Response) => {

    const { page } = req.query;

    let currentPage = page ? +page : 1;
    if (currentPage <= 0) currentPage = 1;
    const products = await getProductList(currentPage);
    const totalPages = await countTotalProductPages();
    return res.render("admin/product/show.ejs", {
        products: products,
        totalPages: +totalPages,
        page: +currentPage
});
};

const getAdminOrderDetailPage = async (req: Request, res: Response) => {
    const {id} = req.params;
    const orderDetails = await getOrderDetailAdmin(+id);
    return res.render("admin/order/detail.ejs", { orderDetails, id });
};

const getAdminOrderPage = async (req: Request, res: Response) => {
    const {page} = req.query;
    let currentPage = page ? +page : 1;
    if (currentPage <= 0) currentPage = 1;
    const orders = await getOrderAdmin(currentPage);

    const totalPages = await countTotalOrderPages();

    return res.render("admin/order/show.ejs", {
        orders,
        totalPages: +totalPages,
        page: +currentPage
    });
};

export { getDashboardPage, getAdminUserPage, 
    getAdminProductPage, getAdminOrderPage, getAdminOrderDetailPage };