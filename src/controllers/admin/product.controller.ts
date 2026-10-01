import { Request, Response } from 'express';
import { ProductSchema, TProductSchema } from '../../validation/product.schema';
import { createProduct, handleDeleteProduct, getProductId, updateProduct, getProductList } from 'services/admin/product.service';
import { TOTAL_ITEM_PER_PAGE } from 'config/constant';
import { prisma } from 'config/client';
import { getPresignedUploadUrl, uploadMulterFile } from 'services/s3.service';

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const productImageUrl = (value: unknown): string | undefined => {
    if (typeof value !== 'string' || value.trim() === '') return undefined;
    const bucket = process.env.AWS_S3_BUCKET_NAME || '';
    const region = process.env.AWS_REGION || 'ap-southeast-2';
    const prefix = `https://${bucket}.s3.${region}.amazonaws.com/products/`;
    if (!bucket || !value.startsWith(prefix)) return '';
    return value;
};

// Render create product page
const getAdminCreateProductPage = async (req: Request, res: Response) => {
    return res.render('admin/product/create.ejs');
};

const postProductUploadUrl = async (req: Request, res: Response) => {
    const rawType = req.body?.contentType;
    const contentType = rawType === 'image/jpg' ? 'image/jpeg' : rawType;
    const size = Number(req.body?.size);
    if (
        (contentType !== 'image/png' && contentType !== 'image/jpeg')
        || !Number.isInteger(size)
        || size <= 0
        || size > MAX_IMAGE_BYTES
    ) {
        return res.status(400).json({ error: 'Only JPEG and PNG images up to 3MB are allowed' });
    }

    const signed = await getPresignedUploadUrl(
        contentType === 'image/png' ? 'image.png' : 'image.jpg',
        contentType,
        'products',
    );
    return res.json({ ...signed, contentType });
};

// Create product handler
const postAdminCreateProduct = async (req: Request, res: Response) => {
    const { name, price, detailDesc, shortDesc, quantity, factory, target } = req.body as TProductSchema;
    const validate = ProductSchema.safeParse(req.body);
    if (!validate.success) {
        console.error('Validation error in postAdminCreateProduct:', validate.error);
        return res.status(400).send('Invalid product data');
    }
    
    const provided = productImageUrl(req.body.imageUrl);
    if (provided === '') {
        return res.status(400).send('Invalid product image');
    }

    let image = provided || '';
    if (!image && req.file) {
        try {
            const result = await uploadMulterFile(req.file, 'products');
            image = result.url;
        } catch (error) {
            console.error('S3 upload error:', error);
            image = req.file.filename; // Fallback to local
        }
    }
    
    await createProduct({
        name,
        price: +price,
        detailDesc,
        shortDesc,
        quantity: +quantity,
        factory,
        target,
        imageUpload: image,
    });
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
    
    const provided = productImageUrl(req.body.imageUrl);
    if (provided === '') {
        return res.status(400).send('Invalid product image');
    }

    let image: string | null = provided || null;
    if (!image && req.file) {
        try {
            const result = await uploadMulterFile(req.file, 'products');
            image = result.url;
        } catch (error) {
            console.error('S3 upload error:', error);
            image = req.file.filename; // Fallback to local
        }
    }
    
    await updateProduct({
        id: numId,
        name,
        price: Number(price),
        detailDesc,
        shortDesc: shortDesc || null,
        quantity: Number(quantity),
        factory: factory || null,
        target: target || null,
        imageUpload: image,
    });
    return res.redirect('/admin/product');
};

const countTotalProductPages = async () => {
    const pageSize = TOTAL_ITEM_PER_PAGE;
    const totalItems = await prisma.product.count();
    return Math.ceil(totalItems / pageSize);
};

export { getAdminCreateProductPage, postProductUploadUrl, postAdminCreateProduct, 
    postDeleteProduct, getViewProduct, postUpdateProduct, countTotalProductPages };