import { prisma } from 'config/client';
import passport from 'passport';
import { Strategy as LocalStrategy} from 'passport-local';
import bcrypt from 'bcrypt';
import db from 'config/database';
import { getUserById } from 'services/user.service';
import { getUserSumCart, getUserWithRoleById } from 'services/client/auth.service';

const configPassportLocal = () => {

    passport.use(new LocalStrategy({
        passReqToCallback: true
    },async function verify(req, username, password, callback) {
        const session = (req as any).session;
        if (session?.messages?.length){
            session.messages = [];
        }
    const user = await prisma.user.findUnique({
        where: { username: username }
        
    });
    if (!user) {
        console.log('User not found:', username);
        return callback(null, false, { message: 'Username/password invalid' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        console.log('Invalid password for user:', username);
        return callback(null, false, { message: 'Username/password invalid' });
    }

    console.log('User authenticated successfully:', username);
    return callback(null, user as any);

}));
    // store only the user id in the session
    passport.serializeUser(function(user: any, callback) {
        callback(null, { id: user.id, username: user.username  });
    });

    // deserialize receives the numeric id and loads the user
    passport.deserializeUser(async function(user: any, callback: any) {

        const {id, username} = user;

        // query to database
        const userInDB: any = await getUserWithRoleById(id);
        const sumCart = await getUserSumCart(id);
        console.log("check sum cart:", sumCart);


        return callback(null, {...userInDB, sumCart: sumCart} );


    });

}
export default configPassportLocal;

//