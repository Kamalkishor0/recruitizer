import JWT from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET;

if (!secretKey) {
    throw new Error('JWT_SECRET environment variable is not defined. Set it before starting the server.');
}

export function createTokenForUser(user){
    const payload = {
        _id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName
    };
    const token = JWT.sign(payload, secretKey, {expiresIn: '24h'});
    return token;
}

export function validateToken(token){
    try{
        const payload = JWT.verify(token, secretKey);
        return payload;
    }catch(err){
        throw new Error('Invalid Token');
    }
}