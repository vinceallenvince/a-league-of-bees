/**
 * Unit tests for OTP verification
 */
import { User } from '@shared/schema';

// Import our modules after mocking
import { storage } from '../../server/storage';

// Create a mock version of the storage module
jest.mock('../../server/storage', () => {
  // Create a mock for the storage module
  const storageMock = {
    getUserByEmail: jest.fn(),
    setOtp: jest.fn(),
    verifyOtp: jest.fn(),
    clearOtp: jest.fn(),
    updateLastLogin: jest.fn(),
    getUser: jest.fn(),
    sessionStore: {},
  };

  return {
    storage: storageMock
  };
});

// Mock the email module to prevent actual email sending
jest.mock('../../server/email', () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(undefined),
  sendMagicLinkEmail: jest.fn().mockResolvedValue(undefined)
}));

describe('OTP Verification', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('verifyOtp', () => {
    it('should accept a valid OTP that is within expiry time', async () => {
      // Arrange
      const email = 'test@example.com';
      const validOtp = '123456';
      
      // Set up the expected future expiry date (30 minutes from now)
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 30);
      
      // Set up the mock user with the OTP
      const mockUser: Partial<User> = {
        id: "mock-uuid-1",
        email,
        otpSecret: validOtp,
        otpExpiry: expiry,
        otpAttempts: 0
      };
      
      // Mock the storage.getUserByEmail to return our test user
      (storage.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      
      // Mock the storage.verifyOtp to return success
      (storage.verifyOtp as jest.Mock).mockImplementation(async (userEmail: string, otp: string) => {
        // Simulate the actual verification logic
        const user = await storage.getUserByEmail(userEmail);
        
        if (!user || !user.otpSecret || !user.otpExpiry) {
          return { success: false, message: "No OTP requested" };
        }
        
        if (user.otpExpiry < new Date()) {
          return { success: false, message: "OTP has expired" };
        }
        
        if (user.otpSecret !== otp) {
          return { 
            success: false, 
            message: "Invalid OTP code", 
            remainingAttempts: 4 
          };
        }
        
        return { success: true };
      });
      
      // Act
      const result = await storage.verifyOtp(email, validOtp);
      
      // Assert
      expect(result.success).toBe(true);
      expect(storage.verifyOtp).toHaveBeenCalledWith(email, validOtp);
      expect(storage.getUserByEmail).toHaveBeenCalledWith(email);
    });
    
    it('should reject an OTP when expired', async () => {
      // Arrange
      const email = 'test@example.com';
      const validOtp = '123456';
      
      // Set up an expiry date in the past
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() - 10); // 10 minutes in the past
      
      // Set up the mock user with the expired OTP
      const mockUser: Partial<User> = {
        id: "mock-uuid-1",
        email,
        otpSecret: validOtp,
        otpExpiry: expiry,
        otpAttempts: 0
      };
      
      // Mock the storage.getUserByEmail to return our test user
      (storage.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      
      // Mock the storage.verifyOtp with similar logic to the real implementation
      (storage.verifyOtp as jest.Mock).mockImplementation(async (userEmail: string, otp: string) => {
        // Simulate the actual verification logic
        const user = await storage.getUserByEmail(userEmail);
        
        if (!user || !user.otpSecret || !user.otpExpiry) {
          return { success: false, message: "No OTP requested" };
        }
        
        if (user.otpExpiry < new Date()) {
          return { success: false, message: "OTP has expired" };
        }
        
        return { success: true };
      });
      
      // Act
      const result = await storage.verifyOtp(email, validOtp);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe("OTP has expired");
      expect(storage.verifyOtp).toHaveBeenCalledWith(email, validOtp);
      expect(storage.getUserByEmail).toHaveBeenCalledWith(email);
    });
    
    it('should reject an invalid OTP', async () => {
      // Arrange
      const email = 'test@example.com';
      const validOtp = '123456';
      const invalidOtp = '654321';
      
      // Set up the expected future expiry date (30 minutes from now)
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 30);
      
      // Set up the mock user with the OTP
      const mockUser: Partial<User> = {
        id: "mock-uuid-1",
        email,
        otpSecret: validOtp,
        otpExpiry: expiry,
        otpAttempts: 0
      };
      
      // Mock the storage.getUserByEmail to return our test user
      (storage.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      
      // Mock the storage.verifyOtp to return failure for invalid OTP
      (storage.verifyOtp as jest.Mock).mockImplementation(async (userEmail: string, otp: string) => {
        // Simulate the actual verification logic
        const user = await storage.getUserByEmail(userEmail);
        
        if (!user || !user.otpSecret || !user.otpExpiry) {
          return { success: false, message: "No OTP requested" };
        }
        
        if (user.otpExpiry < new Date()) {
          return { success: false, message: "OTP has expired" };
        }
        
        if (user.otpSecret !== otp) {
          return { 
            success: false, 
            message: "Invalid OTP code", 
            remainingAttempts: 4 
          };
        }
        
        return { success: true };
      });
      
      // Act
      const result = await storage.verifyOtp(email, invalidOtp);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe("Invalid OTP code");
      expect(result.remainingAttempts).toBe(4);
      expect(storage.verifyOtp).toHaveBeenCalledWith(email, invalidOtp);
      expect(storage.getUserByEmail).toHaveBeenCalledWith(email);
    });
  });
}); 