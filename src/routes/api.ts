import {
    postAddProductToCartAPI,
    getAllUsersAPI,
    getUserByIdAPI,
    createUsersAPI,
    updateUserByIdAPI,
    deleteUserByIdAPI,
    loginAPI,
    fetchAccountAPI,
} from "src/controllers/client/api.controller";
import { getProductsAPI, getProductByIdAPI } from "src/controllers/client/api/products.controller";
import {
    getCartAPI,
    addCartItemAPI,
    updateCartItemsAPI,
    deleteCartItemAPI,
} from "src/controllers/client/api/cart.controller";
import {
    getOrdersAPI,
    getOrderByIdAPI,
    placeOrderAPI,
} from "src/controllers/client/api/orders.controller";
import {
    getAdminDashboardAPI,
    getAdminProductsAPI,
    createAdminProductAPI,
    updateAdminProductAPI,
    deleteAdminProductAPI,
    getAdminOrdersAPI,
    getAdminOrderDetailAPI,
    getAdminUsersAPI,
    deleteAdminUserAPI,
} from "src/controllers/client/api/admin.controller";
import express, { Express } from "express";
import { checkValidJWT } from "src/middleware/jwt.middleware";
import { requireAuth, requireAdmin } from "src/middleware/auth";

const router = express.Router();
const auth = [checkValidJWT, requireAuth] as const;
const admin = [checkValidJWT, requireAuth, requireAdmin] as const;

const apiRoutes = (app: Express) => {
    // Public
    router.post("/login", loginAPI);
    router.post("/users", createUsersAPI); // registration
    router.get("/products", getProductsAPI);
    router.get("/products/:id", getProductByIdAPI);

    // Authenticated — account / legacy cart add
    router.get("/account", ...auth, fetchAccountAPI);
    router.post("/add-product-to-cart", ...auth, postAddProductToCartAPI);

    // Authenticated — cart
    router.get("/cart", ...auth, getCartAPI);
    router.post("/cart/items", ...auth, addCartItemAPI);
    router.put("/cart/items", ...auth, updateCartItemsAPI);
    router.delete("/cart/items/:cartDetailId", ...auth, deleteCartItemAPI);

    // Authenticated — orders
    router.get("/orders", ...auth, getOrdersAPI);
    router.get("/orders/:id", ...auth, getOrderByIdAPI);
    router.post("/orders", ...auth, placeOrderAPI);

    // Admin — users (existing + paginated list)
    router.get("/users", ...admin, getAllUsersAPI);
    router.get("/users/:id", ...admin, getUserByIdAPI);
    router.put("/users/:id", ...admin, updateUserByIdAPI);
    router.delete("/users/:id", ...admin, deleteUserByIdAPI);

    // Admin — dashboard / catalog / orders / users (paginated)
    router.get("/admin/dashboard", ...admin, getAdminDashboardAPI);
    router.get("/admin/products", ...admin, getAdminProductsAPI);
    router.post("/admin/products", ...admin, createAdminProductAPI);
    router.put("/admin/products/:id", ...admin, updateAdminProductAPI);
    router.delete("/admin/products/:id", ...admin, deleteAdminProductAPI);
    router.get("/admin/orders", ...admin, getAdminOrdersAPI);
    router.get("/admin/orders/:id", ...admin, getAdminOrderDetailAPI);
    router.get("/admin/users", ...admin, getAdminUsersAPI);
    router.delete("/admin/users/:id", ...admin, deleteAdminUserAPI);

    app.use("/api", router);
};

export default apiRoutes;
