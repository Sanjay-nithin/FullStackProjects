import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Clock, Calendar as CalendarIcon, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { servicesAPI } from '@/services/api';

const BookingForm = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const fetchUnavailableSlots = async () => {
      if (!selectedDate) return;
      setLoadingSlots(true);
      try {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const data = await servicesAPI.getUnavailableSlots(serviceId!, formattedDate);
        setUnavailableSlots(data.unavailable_slots);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load unavailable time slots.',
          variant: 'destructive'
        });
      } finally {
        setLoadingSlots(false);
      }
    };
  
    fetchUnavailableSlots();
  }, [selectedDate, serviceId, toast]);

  const allTimeSlots = [
    '08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', 
    '16:00-18:00'
  ];

  // Compute based on unavailableSlots:
  const availableTimeSlots = allTimeSlots.map(time => ({
    time,
    available: !unavailableSlots.includes(time),
  }));

  const handleBookService = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      toast({
        title: 'Missing Information',
        description: 'Please select both date and time slot.',
        variant: 'destructive'
      });
      return;
    }

    setIsBooking(true);
    try {
      await servicesAPI.book({
        service_id: serviceId!,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time_slot: selectedTimeSlot,
        special_instructions: specialInstructions
      });

      // Invalidate the bookings cache to force a refetch
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });

      toast({
        title: 'Booking Confirmed!',
        description: 'Your service has been booked successfully.',
      });

      navigate('/');
    } catch (error) {
      toast({
        title: 'Booking Failed',
        description: 'There was an error booking your service. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Header />
        
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Services
            </Button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Book Your Service
              </span>
            </h1>
            <p className="text-xl text-gray-600">
              Select your preferred date and time
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calendar Section */}
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Select Date
                </CardTitle>
                <CardDescription>
                  Choose an available date for your service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  className="rounded-md border pointer-events-auto"
                />
              </CardContent>
            </Card>

            {/* Time Slots Section */}
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Select Time
                </CardTitle>
                <CardDescription>
                  Available time slots for {selectedDate ? format(selectedDate, 'PPP') : 'selected date'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDate ? (
                  <div className="grid grid-cols-2 gap-3">
                    {availableTimeSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={selectedTimeSlot === slot.time ? "default" : "outline"}
                        disabled={!slot.available}
                        onClick={() => setSelectedTimeSlot(slot.time)}
                        className={`${
                          slot.available 
                            ? selectedTimeSlot === slot.time 
                              ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white' 
                              : 'border-green-300 hover:bg-green-50'
                            : 'border-red-300 bg-red-50 text-red-400 cursor-not-allowed'
                        }`}
                      >
                        {slot.time}
                        {selectedTimeSlot === slot.time && (
                          <CheckCircle className="h-4 w-4 ml-2" />
                        )}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Please select a date first
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Special Instructions */}
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg mt-8">
            <CardHeader>
              <CardTitle>Special Instructions</CardTitle>
              <CardDescription>
                Any specific requirements or notes for your service (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter any special instructions here..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Booking Summary & Confirm */}
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg mt-8">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-6">
                <p><strong>Date:</strong> {selectedDate ? format(selectedDate, 'PPP') : 'Not selected'}</p>
                <p><strong>Time:</strong> {selectedTimeSlot || 'Not selected'}</p>
                {specialInstructions && (
                  <p><strong>Instructions:</strong> {specialInstructions}</p>
                )}
              </div>
              <Button
                onClick={handleBookService}
                disabled={!selectedDate || !selectedTimeSlot || isBooking}
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium py-3 rounded-xl transition-all duration-300"
              >
                {isBooking ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default BookingForm;
