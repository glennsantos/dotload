// Mock for discount-utils module
const mockDiscountUtils = {
  validateDiscountCode: jest.fn(),
  applyDiscount: jest.fn(),
  calculateDiscountAmount: jest.fn(),
  getDiscountByCode: jest.fn(),
};

module.exports = mockDiscountUtils; 