import { Handler } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { callbackify } from 'util';

import config from '../config';
import { User } from '../db/models/user';

// JWT stuff
// ==========

interface JwtData {
    userId: string;
}

export function signToken(data: JwtData): string {
    return jwt.sign(data, config.JWT_SECRET, {
        algorithm: 'HS256',
    });
}

// register passport strategy
// ==========

passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.JWT_SECRET,
            algorithms: ['HS256'],
        },
        callbackify(async (payload: JwtData) => {
            // NOTE: this assumes we always sign proper objects,
            // it doesn't check whether `userId` exists at all (which is fine)
            const user = await User.findByPk(payload.userId);
            if (!user) {
                throw new Error('Unknown user ID!');
            }
            return user;
        })
    )
);

// define some middlewares
// ==========

// Example usage:
// router.get("/secret", requireAuth, (req: Request, res: Response) => {
//     // successfully authenticated here
// })

// need cast here since `authenticate` returns `any` for unknown reasons
// https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/58704
export const requireAuth = passport.authenticate('jwt', { session: false }) as Handler;

// // not used yet, useful if we ever have routes where auth is optional
// // see https://github.com/mikenicholson/passport-jwt/issues/110#issuecomment-724797721
// export const optionalAuth = passport.authenticate(['jwt', 'anonymous'], {session: false}) as Handler;
