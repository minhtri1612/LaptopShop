import { prisma } from "config/client";
import { TOTAL_ITEM_PER_PAGE } from "config/constant";

type CreateProductInput = {
    name: string;
    price: number;
    detailDesc: string;
    shortDesc: string;
    quantity: number;
    factory: string;
    target: string;
    imageUpload: string;
};

type UpdateProductInput = {
    id: number;
    name: string;
    price: number;
    detailDesc: string;
    shortDesc: string | null;
    quantity: number;
    factory: string | null;
    target: string | null;
    imageUpload: string | null;
};

const createProduct = async (input: CreateProductInput) => {
    await prisma.product.create({
        data: {
            name: input.name,
            price: input.price,
            detailDesc: input.detailDesc,
            shortDesc: input.shortDesc,
            quantity: input.quantity,
            factory: input.factory,
            target: input.target,
            image: input.imageUpload
        }
    });
};

const getProductList = async(page: number) => {
    const pageSize =  TOTAL_ITEM_PER_PAGE;
    const skip = (page - 1) * pageSize;
    const products = await prisma.product.findMany({
        skip: skip,
        take: pageSize
    });
    return products;
};

const handleDeleteProduct = async (id: number) => {
    await prisma.product.delete({
        where: { id }
    });
};  

const  getProductId = async (id: number) => {
    return prisma.product.findUnique({
        where: { id }
    });
};

const updateProduct = async (input: UpdateProductInput) => {
    return prisma.product.update({
        where: { id: input.id },
        data: {
            name: input.name,
            price: input.price,
            detailDesc: input.detailDesc,
            shortDesc: input.shortDesc,
            quantity: input.quantity,
            factory: input.factory,
            target: input.target,
            image: input.imageUpload || undefined,
        },
    });
};

export { createProduct, getProductList, handleDeleteProduct, getProductId, updateProduct };