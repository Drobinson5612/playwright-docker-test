/**
 * Test Configuration for API Tests
 * 
 * This file provides centralized configuration for all API tests,
 * including base URLs, timeouts, and test data management settings.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.test
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

/**
 * API Configuration
 */
export const API_CONFIG = {
  // Base URL for the Prompt Helper API
  baseURL: process.env.PROMPT_HELPER_API_URL || 'http://localhost:3000',
  
  // Timeout for API requests (milliseconds)
  timeout: parseInt(process.env.TEST_TIMEOUT || '30000', 10),
  
  // Number of retries for failed tests
  retries: parseInt(process.env.TEST_RETRIES || '1', 10),
};

/**
 * Test Data Configuration
 */
export const TEST_DATA_CONFIG = {
  // Prefix for test data to identify and clean up
  prefix: process.env.TEST_DATA_PREFIX || 'test_',
  
  // Whether to clean up test data after tests
  cleanup: process.env.CLEANUP_TEST_DATA === 'true',
  
  // Default category for test fragments
  defaultCategory: 'Test Category',
  
  // Minimum text length for fragments/steps
  minTextLength: 10,
  
  // Maximum text length for fragments/steps
  maxTextLength: 1048576, // 1 MB
};

/**
 * Authentication Configuration (if required)
 */
export const AUTH_CONFIG = {
  // API Key (if required)
  apiKey: process.env.API_KEY || '',
  
  // Bearer Token (if required)
  token: process.env.API_TOKEN || '',
  
  // Whether authentication is required
  isRequired: !!(process.env.API_KEY || process.env.API_TOKEN),
};

/**
 * Endpoint Paths
 */
export const ENDPOINTS = {
  // Health Check
  health: '/health',
  
  // Fragment Management
  fragments: '/api/fragments',
  fragmentById: (id: number) => `/api/fragments/${id}`,
  fragmentCategories: '/api/fragments/categories',
  fragmentExport: '/api/fragments/export',
  fragmentImport: '/api/fragments/import',
  
  // Workflow Management
  workflows: '/api/workflows',
  workflowById: (id: number) => `/api/workflows/${id}`,
  workflowCategories: '/api/workflows/categories',
  
  // AutoSave
  autosaves: '/api/autosaves',
  autosaveLatest: '/api/autosaves/latest',
  autosaveDownload: (filename: string) => `/api/autosaves/download/${filename}`,
  autosaveTrigger: '/api/autosaves/trigger',
};

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

/**
 * Test Data Samples
 */
export const SAMPLE_DATA = {
  // Valid fragment text (meets minimum length requirement)
  validFragmentText: 'This is a valid test fragment with sufficient length for testing purposes.',
  
  // Short text (fails validation)
  shortText: 'short',
  
  // Valid workflow name
  validWorkflowName: 'Test Workflow',
  
  // Valid workflow description
  validWorkflowDescription: 'This is a test workflow for automated testing purposes.',
  
  // Valid step text
  validStepText: 'This is a valid workflow step with sufficient length for testing.',
};

/**
 * Helper function to get full URL
 */
export function getFullURL(endpoint: string): string {
  return `${API_CONFIG.baseURL}${endpoint}`;
}

/**
 * Helper function to get auth headers (if required)
 */
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (AUTH_CONFIG.apiKey) {
    headers['X-API-Key'] = AUTH_CONFIG.apiKey;
  }
  
  if (AUTH_CONFIG.token) {
    headers['Authorization'] = `Bearer ${AUTH_CONFIG.token}`;
  }
  
  return headers;
}
