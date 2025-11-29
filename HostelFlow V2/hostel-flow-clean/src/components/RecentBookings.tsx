import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';
import { useMyBookings, useCancelBooking } from '@/hooks/useBookings';
import RescheduleModal from './RescheduleModal';
import ReviewForm from './ReviewForm';
import { Link } from 'react-router-dom';

const RecentBookings = () => {
  const { data: bookings, isLoading } = useMyBookings();
  const cancelBooking = useCancelBooking();
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState<any>(null);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<any>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleReviewSubmitted = () => {
    setSelectedBookingForReview(null);
  };

  // Get only the first 3 bookings for dashboard
  const recentBookings = bookings?.slice(0, 3) || [];

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 animate-pulse">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-800">Recent Bookings</CardTitle>
          {bookings?.length > 3 && (
            <Link to="/my-bookings">
              <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {recentBookings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No bookings found</p>
          ) : (
            recentBookings.map((booking: any) => (
              <div key={booking.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">{booking.service_provider_service.service.name}</h4>
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(booking.date)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{booking.time_slot}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{booking.user.room_number}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{booking.user.username}</span>
                  <div className="flex space-x-2">
                    {booking.status === 'confirmed' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          onClick={() => setSelectedBookingForReschedule(booking)}
                        >
                          Reschedule
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs text-red-600 hover:text-red-700"
                          onClick={() => cancelBooking.mutate(booking._id)}
                          disabled={cancelBooking.isPending}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {booking.status === 'completed' && !booking.rating && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => setSelectedBookingForReview(booking)}
                      >
                        Rate Service
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={!!selectedBookingForReschedule}
        onClose={() => setSelectedBookingForReschedule(null)}
        booking={selectedBookingForReschedule}
      />

      {/* Review Modal */}
      {selectedBookingForReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <ReviewForm
              bookingId={selectedBookingForReview._id}
              serviceName={selectedBookingForReview.service_name}
              onReviewSubmitted={handleReviewSubmitted}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default RecentBookings;