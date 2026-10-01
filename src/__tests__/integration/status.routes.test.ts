import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('status routes', () => {
    it('GET /status/404 renders the 404 view', async () => {
        const res = await request(app).get('/status/404');

        expect(res.status).toBe(404);
        expect(res.type).toBe('text/html');
        expect(res.text).not.toBe('status/404.ejs');
    });

    it('GET /status/403 renders the 403 view', async () => {
        const res = await request(app).get('/status/403');

        expect(res.status).toBe(403);
        expect(res.type).toBe('text/html');
    });

    it('an unknown path renders the 404 view', async () => {
        const res = await request(app).get('/duong-dan-khong-ton-tai');

        expect(res.status).toBe(404);
        expect(res.type).toBe('text/html');
        expect(res.text).not.toBe('status/404.ejs');
    });
});
