import { Request, Response } from 'express';
import { ProductSchema, TProductSchema } from '../../validation/product.schema';
import { createProduct, handleDeleteProduct, getProductId, updateProduct, getProductList } from 'services/admin/product.service';
import { TOTAL_ITEM_PER_PAGE } from 'config/constant';
import { prisma } from 'config/client';
import { uploadMulterFile } from 'services/s3.service';

// Render create product page
const getAdminCreateProductPage = async (req: Request, res: Response) => {
    return res.render('admin/product/create.ejs');
};

// Create product handler
const postAdminCreateProduct = async (req: Request, res: Response) => {
    const { name, price, detailDesc, shortDesc, quantity, factory, target } = req.body as TProductSchema;
    const validate = ProductSchema.safeParse(req.body);
    if (!validate.success) {
        console.error('Validation error in postAdminCreateProduct:', validate.error);
        return res.status(400).send('Invalid product data');
    }
    
    let image = '';
    if (req.file) {
        try {
            const result = await uploadMulterFile(req.file, 'products');
            image = result.url;
        } catch (error) {
            console.error('S3 upload error:', error);
            image = req.file.filename; // Fallback to local
        }
    }
    
    await createProduct(name, +price, detailDesc, shortDesc, +quantity, factory, target, image);
    return res.redirect('/admin/product');
};

// Delete product
const postDeleteProduct = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.redirect('/admin/product');
    await handleDeleteProduct(id);
    return res.redirect('/admin/product');
};

// View product details (render detail page)
const getViewProduct = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.redirect('/admin/product');
    const product = await getProductId(id);
    if (!product) return res.status(404).send('Product not found');

    const factoryOptions = [
        { name: 'Apple (MacBook)', value: 'APPLE' },
        { name: 'Asus', value: 'ASUS' },
        { name: 'Lenovo', value: 'LENOVO' },
        { name: 'Dell', value: 'DELL' },
        { name: 'LG', value: 'LG' },
        { name: 'Acer', value: 'ACER' },
    ];

    const targetOptions = [
        { name: 'Gaming', value: 'GAMING' },
        { name: 'Sinh viên - Văn phòng', value: 'SINHVIEN-VANPHONG' },
        { name: 'Thiết kế đồ họa', value: 'THIET-KE-DO-HOA' },
        { name: 'Mỏng nhẹ', value: 'MONG-NHE' },
        { name: 'Doanh nhân', value: 'DOANH-NHAN' },
    ];

    return res.render('admin/product/detail.ejs', {
        id: id,
        product: product,
        factoryOptions,
        targetOptions,
    });
};

// Update product
const postUpdateProduct = async (req: Request, res: Response) => {
    const { id, name, price, detailDesc, shortDesc, quantity, factory, target } = req.body as any;
    const numId = Number(id);
    if (Number.isNaN(numId)) return res.redirect('/admin/product');
    
    let image: string | null = null;
    if (req.file) {
        try {
            const result = await uploadMulterFile(req.file, 'products');
            image = result.url;
        } catch (error) {
            console.error('S3 upload error:', error);
            image = req.file.filename; // Fallback to local
        }
    }
    
    await updateProduct(
        numId,
        name,
        Number(price),
        detailDesc,
        shortDesc || null,
        Number(quantity),
        factory || null,
        target || null,
        image
    );
    return res.redirect('/admin/product');
};

const countTotalProductPages = async () => {
    const pageSize = TOTAL_ITEM_PER_PAGE;
    const totalItems = await prisma.product.count();
    return Math.ceil(totalItems / pageSize);
};

export { getAdminCreateProductPage, postAdminCreateProduct, 
    postDeleteProduct, getViewProduct, postUpdateProduct, countTotalProductPages };