import request from 'supertest';

import { app } from '../../src/app';
import { setupDatabase } from '../../src/db';
import PushToken from '../../src/db/models/pushToken';
import User from '../../src/db/models/user';
import { createTokenForUser } from '../../src/passport';
import { pick } from '../../src/utils';
import * as email from '../../src/utils/email';

const tokenMatcher = expect.stringMatching(/^ey/);

const createUser = async (name: string) =>
    await User.scope('full').create({
        username: name,
        email: `${name}@abc.test`,
        password: 'test1234',
    });
const getAllTokens = async () =>
    (await PushToken.findAll()).map((t) => pick(t, ['token', 'userId']));

let user: User;
let authHeader: Record<string, string>;

beforeEach(async () => {
    await setupDatabase(true);
    user = await createUser('user');
    authHeader = { Authorization: `Bearer ${createTokenForUser(user)}` };
});

describe('POST /auth/register', () => {
    const register = () => request(app).post('/api/auth/register');

    it('successfully creates users', async () => {
        const res = await register()
            .send({ email: 'a@abc.test', username: 'a', password: 'test1234' })
            .expect(200);
        expect(res.body).toEqual({ token: tokenMatcher });
    });

    it.each(['user', 'USER'])('rejects duplicate usernames ("%s")', async (name) => {
        const res = await register()
            .send({ username: name, email: 'otherduplicate@abc.test', password: 'test1234' })
            .expect(409);
        expect(res.body).toEqual({ error: 'Username already taken' });
    });

    it('rejects duplicate emails', async () => {
        const res = await register()
            .send({ username: 'duplicate', email: 'user@abc.test', password: 'test1234' })
            .expect(409);
        expect(res.body).toEqual({ error: 'User with given email already exists' });
    });
});

describe('POST /auth/login', () => {
    const login = () => request(app).post('/api/auth/login');

    it.each(['user', 'USER'])('allows login by username, case-insensitive ("%s")', async (name) => {
        const res = await login().send({ username: name, password: 'test1234' }).expect(200);
        expect(res.body).toEqual({ token: tokenMatcher });
    });

    it('allows login by email', async () => {
        const res = await login()
            .send({ username: 'user@abc.test', password: 'test1234' })
            .expect(200);
        expect(res.body).toEqual({ token: tokenMatcher });
    });

    it('supports password reset tokens', async () => {
        await user.update({ passwordResetToken: 'cooltoken' });
        const res = await login().send({ username: 'user', password: 'cooltoken' }).expect(200);
        expect(res.body).toEqual({ token: tokenMatcher });

        await user.reload();
        expect(user.passwordResetToken).toBeNull();
    });

    it('rejects unknown users', async () => {
        const res = await login().send({ username: 'notfound', password: 'test1234' }).expect(404);
        expect(res.body).toEqual({ error: "No user named 'notfound'" });
    });

    it('rejects invalid passwords', async () => {
        const res = await login()
            .send({ username: 'user', password: 'invalidpassword' })
            .expect(401);
        expect(res.body).toEqual({ error: 'Incorrect password' });
    });
});

describe('POST /auth/reset', () => {
    const reset = () => request(app).post('/api/auth/reset');

    it('rejects unknown users', async () => {
        const res = await reset().send({ email: 'unknown@abc.test' }).expect(404);
        expect(res.body).toEqual({ error: 'User not found' });
    });

    it('creates a token and sends an email', async () => {
        const mock = jest.spyOn(email, 'sendMail').mockResolvedValue();

        await reset().send({ email: user.email }).expect(200);
        await user.reload();
        expect(user.passwordResetToken).toBeTruthy();

        expect(mock).toBeCalledTimes(1);
        expect(mock).toBeCalledWith(
            user.email,
            expect.anything(),
            expect.objectContaining({ text: expect.stringContaining(user.passwordResetToken!) }),
        );
    });
});

describe('POST /auth/registerPush', () => {
    const registerPush = () => request(app).post('/api/auth/registerPush').set(authHeader);

    it('inserts new tokens', async () => {
        await registerPush().send({ token: 'ExponentPushToken[a]' }).expect(200);
        await registerPush().send({ token: 'ExponentPushToken[b]' }).expect(200);
        expect(await getAllTokens()).toEqual([
            { userId: user.id, token: 'ExponentPushToken[a]' },
            { userId: user.id, token: 'ExponentPushToken[b]' },
        ]);
    });

    it('updates the userId of existing tokens', async () => {
        const otherUser = await createUser('other');
        await PushToken.create({ userId: otherUser.id, token: 'ExponentPushToken[a]' });

        await registerPush().send({ token: 'ExponentPushToken[a]' }).expect(200);
        expect(await getAllTokens()).toEqual([{ userId: user.id, token: 'ExponentPushToken[a]' }]);
    });
});

describe('POST /auth/unregisterPush', () => {
    const unregisterPush = () => request(app).post('/api/auth/unregisterPush');

    it('removes tokens', async () => {
        await PushToken.create({ userId: user.id, token: 'ExponentPushToken[a]' });
        await unregisterPush().send({ token: 'ExponentPushToken[a]' }).expect(200);
        expect(await getAllTokens()).toEqual([]);
    });
});
