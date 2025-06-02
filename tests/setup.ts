// Test setup file for Jest
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Mock Web APIs that Next.js server components depend on
global.Request = class MockRequest {
  constructor(input: any, init?: any) {
    this.url = typeof input === 'string' ? input : input.url;
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers);
    this.body = init?.body;
  }
  url: string;
  method: string;
  headers: Headers;
  body: any;
  
  async json() {
    return this.body ? JSON.parse(this.body) : {};
  }
  
  async text() {
    return this.body || '';
  }
  
  async formData() {
    return new FormData();
  }
  
  clone() {
    return new (global.Request as any)(this.url, {
      method: this.method,
      headers: this.headers,
      body: this.body
    });
  }
} as any;

global.Response = class MockResponse {
  constructor(body?: any, init?: any) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.headers = new Headers(init?.headers);
    this.ok = this.status >= 200 && this.status < 300;
  }
  body: any;
  status: number;
  statusText: string;
  headers: Headers;
  ok: boolean;
  
  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }
  
  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }
  
  static json(data: any, init?: any) {
    return new (global.Response as any)(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers
      }
    });
  }
  
  static redirect(url: string, status = 302) {
    return new (global.Response as any)(null, {
      status,
      headers: { Location: url }
    });
  }
} as any;

global.Headers = class MockHeaders {
  private headers: Map<string, string> = new Map();
  
  constructor(init?: any) {
    if (init) {
      if (init instanceof Headers) {
        init.forEach((value: string, key: string) => {
          this.headers.set(key.toLowerCase(), value);
        });
      } else if (Array.isArray(init)) {
        init.forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      } else if (typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value as string);
        });
      }
    }
  }
  
  get(name: string) {
    return this.headers.get(name.toLowerCase()) || null;
  }
  
  set(name: string, value: string) {
    this.headers.set(name.toLowerCase(), value);
  }
  
  has(name: string) {
    return this.headers.has(name.toLowerCase());
  }
  
  delete(name: string) {
    this.headers.delete(name.toLowerCase());
  }
  
  forEach(callback: (value: string, key: string) => void) {
    this.headers.forEach(callback);
  }
  
  entries() {
    return this.headers.entries();
  }
  
  keys() {
    return this.headers.keys();
  }
  
  values() {
    return this.headers.values();
  }
} as any;

global.FormData = class MockFormData {
  private data: Map<string, any> = new Map();
  
  append(name: string, value: any) {
    this.data.set(name, value);
  }
  
  get(name: string) {
    return this.data.get(name);
  }
  
  has(name: string) {
    return this.data.has(name);
  }
  
  delete(name: string) {
    this.data.delete(name);
  }
  
  entries() {
    return this.data.entries();
  }
} as any;

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.XENDIT_API_KEY = 'test-xendit-key';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';

// Mock fetch globally for API tests
(global as any).fetch = jest.fn(() => 
  Promise.resolve(new Response('{}', { status: 200 }))
);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock localStorage for browser environment tests
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock window object for browser environment tests
global.window = {
  ...global.window,
  location: {
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
  },
  dispatchEvent: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
} as any; 