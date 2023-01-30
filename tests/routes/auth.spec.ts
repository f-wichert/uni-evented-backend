import request from 'supertest';

import { app } from '../../src/app';
import { setupDatabase } from '../../src/db';
import User from '../../src/db/models/user';

const createUser = async (name: string) =>
    User.create({ email: `${name}@abc.com`, username: name, password: 'test1234' });

beforeEach(async () => {
    await setupDatabase(true);
});

describe('POST /register', () => {
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

    it('should not allow duplicate emails', async () => {
        await createUser('duplicate2');
        const res = await register()
            .send({ username: 'otherduplicate', email: 'duplicate2@abc.com', password: 'test1234' })
            .expect(409);
        expect(res.body).toEqual({ error: 'User with given email already exists' });
    });
});
