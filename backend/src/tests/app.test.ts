import request from 'supertest';
import app from '@/app';

describe('Health Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('timestamp');
    });

    it('should include response time in health check', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.data).toHaveProperty('responseTime');
      expect(typeof response.body.data.responseTime).toBe('number');
      expect(response.body.data.responseTime).toBeGreaterThan(0);
    });
  });

  describe('GET /api/health/detailed', () => {
    it('should return detailed health information', async () => {
      const response = await request(app)
        .get('/api/health/detailed')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('system');
      expect(response.body.data).toHaveProperty('config');
      expect(response.body.data).toHaveProperty('apis');
      expect(response.body.data).toHaveProperty('dependencies');
    });

    it('should include system information', async () => {
      const response = await request(app)
        .get('/api/health/detailed')
        .expect(200);

      const { system } = response.body.data;
      expect(system).toHaveProperty('nodeVersion');
      expect(system).toHaveProperty('platform');
      expect(system).toHaveProperty('memory');
      expect(system).toHaveProperty('uptime');
    });
  });
});

describe('Root Endpoint', () => {
  it('should return API information', async () => {
    const response = await request(app)
      .get('/')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('message', 'HumanizeAI API Server');
    expect(response.body.data).toHaveProperty('version');
    expect(response.body.data).toHaveProperty('status', 'running');
  });
});

describe('Error Handling', () => {
  it('should return 404 for undefined routes', async () => {
    const response = await request(app)
      .get('/api/nonexistent')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    expect(response.body.error).toHaveProperty('message', 'Route not found');
  });

  it('should handle malformed JSON', async () => {
    const response = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }')
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });
});

describe('Security Headers', () => {
  it('should include security headers', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
    expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
    expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
    expect(response.headers).toHaveProperty('x-request-id');
  });

  it('should not expose server information', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.headers).not.toHaveProperty('x-powered-by');
    expect(response.headers).not.toHaveProperty('server');
  });
});