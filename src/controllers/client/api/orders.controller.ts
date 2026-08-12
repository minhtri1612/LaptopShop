import { Request, Response } from "express";
import { prisma } from "config/client";
import {
    getOrderHistory,
    handlerPlaceOrder,
    getCartByUserId,
} from "services/client/item.service";
import { PlaceOrderSchema } from "src/validation/order.schema";

const formatZodErrors = (issues: { path: (string | number)[]; message: string }[]) =>
    issues.map((item) => `${item.path.join(".")}: ${item.message}`);

const getOrdersAPI = async (req: Request, res: Response) => {
    const orders = await getOrderHistory(req.user!.id);
    return res.status(200).json({
        message: "Orders retrieved successfully",
        data: orders,
    });
};

const getOrderByIdAPI = async (req: Request, res: Response) => {
    const orderId = Number(req.params.id);
    if (!Number.isFinite(orderId) || orderId <= 0) {
        return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            ordersDetails: { include: { product: true } },
        },
    });

    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    const isAdmin = req.user?.role?.name === "ADMIN";
    if (order.userId !== req.user!.id && !isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
    }

    return res.status(200).json({
        message: "Order retrieved successfully",
        data: order,
    });
};

const placeOrderAPI = async (req: Request, res: Response) => {
    const parsed = PlaceOrderSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ errors: formatZodErrors(parsed.error.issues) });
    }

    const user = req.user!;
    const { receiverName, receiverAddress, receiverPhone } = parsed.data;

    let totalPrice = parsed.data.totalPrice;
    if (totalPrice === undefined) {
        const cart = await getCartByUserId(user.id);
        const details = cart?.cartDetails ?? [];
        totalPrice = details
            .map((item) => item.price * item.quantity)
            .reduce((a, b) => a + b, 0);
    }

    try {
        await handlerPlaceOrder(
            user.id,
            receiverName,
            receiverAddress,
            receiverPhone,
            totalPrice
        );
        return res.status(201).json({
            message: "Order placed successfully",
            data: { paymentMethod: "COD", paymentStatus: "UNPAID", status: "PENDING" },
        });
    } catch (error: any) {
        const message = error?.message || "Failed to place order";
        const status = message.includes("stock") || message.includes("Cart not found")
            ? 400
            : 500;
        return res.status(status).json({ message });
    }
};

export { getOrdersAPI, getOrderByIdAPI, placeOrderAPI };
