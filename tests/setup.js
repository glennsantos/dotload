// Test setup file for Jest
require('@testing-library/jest-dom');

// Mock jose library before any imports that might use it
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  SignJWT: jest.fn(),
}));

// Mock cloudinary library
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({
        public_id: 'mock_public_id',
        secure_url: 'https://res.cloudinary.com/test/image/upload/mock_image.jpg',
        url: 'https://res.cloudinary.com/test/image/upload/mock_image.jpg',
        bytes: 1024,
        format: 'jpg'
      }),
      upload_stream: jest.fn().mockImplementation((options, callback) => {
        // Mock the upload_stream method
        const mockResult = {
          public_id: 'mock_public_id',
          secure_url: 'https://res.cloudinary.com/test/image/upload/mock_image.jpg',
          url: 'https://res.cloudinary.com/test/image/upload/mock_image.jpg',
          bytes: 1024,
          format: 'jpg'
        };
        
        // Return a mock stream object
        return {
          end: jest.fn((buffer) => {
            // Simulate successful upload
            setTimeout(() => callback(null, mockResult), 0);
          })
        };
      }),
      destroy: jest.fn().mockResolvedValue({
        result: 'ok'
      })
    },
    api: {
      delete_resources: jest.fn().mockResolvedValue({
        deleted: ['mock_public_id']
      })
    }
  }
}));

// Mock Next.js server components and Web APIs
// Note: Don't override global.Request directly as Next.js 15+ has read-only properties
// Instead, we'll mock it in individual tests where needed

// Create a custom Request class for tests that don't conflict with Next.js
class TestRequest {
  constructor(input, init) {
    this.url = typeof input === 'string' ? input : input.url;
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers);
    this.body = init?.body;
  }
  
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
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.headers = new Headers(init?.headers);
    this.ok = this.status >= 200 && this.status < 300;
  }
  
  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }
  
  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }
  
  static json(data, init) {
    return new TestResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers
      }
    });
  }
  
  static redirect(url, status = 302) {
    return new TestResponse(null, {
      status,
      headers: { Location: url }
    });
  }
}

// Helper function to create mock NextRequest objects for testing
function createMockNextRequest(url, init) {
  const headersMap = new Map();
  if (init?.headers) {
    Object.entries(init.headers).forEach(([key, value]) => {
      headersMap.set(key.toLowerCase(), value);
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
        get: (name) => headersMap.get(name.toLowerCase()) || null,
        has: (name) => headersMap.has(name.toLowerCase()),
        set: (name, value) => headersMap.set(name.toLowerCase(), value),
        delete: (name) => headersMap.delete(name.toLowerCase()),
        forEach: (callback) => headersMap.forEach(callback),
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
global.TestRequest = TestRequest;
global.TestResponse = TestResponse;
global.createMockNextRequest = createMockNextRequest;

// Mock Headers if not already available
if (!global.Headers) {
  global.Headers = class MockHeaders {
    constructor(init) {
      this.headers = new Map();
      
      if (init) {
        if (init instanceof Headers) {
          init.forEach((value, key) => {
            this.headers.set(key.toLowerCase(), value);
          });
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]) => {
            this.headers.set(key.toLowerCase(), value);
          });
        } else if (typeof init === 'object') {
          Object.entries(init).forEach(([key, value]) => {
            this.headers.set(key.toLowerCase(), value);
          });
        }
      }
    }
    
    get(name) {
      return this.headers.get(name.toLowerCase()) || null;
    }
    
    set(name, value) {
      this.headers.set(name.toLowerCase(), value);
    }
    
    has(name) {
      return this.headers.has(name.toLowerCase());
    }
    
    delete(name) {
      this.headers.delete(name.toLowerCase());
    }
    
    forEach(callback) {
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
  };
}

// Mock Request if not already available
if (!global.Request) {
  global.Request = TestRequest;
}

// Mock Response if not already available - this is the key fix
if (!global.Response) {
  global.Response = TestResponse;
}

// Mock FormData if not already available
if (!global.FormData) {
  global.FormData = class MockFormData {
    constructor() {
      this.data = new Map();
    }
    
    append(name, value) {
      this.data.set(name, value);
    }
    
    get(name) {
      return this.data.get(name);
    }
    
    has(name) {
      return this.data.has(name);
    }
    
    delete(name) {
      this.data.delete(name);
    }
    
    entries() {
      return this.data.entries();
    }
  };
}

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.XENDIT_API_KEY = 'test-xendit-key';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';

// Mock fetch globally for API tests
global.fetch = jest.fn(() => 
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
global.localStorage = localStorageMock;

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
}; 