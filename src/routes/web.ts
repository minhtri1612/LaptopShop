import express, { Express } from 'express';
import { getHomePage, getUserPage, postUserPage, postDeleteUser, getViewUser, postUpdateUser, getProductFilterPage } from '../controllers/user.controller';
import { getDashboardPage } from 'controllers/admin/dashboard.controller';
import { getAdminUserPage } from 'controllers/admin/dashboard.controller';
import { getAdminProductPage } from 'controllers/admin/dashboard.controller';
import { getAdminOrderPage, getAdminOrderDetailPage } from 'controllers/admin/dashboard.controller';
import { getProductPage, postAddProductToCart, getCartPage, postDeleteProductInCart, getCheckOutPage, postHandleCartToCheckout, postPlaceOrder, getThanksPage, getOrderHistoryPage, postAddToCartFromDetailPage } from 'controllers/client/product.controller';
import fileUploadMiddleware from 'src/middleware/multer';
import { postAdminCreateProduct, getAdminCreateProductPage, postDeleteProduct, getViewProduct, postUpdateProduct } from 'controllers/admin/product.controller';
import { getLoginPage, getRegisterPage, postRegister, postLogout } from 'controllers/client/auth.controller';
import passport from 'passport';
import { isAdmin, isLogin } from 'src/middleware/auth';
import { getSuccessRedirectPage } from 'controllers/client/auth.controller';


const router = express.Router();

const webRoutes = (app: Express) => {
    router.get('/', getHomePage);
    router.get('/products', getProductFilterPage);
    router.get("/success-redirect", getSuccessRedirectPage);
    router.get("/product/:id", getProductPage);
    router.get("/login", getLoginPage);
    router.post("/login", passport.authenticate('local', {
        successRedirect: '/success-redirect',
        failureRedirect: '/login',
        failureMessage: true
    }));
    router.post("/logout", postLogout);
    router.get("/register", getRegisterPage);
    router.post("/register", postRegister);

    router.post("/add-product-to-cart/:id", postAddProductToCart);
    router.get("/cart", getCartPage);
    router.post("/delete-product-in-cart/:id", postDeleteProductInCart);
    router.post("/handle-cart-to-checkout", postHandleCartToCheckout);
    router.get("/checkout", getCheckOutPage);
    router.post("/place-order", postPlaceOrder);
    router.get("/thanks", getThanksPage);
    router.get("/order-history", getOrderHistoryPage);
    router.post("/add-to-cart-from-detail-page/:id", postAddToCartFromDetailPage);

    // public create page
    router.get('/create-user', getUserPage);

    // view user by id
    router.get('/handle-view-user/:id', getViewUser);

    //admin routes
    router.get('/admin', getDashboardPage);
    router.get('/admin/user', getAdminUserPage);
    router.get('/admin/product', getAdminProductPage);
    router.get('/admin/order', getAdminOrderPage);
    router.get('/admin/create-user', getUserPage);
    router.get("/admin/order/:id", getAdminOrderDetailPage);
    router.post('/admin/handle-create-user', fileUploadMiddleware('avatar'), postUserPage);
    router.post('/admin/delete-user/:id', postDeleteUser);
    router.get('/admin/view-user/:id', getViewUser);
    router.post('/admin/update-user', fileUploadMiddleware('avatar'), postUpdateUser);
    router.get('/admin/create-product', getAdminCreateProductPage);
    router.post('/admin/create-product', fileUploadMiddleware("image","image/product"),  postAdminCreateProduct);
    
    router.post("/admin/delete-product/:id", postDeleteProduct);
    router.get("/admin/view-product/:id", getViewProduct);
    router.post("/admin/update-product", fileUploadMiddleware("image","image/product"), postUpdateProduct);


    app.use('/', isAdmin, router);
}

export default webRoutes;
