/**
 * Test Data Generators
 * 
 * Provides functions to generate test data for fragments, workflows, and other entities.
 * All test data is prefixed with 'test_' for easy identification and cleanup.
 */

const TEST_PREFIX = 'test_';

/**
 * Generate a unique timestamp-based identifier
 */
function generateUniqueId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Fragment Test Data Generators
 */
export class FragmentTestData {
  /**
   * Generate valid fragment text with minimum length requirement (10 chars)
   */
  static validText(suffix?: string): string {
    const id = suffix || generateUniqueId();
    return `${TEST_PREFIX}fragment_text_${id}`;
  }

  /**
   * Generate fragment text that's too short (< 10 chars)
   */
  static shortText(): string {
    return 'short';
  }

  /**
   * Generate fragment text that's at the minimum length (10 chars)
   */
  static minLengthText(): string {
    return '0123456789'; // exactly 10 characters
  }

  /**
   * Generate fragment text that's very long (but under 1MB limit)
   */
  static longText(): string {
    const baseText = `${TEST_PREFIX}long_fragment_`;
    return baseText + 'x'.repeat(1000 - baseText.length);
  }

  /**
   * Generate fragment text that exceeds 1MB limit
   */
  static tooLongText(): string {
    const baseText = `${TEST_PREFIX}too_long_`;
    // 1MB = 1,048,576 characters
    return baseText + 'x'.repeat(1048577 - baseText.length);
  }

  /**
   * Generate a test category name
   */
  static category(name?: string): string {
    return `${TEST_PREFIX}category_${name || generateUniqueId()}`;
  }

  /**
   * Generate a complete valid fragment object
   */
  static validFragment(options?: { text?: string; category?: string }) {
    return {
      text: options?.text || this.validText(),
      category: options?.category || this.category()
    };
  }

  /**
   * Generate multiple fragments for bulk testing
   */
  static multipleFragments(count: number, category?: string) {
    return Array.from({ length: count }, (_, i) => ({
      text: this.validText(`batch_${i}`),
      category: category || this.category()
    }));
  }
}

/**
 * Workflow Test Data Generators
 */
export class WorkflowTestData {
  /**
   * Generate a valid workflow name
   */
  static name(suffix?: string): string {
    const id = suffix || generateUniqueId();
    return `${TEST_PREFIX}workflow_${id}`;
  }

  /**
   * Generate a workflow description
   */
  static description(suffix?: string): string {
    const id = suffix || generateUniqueId();
    return `${TEST_PREFIX}workflow_description_${id}`;
  }

  /**
   * Generate a test category name
   */
  static category(name?: string): string {
    return `${TEST_PREFIX}wf_category_${name || generateUniqueId()}`;
  }

  /**
   * Generate valid workflow steps
   */
  static steps(count: number = 3): Array<{ text: string; category?: string }> {
    return Array.from({ length: count }, (_, i) => ({
      text: `${TEST_PREFIX}step_${i + 1}_${generateUniqueId()}`,
      category: i % 2 === 0 ? this.category(`step_${i}`) : undefined
    }));
  }

  /**
   * Generate a single valid step
   */
  static step(stepNumber?: number): { text: string; category?: string } {
    const num = stepNumber || 1;
    return {
      text: `${TEST_PREFIX}step_${num}_${generateUniqueId()}`,
      category: this.category(`step_${num}`)
    };
  }

  /**
   * Generate a complete valid workflow object
   */
  static validWorkflow(options?: {
    name?: string;
    description?: string;
    category?: string;
    stepCount?: number;
  }) {
    return {
      name: options?.name || this.name(),
      description: options?.description || this.description(),
      category: options?.category || this.category(),
      steps: this.steps(options?.stepCount || 3)
    };
  }

  /**
   * Generate workflow with minimum required fields
   */
  static minimalWorkflow() {
    return {
      name: this.name('minimal'),
      steps: [this.step(1)]
    };
  }

  /**
   * Generate workflow with many steps
   */
  static workflowWithManySteps(stepCount: number = 10) {
    return {
      name: this.name('many_steps'),
      description: this.description('many_steps'),
      category: this.category('many_steps'),
      steps: this.steps(stepCount)
    };
  }
}

/**
 * Import/Export Test Data Generators
 */
export class ImportExportTestData {
  /**
   * Generate v1.0 export format (fragments only)
   */
  static exportV1(fragmentCount: number = 3) {
    return {
      version: '1.0',
      exported_at: new Date().toISOString(),
      fragments: FragmentTestData.multipleFragments(fragmentCount)
    };
  }

  /**
   * Generate v2.0 export format (fragments + workflows)
   */
  static exportV2(fragmentCount: number = 3, workflowCount: number = 2) {
    return {
      version: '2.0',
      exported_at: new Date().toISOString(),
      fragments: FragmentTestData.multipleFragments(fragmentCount),
      workflows: Array.from({ length: workflowCount }, (_, i) => 
        WorkflowTestData.validWorkflow({ name: `workflow_${i}` })
      )
    };
  }

  /**
   * Generate invalid export format
   */
  static invalidExport() {
    return {
      version: '999.0',
      invalid_field: 'this should not be here',
      fragments: [{ invalid: 'data' }]
    };
  }

  /**
   * Generate export with some invalid items
   */
  static partiallyValidExport() {
    return {
      version: '2.0',
      exported_at: new Date().toISOString(),
      fragments: [
        FragmentTestData.validFragment(),
        { text: 'short' }, // Invalid - too short
        FragmentTestData.validFragment()
      ],
      workflows: [
        WorkflowTestData.validWorkflow(),
        { name: 'Invalid Workflow' } // Invalid - no steps
      ]
    };
  }
}

/**
 * Special Characters and Edge Cases
 */
export class EdgeCaseTestData {
  /**
   * Text with special characters
   */
  static specialCharacters(): string {
    return `${TEST_PREFIX}special_!@#$%^&*()_+-=[]{}|;:',.<>?/~\``;
  }

  /**
   * Text with unicode characters
   */
  static unicodeText(): string {
    return `${TEST_PREFIX}unicode_你好世界_مرحبا_🎉🚀✨`;
  }

  /**
   * Text with newlines and tabs
   */
  static multilineText(): string {
    return `${TEST_PREFIX}multiline\nwith\ttabs\nand\nnewlines`;
  }

  /**
   * Text with HTML/XML tags
   */
  static htmlText(): string {
    return `${TEST_PREFIX}<script>alert('test')</script><div>content</div>`;
  }

  /**
   * Text with SQL injection attempt
   */
  static sqlInjectionText(): string {
    return `${TEST_PREFIX}'; DROP TABLE fragments; --`;
  }

  /**
   * Empty or whitespace-only text
   */
  static whitespaceText(): string {
    return '          '; // 10 spaces
  }
}

/**
 * Helper to generate random data
 */
export class RandomData {
  /**
   * Generate random integer between min and max (inclusive)
   */
  static int(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate random string of specified length
   */
  static string(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = TEST_PREFIX;
    for (let i = 0; i < length - TEST_PREFIX.length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Pick random item from array
   */
  static pick<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}

/**
 * Get the test data prefix for cleanup operations
 */
export function getTestPrefix(): string {
  return TEST_PREFIX;
}
