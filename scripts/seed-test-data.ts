import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import fetch from 'node-fetch';

// Add type for node-fetch
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      fetch: typeof fetch;
    }
  }
}

const prisma = new PrismaClient();

// Helper function to generate random data
const randomElement = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

const productTypes = ['digital_product', 'physical_product'];
const productCategories = ['Art', 'Music', 'Photography', 'Writing', 'Design', 'Software', 'Other'];
const purchaseStatuses = ['completed', 'completed', 'completed', 'completed', 'pending', 'failed'];

// Generate a random user
const createUser = async (i: number) => {
  const email = `user${i}@example.com`;
  const name = `User ${i}`;
  const password = 'password123'; // In a real app, hash this
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });
  
  if (existingUser) {
    console.log(`User ${email} already exists, skipping...`);
    return existingUser;
  }
  
  // Create user with email verification
  const user = await prisma.user.create({
    data: {
      email,
      name,
      emailVerified: true, // Mark as verified
      password, // In a real app, store hashed password
    },
  });
  
  // Update user with store info
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      storeName: `${name}'s Store`,
      storeDescription: `Welcome to ${name}'s store!`
    }
  });
  
  console.log(`Created user: ${updatedUser.email} with store: ${updatedUser.storeName}`);
  return updatedUser;
};

// Generate a random product for a user
const createProduct = async (user: any, i: number) => {
  const type = randomElement(productTypes);
  const name = `Product ${i} by ${user.name}`;
  const price = Math.floor(Math.random() * 9000 + 1000) / 100; // Random price between 10.00 and 100.00
  const category = randomElement(productCategories);
  
  // Get a random image from picsum.photos
  const imageWidth = 800;
  const imageHeight = 600;
  const imageUrl = `https://picsum.photos/seed/${user.id}-${i}/${imageWidth}/${imageHeight}`;
  
  // Download the image to get the actual URL
  const imageResponse = await fetch(imageUrl);
  const finalImageUrl = imageResponse.url;
  
  const productData = {
    name,
    description: `This is a description for ${name}. It's a great product!`,
    price,
    type,
    coverImagePath: finalImageUrl,
    userId: user.id,
    status: 'active',
    stockQuantity: type === 'physical_product' ? Math.floor(Math.random() * 100) : null,
    currency: 'PHP',
    slug: `${name.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substring(2, 10)}`
  };

  const product = await prisma.product.create({
    data: productData
  });
  
  console.log(`  Created product: ${product.name}`);
  return product;
};

// Generate a random purchase for a product
const createPurchase = async (product: any, i: number) => {
  const status = randomElement(purchaseStatuses);
  const amount = product.price * (Math.floor(Math.random() * 5) + 1); // 1-5 items
  const email = `customer${Math.floor(Math.random() * 10000)}@example.com`;
  const mobileNumber = `09${Math.floor(10000000 + Math.random() * 90000000)}`; // PH mobile number format
  
  const purchaseData = {
    email,
    mobileNumber,
    amount,
    currency: 'PHP',
    paymentMethod: 'test',
    status,
    accessCode: randomUUID(),
    productId: product.id,
    paymentId: `test_payment_${Math.random().toString(36).substring(2, 10)}`,
    userId: product.userId // Use the product's userId instead of the current user
  };

  const purchase = await prisma.purchase.create({
    data: purchaseData
  });
  
  console.log(`    Created purchase: ${purchase.id} (${purchase.status})`);
  return purchase;
};

// Main seeding function
const seed = async () => {
  try {
    console.log('Starting seed...');
    
    // Create users
    for (let i = 1; i <= 10; i++) {
      try {
        const user = await createUser(i);
        
        // Create products for each user
        for (let j = 1; j <= 10; j++) {
          try {
            const product = await createProduct(user, j);
            
            // Create purchases for each product
            for (let k = 1; k <= 10; k++) {
              try {
                await createPurchase(product, k);
              } catch (purchaseError) {
                console.error(`Error creating purchase ${k} for product ${product.id}:`, purchaseError);
              }
            }
          } catch (productError) {
            console.error(`Error creating product ${j} for user ${user.id}:`, productError);
          }
        }
      } catch (userError) {
        console.error(`Error creating user ${i}:`, userError);
      }
    }
    
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

// Run the seed
seed();
