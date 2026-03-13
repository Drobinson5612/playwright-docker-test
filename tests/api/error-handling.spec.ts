/**
 * Error Handling & Edge Cases Tests
 * 
 * Tests for error scenarios and edge cases across all API endpoints:
 * - General error handling (404, 400, malformed requests)
 * - Edge cases for fragments (special characters, unicode, etc.)
 * - Edge cases for workflows
 * - Performance and limits
 */

import { test, expect } from '@playwright/test';
import {
  createApiClient,
  createCleanupHelper,
  FragmentTestData,
  WorkflowTestData,
  EdgeCaseTestData,
  assertErrorMessage,
} from './helpers';

test.describe('Error Handling & Edge Cases', () => {
  
  let cleanup: ReturnType<typeof createCleanupHelper>;

  test.beforeEach(async ({ request }) => {
    cleanup = createCleanupHelper(request);
  });

  test.afterEach(async () => {
    await cleanup.cleanupTracked();
  });

  test.describe('General Error Handling', () => {
    
    test('should return 404 for unknown endpoint', async ({ request }) => {
      const response = await request.get(
        `${process.env.PROMPT_HELPER_API_URL || 'http://localhost:3000'}/api/nonexistent`
      );
      
      expect(response.status()).toBe(404);
    });

    test('should return 404 for unknown nested endpoint', async ({ request }) => {
      const response = await request.get(
        `${process.env.PROMPT_HELPER_API_URL || 'http://localhost:3000'}/api/fragments/invalid/route`
      );
      
      expect(response.status()).toBe(404);
    });

    test('should handle malformed JSON in POST request', async ({ request }) => {
      const response = await request.post(
        `${process.env.PROMPT_HELPER_API_URL || 'http://localhost:3000'}/api/fragments`,
        {
          data: 'this is not valid JSON',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      // Should return 400 for malformed JSON
      expect([400, 500]).toContain(response.status());
    });

    test('should return 400 for missing required fields in fragment', async ({ request }) => {
      const client = createApiClient(request);
      
      // Try to create fragment without text field
      const response = await request.post(
        `${process.env.PROMPT_HELPER_API_URL || 'http://localhost:3000'}/api/fragments`,
        {
          data: { category: 'test' }
        }
      );
      
      await assertErrorMessage(response, 400);
    });

    test('should return 400 for missing required fields in workflow', async ({ request }) => {
      const client = createApiClient(request);
      
      // Try to create workflow without name
      const response = await request.post(
        `${process.env.PROMPT_HELPER_API_URL || 'http://localhost:3000'}/api/workflows`,
        {
          data: { steps: [{ text: 'test step text here' }] }
        }
      );
      
      await assertErrorMessage(response, 400);
    });

    test('should have consistent error response format', async ({ request }) => {
      const client = createApiClient(request);
      
      // Trigger a 404 error
      const response = await client.fragments.getById(999999);
      expect(response.status()).toBe(404);
      
      const error = await response.json();
      expect(error.error).toBeDefined();
      expect(typeof error.error).toBe('string');
    });

  });

  test.describe('Fragment Edge Cases - Special Characters', () => {
    
    test('should handle special characters in fragment text', async ({ request }) => {
      const client = createApiClient(request);
      const specialText = EdgeCaseTestData.specialCharacters();
      
      const response = await client.fragments.create(specialText);
      expect(response.ok()).toBeTruthy();
      
      const fragment = await response.json();
      cleanup.tracker.trackFragment(fragment.id);
      
      expect(fragment.text).toBe(specialText);
    });

    test('should handle unicode characters in fragment text', async ({ request }) => {
      const client = createApiClient(request);
      const unicodeText = EdgeCaseTestData.unicodeText();
      
      const response = await client.fragments.create(unicodeText);
      expect(response.ok()).toBeTruthy();
      
      const fragment = await response.json();
      cleanup.tracker.trackFragment(fragment.id);
      
      expect(fragment.text).toBe(unicodeText);
    });

    test('should handle multiline text with tabs and newlines', async ({ request }) => {
      const client = createApiClient(request);
      const multilineText = EdgeCaseTestData.multilineText();
      
      const response = await client.fragments.create(multilineText);
      expect(response.ok()).toBeTruthy();
      
      const fragment = await response.json();
      cleanup.tracker.trackFragment(fragment.id);
      
      expect(fragment.text).toBe(multilineText);
    });

    test('should handle HTML/XML tags in fragment text', async ({ request }) => {
      const client = createApiClient(request);
      const htmlText = EdgeCaseTestData.htmlText();
      
      const response = await client.fragments.create(htmlText);
      expect(response.ok()).toBeTruthy();
      
      const fragment = await response.json();
      cleanup.tracker.trackFragment(fragment.id);
      
      // Text should be stored as-is (not parsed or sanitized)
      expect(fragment.text).toBe(htmlText);
    });

    test('should handle SQL injection attempts in fragment text', async ({ request }) => {
      const client = createApiClient(request);
      const sqlText = EdgeCaseTestData.sqlInjectionText();
      
      const response = await client.fragments.create(sqlText);
      expect(response.ok()).toBeTruthy();
      
      const fragment = await response.json();
      cleanup.tracker.trackFragment(fragment.id);
      
      // SQL should be stored as text, not executed
      expect(fragment.text).toBe(sqlText);
      
      // Verify we can still retrieve other fragments (SQL didn't break anything)
      const listResponse = await client.fragments.getAll();
      expect(listResponse.ok()).toBeTruthy();
    });

    test('should handle whitespace-only text (if meets length requirement)', async ({ request }) => {
      const client = createApiClient(request);
      const whitespaceText = EdgeCaseTestData.whitespaceText();
      
      const response = await client.fragments.create(whitespaceText);
      
      // This might be valid if it's 10+ characters, or invalid if trimmed
      if (response.ok()) {
        const fragment = await response.json();
        cleanup.tracker.trackFragment(fragment.id);
        expect(fragment.text.length).toBeGreaterThanOrEqual(10);
      } else {
        // If rejected, should be 400
        expect(response.status()).toBe(400);
      }
    });

  });

  test.describe('Fragment Edge Cases - Categories', () => {
    
    test('should handle special characters in category', async ({ request }) => {
      const client = createApiClient(request);
      const specialCategory = 'test_cat!@#$%^&*()';
      
      const response = await client.fragments.create(
        FragmentTestData.validText(),
        specialCategory
      );
      expect(response.ok()).toBeTruthy();
      
      const fragment = await response.json();
      cleanup.tracker.trackFragment(fragment.id);
      
      expect(fragment.category).toBe(specialCategory);
    });

    test('should handle very long category name', async ({ request }) => {
      const client = createApiClient(request);
      const longCategory = 'test_' + 'x'.repeat(200);
      
      const response = await client.fragments.create(
        FragmentTestData.validText(),
        longCategory
      );
      
      // Should either accept it or reject with 400
      if (response.ok()) {
        const fragment = await response.json();
        cleanup.tracker.trackFragment(fragment.id);
        expect(fragment.category).toBe(longCategory);
      } else {
        expect(response.status()).toBe(400);
      }
    });

    test('should handle empty string category', async ({ request }) => {
      const client = createApiClient(request);
      
      const response = await client.fragments.create(
        FragmentTestData.validText(),
        ''
      );
      expect(response.ok()).toBeTruthy();
      
      const fragment = await response.json();
      cleanup.tracker.trackFragment(fragment.id);
      
      // Empty string should be treated as null
      expect(fragment.category === null || fragment.category === '').toBe(true);
    });

  });

  test.describe('Workflow Edge Cases', () => {
    
    test('should handle very long workflow name', async ({ request }) => {
      const client = createApiClient(request);
      const longName = 'test_workflow_' + 'x'.repeat(200);
      
      const response = await client.workflows.create(
        longName,
        WorkflowTestData.steps(2)
      );
      
      // Should either accept it or reject with 400
      if (response.ok()) {
        const workflow = await response.json();
        cleanup.tracker.trackWorkflow(workflow.id);
        expect(workflow.name).toBe(longName);
      } else {
        expect(response.status()).toBe(400);
      }
    });

    test('should handle special characters in workflow name', async ({ request }) => {
      const client = createApiClient(request);
      const specialName = 'test_wf_!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      const response = await client.workflows.create(
        specialName,
        WorkflowTestData.steps(2)
      );
      expect(response.ok()).toBeTruthy();
      
      const workflow = await response.json();
      cleanup.tracker.trackWorkflow(workflow.id);
      
      expect(workflow.name).toBe(specialName);
    });

    test('should handle unicode in workflow name', async ({ request }) => {
      const client = createApiClient(request);
      const unicodeName = 'test_workflow_你好_مرحبا_🎉';
      
      const response = await client.workflows.create(
        unicodeName,
        WorkflowTestData.steps(2)
      );
      expect(response.ok()).toBeTruthy();
      
      const workflow = await response.json();
      cleanup.tracker.trackWorkflow(workflow.id);
      
      expect(workflow.name).toBe(unicodeName);
    });

    test('should handle special characters in step text', async ({ request }) => {
      const client = createApiClient(request);
      const specialStepText = EdgeCaseTestData.specialCharacters();
      
      const response = await client.workflows.create(
        WorkflowTestData.name(),
        [{ text: specialStepText }]
      );
      expect(response.ok()).toBeTruthy();
      
      const workflow = await response.json();
      cleanup.tracker.trackWorkflow(workflow.id);
      
      expect(workflow.steps[0].text).toBe(specialStepText);
    });

    test('should handle workflow with maximum reasonable steps', async ({ request }) => {
      const client = createApiClient(request);
      const maxSteps = 50; // Test with 50 steps
      
      const response = await client.workflows.create(
        WorkflowTestData.name('max_steps'),
        WorkflowTestData.steps(maxSteps)
      );
      
      // Should either accept it or reject with 400
      if (response.ok()) {
        const workflow = await response.json();
        cleanup.tracker.trackWorkflow(workflow.id);
        expect(workflow.steps.length).toBe(maxSteps);
        
        // Verify all steps are ordered correctly
        workflow.steps.forEach((step: any, index: number) => {
          expect(step.step_order).toBe(index + 1);
        });
      } else {
        expect(response.status()).toBe(400);
      }
    });

  });

  test.describe('Performance & Limits', () => {
    
    test('should handle retrieving large number of fragments', async ({ request }) => {
      const client = createApiClient(request);
      
      // Get all fragments (might be many)
      const startTime = Date.now();
      const response = await client.fragments.getAll();
      const endTime = Date.now();
      
      expect(response.ok()).toBeTruthy();
      
      const fragments = await response.json();
      const responseTime = endTime - startTime;
      
      console.log(`Retrieved ${fragments.length} fragments in ${responseTime}ms`);
      
      // Should respond within reasonable time (10 seconds)
      expect(responseTime).toBeLessThan(10000);
    });

    test('should handle retrieving large number of workflows', async ({ request }) => {
      const client = createApiClient(request);
      
      // Get all workflows
      const startTime = Date.now();
      const response = await client.workflows.getAll();
      const endTime = Date.now();
      
      expect(response.ok()).toBeTruthy();
      
      const workflows = await response.json();
      const responseTime = endTime - startTime;
      
      console.log(`Retrieved ${workflows.length} workflows in ${responseTime}ms`);
      
      // Should respond within reasonable time (10 seconds)
      expect(responseTime).toBeLessThan(10000);
    });

    test('should handle fragment at exactly 1MB limit', async ({ request }) => {
      const client = createApiClient(request);
      
      // Create text that's exactly 1MB (1,048,576 characters)
      const oneMBText = 'test_1mb_' + 'x'.repeat(1048576 - 9);
      
      const response = await client.fragments.create(oneMBText);
      
      // Should either accept it (at limit) or reject (over limit)
      if (response.ok()) {
        const fragment = await response.json();
        cleanup.tracker.trackFragment(fragment.id);
        expect(fragment.text.length).toBe(1048576);
      } else {
        expect(response.status()).toBe(400);
      }
    });

    test('should reject fragment over 1MB limit', async ({ request }) => {
      const client = createApiClient(request);
      const tooLongText = FragmentTestData.tooLongText();
      
      const response = await client.fragments.create(tooLongText);
      
      // Should reject with 400
      await assertErrorMessage(response, 400);
    });

  });

  test.describe('Concurrent Operations', () => {
    
    test('should handle multiple fragment creations concurrently', async ({ request }) => {
      const client = createApiClient(request);
      
      // Create 5 fragments concurrently
      const createPromises = Array.from({ length: 5 }, (_, i) =>
        client.fragments.create(FragmentTestData.validText(`concurrent_${i}`))
      );
      
      const responses = await Promise.all(createPromises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.ok()).toBeTruthy();
      });
      
      // Track all for cleanup
      const fragments = await Promise.all(responses.map(r => r.json()));
      fragments.forEach(f => cleanup.tracker.trackFragment(f.id));
      
      // All should have unique IDs
      const ids = fragments.map(f => f.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });

    test('should handle multiple workflow creations concurrently', async ({ request }) => {
      const client = createApiClient(request);
      
      // Create 3 workflows concurrently
      const createPromises = Array.from({ length: 3 }, (_, i) =>
        client.workflows.create(
          WorkflowTestData.name(`concurrent_${i}`),
          WorkflowTestData.steps(2)
        )
      );
      
      const responses = await Promise.all(createPromises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.ok()).toBeTruthy();
      });
      
      // Track all for cleanup
      const workflows = await Promise.all(responses.map(r => r.json()));
      workflows.forEach(w => cleanup.tracker.trackWorkflow(w.id));
      
      // All should have unique IDs
      const ids = workflows.map(w => w.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });

  });

});
