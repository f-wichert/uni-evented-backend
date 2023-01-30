import request from 'supertest';

import { app } from '../src/app';
import { setupDatabase } from '../src/db';
import User from '../src/db/models/user';

const defaultParams = { email: 'a@abc.com', username: 'testuser', password: 'test1234' };
const createUser = async (name: string) =>
    User.create({ ...defaultParams, email: `${name}@abc.com`, username: name });

beforeEach(async () => {
    await setupDatabase(true);
});

describe('POST /register', () => {
    const register = () => request(app).post('/api/auth/register');

    it('successfully creates users', async () => {
        const res = await register().send(defaultParams).expect(200);
        expect(res.body).toEqual({ token: expect.stringMatching(/^ey/) });
    });

    it('should not allow duplicate usernames', async () => {
        await createUser('duplicate1');
        const res = await register()
            .send({ ...defaultParams, username: 'duplicate1' })
            .expect(409);
        expect(res.body).toEqual({ error: 'Username already taken' });
    });

    it('should not allow duplicate emails', async () => {
        await createUser('duplicate2');
        const res = await register()
            .send({ ...defaultParams, email: 'duplicate2@abc.com' })
            .expect(409);
        expect(res.body).toEqual({ error: 'User with given email already exists' });
    });
});
