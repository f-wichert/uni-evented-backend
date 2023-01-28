import { Handler } from 'express';
import httpError from 'http-errors';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { callbackify } from 'util';

import config from './config';
import User from './db/models/user';

/* For authentication, we're using JWTs (https://auth0.com/learn/json-web-tokens),
   which (currently) only contain the user ID (see `JwtData` below).

   Based on this ID, the full user data is fetched from the database.
   These tokens are signed and validated using `config.JWT_SECRET`.

   The basic process is as follows (assuming the route is using the `requireAuth` (see below) middleware):
   - Client sends its token
   - Server validates signature using `config.JWT_SECRET` (done by passport-jwt)
   - Server extracts `userId` field from token, fetches user from database (see `JwtStrategy` below)
   - Full `User` object is accessible as `req.user` in route handlers

   Clients initially obtain a JWT by calling the login endpoint with a username and password.
   If the inputs are valid, the server generates and signs a new JWT, and sends it back to the client.
   (see routes/auth.ts)
*/

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

export function createTokenForUser(user: User): string {
    return signToken({ userId: user.id });
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
            const user = await User.scope('full').findByPk(payload.userId);
            if (!user) {
                throw httpError.Unauthorized('Unknown user ID');
            }
            return user;
        }),
    ),
);

// define some middlewares
// (see `/info` in `routes/auth.ts` for a usage example)
// ==========

export const requireAuth = passport.authenticate('jwt', { session: false }) as Handler;

// // not used yet, useful if we ever have routes where auth is optional
// // see https://github.com/mikenicholson/passport-jwt/issues/110#issuecomment-724797721
// export const optionalAuth = passport.authenticate(['jwt', 'anonymous'], {session: false}) as Handler;
