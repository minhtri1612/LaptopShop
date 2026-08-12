import { z } from "zod";

const coercePositiveInt = z.preprocess((val) => {
    if (typeof val === "string" && val.trim() !== "") return Number(val);
    return val;
}, z.number().int().positive());

export const AddCartItemSchema = z.object({
    productId: coercePositiveInt,
    quantity: z.preprocess((val) => {
        if (typeof val === "string" && val.trim() !== "") return Number(val);
        return val;
    }, z.number().int().positive()),
});

export const UpdateCartItemsSchema = z.object({
    cartDetails: z
        .array(
            z.object({
                id: z.coerce.string().min(1),
                quantity: z.coerce.string().min(1),
            })
        )
        .min(1),
});

export type TAddCartItem = z.infer<typeof AddCartItemSchema>;
export type TUpdateCartItems = z.infer<typeof UpdateCartItemsSchema>;
