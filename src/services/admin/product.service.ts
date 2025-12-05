import { prisma } from "config/client";
import { TOTAL_ITEM_PER_PAGE } from "config/constant";
const createProduct = async(
    name: string,
    price: number,
    detailDesc: string,
    shortDesc: string,
    quantity: number,
    factory: string,
    target: string,
    imageUpload: string
) => {
    await prisma.product.create({
        data: {
            name: name,
            price: price,
            detailDesc: detailDesc,
            shortDesc: shortDesc,
            quantity: quantity,
            factory: factory,
            target: target,
            image: imageUpload
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

const updateProduct = async (
    id: number,
    name: string,
    price: number,
    detailDesc: string,
    shortDesc: string | null,
    quantity: number,
    factory: string | null,
    target: string | null,
    imageUpload: string | null
) => {
    return prisma.product.update({
        where: { id },
        data: {
            name,
            price,
            detailDesc,
            shortDesc,
            quantity,
            factory,
            target,
            image: imageUpload || undefined,
        },
    });
};

export { createProduct, getProductList, handleDeleteProduct, getProductId, updateProduct };