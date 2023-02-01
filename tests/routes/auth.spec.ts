import request from 'supertest';

import { app } from '../../src/app';
import { setupDatabase } from '../../src/db';
import User from '../../src/db/models/user';

const tokenMatcher = expect.stringMatching(/^ey/);

let user: User;

beforeEach(async () => {
    await setupDatabase(true);
    user = await User.scope('full').create({
        username: 'user',
        email: `user@abc.com`,
        password: 'test1234',
    });
});

describe('POST /auth/register', () => {
    const register = () => request(app).post('/api/auth/register');

    it('successfully creates users', async () => {
        const res = await register()
            .send({ email: 'a@abc.com', username: 'a', password: 'test1234' })
            .expect(200);
        expect(res.body).toEqual({ token: tokenMatcher });
    });

    it.each(['user', 'USER'])('rejects duplicate usernames ("%s")', async (name) => {
        const res = await register()
            .send({ username: name, email: 'otherduplicate@abc.com', password: 'test1234' })
            .expect(409);
        expect(res.body).toEqual({ error: 'Username already taken' });
    });

    it('rejects duplicate emails', async () => {
        const res = await register()
            .send({ username: 'duplicate', email: 'user@abc.com', password: 'test1234' })
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
            .send({ username: 'user@abc.com', password: 'test1234' })
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

    it.todo('rejects unknown users');

    it.todo('creates a token and sends an email');
});

describe('POST /auth/registerPush', () => {
    const registerPush = () => request(app).post('/api/auth/registerPush');

    it.todo('inserts new tokens');

    it.todo('updates the userId of existing tokens');
});

describe('POST /auth/unregisterPush', () => {
    const unregisterPush = () => request(app).post('/api/auth/unregisterPush');

    it.todo('removes tokens');
});
