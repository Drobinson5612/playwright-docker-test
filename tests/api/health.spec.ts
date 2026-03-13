/**
 * Health Check API Tests
 * 
 * Tests for the GET /health endpoint to verify API availability and status.
 */

import { test, expect } from '@playwright/test';
import { createApiClient, HealthAssertions, assertSuccess } from './helpers';

test.describe('Health Check API', () => {
  
  test('GET /health - should return healthy status', async ({ request }) => {
    const client = createApiClient(request);
    const response = await client.health.check();
    
    // Verify successful response
    await assertSuccess(response, 200);
    
    // Parse and validate response body
    const health = await response.json();
    HealthAssertions.assertValidStructure(health);
    
    // Verify status is healthy
    expect(health.status).toBe('healthy');
  });

  test('GET /health - should return database information', async ({ request }) => {
    const client = createApiClient(request);
    const response = await client.health.check();
    
    await assertSuccess(response, 200);
    const health = await response.json();
    
    // Verify database field exists and is a string
    expect(health.database).toBeDefined();
    expect(typeof health.database).toBe('string');
    expect(health.database.length).toBeGreaterThan(0);
    
    console.log('Database path:', health.database);
  });

  test('GET /health - should return autosave configuration', async ({ request }) => {
    const client = createApiClient(request);
    const response = await client.health.check();
    
    await assertSuccess(response, 200);
    const health = await response.json();
    
    // Verify autosave configuration
    expect(health.autosave).toBeDefined();
    expect(health.autosave.enabled).toBeDefined();
    expect(typeof health.autosave.enabled).toBe('boolean');
    expect(health.autosave.interval).toBeDefined();
    expect(typeof health.autosave.interval).toBe('string');
    expect(health.autosave.retention_days).toBeDefined();
    expect(typeof health.autosave.retention_days).toBe('number');
    
    console.log('AutoSave config:', {
      enabled: health.autosave.enabled,
      interval: health.autosave.interval,
      retention_days: health.autosave.retention_days
    });
  });

  test('GET /health - should return latest autosave filename if available', async ({ request }) => {
    const client = createApiClient(request);
    const response = await client.health.check();
    
    await assertSuccess(response, 200);
    const health = await response.json();
    
    // Latest autosave may or may not exist
    if (health.autosave.latest) {
      expect(typeof health.autosave.latest).toBe('string');
      expect(health.autosave.latest).toMatch(/^autosave-.*\.json$/);
      console.log('Latest autosave:', health.autosave.latest);
    } else {
      console.log('No autosave files found');
    }
  });

  test('GET /health - should have JSON content type', async ({ request }) => {
    const client = createApiClient(request);
    const response = await client.health.check();
    
    await assertSuccess(response, 200);
    
    // Verify content type
    const contentType = response.headers()['content-type'];
    expect(contentType).toBeDefined();
    expect(contentType).toContain('application/json');
  });

  test('GET /health - should respond quickly', async ({ request }) => {
    const client = createApiClient(request);
    
    const startTime = Date.now();
    const response = await client.health.check();
    const endTime = Date.now();
    
    await assertSuccess(response, 200);
    
    const responseTime = endTime - startTime;
    console.log(`Health check response time: ${responseTime}ms`);
    
    // Health check should respond within 5 seconds
    expect(responseTime).toBeLessThan(5000);
  });

  test('GET /health - should be accessible without authentication', async ({ request }) => {
    // This test verifies that health check doesn't require auth
    // Using direct request without any auth headers
    const response = await request.get(`${process.env.PROMPT_HELPER_API_URL || 'http://localhost:3000'}/health`);
    
    await assertSuccess(response, 200);
    const health = await response.json();
    expect(health.status).toBe('healthy');
  });

  test('GET /health - should return consistent structure on multiple calls', async ({ request }) => {
    const client = createApiClient(request);
    
    // Make multiple calls
    const response1 = await client.health.check();
    const response2 = await client.health.check();
    const response3 = await client.health.check();
    
    // All should succeed
    await assertSuccess(response1, 200);
    await assertSuccess(response2, 200);
    await assertSuccess(response3, 200);
    
    // Parse responses
    const health1 = await response1.json();
    const health2 = await response2.json();
    const health3 = await response3.json();
    
    // All should have same structure
    HealthAssertions.assertValidStructure(health1);
    HealthAssertions.assertValidStructure(health2);
    HealthAssertions.assertValidStructure(health3);
    
    // Status should always be healthy
    expect(health1.status).toBe('healthy');
    expect(health2.status).toBe('healthy');
    expect(health3.status).toBe('healthy');
    
    // Database path should be consistent
    expect(health1.database).toBe(health2.database);
    expect(health2.database).toBe(health3.database);
  });

});
