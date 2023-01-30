import request from 'supertest';

import { app } from '../src/app';
import { setupDatabase } from '../src/db';

beforeAll(async () => {
    await setupDatabase(true);
});

describe('Basic `/` root tests', () => {
    it("responds with 'ok'", async () => {
        await request(app).get('/').expect(200, { status: 'ok' });
    });
});
