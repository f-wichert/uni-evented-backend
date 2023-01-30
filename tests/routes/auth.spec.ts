import request from 'supertest';

import { app } from '../../src/app';
import { setupDatabase } from '../../src/db';
import User from '../../src/db/models/user';

const createUser = async (name: string) =>
    User.create({ email: `${name}@abc.com`, username: name, password: 'test1234' });

beforeEach(async () => {
    await setupDatabase(true);
});

describe('POST /auth/register', () => {
    const register = () => request(app).post('/api/auth/register');

    it('successfully creates users', async () => {
        const res = await register()
            .send({ email: 'a@abc.com', username: 'a', password: 'test1234' })
            .expect(200);
        expect(res.body).toEqual({ token: expect.stringMatching(/^ey/) });
    });

    it.each(['duplicate1', 'DUPLICATE1'])('rejects duplicate usernames ("%s")', async (name) => {
        await createUser('duplicate1');
        const res = await register()
            .send({ username: name, email: 'otherduplicate@abc.com', password: 'test1234' })
            .expect(409);
        expect(res.body).toEqual({ error: 'Username already taken' });
    });

    it('rejects duplicate emails', async () => {
        await createUser('duplicate2');
        const res = await register()
            .send({ username: 'otherduplicate', email: 'duplicate2@abc.com', password: 'test1234' })
            .expect(409);
        expect(res.body).toEqual({ error: 'User with given email already exists' });
    });
});

describe('POST /auth/login', () => {
    const login = () => request(app).post('/api/auth/login');

    it.todo('allows login by username (case-insensitive)');

    it.todo('allows login by email');

    it.todo('supports password reset tokens');

    it.todo('rejects unknown users');

    it.todo('rejects invalid passwords');
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
