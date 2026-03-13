/**
 * Fragment Management API Tests
 * 
 * Tests for Fragment CRUD operations:
 * - GET /api/fragments - List all fragments
 * - POST /api/fragments - Create fragment
 * - PUT /api/fragments/:id - Update fragment
 * - DELETE /api/fragments/:id - Delete fragment
 * - GET /api/fragments/categories - List categories
 */

import { test, expect } from '@playwright/test';
import {
  createApiClient,
  createCleanupHelper,
  FragmentTestData,
  FragmentAssertions,
  assertSuccess,
  assertErrorMessage,
} from './helpers';

test.describe('Fragment Management API', () => {
  
  // Cleanup helper to track and remove test data
  let cleanup: ReturnType<typeof createCleanupHelper>;

  test.beforeEach(async ({ request }) => {
    cleanup = createCleanupHelper(request);
  });

  test.afterEach(async () => {
    // Clean up any test data created during the test
    await cleanup.cleanupTracked();
  });

  test.describe('GET /api/fragments', () => {
    
    test('should return all fragments', async ({ request }) => {
      const client = createApiClient(request);
      const response = await client.fragments.getAll();
      
      await assertSuccess(response, 200);
      
      const fragments = await response.json();
      expect(Array.isArray(fragments)).toBe(true);
      
      // Validate structure of each fragment
      if (fragments.length > 0) {
        FragmentAssertions.assertValidArray(fragments);
      }
    });

    test('should filter fragments by category', async ({ request }) => {
      const client = createApiClient(request);
      const category = FragmentTestData.category('filter_test');
      
      // Create fragments with specific category
      const fragment1 = await client.fragments.create(
        FragmentTestData.validText('cat1'),
        category
      );
      const created1 = await fragment1.json();
      cleanup.tracker.trackFragment(created1.id);
      
      const fragment2 = await client.fragments.create(
        FragmentTestData.validText('cat2'),
        category
      );
      const created2 = await fragment2.json();
      cleanup.tracker.trackFragment(created2.id);
      
      // Create fragment with different category
      const fragment3 = await client.fragments.create(
        FragmentTestData.validText('other'),
        FragmentTestData.category('other')
      );
      const created3 = await fragment3.json();
      cleanup.tracker.trackFragment(created3.id);
      
      // Filter by category
      const response = await client.fragments.getAll(category);
      await assertSuccess(response, 200);
      
      const filtered = await response.json();
      expect(filtered.length).toBeGreaterThanOrEqual(2);
      
      // All returned fragments should have the specified category
      filtered.forEach((frag: any) => {
        expect(frag.category).toBe(category);
      });
    });

    test('should return empty array when no fragments match category', async ({ request }) => {
      const client = createApiClient(request);
      const nonExistentCategory = FragmentTestData.category('nonexistent_' + Date.now());
      
      const response = await client.fragments.getAll(nonExistentCategory);
      await assertSuccess(response, 200);
      
      const fragments = await response.json();
      expect(Array.isArray(fragments)).toBe(true);
      expect(fragments.length).toBe(0);
    });

  });

  test.describe('POST /api/fragments', () => {
    
    test('should create a valid fragment', async ({ request }) => {
      const client = createApiClient(request);
      const text = FragmentTestData.validText();
      const category = FragmentTestData.category();
      
      const response = await client.fragments.create(text, category);
      await assertSuccess(response, 201);
      
      const fragment = await response.json();
      cleanup.tracker.trackFragment(fragment.id);
      
      FragmentAssertions.assertValidStructure(fragment);
      FragmentAssertions.assertMatches(fragment, { text, category });
    });

    test('should create fragment without category', async ({ request }) => {
      const client = createApiClient(request);
      const text = FragmentTestData.validText();
      
      const response = await client.fragments.create(text);
      await assertSuccess(response, 201);
      
      const fragment = await response.json();
      cleanup.tracker.trackFragment(fragment.id);
      
      FragmentAssertions.assertValidStructure(fragment);
      expect(fragment.text).toBe(text);
      expect(fragment.category).toBeNull();
    });

    test('should fail with text too short (< 10 chars)', async ({ request }) => {
      const client = createApiClient(request);
      const shortText = FragmentTestData.shortText();
      
      const response = await client.fragments.create(shortText);
      await assertErrorMessage(response, 400);
    });

    test('should succeed with minimum length text (10 chars)', async ({ request }) => {
      const client = createApiClient(request);
      const minText = FragmentTestData.minLengthText();
      
      const response = await client.fragments.create(minText);
      await assertSuccess(response, 201);
      
      const fragment = await response.json();
      cleanup.tracker.trackFragment(fragment.id);
      
      expect(fragment.text).toBe(minText);
      expect(fragment.text.length).toBe(10);
    });

    test('should handle long text (under 1MB limit)', async ({ request }) => {
      const client = createApiClient(request);
      const longText = FragmentTestData.longText();
      
      const response = await client.fragments.create(longText);
      await assertSuccess(response, 201);
      
      const fragment = await response.json();
      cleanup.tracker.trackFragment(fragment.id);
      
      expect(fragment.text).toBe(longText);
      expect(fragment.text.length).toBeGreaterThan(100);
    });

  });

  test.describe('PUT /api/fragments/:id', () => {
    
    test('should update existing fragment', async ({ request }) => {
      const client = createApiClient(request);
      
      // Create fragment
      const createResponse = await client.fragments.create(
        FragmentTestData.validText('original'),
        FragmentTestData.category('original')
      );
      const created = await createResponse.json();
      cleanup.tracker.trackFragment(created.id);
      
      // Update fragment
      const newText = FragmentTestData.validText('updated');
      const newCategory = FragmentTestData.category('updated');
      
      const updateResponse = await client.fragments.update(
        created.id,
        newText,
        newCategory
      );
      await assertSuccess(updateResponse, 200);
      
      const updated = await updateResponse.json();
      FragmentAssertions.assertValidStructure(updated);
      expect(updated.id).toBe(created.id);
      expect(updated.text).toBe(newText);
      expect(updated.category).toBe(newCategory);
      expect(updated.updated_at).not.toBe(created.updated_at);
    });

    test('should update only text', async ({ request }) => {
      const client = createApiClient(request);
      
      // Create fragment
      const originalCategory = FragmentTestData.category('keep');
      const createResponse = await client.fragments.create(
        FragmentTestData.validText('original'),
        originalCategory
      );
      const created = await createResponse.json();
      cleanup.tracker.trackFragment(created.id);
      
      // Update only text
      const newText = FragmentTestData.validText('new_text');
      const updateResponse = await client.fragments.update(
        created.id,
        newText,
        originalCategory
      );
      await assertSuccess(updateResponse, 200);
      
      const updated = await updateResponse.json();
      expect(updated.text).toBe(newText);
      expect(updated.category).toBe(originalCategory);
    });

    test('should fail updating non-existent fragment', async ({ request }) => {
      const client = createApiClient(request);
      const nonExistentId = 999999;
      
      const response = await client.fragments.update(
        nonExistentId,
        FragmentTestData.validText()
      );
      await assertErrorMessage(response, 404);
    });

    test('should fail with invalid text length', async ({ request }) => {
      const client = createApiClient(request);
      
      // Create fragment
      const createResponse = await client.fragments.create(
        FragmentTestData.validText()
      );
      const created = await createResponse.json();
      cleanup.tracker.trackFragment(created.id);
      
      // Try to update with short text
      const response = await client.fragments.update(
        created.id,
        FragmentTestData.shortText()
      );
      await assertErrorMessage(response, 400);
    });

  });

  test.describe('DELETE /api/fragments/:id', () => {
    
    test('should delete existing fragment', async ({ request }) => {
      const client = createApiClient(request);
      
      // Create fragment
      const createResponse = await client.fragments.create(
        FragmentTestData.validText()
      );
      const created = await createResponse.json();
      
      // Delete fragment
      const deleteResponse = await client.fragments.delete(created.id);
      await assertSuccess(deleteResponse, 200);
      
      const result = await deleteResponse.json();
      expect(result.message).toBeDefined();
      
      // Verify fragment is deleted
      const getResponse = await client.fragments.getById(created.id);
      expect(getResponse.status()).toBe(404);
    });

    test('should fail deleting non-existent fragment', async ({ request }) => {
      const client = createApiClient(request);
      const nonExistentId = 999999;
      
      const response = await client.fragments.delete(nonExistentId);
      await assertErrorMessage(response, 404);
    });

    test('should not affect other fragments when deleting one', async ({ request }) => {
      const client = createApiClient(request);
      
      // Create two fragments
      const create1 = await client.fragments.create(FragmentTestData.validText('frag1'));
      const fragment1 = await create1.json();
      cleanup.tracker.trackFragment(fragment1.id);
      
      const create2 = await client.fragments.create(FragmentTestData.validText('frag2'));
      const fragment2 = await create2.json();
      cleanup.tracker.trackFragment(fragment2.id);
      
      // Delete first fragment
      await client.fragments.delete(fragment1.id);
      
      // Verify second fragment still exists
      const getResponse = await client.fragments.getById(fragment2.id);
      await assertSuccess(getResponse, 200);
      
      const retrieved = await getResponse.json();
      expect(retrieved.id).toBe(fragment2.id);
    });

  });

  test.describe('GET /api/fragments/categories', () => {
    
    test('should return list of unique categories', async ({ request }) => {
      const client = createApiClient(request);
      
      const response = await client.fragments.getCategories();
      await assertSuccess(response, 200);
      
      const categories = await response.json();
      FragmentAssertions.assertValidCategories(categories);
    });

    test('should include categories from created fragments', async ({ request }) => {
      const client = createApiClient(request);
      const uniqueCategory = FragmentTestData.category('unique_' + Date.now());
      
      // Create fragment with unique category
      const createResponse = await client.fragments.create(
        FragmentTestData.validText(),
        uniqueCategory
      );
      const created = await createResponse.json();
      cleanup.tracker.trackFragment(created.id);
      
      // Get categories
      const response = await client.fragments.getCategories();
      await assertSuccess(response, 200);
      
      const categories = await response.json();
      expect(categories).toContain(uniqueCategory);
    });

    test('should not include duplicate categories', async ({ request }) => {
      const client = createApiClient(request);
      const sharedCategory = FragmentTestData.category('shared_' + Date.now());
      
      // Create multiple fragments with same category
      const create1 = await client.fragments.create(
        FragmentTestData.validText('1'),
        sharedCategory
      );
      const fragment1 = await create1.json();
      cleanup.tracker.trackFragment(fragment1.id);
      
      const create2 = await client.fragments.create(
        FragmentTestData.validText('2'),
        sharedCategory
      );
      const fragment2 = await create2.json();
      cleanup.tracker.trackFragment(fragment2.id);
      
      // Get categories
      const response = await client.fragments.getCategories();
      const categories = await response.json();
      
      // Count occurrences of shared category
      const count = categories.filter((cat: string) => cat === sharedCategory).length;
      expect(count).toBe(1);
    });

  });

});
