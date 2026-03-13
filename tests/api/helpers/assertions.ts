/**
 * Custom Assertion Helpers
 * 
 * Provides reusable assertion functions for API responses, schemas, and error handling.
 */

import { expect, APIResponse } from '@playwright/test';

/**
 * Assert that response is successful (2xx status code)
 */
export async function assertSuccess(response: APIResponse, expectedStatus: number = 200) {
  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(expectedStatus);
}

/**
 * Assert that response is an error (4xx or 5xx status code)
 */
export async function assertError(response: APIResponse, expectedStatus: number) {
  expect(response.ok()).toBeFalsy();
  expect(response.status()).toBe(expectedStatus);
}

/**
 * Assert that response contains error message
 */
export async function assertErrorMessage(response: APIResponse, expectedStatus: number) {
  await assertError(response, expectedStatus);
  const body = await response.json();
  expect(body.error).toBeDefined();
  expect(typeof body.error).toBe('string');
  expect(body.error.length).toBeGreaterThan(0);
}

/**
 * Fragment Schema Assertions
 */
export class FragmentAssertions {
  /**
   * Assert fragment has valid structure
   */
  static assertValidStructure(fragment: any) {
    expect(fragment).toBeDefined();
    expect(fragment.id).toBeDefined();
    expect(typeof fragment.id).toBe('number');
    expect(fragment.text).toBeDefined();
    expect(typeof fragment.text).toBe('string');
    expect(fragment.text.length).toBeGreaterThanOrEqual(10);
    expect(fragment.created_at).toBeDefined();
    expect(fragment.updated_at).toBeDefined();
    // category can be null or string
    if (fragment.category !== null) {
      expect(typeof fragment.category).toBe('string');
    }
  }

  /**
   * Assert fragment matches expected values
   */
  static assertMatches(fragment: any, expected: { text: string; category?: string | null }) {
    expect(fragment.text).toBe(expected.text);
    if (expected.category !== undefined) {
      expect(fragment.category).toBe(expected.category);
    }
  }

  /**
   * Assert fragment array is valid
   */
  static assertValidArray(fragments: any[]) {
    expect(Array.isArray(fragments)).toBe(true);
    fragments.forEach(fragment => this.assertValidStructure(fragment));
  }

  /**
   * Assert categories array is valid
   */
  static assertValidCategories(categories: any[]) {
    expect(Array.isArray(categories)).toBe(true);
    categories.forEach(category => {
      expect(typeof category).toBe('string');
      expect(category.length).toBeGreaterThan(0);
    });
  }
}

/**
 * Workflow Schema Assertions
 */
export class WorkflowAssertions {
  /**
   * Assert workflow has valid structure (summary - without steps)
   */
  static assertValidSummaryStructure(workflow: any) {
    expect(workflow).toBeDefined();
    expect(workflow.id).toBeDefined();
    expect(typeof workflow.id).toBe('number');
    expect(workflow.name).toBeDefined();
    expect(typeof workflow.name).toBe('string');
    expect(workflow.name.length).toBeGreaterThan(0);
    expect(workflow.created_at).toBeDefined();
    expect(workflow.updated_at).toBeDefined();
    expect(workflow.step_count).toBeDefined();
    expect(typeof workflow.step_count).toBe('number');
    expect(workflow.step_count).toBeGreaterThanOrEqual(1);
    // description and category can be null or string
    if (workflow.description !== null) {
      expect(typeof workflow.description).toBe('string');
    }
    if (workflow.category !== null) {
      expect(typeof workflow.category).toBe('string');
    }
  }

  /**
   * Assert workflow has valid structure (full - with steps)
   */
  static assertValidFullStructure(workflow: any) {
    expect(workflow).toBeDefined();
    expect(workflow.id).toBeDefined();
    expect(typeof workflow.id).toBe('number');
    expect(workflow.name).toBeDefined();
    expect(typeof workflow.name).toBe('string');
    expect(workflow.created_at).toBeDefined();
    expect(workflow.updated_at).toBeDefined();
    expect(workflow.steps).toBeDefined();
    expect(Array.isArray(workflow.steps)).toBe(true);
    expect(workflow.steps.length).toBeGreaterThanOrEqual(1);
    
    // Validate each step
    workflow.steps.forEach((step: any, index: number) => {
      this.assertValidStepStructure(step);
      expect(step.step_order).toBe(index + 1); // Steps should be ordered starting from 1
    });
  }

  /**
   * Assert workflow step has valid structure
   */
  static assertValidStepStructure(step: any) {
    expect(step).toBeDefined();
    expect(step.id).toBeDefined();
    expect(typeof step.id).toBe('number');
    expect(step.workflow_id).toBeDefined();
    expect(typeof step.workflow_id).toBe('number');
    expect(step.step_order).toBeDefined();
    expect(typeof step.step_order).toBe('number');
    expect(step.text).toBeDefined();
    expect(typeof step.text).toBe('string');
    expect(step.text.length).toBeGreaterThanOrEqual(10);
    expect(step.created_at).toBeDefined();
    // category can be null or string
    if (step.category !== null) {
      expect(typeof step.category).toBe('string');
    }
  }

  /**
   * Assert workflow matches expected values
   */
  static assertMatches(
    workflow: any,
    expected: {
      name: string;
      description?: string | null;
      category?: string | null;
      stepCount?: number;
    }
  ) {
    expect(workflow.name).toBe(expected.name);
    if (expected.description !== undefined) {
      expect(workflow.description).toBe(expected.description);
    }
    if (expected.category !== undefined) {
      expect(workflow.category).toBe(expected.category);
    }
    if (expected.stepCount !== undefined) {
      expect(workflow.steps.length).toBe(expected.stepCount);
    }
  }

  /**
   * Assert workflow array is valid
   */
  static assertValidArray(workflows: any[]) {
    expect(Array.isArray(workflows)).toBe(true);
    workflows.forEach(workflow => this.assertValidSummaryStructure(workflow));
  }

  /**
   * Assert categories array is valid
   */
  static assertValidCategories(categories: any[]) {
    expect(Array.isArray(categories)).toBe(true);
    categories.forEach(category => {
      expect(typeof category).toBe('string');
      expect(category.length).toBeGreaterThan(0);
    });
  }
}

/**
 * Export/Import Schema Assertions
 */
export class ExportImportAssertions {
  /**
   * Assert export data has valid structure
   */
  static assertValidExportStructure(exportData: any) {
    expect(exportData).toBeDefined();
    expect(exportData.version).toBeDefined();
    expect(typeof exportData.version).toBe('string');
    expect(exportData.exported_at).toBeDefined();
    expect(exportData.fragments).toBeDefined();
    expect(Array.isArray(exportData.fragments)).toBe(true);
    
    if (exportData.version === '2.0') {
      expect(exportData.workflows).toBeDefined();
      expect(Array.isArray(exportData.workflows)).toBe(true);
    }
  }

  /**
   * Assert import response has valid structure
   */
  static assertValidImportResponse(importResponse: any) {
    expect(importResponse).toBeDefined();
    expect(importResponse.message).toBeDefined();
    expect(typeof importResponse.message).toBe('string');
    expect(importResponse.imported_fragments).toBeDefined();
    expect(typeof importResponse.imported_fragments).toBe('number');
    expect(importResponse.imported_workflows).toBeDefined();
    expect(typeof importResponse.imported_workflows).toBe('number');
    expect(importResponse.errors).toBeDefined();
    expect(Array.isArray(importResponse.errors)).toBe(true);
  }
}

/**
 * AutoSave Schema Assertions
 */
export class AutoSaveAssertions {
  /**
   * Assert autosave list response has valid structure
   */
  static assertValidListStructure(listResponse: any) {
    expect(listResponse).toBeDefined();
    expect(listResponse.autosaves).toBeDefined();
    expect(Array.isArray(listResponse.autosaves)).toBe(true);
    expect(listResponse.count).toBeDefined();
    expect(typeof listResponse.count).toBe('number');
    expect(listResponse.retention_days).toBeDefined();
    expect(typeof listResponse.retention_days).toBe('number');
    
    listResponse.autosaves.forEach((autosave: any) => {
      this.assertValidAutosaveInfo(autosave);
    });
  }

  /**
   * Assert autosave info has valid structure
   */
  static assertValidAutosaveInfo(autosave: any) {
    expect(autosave).toBeDefined();
    expect(autosave.filename).toBeDefined();
    expect(typeof autosave.filename).toBe('string');
    expect(autosave.filename).toMatch(/^autosave-.*\.json$/);
    expect(autosave.size).toBeDefined();
    expect(typeof autosave.size).toBe('number');
    expect(autosave.modified).toBeDefined();
    expect(typeof autosave.modified).toBe('number');
    expect(autosave.age_days).toBeDefined();
    expect(typeof autosave.age_days).toBe('number');
  }

  /**
   * Assert autosave latest response has valid structure
   */
  static assertValidLatestStructure(latestResponse: any) {
    expect(latestResponse).toBeDefined();
    expect(latestResponse.filename).toBeDefined();
    expect(latestResponse.size).toBeDefined();
    expect(latestResponse.modified).toBeDefined();
    expect(latestResponse.path).toBeDefined();
    expect(typeof latestResponse.path).toBe('string');
  }
}

/**
 * Health Check Schema Assertions
 */
export class HealthAssertions {
  /**
   * Assert health check response has valid structure
   */
  static assertValidStructure(health: any) {
    expect(health).toBeDefined();
    expect(health.status).toBeDefined();
    expect(health.status).toBe('healthy');
    expect(health.database).toBeDefined();
    expect(typeof health.database).toBe('string');
    expect(health.autosave).toBeDefined();
    expect(health.autosave.enabled).toBeDefined();
    expect(typeof health.autosave.enabled).toBe('boolean');
    expect(health.autosave.interval).toBeDefined();
    expect(health.autosave.retention_days).toBeDefined();
  }
}

/**
 * HTTP Header Assertions
 */
export class HeaderAssertions {
  /**
   * Assert response has JSON content type
   */
  static assertJsonContentType(response: APIResponse) {
    const contentType = response.headers()['content-type'];
    expect(contentType).toBeDefined();
    expect(contentType).toContain('application/json');
  }

  /**
   * Assert response has attachment disposition (for downloads)
   */
  static assertAttachmentDisposition(response: APIResponse) {
    const disposition = response.headers()['content-disposition'];
    expect(disposition).toBeDefined();
    expect(disposition).toContain('attachment');
  }
}
