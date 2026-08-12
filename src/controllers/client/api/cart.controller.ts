import { Request, Response } from "express";
import {
    addProductToCart,
    getCartByUserId,
    deleteProductFromCart,
    updateCartDetailBeforeCheckout,
} from "services/client/item.service";
import { AddCartItemSchema, UpdateCartItemsSchema } from "src/validation/cart.schema";

const formatZodErrors = (issues: { path: (string | number)[]; message: string }[]) =>
    issues.map((item) => `${item.path.join(".")}: ${item.message}`);

const getCartAPI = async (req: Request, res: Response) => {
    const user = req.user!;
    const cart = await getCartByUserId(user.id);
    const cartDetails = cart?.cartDetails ?? [];
    const totalPrice = cartDetails
        .map((item) => item.price * item.quantity)
        .reduce((a, b) => a + b, 0);

    return res.status(200).json({
        message: "Cart retrieved successfully",
        data: {
            cart: cart ?? null,
            cartDetails,
            sum: cart?.sum ?? 0,
            totalPrice,
        },
    });
};

const addCartItemAPI = async (req: Request, res: Response) => {
    const parsed = AddCartItemSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ errors: formatZodErrors(parsed.error.issues) });
    }

    const user = req.user!;
    const { productId, quantity } = parsed.data;

    await addProductToCart(quantity, productId, user as Express.User);
    const cart = await getCartByUserId(user.id);

    return res.status(200).json({
        message: "Product added to cart successfully",
        data: { sum: cart?.sum ?? 0, cart },
    });
};

const updateCartItemsAPI = async (req: Request, res: Response) => {
    const parsed = UpdateCartItemsSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ errors: formatZodErrors(parsed.error.issues) });
    }

    await updateCartDetailBeforeCheckout(
        parsed.data.cartDetails.map((item) => ({
            id: String(item.id),
            quantity: String(item.quantity),
        }))
    );
    const cart = await getCartByUserId(req.user!.id);

    return res.status(200).json({
        message: "Cart updated successfully",
        data: cart,
    });
};

const deleteCartItemAPI = async (req: Request, res: Response) => {
    const cartDetailId = Number(req.params.cartDetailId);
    if (!Number.isFinite(cartDetailId) || cartDetailId <= 0) {
        return res.status(400).json({ message: "Invalid cart detail id" });
    }

    const user = req.user!;
    const cart = await getCartByUserId(user.id);
    if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
    }

    const belongsToUser = cart.cartDetails.some((d) => d.id === cartDetailId);
    if (!belongsToUser) {
        return res.status(404).json({ message: "Cart item not found" });
    }

    await deleteProductFromCart(user.id, cartDetailId, cart.sum);
    const updated = await getCartByUserId(user.id);

    return res.status(200).json({
        message: "Cart item removed successfully",
        data: updated ?? null,
    });
};

export { getCartAPI, addCartItemAPI, updateCartItemsAPI, deleteCartItemAPI };
