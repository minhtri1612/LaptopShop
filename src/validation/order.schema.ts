import { z } from "zod";

export const PlaceOrderSchema = z.object({
    receiverName: z.string().trim().min(1, "Receiver name is required").max(255),
    receiverAddress: z.string().trim().min(1, "Receiver address is required").max(255),
    receiverPhone: z.string().trim().min(1, "Receiver phone is required").max(255),
    totalPrice: z.preprocess((val) => {
        if (val === undefined || val === null || val === "") return undefined;
        if (typeof val === "string") return Number(val);
        return val;
    }, z.number().nonnegative().optional()),
});

export type TPlaceOrder = z.infer<typeof PlaceOrderSchema>;
