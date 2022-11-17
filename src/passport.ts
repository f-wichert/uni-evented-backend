import { Handler } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { callbackify } from 'util';

import config from './config';
import { User } from './db/models/user';

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

// merge custom user type into express request type declaration
// (this globally changes the type of `req.user` to our `User` db model)
// see https://github.com/DefinitelyTyped/DefinitelyTyped/commit/91c229dbdb653dbf0da91992f525905893cbeb91#r34812715
// ==========

type UserModel = User;
declare global {
    namespace Express {
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface User extends UserModel {}
    }
}

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
// (see `/info` in `routes/auth.ts` for a usage example)
// ==========

export const requireAuth = passport.authenticate('jwt', { session: false }) as Handler;

// // not used yet, useful if we ever have routes where auth is optional
// // see https://github.com/mikenicholson/passport-jwt/issues/110#issuecomment-724797721
// export const optionalAuth = passport.authenticate(['jwt', 'anonymous'], {session: false}) as Handler;
