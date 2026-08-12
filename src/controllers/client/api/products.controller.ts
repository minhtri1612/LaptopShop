import { Request, Response } from "express";
import { getProductById } from "services/client/item.service";
import {
    productFilterService,
    countFilteredProducts,
} from "services/client/product.filter";

const DEFAULT_PAGE_SIZE = 8;

const getProductsAPI = async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Number(req.query.pageSize) || DEFAULT_PAGE_SIZE);
    const factory = req.query.factory ? String(req.query.factory) : undefined;
    const target = req.query.target ? String(req.query.target) : undefined;
    const price = req.query.price ? String(req.query.price) : undefined;
    const sort = req.query.sort ? String(req.query.sort) : undefined;

    const [products, totalItems] = await Promise.all([
        productFilterService(page, pageSize, factory, target, price, sort),
        countFilteredProducts(factory, target, price),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    return res.status(200).json({
        message: "Products retrieved successfully",
        data: products,
        pagination: { page, pageSize, totalItems, totalPages },
    });
};

const getProductByIdAPI = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await getProductById(id);
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
        message: "Product retrieved successfully",
        data: product,
    });
};

export { getProductsAPI, getProductByIdAPI };
