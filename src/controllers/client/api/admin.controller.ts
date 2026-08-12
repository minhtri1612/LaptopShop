import { Request, Response } from "express";
import { TOTAL_ITEM_PER_PAGE } from "config/constant";
import { getDashboardInfo } from "services/admin/dashboard.service";
import {
    createProduct,
    getProductList,
    handleDeleteProduct,
    getProductId,
    updateProduct,
} from "services/admin/product.service";
import {
    getOrderAdmin,
    getOrderDetailAdmin,
    countTotalOrderPages,
} from "services/admin/order.service";
import { getAllUser, countTotalUserPages, handleDeleteUser } from "services/user.service";
import { prisma } from "config/client";
import { ProductSchema } from "src/validation/product.schema";

const formatZodErrors = (issues: { path: (string | number)[]; message: string }[]) =>
    issues.map((item) => `${item.path.join(".")}: ${item.message}`);

const getAdminDashboardAPI = async (_req: Request, res: Response) => {
    const data = await getDashboardInfo();
    return res.status(200).json({
        message: "Dashboard retrieved successfully",
        data,
    });
};

const getAdminProductsAPI = async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const [products, totalItems] = await Promise.all([
        getProductList(page),
        prisma.product.count(),
    ]);
    const totalPages = Math.ceil(totalItems / TOTAL_ITEM_PER_PAGE) || 1;

    return res.status(200).json({
        message: "Admin products retrieved successfully",
        data: products,
        pagination: { page, pageSize: TOTAL_ITEM_PER_PAGE, totalItems, totalPages },
    });
};

const createAdminProductAPI = async (req: Request, res: Response) => {
    const parsed = ProductSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ errors: formatZodErrors(parsed.error.issues) });
    }

    const { name, price, detailDesc, shortDesc, quantity, factory, target } = parsed.data;
    const image = typeof req.body.image === "string" ? req.body.image : "";

    await createProduct(
        name,
        price,
        detailDesc,
        shortDesc ?? "",
        quantity,
        factory ?? "",
        target ?? "",
        image
    );

    return res.status(201).json({ message: "Product created successfully" });
};

const updateAdminProductAPI = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid product id" });
    }

    const existing = await getProductId(id);
    if (!existing) {
        return res.status(404).json({ message: "Product not found" });
    }

    const parsed = ProductSchema.safeParse({ ...req.body, id: String(id) });
    if (!parsed.success) {
        return res.status(400).json({ errors: formatZodErrors(parsed.error.issues) });
    }

    const { name, price, detailDesc, shortDesc, quantity, factory, target } = parsed.data;
    const image =
        typeof req.body.image === "string" && req.body.image.trim() !== ""
            ? req.body.image
            : existing.image;

    await updateProduct(
        id,
        name,
        price,
        detailDesc,
        shortDesc ?? null,
        quantity,
        factory ?? null,
        target ?? null,
        image
    );

    return res.status(200).json({ message: "Product updated successfully" });
};

const deleteAdminProductAPI = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid product id" });
    }

    const existing = await getProductId(id);
    if (!existing) {
        return res.status(404).json({ message: "Product not found" });
    }

    await handleDeleteProduct(id);
    return res.status(200).json({ message: "Product deleted successfully" });
};

const getAdminOrdersAPI = async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const [orders, totalPages] = await Promise.all([
        getOrderAdmin(page),
        countTotalOrderPages(),
    ]);

    return res.status(200).json({
        message: "Admin orders retrieved successfully",
        data: orders,
        pagination: {
            page,
            pageSize: TOTAL_ITEM_PER_PAGE,
            totalPages,
        },
    });
};

const getAdminOrderDetailAPI = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await prisma.order.findUnique({
        where: { id },
        include: { user: true },
    });
    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    const details = await getOrderDetailAdmin(id);
    return res.status(200).json({
        message: "Admin order detail retrieved successfully",
        data: { order, details },
    });
};

const getAdminUsersAPI = async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const [users, totalPages] = await Promise.all([
        getAllUser(page),
        countTotalUserPages(),
    ]);

    const sanitized = users.map(({ password, ...rest }) => rest);

    return res.status(200).json({
        message: "Admin users retrieved successfully",
        data: sanitized,
        pagination: { page, pageSize: TOTAL_ITEM_PER_PAGE, totalPages },
    });
};

const deleteAdminUserAPI = async (req: Request, res: Response) => {
    const id = req.params.id;
    await handleDeleteUser(id);
    return res.status(200).json({ message: "User deleted successfully" });
};

export {
    getAdminDashboardAPI,
    getAdminProductsAPI,
    createAdminProductAPI,
    updateAdminProductAPI,
    deleteAdminProductAPI,
    getAdminOrdersAPI,
    getAdminOrderDetailAPI,
    getAdminUsersAPI,
    deleteAdminUserAPI,
};
