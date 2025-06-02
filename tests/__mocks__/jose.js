// Mock for jose library to handle ESM compatibility in Jest
const mockJwtVerify = jest.fn();
const mockSignJWT = jest.fn();

module.exports = {
  jwtVerify: mockJwtVerify,
  SignJWT: mockSignJWT,
  __esModule: true,
  default: {
    jwtVerify: mockJwtVerify,
    SignJWT: mockSignJWT,
  }
};

// Export individual functions for named imports
module.exports.jwtVerify = mockJwtVerify;
module.exports.SignJWT = mockSignJWT; 