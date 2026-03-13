/**
 * Test Data Cleanup Utilities
 * 
 * Provides functions to clean up test data after tests to maintain test isolation
 * and prevent test data accumulation in the API.
 */

import { APIRequestContext } from '@playwright/test';
import { getTestPrefix } from './test-data';

const API_BASE_URL = process.env.PROMPT_HELPER_API_URL || 'http://localhost:3000';

/**
 * Tracker for created resources during tests
 */
export class ResourceTracker {
  private fragmentIds: number[] = [];
  private workflowIds: number[] = [];

  /**
   * Track a created fragment
   */
  trackFragment(id: number) {
    this.fragmentIds.push(id);
  }

  /**
   * Track a created workflow
   */
  trackWorkflow(id: number) {
    this.workflowIds.push(id);
  }

  /**
   * Get all tracked fragment IDs
   */
  getFragmentIds(): number[] {
    return [...this.fragmentIds];
  }

  /**
   * Get all tracked workflow IDs
   */
  getWorkflowIds(): number[] {
    return [...this.workflowIds];
  }

  /**
   * Clear all tracked resources
   */
  clear() {
    this.fragmentIds = [];
    this.workflowIds = [];
  }
}

/**
 * Cleanup helper for fragments
 */
export class FragmentCleanup {
  constructor(private request: APIRequestContext) {}

  /**
   * Delete a single fragment by ID
   */
  async deleteFragment(id: number): Promise<boolean> {
    try {
      const response = await this.request.delete(`${API_BASE_URL}/api/fragments/${id}`);
      return response.ok();
    } catch (error) {
      console.warn(`Failed to delete fragment ${id}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple fragments by IDs
   */
  async deleteFragments(ids: number[]): Promise<void> {
    const deletePromises = ids.map(id => this.deleteFragment(id));
    await Promise.all(deletePromises);
  }

  /**
   * Delete all fragments with test prefix
   */
  async deleteAllTestFragments(): Promise<number> {
    try {
      const response = await this.request.get(`${API_BASE_URL}/api/fragments`);
      if (!response.ok()) return 0;

      const fragments = await response.json();
      const testPrefix = getTestPrefix();
      const testFragments = fragments.filter((f: any) => 
        f.text?.startsWith(testPrefix) || f.category?.startsWith(testPrefix)
      );

      await this.deleteFragments(testFragments.map((f: any) => f.id));
      return testFragments.length;
    } catch (error) {
      console.warn('Failed to delete test fragments:', error);
      return 0;
    }
  }
}

/**
 * Cleanup helper for workflows
 */
export class WorkflowCleanup {
  constructor(private request: APIRequestContext) {}

  /**
   * Delete a single workflow by ID
   */
  async deleteWorkflow(id: number): Promise<boolean> {
    try {
      const response = await this.request.delete(`${API_BASE_URL}/api/workflows/${id}`);
      return response.ok();
    } catch (error) {
      console.warn(`Failed to delete workflow ${id}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple workflows by IDs
   */
  async deleteWorkflows(ids: number[]): Promise<void> {
    const deletePromises = ids.map(id => this.deleteWorkflow(id));
    await Promise.all(deletePromises);
  }

  /**
   * Delete all workflows with test prefix
   */
  async deleteAllTestWorkflows(): Promise<number> {
    try {
      const response = await this.request.get(`${API_BASE_URL}/api/workflows`);
      if (!response.ok()) return 0;

      const workflows = await response.json();
      const testPrefix = getTestPrefix();
      const testWorkflows = workflows.filter((w: any) => 
        w.name?.startsWith(testPrefix) || w.category?.startsWith(testPrefix)
      );

      await this.deleteWorkflows(testWorkflows.map((w: any) => w.id));
      return testWorkflows.length;
    } catch (error) {
      console.warn('Failed to delete test workflows:', error);
      return 0;
    }
  }
}

/**
 * Main cleanup helper - aggregates all cleanup operations
 */
export class CleanupHelper {
  public fragments: FragmentCleanup;
  public workflows: WorkflowCleanup;
  public tracker: ResourceTracker;

  constructor(request: APIRequestContext) {
    this.fragments = new FragmentCleanup(request);
    this.workflows = new WorkflowCleanup(request);
    this.tracker = new ResourceTracker();
  }

  /**
   * Clean up all tracked resources
   */
  async cleanupTracked(): Promise<void> {
    const fragmentIds = this.tracker.getFragmentIds();
    const workflowIds = this.tracker.getWorkflowIds();

    await this.fragments.deleteFragments(fragmentIds);
    await this.workflows.deleteWorkflows(workflowIds);
    
    this.tracker.clear();
  }

  /**
   * Clean up all test data (fragments and workflows with test prefix)
   */
  async cleanupAllTestData(): Promise<{ fragments: number; workflows: number }> {
    const fragmentCount = await this.fragments.deleteAllTestFragments();
    const workflowCount = await this.workflows.deleteAllTestWorkflows();
    
    return { fragments: fragmentCount, workflows: workflowCount };
  }
}

/**
 * Helper function to create cleanup helper
 */
export function createCleanupHelper(request: APIRequestContext): CleanupHelper {
  return new CleanupHelper(request);
}
