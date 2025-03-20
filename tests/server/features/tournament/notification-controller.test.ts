import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';

// Create mock functions
const loggerMock = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

// Mock the dependencies before importing the code
jest.mock('../../../../server/core/logger', () => {
  return {
    __esModule: true,
    default: loggerMock
  };
});

// Mock the notification service
jest.mock('../../../../server/features/tournament/services/notification', () => ({
  notificationService: {
    getNotifications: jest.fn(),
    markAsRead: jest.fn()
  }
}));

// Mock validator
const validateMarkAsReadMock = jest.fn();

// Mock the notification validator
jest.mock('../../../../server/features/tournament/validators/notification', () => ({
  validateMarkAsRead: validateMarkAsReadMock
}));

// Now import the code being tested
import { notificationController } from '../../../../server/features/tournament/controllers/notification';
import { notificationService } from '../../../../server/features/tournament/services/notification';

describe('Notification Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn().mockReturnThis();
    responseStatus = jest.fn().mockReturnThis();
    
    mockRequest = {
      params: {},
      body: {},
      query: {},
      session: {
        userId: 'test-user-id'
      } as any
    };
    
    mockResponse = {
      json: responseJson as any,
      status: responseStatus as any
    };
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Set default validator response
    validateMarkAsReadMock.mockReturnValue({
      success: true,
      data: { notificationIds: ['notification-1', 'notification-2'] }
    });
  });

  describe('getNotificationsHandler', () => {
    it('should return notifications with pagination', async () => {
      const mockNotifications = {
        notifications: [
          {
            id: 'notification-1',
            userId: 'test-user-id',
            tournamentId: 'tournament-1',
            type: 'invitation',
            message: 'You have been invited to Tournament 1',
            read: false,
            createdAt: new Date(),
            tournamentName: 'Tournament 1'
          },
          {
            id: 'notification-2',
            userId: 'test-user-id',
            tournamentId: 'tournament-2',
            type: 'tournament_start',
            message: 'Tournament 2 has started',
            read: true,
            createdAt: new Date(),
            tournamentName: 'Tournament 2'
          }
        ],
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1
      };
      
      jest.spyOn(notificationService, 'getNotifications').mockResolvedValue(mockNotifications);
      
      mockRequest.query = { page: '1', pageSize: '10' };
      
      await notificationController.getNotificationsHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(notificationService.getNotifications).toHaveBeenCalledWith(
        'test-user-id',
        1,
        10,
        undefined,
        undefined
      );
      expect(responseJson).toHaveBeenCalledWith(mockNotifications);
    });
    
    it('should handle filtering by type and read status', async () => {
      const mockNotifications = {
        notifications: [
          {
            id: 'notification-1',
            userId: 'test-user-id',
            tournamentId: 'tournament-1',
            type: 'invitation',
            message: 'You have been invited to Tournament 1',
            read: false,
            createdAt: new Date(),
            tournamentName: 'Tournament 1'
          }
        ],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1
      };
      
      jest.spyOn(notificationService, 'getNotifications').mockResolvedValue(mockNotifications);
      
      mockRequest.query = {
        page: '1',
        pageSize: '10',
        type: 'invitation',
        read: 'false'
      };
      
      await notificationController.getNotificationsHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(notificationService.getNotifications).toHaveBeenCalledWith(
        'test-user-id',
        1,
        10,
        'invitation',
        false
      );
      expect(responseJson).toHaveBeenCalledWith(mockNotifications);
    });
    
    it('should handle authentication errors', async () => {
      mockRequest.session = {} as any;
      
      await notificationController.getNotificationsHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Authentication required' });
    });
    
    it('should handle service errors', async () => {
      jest.spyOn(notificationService, 'getNotifications')
        .mockRejectedValue(new Error('Database error'));
      
      await notificationController.getNotificationsHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(loggerMock.error).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Failed to get notifications'
      }));
    });
  });
  
  describe('markAsReadHandler', () => {
    it('should mark notifications as read', async () => {
      const updatedNotifications = [
        {
          id: 'notification-1',
          userId: 'test-user-id',
          tournamentId: 'tournament-1',
          type: 'invitation',
          message: 'You have been invited to Tournament 1',
          read: true,
          createdAt: new Date()
        },
        {
          id: 'notification-2',
          userId: 'test-user-id',
          tournamentId: 'tournament-2',
          type: 'tournament_start',
          message: 'Tournament 2 has started',
          read: true,
          createdAt: new Date()
        }
      ];
      
      jest.spyOn(notificationService, 'markAsRead').mockResolvedValue(updatedNotifications);
      
      mockRequest.body = { notificationIds: ['notification-1', 'notification-2'] };
      
      await notificationController.markAsReadHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(notificationService.markAsRead).toHaveBeenCalledWith(
        'test-user-id',
        ['notification-1', 'notification-2']
      );
      expect(responseJson).toHaveBeenCalledWith(updatedNotifications);
    });
    
    it('should handle validation errors', async () => {
      validateMarkAsReadMock.mockReturnValue({
        success: false,
        error: {
          format: () => ({ notificationIds: { _errors: ['Required'] } })
        }
      });
      
      mockRequest.body = {};
      
      await notificationController.markAsReadHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Invalid notification data'
      }));
    });
    
    it('should handle authentication errors', async () => {
      mockRequest.session = {} as any;
      
      await notificationController.markAsReadHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Authentication required' });
    });
    
    it('should handle service errors', async () => {
      jest.spyOn(notificationService, 'markAsRead')
        .mockRejectedValue(new Error('Database error'));
      
      mockRequest.body = { notificationIds: ['notification-1', 'notification-2'] };
      
      await notificationController.markAsReadHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(loggerMock.error).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Failed to mark notifications as read'
      }));
    });
    
    it('should handle unauthorized access to notifications', async () => {
      jest.spyOn(notificationService, 'markAsRead')
        .mockRejectedValue(new Error('Unauthorized: Cannot mark notifications that do not belong to you'));
      
      mockRequest.body = { notificationIds: ['notification-1', 'notification-2'] };
      
      await notificationController.markAsReadHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({ 
        error: 'Unauthorized: Cannot mark notifications that do not belong to you' 
      });
    });
  });
}); 