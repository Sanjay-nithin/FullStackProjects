
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceProviderAPI, notificationsAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export const useServiceProviderBookings = () => {
  return useQuery({
    queryKey: ['service-provider', 'bookings'],
    queryFn: serviceProviderAPI.getAssignedBookings,
    refetchOnWindowFocus: false,   
    refetchOnReconnect: false,  
    retry: 1,                 
    staleTime: 1000 * 60, 
  });
};

export const useServiceProviderNotifications = () => {
  return useQuery({
    queryKey: ['service-provider', 'notifications'],
    queryFn: serviceProviderAPI.getNotifications,
    refetchInterval: 30000, 
    refetchOnWindowFocus: false,   
    refetchOnReconnect: false,     
    retry: 1,                 
    staleTime: 1000 * 60, 
  });
};

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: 'in_progress' | 'completed' }) =>
      serviceProviderAPI.updateBookingStatus(bookingId, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['service-provider', 'bookings'] });
      toast({
        title: 'Success',
        description: `Booking status updated to ${status.replace('_', ' ')}`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update booking status.',
        variant: 'destructive',
      });
    },
  });
};

export const useSendCompletionNotification = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ bookingId, message }: { bookingId: string; message: string }) =>
      serviceProviderAPI.sendCompletionNotification(bookingId, message),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Completion notification sent to user.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send notification.',
        variant: 'destructive',
      });
    },
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: serviceProviderAPI.markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-provider', 'notifications'] });
    },
  });
};
