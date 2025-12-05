import { skip } from "@prisma/client/runtime/library";
import { prisma } from "config/client";

const getProducts = async (page: number, pageSize: number) => {
    const skip = (page - 1) * pageSize;
    const products = await prisma.product.findMany({
        skip: skip,
        take: pageSize
    });
    return products;
}

const countTotalProductClientPages = async (pageSize: number) => {
    const totalItems = await prisma.product.count();
    const totalPages = Math.ceil(totalItems / pageSize);
    return totalPages;
}

const getProductById = async (id: number) => {
    const product = await prisma.product.findUnique({
        where: { id }
    });
    return product;
}

const addProductToCart = async (quantity: number, productId: number, user: Express.User) => {
    const cart = await prisma.cart.findUnique({
        where: {
            userId: user.id
        }
    });
    
    const product = await prisma.product.findUnique({
        where: { id: productId }
    });

    if (cart) {
        await prisma.cart.update({
            where: {
                id: cart.id
            },
            data: {
                sum: {
                    increment: quantity
                }
            }
        });

        const currentCartDetail = await prisma.cartDetail.findFirst({
            where: {
                productId: productId,
                cartId: cart.id
            }
        });

        await prisma.cartDetail.upsert({
            where: {
                id: currentCartDetail ? currentCartDetail.id : 0
            },
            update: {
                quantity: {
                    increment: quantity
                }
            },
            create: {
                price: product ? product.price : 0,
                quantity: quantity,
                productId: productId,
                cartId: cart.id
            }
        });

    } else {
        await prisma.cart.create({
            data: {
                sum: quantity,
                userId: user.id,
                cartDetails: {
                    create: [{
                        price: product.price,
                        quantity: quantity,
                        productId: productId
                    }]
                }
            }
        });
    }
}

const getCartByUserId = async (userId: number) => {
    const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
            cartDetails: {
                include: {
                    product: true
                }
            }
        }
    });
    return cart;
}

const getProductInCart = async (userId: number) => {
    const cart = await prisma.cart.findUnique({
        where: { userId }
    });

    if (cart) {
        const currentCartDetail = await prisma.cartDetail.findMany({
            where: { cartId: cart.id },
            include: { product: true }
        });
        return currentCartDetail;
    }
    return null;
}

const deleteProductFromCart = async (userId: number, cartDetailId: number, sumCart: number) => {
    const currentCartDetail = await prisma.cartDetail.findUnique({
        where: { id: cartDetailId }
    });

    const quantity = currentCartDetail.quantity;

    await prisma.cartDetail.delete({
        where: { id: cartDetailId }
    });

    if (sumCart === 1) {
        await prisma.cart.delete({
            where: { userId }
        });
    } else {
        await prisma.cart.update({
            where: { userId },
            data: {
                sum: {
                    decrement: quantity,
                }
            }
        });
    }
}

const updateCartDetailBeforeCheckout = async (cartDetails: { id: string; quantity: string }[]) => {
    let quantity = 0;

    for (let i = 0; i < cartDetails.length; i++) {
        quantity += +cartDetails[i].quantity;
        await prisma.cartDetail.update({
            where: {
                id: +(cartDetails[i].id)
            },
            data: {
                quantity: +cartDetails[i].quantity
            }
        });
    }

    // Get the cart from the first cartDetail to update sum
    const firstCartDetail = await prisma.cartDetail.findUnique({
        where: { id: +cartDetails[0].id }
    });

    if (firstCartDetail) {
        await prisma.cart.update({
            where: {
                id: firstCartDetail.cartId
            },
            data: {
                sum: cartDetails.reduce((total, item) => total + (+item.quantity), 0)
            }
        });
    }
}

const handlerPlaceOrder = async (
    userId: number,
    receiverName: string,
    receiverAddress: string,
    receiverPhone: string,
    totalPrice: number = 0
) => {
    try {
        await prisma.$transaction(async (tx) => {
            const cart = await tx.cart.findUnique({
                where: { userId },
                include: { cartDetails: true }
            });

            if (!cart) {
                throw new Error("Cart not found");
            }

            // Check product availability first
            for (let i = 0; i < cart.cartDetails.length; i++) {
                const cartDetail = cart.cartDetails[i];
                const product = await tx.product.findUnique({
                    where: { id: cartDetail.productId }
                });

                if (!product) {
                    throw new Error(`Product with ID ${cartDetail.productId} does not exist.`);
                }

                if (product.quantity < cartDetail.quantity) {
                    throw new Error(`Product "${product.name}" only has ${product.quantity} in stock, but you requested ${cartDetail.quantity}.`);
                }
            }

            // Create order details data
            const dataOrderDetails = cart.cartDetails.map(item => ({
                price: item.price,
                quantity: item.quantity,
                productId: item.productId
            }));

            // Create order
            await tx.order.create({
                data: {
                    receiverName,
                    receiverAddress,
                    receiverPhone,
                    paymentMethod: "COD",
                    paymentStatus: "UNPAID",
                    status: "PENDING",
                    totalPrice,
                    userId,
                    ordersDetails: {
                        create: dataOrderDetails
                    }
                }
            });

            // Update product quantity and sold
            for (let i = 0; i < cart.cartDetails.length; i++) {
                const cartDetail = cart.cartDetails[i];
                const product = await tx.product.findUnique({
                    where: { id: cartDetail.productId }
                });

                // Calculate new sold value (sold is String, so we need to parse and convert)
                const currentSold = product.sold ? parseInt(product.sold) : 0;
                const newSold = currentSold + cartDetail.quantity;

                await tx.product.update({
                    where: { id: cartDetail.productId },
                    data: {
                        quantity: {
                            decrement: cartDetail.quantity
                        },
                        sold: String(newSold)
                    }
                });
            }

            // Delete cart details
            await tx.cartDetail.deleteMany({
                where: {
                    cartId: cart.id
                }
            });

            // Delete cart
            await tx.cart.delete({
                where: {
                    id: cart.id
                }
            });
        });
    } catch (error) {
        console.error("Error placing order:", error);
        throw error;
    }
}

const getOrderHistory = async (userId: number) => {
    return await prisma.order.findMany({
        where: { userId },
        include: {
            ordersDetails: {
                include: {
                    product: true
                }
            }
        }
    });
}

export {
    getProducts, getProductById, addProductToCart, getCartByUserId,
    getProductInCart, deleteProductFromCart, updateCartDetailBeforeCheckout,
    getOrderHistory, handlerPlaceOrder, countTotalProductClientPages
};
