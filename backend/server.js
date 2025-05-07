import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

// Import authentication routes and middleware
import { 
  registerUser, 
  loginUser, 
  authenticateToken, 
  getUserProfile 
} from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 50 * 1024 * 1024 // 50MB file size limit
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Authentication Routes
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);
app.get('/api/auth/profile', authenticateToken, getUserProfile);

// Validation middleware
const validateProductData = (req, res, next) => {
  const { name, type, price } = req.body;

  // Check for required fields
  if (!name || !type || !price) {
    return res.status(400).json({ 
      error: 'Missing required fields', 
      details: {
        name: !!name,
        type: !!type,
        price: !!price
      }
    });
  }

  // Validate price
  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ 
      error: 'Invalid price', 
      details: 'Price must be a non-negative number' 
    });
  }

  next();
};

// Product Creation Route
const createProduct = async (req, res) => {
  try {
    const { 
      name, 
      type, 
      price, 
      description, 
      variations, 
      paymentOptions 
    } = req.body;

    // Safe parsing of variations
    let parsedVariations = [];
    try {
      if (variations) {
        parsedVariations = JSON.parse(variations).map(v => ({
          name: v.name || 'Unnamed Variation',
          options: JSON.stringify(v.options || [])
        }));
      }
    } catch (parseError) {
      return res.status(400).json({ 
        error: 'Invalid variations format', 
        details: parseError.message 
      });
    }

    // Process payment options
    const safePaymentOptions = {
      allowPayWhatYouWant: paymentOptions?.allowPayWhatYouWant === 'true',
      offerCoupons: paymentOptions?.offerCoupons === 'true',
      subscriptionBilling: paymentOptions?.subscriptionBilling === 'true'
    };

    // Process uploaded files
    const coverImage = req.files['coverImage'] ? req.files['coverImage'][0] : null;
    const uploadedFiles = req.files['files'] || [];

    const processedFiles = uploadedFiles.map(file => ({
      filename: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    }));

    // Create product in database
    const product = await prisma.product.create({
      data: {
        name,
        type,
        price: parseFloat(price),
        description: description || '',
        coverImagePath: coverImage ? coverImage.path : null,
        ...safePaymentOptions,
        variations: {
          create: parsedVariations
        },
        files: {
          create: processedFiles
        }
      },
      include: {
        variations: true,
        files: true
      }
    });

    // Send detailed response
    res.status(201).json({
      message: 'Product created successfully',
      product,
      fileCount: processedFiles.length,
      variationCount: parsedVariations.length
    });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create product', 
      details: error.message 
    });
  }
};

app.post('/api/products', 
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'files', maxCount: 10 }
  ]), 
  validateProductData,
  createProduct
);

// Get All Products Route
const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        files: true,
        variations: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products', 
      details: error.message 
    });
  }
};

app.get('/api/products', getAllProducts);

// Get Single Product Route
const getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        files: true,
        variations: true
      }
    });

    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found', 
        details: `No product found with ID: ${req.params.id}` 
      });
    }

    res.json(product);
  } catch (error) {
    console.error('Fetch product error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product', 
      details: error.message 
    });
  }
};

app.get('/api/products/:id', getProductById);

const SERVER_PORT = process.env.PORT || 5000;
app.listen(SERVER_PORT, () => {
  console.log(`Server running on port ${SERVER_PORT}`);
});

export { app as default };
