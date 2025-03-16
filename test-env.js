// Simple script to test environment variable loading
import * as dotenv from 'dotenv';
dotenv.config();

console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'Found (length: ' + process.env.SENDGRID_API_KEY.length + ')' : 'Not found');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');
console.log('AUTH_METHOD:', process.env.AUTH_METHOD); 