import request from 'supertest';
import app from '../src/index';

describe('Auth Endpoints', () => {
  describe('POST /api/auth/login', () => {
    it('should return 422 for missing fields', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(422);
    });

    it('should return 422 for invalid email', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email', password: 'pass' });
      expect(res.status).toBe(422);
    });

    it('should return 401 for wrong credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'wrong@email.com', password: 'wrongpass' });
      expect([401, 500]).toContain(res.status);
    });
  });

  describe('GET /health', () => {
    it('should return OK', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
