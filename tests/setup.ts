// Test setup file for Jest
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Mock jose library before any imports that might use it
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  SignJWT: jest.fn(),
}));

// Mock Next.js server components and Web APIs
// Note: Don't override global.Request directly as Next.js 15+ has read-only properties
// Instead, we'll mock it in individual tests where needed

// Create a custom Request class for tests that don't conflict with Next.js
class TestRequest {
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
    return new TestRequest(this.url, {
      method: this.method,
      headers: this.headers,
      body: this.body
    });
  }
}

// Create a custom Response class for tests
class TestResponse {
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
    return new TestResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers
      }
    });
  }
  
  static redirect(url: string, status = 302) {
    return new TestResponse(null, {
      status,
      headers: { Location: url }
    });
  }
}

// Helper function to create mock NextRequest objects for testing
function createMockNextRequest(url: string, init?: any) {
  const headersMap = new Map();
  if (init?.headers) {
    Object.entries(init.headers).forEach(([key, value]) => {
      headersMap.set(key.toLowerCase(), value as string);
    });
  }
  
  const mockRequest = {
    url,
    method: init?.method || 'GET',
    body: init?.body,
    nextUrl: new URL(url),
    
    // Mock the headers.get method
    get headers() {
      return {
        get: (name: string) => headersMap.get(name.toLowerCase()) || null,
        has: (name: string) => headersMap.has(name.toLowerCase()),
        set: (name: string, value: string) => headersMap.set(name.toLowerCase(), value),
        delete: (name: string) => headersMap.delete(name.toLowerCase()),
        forEach: (callback: (value: string, key: string) => void) => headersMap.forEach(callback),
        entries: () => headersMap.entries(),
        keys: () => headersMap.keys(),
        values: () => headersMap.values(),
      };
    },
    
    async json() {
      return this.body ? JSON.parse(this.body) : {};
    },
    
    async text() {
      return this.body || '';
    },
    
    async formData() {
      if (this.body && (this.body instanceof FormData || (this.body.get && this.body.entries))) {
        return this.body;
      }
      return new FormData();
    },
    
    clone() {
      return createMockNextRequest(this.url, {
        method: this.method,
        headers: init?.headers,
        body: this.body
      });
    }
  };
  
  return mockRequest;
}

// Make test classes and helpers available globally for tests
(global as any).TestRequest = TestRequest;
(global as any).TestResponse = TestResponse;
(global as any).createMockNextRequest = createMockNextRequest;

// Mock Headers if not already available
if (!global.Headers) {
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
}

// Mock FormData if not already available
if (!global.FormData) {
  global.FormData = class MockFormData {
    private data: Map<string, any> = new Map();
    
    append(name: string, value: any) {
      this.data.set(name, value);
    }
    
    get(name: string) {
      return this.data.get(name) || null;
    }
    
    getAll(name: string) {
      const value = this.data.get(name);
      return value ? [value] : [];
    }
    
    has(name: string) {
      return this.data.has(name);
    }
    
    set(name: string, value: any) {
      this.data.set(name, value);
    }
    
    delete(name: string) {
      this.data.delete(name);
    }
    
    entries() {
      return this.data.entries();
    }
    
    keys() {
      return this.data.keys();
    }
    
    values() {
      return this.data.values();
    }
    
    forEach(callback: (value: any, key: string) => void) {
      this.data.forEach(callback);
    }
  } as any;
}

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.XENDIT_API_KEY = 'test-xendit-key';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';

// Mock fetch globally for API tests
(global as any).fetch = jest.fn(() => 
  Promise.resolve(new TestResponse('{}', { status: 200 }))
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
    href: 'http://localhost:2222',
    pathname: '/',
    search: '',
    hash: '',
  },
  dispatchEvent: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
} as any; 