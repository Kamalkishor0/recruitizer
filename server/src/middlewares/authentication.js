import {validateToken} from '../utils/authentication.js';

export function checkForAuthenticationCookie(cookieName){
    return (req, res, next)=>{
        const token = req.cookies[cookieName];
        if(!token){
            return next();
        }
        try{
            const userPayLoad = validateToken(token);
            req.user = userPayLoad;
        }catch(err){};
        return next();
    }
}
