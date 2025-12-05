import { Request, Response } from "express";
import { addProductToCart, getProductById, getCartByUserId, deleteProductFromCart, getProductInCart, updateCartDetailBeforeCheckout, handlerPlaceOrder, getProducts, getOrderHistory } from "services/client/item.service";

const getProductPage = async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await getProductById(+id);

    return res.render("client/product/detail.ejs", { product });
};

const postAddProductToCart = async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    if (user){
        await addProductToCart(1, +id, user as Express.User);

    }
    else{
        return res.redirect('/login');
    }
    
    // Redirect back to the product page or cart page
    return res.redirect(`/`);
};

const getCartPage = async (req: Request, res: Response) => {
    const user = req.user
    if(!user) return res.redirect('/login');

    const cart = await getCartByUserId(user.id);
    const cartDetails = cart?.cartDetails || [];
    const cartId = cart?.id || 0;

    const totalPrice = cartDetails.map(item => item.price * item.quantity)
        .reduce((a, b) => a + b, 0) || 0;

    return res.render("client/product/cart.ejs", { cart, cartDetails, totalPrice, user, cartId });

}

const postDeleteProductInCart = async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    if(user) {
        const cart = await getCartByUserId(user.id);
        if(cart) {
            await deleteProductFromCart(user.id, +id, cart.sum);
        }
    }
    else{
        return res.redirect('/login');
    }
    return res.redirect('/cart');
}



const getCheckOutPage = async (req: Request, res: Response) => {
    const user = req.user
    if(!user) return res.redirect('/login');

    const cartDetails = await getProductInCart(+user.id);

    const totalPrice = cartDetails?.map(item => +item.price * +item.quantity)
        ?.reduce((a, b) => a + b, 0) || 0;

    return res.render("client/product/checkout", { cartDetails, totalPrice });

}


const postHandleCartToCheckout = async (req: Request, res: Response) => {
    const user = req.user;
    if(!user) return res.redirect('/login');

    const currentCartDetail: {
        id: string;
        quantity: string;
    }[] = req.body?.cartDetails ?? [];

    await updateCartDetailBeforeCheckout(currentCartDetail);


    return res.redirect('/checkout');
};


const postPlaceOrder = async (req: Request, res: Response) => {
    const user = req.user;
    if(!user) return res.redirect('/login');

    const { receiverName, receiverAddress, receiverPhone, totalPrice } = req.body;

    try {
        await handlerPlaceOrder(user.id, receiverName, receiverAddress, receiverPhone, +totalPrice);
        return res.redirect("/thanks");
    }catch(error){
        console.log("check error here:", error.message);
        return res.redirect('/checkout');
    }



    return res.redirect("/thanks");
};

const getThanksPage = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) return res.redirect('/login');

    const products = await getProducts(1, 8);
    return res.render("client/product/thanks.ejs", { products });
};


const getOrderHistoryPage = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) return res.redirect('/login');

    const orders = await getOrderHistory(user.id);

    return res.render("client/product/order.history.ejs", { orders });
};


const postAddToCartFromDetailPage = async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    const { quantity } = req.body;

    if (!user){ return res.redirect('/login'); }

    await addProductToCart(+quantity, +id, user as Express.User);

    return res.redirect(`/product/${id}`);
};





export { 
    getProductPage, postAddProductToCart, getCartPage, 
    postDeleteProductInCart, getCheckOutPage, postHandleCartToCheckout,
    postPlaceOrder, getThanksPage, getOrderHistoryPage, postAddToCartFromDetailPage };