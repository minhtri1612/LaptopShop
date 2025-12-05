import {z} from 'zod';

export const ProductSchema = z.object({
    id: z.string().optional(),
    name: z.string().trim().min(1),
    // form inputs come in as strings; coerce to number before validating
    price: z.preprocess((val) => {
        if (typeof val === 'string' && val.trim() !== '') return Number(val);
        return val;
    }, z.number().min(1)),
    detailDesc: z.string().trim().min(1),
    // shortDesc can be optional in the form; accept an optional trimmed string
    shortDesc: z.string().trim().optional(),
    quantity: z.preprocess((val) => {
        if (typeof val === 'string' && val.trim() !== '') return Number(val);
        return val;
    }, z.number().min(1)),
    factory: z.string().optional(),
    target: z.string().optional(),

    // name            String   @db.VarChar(255)
    // price           Int   
    // image           String?   @db.VarChar(255)
    // detailDesc      String?   @db.VarChar(255)
    // shortDesc       String?   @db.VarChar(255)
    // quantity        Int   
    // sold            String?   @db.VarChar(255)
    // factory         String?   @db.VarChar(255)
    // target          String?   @db.VarChar(255)
});

export type TProductSchema = z.infer<typeof ProductSchema>;