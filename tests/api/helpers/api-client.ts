/**
 * API Client Helper
 * 
 * Provides wrapper functions for common API operations to reduce code duplication
 * and provide consistent error handling across all API tests.
 */

import { APIRequestContext, APIResponse } from '@playwright/test';

const API_BASE_URL = process.env.PROMPT_HELPER_API_URL || process.env.BASE_URL || 'http://localhost:3000';

/**
 * Fragment API Client
 */
export class FragmentClient {
  constructor(private request: APIRequestContext) {}

  async getAll(category?: string): Promise<APIResponse> {
    const url = category 
      ? `${API_BASE_URL}/api/fragments?category=${encodeURIComponent(category)}`
      : `${API_BASE_URL}/api/fragments`;
    return await this.request.get(url);
  }

  async getById(id: number): Promise<APIResponse> {
    return await this.request.get(`${API_BASE_URL}/api/fragments/${id}`);
  }

  async create(text: string, category?: string): Promise<APIResponse> {
    return await this.request.post(`${API_BASE_URL}/api/fragments`, {
      data: { text, category: category || null }
    });
  }

  async update(id: number, text: string, category?: string): Promise<APIResponse> {
    return await this.request.put(`${API_BASE_URL}/api/fragments/${id}`, {
      data: { text, category: category || null }
    });
  }

  async delete(id: number): Promise<APIResponse> {
    return await this.request.delete(`${API_BASE_URL}/api/fragments/${id}`);
  }

  async getCategories(): Promise<APIResponse> {
    return await this.request.get(`${API_BASE_URL}/api/fragments/categories`);
  }

  async export(): Promise<APIResponse> {
    return await this.request.get(`${API_BASE_URL}/api/fragments/export`);
  }

  async import(data: any): Promise<APIResponse> {
    return await this.request.post(`${API_BASE_URL}/api/fragments/import`, {
      data
    });
  }
}

/**
 * Workflow API Client
 */
export class WorkflowClient {
  constructor(private request: APIRequestContext) {}

  async getAll(category?: string): Promise<APIResponse> {
    const url = category
      ? `${API_BASE_URL}/api/workflows?category=${encodeURIComponent(category)}`
      : `${API_BASE_URL}/api/workflows`;
    return await this.request.get(url);
  }

  async getById(id: number): Promise<APIResponse> {
    return await this.request.get(`${API_BASE_URL}/api/workflows/${id}`);
  }

  async create(
    name: string,
    steps: Array<{ text: string; category?: string }>,
    description?: string,
    category?: string
  ): Promise<APIResponse> {
    return await this.request.post(`${API_BASE_URL}/api/workflows`, {
      data: {
        name,
        description: description || null,
        category: category || null,
        steps
      }
    });
  }

  async update(
    id: number,
    name: string,
    steps: Array<{ text: string; category?: string }>,
    description?: string,
    category?: string
  ): Promise<APIResponse> {
    return await this.request.put(`${API_BASE_URL}/api/workflows/${id}`, {
      data: {
        name,
        description: description || null,
        category: category || null,
        steps
      }
    });
  }

  async delete(id: number): Promise<APIResponse> {
    return await this.request.delete(`${API_BASE_URL}/api/workflows/${id}`);
  }

  async getCategories(): Promise<APIResponse> {
    return await this.request.get(`${API_BASE_URL}/api/workflows/categories`);
  }
}

/**
 * AutoSave API Client
 */
export class AutoSaveClient {
  constructor(private request: APIRequestContext) {}

  async list(): Promise<APIResponse> {
    return await this.request.get(`${API_BASE_URL}/api/autosaves`);
  }

  async getLatest(): Promise<APIResponse> {
    return await this.request.get(`${API_BASE_URL}/api/autosaves/latest`);
  }

  async download(filename: string): Promise<APIResponse> {
    return await this.request.get(`${API_BASE_URL}/api/autosaves/download/${filename}`);
  }

  async trigger(): Promise<APIResponse> {
    return await this.request.post(`${API_BASE_URL}/api/autosaves/trigger`);
  }
}

/**
 * Health Check API Client
 */
export class HealthClient {
  constructor(private request: APIRequestContext) {}

  async check(): Promise<APIResponse> {
    return await this.request.get(`${API_BASE_URL}/health`);
  }
}

/**
 * Main API Client - aggregates all clients
 */
export class ApiClient {
  public fragments: FragmentClient;
  public workflows: WorkflowClient;
  public autosaves: AutoSaveClient;
  public health: HealthClient;

  constructor(request: APIRequestContext) {
    this.fragments = new FragmentClient(request);
    this.workflows = new WorkflowClient(request);
    this.autosaves = new AutoSaveClient(request);
    this.health = new HealthClient(request);
  }
}

/**
 * Helper function to create API client
 */
export function createApiClient(request: APIRequestContext): ApiClient {
  return new ApiClient(request);
}

/**
 * Authentication helper (if needed in the future)
 */
export function getAuthHeaders(): Record<string, string> {
  const apiKey = process.env.API_KEY;
  const apiToken = process.env.API_TOKEN;

  if (apiKey) {
    return { 'X-API-Key': apiKey };
  }
  
  if (apiToken) {
    return { 'Authorization': `Bearer ${apiToken}` };
  }

  return {};
}
