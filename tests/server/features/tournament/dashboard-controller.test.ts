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

// Mock the dashboard service
jest.mock('../../../../server/features/tournament/services/dashboard', () => ({
  dashboardService: {
    getDashboardData: jest.fn()
  }
}));

// Now import the code being tested
import { dashboardController } from '../../../../server/features/tournament/controllers/dashboard';
import { dashboardService } from '../../../../server/features/tournament/services/dashboard';

describe('Dashboard Controller', () => {
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
  });

  describe('getDashboardHandler', () => {
    it('should return dashboard data for the authenticated user', async () => {
      const mockDashboardData = {
        userInfo: {
          id: 'test-user-id',
          username: 'testuser'
        },
        tournamentSummary: {
          active: 2,
          pending: 1,
          completed: 3,
          cancelled: 0
        },
        participation: {
          hosting: 3,
          joined: 5,
          invited: 2
        },
        recentActivity: [
          {
            type: 'score_submitted',
            tournamentId: 'tournament-1',
            tournamentName: 'Tournament 1',
            timestamp: new Date()
          },
          {
            type: 'invitation',
            tournamentId: 'tournament-2',
            tournamentName: 'Tournament 2',
            timestamp: new Date()
          }
        ],
        upcomingTournaments: [
          {
            id: 'tournament-3',
            name: 'Tournament 3',
            startDate: new Date(Date.now() + 86400000) // tomorrow
          }
        ]
      };
      
      jest.spyOn(dashboardService, 'getDashboardData').mockResolvedValue(mockDashboardData);
      
      await dashboardController.getDashboardHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(dashboardService.getDashboardData).toHaveBeenCalledWith('test-user-id');
      expect(responseJson).toHaveBeenCalledWith(mockDashboardData);
    });
    
    it('should handle authentication errors', async () => {
      mockRequest.session = {} as any;
      
      await dashboardController.getDashboardHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Authentication required' });
    });
    
    it('should handle service errors', async () => {
      jest.spyOn(dashboardService, 'getDashboardData')
        .mockRejectedValue(new Error('Failed to fetch dashboard data'));
      
      await dashboardController.getDashboardHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(loggerMock.error).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Failed to get dashboard data'
      }));
    });
    
    it('should handle partial data availability', async () => {
      // Scenario where some dashboard sections are available but others failed
      const partialData = {
        userInfo: {
          id: 'test-user-id',
          username: 'testuser'
        },
        tournamentSummary: {
          active: 2,
          pending: 1,
          completed: 3,
          cancelled: 0
        },
        // Missing participation data
        // Missing recentActivity data
        upcomingTournaments: [] // Empty but present
      };
      
      jest.spyOn(dashboardService, 'getDashboardData').mockResolvedValue(partialData);
      
      await dashboardController.getDashboardHandler(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(responseJson).toHaveBeenCalledWith(partialData);
      // Should still return 200 even with partial data
      expect(responseStatus).not.toHaveBeenCalled();
    });
  });
}); 