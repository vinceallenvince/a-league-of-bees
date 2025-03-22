import { renderHook, waitFor, act } from '@testing-library/react';
import { useParticipants } from '../useParticipants';
import { tournamentApi } from '../../api/tournamentApi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the tournamentApi
jest.mock('../../api/tournamentApi');

describe('useParticipants', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('should fetch participants when tournamentId is provided', async () => {
    const mockParticipants = {
      participants: [
        {
          id: 'p1',
          userId: 'u1',
          tournamentId: 't1',
          username: 'User 1',
          joinedAt: '2023-01-01T00:00:00.000Z',
          status: 'joined'
        },
        {
          id: 'p2',
          userId: 'u2',
          tournamentId: 't1',
          username: 'User 2',
          joinedAt: '2023-01-02T00:00:00.000Z',
          status: 'invited'
        }
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        totalCount: 2,
        totalPages: 1
      }
    };

    (tournamentApi.getParticipants as jest.Mock).mockResolvedValue(mockParticipants);

    const { result } = renderHook(() => useParticipants('t1'), { wrapper });

    // Initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.participants).toEqual([]);

    // Wait for data to load
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.participants).toEqual(mockParticipants.participants);
    expect(result.current.pagination).toEqual(mockParticipants.pagination);
    expect(result.current.error).toBeNull();
    expect(tournamentApi.getParticipants).toHaveBeenCalledWith('t1', {
      page: 1,
      pageSize: 10,
      status: undefined
    });
  });

  it('should not fetch participants when tournamentId is not provided', async () => {
    const { result } = renderHook(() => useParticipants(), { wrapper });

    // Should not be loading since the query is disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.participants).toEqual([]);

    // API should not have been called
    expect(tournamentApi.getParticipants).not.toHaveBeenCalled();
  });

  it('should handle error when participants fetch fails', async () => {
    const errorMessage = 'Failed to fetch participants';
    (tournamentApi.getParticipants as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useParticipants('t1'), { wrapper });

    // Wait for error to be set
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(errorMessage);
    expect(result.current.participants).toEqual([]);
  });

  it('should change page and refetch participants', async () => {
    const page1Response = {
      participants: [{ id: 'p1', userId: 'u1', tournamentId: 't1', username: 'User 1', joinedAt: '2023-01-01', status: 'joined' }],
      pagination: { page: 1, pageSize: 10, totalCount: 2, totalPages: 2 }
    };

    const page2Response = {
      participants: [{ id: 'p2', userId: 'u2', tournamentId: 't1', username: 'User 2', joinedAt: '2023-01-02', status: 'joined' }],
      pagination: { page: 2, pageSize: 10, totalCount: 2, totalPages: 2 }
    };

    (tournamentApi.getParticipants as jest.Mock)
      .mockResolvedValueOnce(page1Response)
      .mockResolvedValueOnce(page2Response);

    const { result } = renderHook(() => useParticipants('t1'), { wrapper });

    // Wait for initial data to load
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.participants).toEqual(page1Response.participants);

    // Change page
    act(() => {
      result.current.setPage(2);
    });

    // Should be loading again
    await waitFor(() => expect(result.current.isLoading).toBe(true));

    // Wait for new data
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.participants).toEqual(page2Response.participants);
    expect(result.current.pagination).toEqual(page2Response.pagination);
    expect(tournamentApi.getParticipants).toHaveBeenCalledWith('t1', expect.objectContaining({ page: 2 }));
  });

  it('should invite users successfully', async () => {
    const inviteResult = { success: true, count: 2 };
    (tournamentApi.inviteUsers as jest.Mock).mockResolvedValue(inviteResult);

    const { result } = renderHook(() => useParticipants('t1'), { wrapper });

    const emails = ['user1@example.com', 'user2@example.com'];
    
    // Call inviteUsers
    const promise = result.current.inviteUsers(emails);

    // Wait for the mutation to complete
    const response = await promise;
    expect(response).toEqual(inviteResult);
    expect(tournamentApi.inviteUsers).toHaveBeenCalledWith('t1', emails);
  });

  it('should remove a participant successfully', async () => {
    const removeResult = { success: true };
    (tournamentApi.removeParticipant as jest.Mock).mockResolvedValue(removeResult);

    const { result } = renderHook(() => useParticipants('t1'), { wrapper });

    // Call removeParticipant
    const promise = result.current.removeParticipant('p1');

    // Wait for the mutation to complete
    const response = await promise;
    expect(response).toEqual(removeResult);
    expect(tournamentApi.removeParticipant).toHaveBeenCalledWith('t1', 'p1');
  });
}); 