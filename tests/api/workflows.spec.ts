/**
 * Workflow Management API Tests
 * 
 * Tests for Workflow CRUD operations with steps:
 * - GET /api/workflows - List all workflows
 * - GET /api/workflows/:id - Get workflow with steps
 * - POST /api/workflows - Create workflow with steps
 * - PUT /api/workflows/:id - Update workflow and steps
 * - DELETE /api/workflows/:id - Delete workflow (cascade)
 * - GET /api/workflows/categories - List categories
 */

import { test, expect } from '@playwright/test';
import {
  createApiClient,
  createCleanupHelper,
  WorkflowTestData,
  WorkflowAssertions,
  assertSuccess,
  assertErrorMessage,
} from './helpers';

test.describe('Workflow Management API', () => {
  
  let cleanup: ReturnType<typeof createCleanupHelper>;

  test.beforeEach(async ({ request }) => {
    cleanup = createCleanupHelper(request);
  });

  test.afterEach(async () => {
    await cleanup.cleanupTracked();
  });

  test.describe('GET /api/workflows', () => {
    
    test('should return all workflows with step counts', async ({ request }) => {
      const client = createApiClient(request);
      const response = await client.workflows.getAll();
      
      await assertSuccess(response, 200);
      
      const workflows = await response.json();
      expect(Array.isArray(workflows)).toBe(true);
      
      if (workflows.length > 0) {
        WorkflowAssertions.assertValidArray(workflows);
        
        // Verify step_count is present (summary format)
        workflows.forEach((workflow: any) => {
          expect(workflow.step_count).toBeDefined();
          expect(typeof workflow.step_count).toBe('number');
          expect(workflow.step_count).toBeGreaterThanOrEqual(1);
        });
      }
    });

    test('should filter workflows by category', async ({ request }) => {
      const client = createApiClient(request);
      const category = WorkflowTestData.category('filter_test');
      
      // Create workflows with specific category
      const workflow1Response = await client.workflows.create(
        WorkflowTestData.name('wf1'),
        WorkflowTestData.steps(2),
        undefined,
        category
      );
      const workflow1 = await workflow1Response.json();
      cleanup.tracker.trackWorkflow(workflow1.id);
      
      const workflow2Response = await client.workflows.create(
        WorkflowTestData.name('wf2'),
        WorkflowTestData.steps(3),
        undefined,
        category
      );
      const workflow2 = await workflow2Response.json();
      cleanup.tracker.trackWorkflow(workflow2.id);
      
      // Create workflow with different category
      const workflow3Response = await client.workflows.create(
        WorkflowTestData.name('other'),
        WorkflowTestData.steps(2),
        undefined,
        WorkflowTestData.category('other')
      );
      const workflow3 = await workflow3Response.json();
      cleanup.tracker.trackWorkflow(workflow3.id);
      
      // Filter by category
      const response = await client.workflows.getAll(category);
      await assertSuccess(response, 200);
      
      const filtered = await response.json();
      expect(filtered.length).toBeGreaterThanOrEqual(2);
      
      filtered.forEach((wf: any) => {
        expect(wf.category).toBe(category);
      });
    });

    test('should return empty array when no workflows match category', async ({ request }) => {
      const client = createApiClient(request);
      const nonExistentCategory = WorkflowTestData.category('nonexistent_' + Date.now());
      
      const response = await client.workflows.getAll(nonExistentCategory);
      await assertSuccess(response, 200);
      
      const workflows = await response.json();
      expect(Array.isArray(workflows)).toBe(true);
      expect(workflows.length).toBe(0);
    });

  });

  test.describe('GET /api/workflows/:id', () => {
    
    test('should return workflow with all steps', async ({ request }) => {
      const client = createApiClient(request);
      
      // Create workflow
      const createResponse = await client.workflows.create(
        WorkflowTestData.name(),
        WorkflowTestData.steps(3)
      );
      const created = await createResponse.json();
      cleanup.tracker.trackWorkflow(created.id);
      
      // Get workflow by ID
      const response = await client.workflows.getById(created.id);
      await assertSuccess(response, 200);
      
      const workflow = await response.json();
      WorkflowAssertions.assertValidFullStructure(workflow);
      expect(workflow.id).toBe(created.id);
      expect(workflow.steps.length).toBe(3);
    });

    test('should return steps in correct order', async ({ request }) => {
      const client = createApiClient(request);
      
      // Create workflow with multiple steps
      const steps = WorkflowTestData.steps(5);
      const createResponse = await client.workflows.create(
        WorkflowTestData.name(),
        steps
      );
      const created = await createResponse.json();
      cleanup.tracker.trackWorkflow(created.id);
      
      // Get workflow
      const response = await client.workflows.getById(created.id);
      const workflow = await response.json();
      
      // Verify steps are ordered correctly (1, 2, 3, 4, 5)
      workflow.steps.forEach((step: any, index: number) => {
        expect(step.step_order).toBe(index + 1);
      });
    });

    test('should fail for non-existent workflow', async ({ request }) => {
      const client = createApiClient(request);
      const nonExistentId = 999999;
      
      const response = await client.workflows.getById(nonExistentId);
      await assertErrorMessage(response, 404);
    });

  });

  test.describe('POST /api/workflows', () => {
    
    test('should create workflow with steps', async ({ request }) => {
      const client = createApiClient(request);
      const name = WorkflowTestData.name();
      const description = WorkflowTestData.description();
      const category = WorkflowTestData.category();
      const steps = WorkflowTestData.steps(3);
      
      const response = await client.workflows.create(
        name,
        steps,
        description,
        category
      );
      await assertSuccess(response, 201);
      
      const workflow = await response.json();
      cleanup.tracker.trackWorkflow(workflow.id);
      
      WorkflowAssertions.assertValidFullStructure(workflow);
      WorkflowAssertions.assertMatches(workflow, {
        name,
        description,
        category,
        stepCount: 3
      });
    });

    test('should create minimal workflow (name and one step)', async ({ request }) => {
      const client = createApiClient(request);
      const minimalWorkflow = WorkflowTestData.minimalWorkflow();
      
      const response = await client.workflows.create(
        minimalWorkflow.name,
        minimalWorkflow.steps
      );
      await assertSuccess(response, 201);
      
      const workflow = await response.json();
      cleanup.tracker.trackWorkflow(workflow.id);
      
      expect(workflow.name).toBe(minimalWorkflow.name);
      expect(workflow.description).toBeNull();
      expect(workflow.category).toBeNull();
      expect(workflow.steps.length).toBe(1);
    });

    test('should create workflow with many steps', async ({ request }) => {
      const client = createApiClient(request);
      const workflowData = WorkflowTestData.workflowWithManySteps(10);
      
      const response = await client.workflows.create(
        workflowData.name,
        workflowData.steps,
        workflowData.description,
        workflowData.category
      );
      await assertSuccess(response, 201);
      
      const workflow = await response.json();
      cleanup.tracker.trackWorkflow(workflow.id);
      
      expect(workflow.steps.length).toBe(10);
      
      // Verify all steps are ordered correctly
      workflow.steps.forEach((step: any, index: number) => {
        expect(step.step_order).toBe(index + 1);
      });
    });

    test('should fail without name', async ({ request }) => {
      const client = createApiClient(request);
      
      // Try to create workflow without name (using empty string)
      const response = await client.workflows.create(
        '',
        WorkflowTestData.steps(1)
      );
      await assertErrorMessage(response, 400);
    });

    test('should fail without steps', async ({ request }) => {
      const client = createApiClient(request);
      
      // Try to create workflow without steps
      const response = await client.workflows.create(
        WorkflowTestData.name(),
        []
      );
      await assertErrorMessage(response, 400);
    });

    test('should fail with invalid step text', async ({ request }) => {
      const client = createApiClient(request);
      
      // Try to create workflow with step text too short
      const response = await client.workflows.create(
        WorkflowTestData.name(),
        [{ text: 'short' }]
      );
      await assertErrorMessage(response, 400);
    });

  });

  test.describe('PUT /api/workflows/:id', () => {
    
    test('should update workflow and replace all steps', async ({ request }) => {
      const client = createApiClient(request);
      
      // Create workflow with 3 steps
      const createResponse = await client.workflows.create(
        WorkflowTestData.name('original'),
        WorkflowTestData.steps(3),
        WorkflowTestData.description('original'),
        WorkflowTestData.category('original')
      );
      const created = await createResponse.json();
      cleanup.tracker.trackWorkflow(created.id);
      
      // Update workflow with 2 different steps
      const newName = WorkflowTestData.name('updated');
      const newDescription = WorkflowTestData.description('updated');
      const newCategory = WorkflowTestData.category('updated');
      const newSteps = WorkflowTestData.steps(2);
      
      const updateResponse = await client.workflows.update(
        created.id,
        newName,
        newSteps,
        newDescription,
        newCategory
      );
      await assertSuccess(updateResponse, 200);
      
      const updated = await updateResponse.json();
      
      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe(newName);
      expect(updated.description).toBe(newDescription);
      expect(updated.category).toBe(newCategory);
      expect(updated.steps.length).toBe(2);
      expect(updated.updated_at).not.toBe(created.updated_at);
    });

    test('should reorder steps correctly after update', async ({ request }) => {
      const client = createApiClient(request);
      
      // Create workflow
      const createResponse = await client.workflows.create(
        WorkflowTestData.name(),
        WorkflowTestData.steps(3)
      );
      const created = await createResponse.json();
      cleanup.tracker.trackWorkflow(created.id);
      
      // Update with 5 steps
      const newSteps = WorkflowTestData.steps(5);
      const updateResponse = await client.workflows.update(
        created.id,
        created.name,
        newSteps
      );
      const updated = await updateResponse.json();
      
      // Verify steps are ordered 1-5
      expect(updated.steps.length).toBe(5);
      updated.steps.forEach((step: any, index: number) => {
        expect(step.step_order).toBe(index + 1);
      });
    });

    test('should remove old steps when updating', async ({ request }) => {
      const client = createApiClient(request);
      
      // Create workflow with 5 steps
      const createResponse = await client.workflows.create(
        WorkflowTestData.name(),
        WorkflowTestData.steps(5)
      );
      const created = await createResponse.json();
      cleanup.tracker.trackWorkflow(created.id);
      const originalStepIds = created.steps.map((s: any) => s.id);
      
      // Update with only 2 steps
      const updateResponse = await client.workflows.update(
        created.id,
        created.name,
        WorkflowTestData.steps(2)
      );
      const updated = await updateResponse.json();
      
      // Verify only 2 steps exist
      expect(updated.steps.length).toBe(2);
      
      // Verify new step IDs (old steps should be gone)
      const newStepIds = updated.steps.map((s: any) => s.id);
      originalStepIds.forEach((oldId: number) => {
        expect(newStepIds).not.toContain(oldId);
      });
    });

    test('should fail updating non-existent workflow', async ({ request }) => {
      const client = createApiClient(request);
      const nonExistentId = 999999;
      
      const response = await client.workflows.update(
        nonExistentId,
        WorkflowTestData.name(),
        WorkflowTestData.steps(1)
      );
      await assertErrorMessage(response, 404);
    });

    test('should fail with invalid data', async ({ request }) => {
      const client = createApiClient(request);
      
      // Create workflow
      const createResponse = await client.workflows.create(
        WorkflowTestData.name(),
        WorkflowTestData.steps(2)
      );
      const created = await createResponse.json();
      cleanup.tracker.trackWorkflow(created.id);
      
      // Try to update with no steps
      const response = await client.workflows.update(
        created.id,
        WorkflowTestData.name(),
        []
      );
      await assertErrorMessage(response, 400);
    });

  });

  test.describe('DELETE /api/workflows/:id', () => {
    
    test('should delete workflow and cascade to steps', async ({ request }) => {
      const client = createApiClient(request);
      
      // Create workflow with steps
      const createResponse = await client.workflows.create(
        WorkflowTestData.name(),
        WorkflowTestData.steps(3)
      );
      const created = await createResponse.json();
      
      // Delete workflow
      const deleteResponse = await client.workflows.delete(created.id);
      await assertSuccess(deleteResponse, 200);
      
      const result = await deleteResponse.json();
      expect(result.message).toBeDefined();
      
      // Verify workflow is deleted
      const getResponse = await client.workflows.getById(created.id);
      expect(getResponse.status()).toBe(404);
    });

    test('should fail deleting non-existent workflow', async ({ request }) => {
      const client = createApiClient(request);
      const nonExistentId = 999999;
      
      const response = await client.workflows.delete(nonExistentId);
      await assertErrorMessage(response, 404);
    });

    test('should not affect other workflows when deleting one', async ({ request }) => {
      const client = createApiClient(request);
      
      // Create two workflows
      const create1 = await client.workflows.create(
        WorkflowTestData.name('wf1'),
        WorkflowTestData.steps(2)
      );
      const workflow1 = await create1.json();
      cleanup.tracker.trackWorkflow(workflow1.id);
      
      const create2 = await client.workflows.create(
        WorkflowTestData.name('wf2'),
        WorkflowTestData.steps(3)
      );
      const workflow2 = await create2.json();
      cleanup.tracker.trackWorkflow(workflow2.id);
      
      // Delete first workflow
      await client.workflows.delete(workflow1.id);
      
      // Verify second workflow still exists
      const getResponse = await client.workflows.getById(workflow2.id);
      await assertSuccess(getResponse, 200);
      
      const retrieved = await getResponse.json();
      expect(retrieved.id).toBe(workflow2.id);
      expect(retrieved.steps.length).toBe(3);
    });

  });

  test.describe('GET /api/workflows/categories', () => {
    
    test('should return list of unique categories', async ({ request }) => {
      const client = createApiClient(request);
      
      const response = await client.workflows.getCategories();
      await assertSuccess(response, 200);
      
      const categories = await response.json();
      WorkflowAssertions.assertValidCategories(categories);
    });

    test('should include categories from created workflows', async ({ request }) => {
      const client = createApiClient(request);
      const uniqueCategory = WorkflowTestData.category('unique_' + Date.now());
      
      // Create workflow with unique category
      const createResponse = await client.workflows.create(
        WorkflowTestData.name(),
        WorkflowTestData.steps(2),
        undefined,
        uniqueCategory
      );
      const created = await createResponse.json();
      cleanup.tracker.trackWorkflow(created.id);
      
      // Get categories
      const response = await client.workflows.getCategories();
      await assertSuccess(response, 200);
      
      const categories = await response.json();
      expect(categories).toContain(uniqueCategory);
    });

    test('should not include duplicate categories', async ({ request }) => {
      const client = createApiClient(request);
      const sharedCategory = WorkflowTestData.category('shared_' + Date.now());
      
      // Create multiple workflows with same category
      const create1 = await client.workflows.create(
        WorkflowTestData.name('wf1'),
        WorkflowTestData.steps(2),
        undefined,
        sharedCategory
      );
      const workflow1 = await create1.json();
      cleanup.tracker.trackWorkflow(workflow1.id);
      
      const create2 = await client.workflows.create(
        WorkflowTestData.name('wf2'),
        WorkflowTestData.steps(3),
        undefined,
        sharedCategory
      );
      const workflow2 = await create2.json();
      cleanup.tracker.trackWorkflow(workflow2.id);
      
      // Get categories
      const response = await client.workflows.getCategories();
      const categories = await response.json();
      
      // Count occurrences of shared category
      const count = categories.filter((cat: string) => cat === sharedCategory).length;
      expect(count).toBe(1);
    });

  });

});
