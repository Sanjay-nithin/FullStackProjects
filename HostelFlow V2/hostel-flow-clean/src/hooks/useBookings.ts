
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export const useMyBookings = () => {
  return useQuery({
    queryKey: ['bookings', 'my'],
    queryFn: bookingsAPI.getMyBookings,
    refetchOnWindowFocus: false,       
    refetchOnReconnect: false,     
    retry: 1,                     
    staleTime: 1000 * 60, 
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: bookingsAPI.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: 'Booking cancelled',
        description: 'Your booking has been cancelled successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to cancel booking. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useRescheduleBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ bookingId, newDateTime }: { 
      bookingId: string; 
      newDateTime: { date: string; time_slot: string } 
    }) => bookingsAPI.reschedule(bookingId, newDateTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: 'Booking rescheduled',
        description: 'Your booking has been rescheduled successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to reschedule booking. Please try again.',
        variant: 'destructive',
      });
    },
  });
};
