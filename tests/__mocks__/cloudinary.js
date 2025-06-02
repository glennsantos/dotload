// Mock for cloudinary library
const mockV2 = {
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
};

const mockCloudinary = {
  v2: mockV2
};

module.exports = mockCloudinary; 