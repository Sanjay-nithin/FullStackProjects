
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useRescheduleBooking } from '@/hooks/useBookings';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

const RescheduleModal = ({ isOpen, onClose, booking }: RescheduleModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const rescheduleBooking = useRescheduleBooking();

  const timeSlots = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '14:00-15:00', '15:00-16:00', '16:00-17:00',
    '18:00-19:00', '19:00-20:00'
  ];

  const handleReschedule = () => {
    if (!selectedDate || !selectedTimeSlot) return;

    const formattedDate = selectedDate.toISOString().split('T')[0];
    rescheduleBooking.mutate({
      bookingId: booking._id,
      newDateTime: {
        date: formattedDate,
        time_slot: selectedTimeSlot
      }
    }, {
      onSuccess: () => {
        onClose();
        setSelectedDate(undefined);
        setSelectedTimeSlot('');
      }
    });
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule Booking</DialogTitle>
          <DialogDescription>
            Select a new date and time for your {booking?.service_name} booking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Selection */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Select Date
            </h4>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={isDateDisabled}
              className="rounded-md border"
            />
          </div>

          {/* Time Slot Selection */}
          {selectedDate && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Select Time
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={selectedTimeSlot === slot ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTimeSlot(slot)}
                    className="text-sm"
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!selectedDate || !selectedTimeSlot || rescheduleBooking.isPending}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              {rescheduleBooking.isPending ? 'Rescheduling...' : 'Reschedule'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleModal;
