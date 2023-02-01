import request from 'supertest';

import { app } from '../src/app';

describe('GET /', () => {
    it("responds with 'ok'", async () => {
        await request(app).get('/').expect(200, { status: 'ok' });
    });
});
