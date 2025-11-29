import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar as CalendarIcon, Search, Filter, X, MapPin, Clock } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { useMyBookings } from '@/hooks/useBookings';
import Header from '@/components/Header';

interface Booking {
  id: number;
  service_provider_service?: {
    service?: {
      name: string;
    };
  };
  date: string;
  time_slot: string;
  status: string;
  user?: {
    username: string;
    room_number: string;
  };
}

const MyBookings = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

  const { data: bookings = [], isLoading } = useMyBookings();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Booked':
        return 'bg-blue-500 text-white';
      case 'In Progress':
        return 'bg-yellow-500 text-white';
      case 'Completed':
        return 'bg-green-500 text-white';
      case 'Cancelled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((booking: Booking) => {
    const serviceName = booking.service_provider_service?.service?.name?.toLowerCase() || '';
    const timeSlot = booking.time_slot?.toLowerCase() || '';
    const userName = booking.user?.username?.toLowerCase() || '';
    
    const matchesSearch =
      searchTerm === '' ||
      serviceName.includes(searchTerm.toLowerCase()) ||
      timeSlot.includes(searchTerm.toLowerCase()) ||
      userName.includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || booking.status === statusFilter;

    const matchesRoom =
      roomFilter === '' ||
      booking.user?.room_number?.toString() === roomFilter;

    const matchesDate =
      !dateFilter || booking.date === format(dateFilter, 'yyyy-MM-dd');

    return matchesSearch && matchesStatus && matchesRoom && matchesDate;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setRoomFilter('');
    setDateFilter(undefined);
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'all' ||
    roomFilter !== '' ||
    dateFilter !== undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            My Bookings
          </h1>
          <p className="text-gray-600 mt-2">
            View and manage all your service bookings
          </p>
        </div>

        {/* Filters Section */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5 text-blue-600" />
                Filters
              </CardTitle>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by service, time, or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Booked">Booked</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Room Number Filter */}
              <Input
                placeholder="Filter by room number"
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
              />

              {/* Date Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !dateFilter && 'text-muted-foreground'
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFilter ? format(dateFilter, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">
              All Bookings ({filteredBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 mt-4">Loading bookings...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {hasActiveFilters
                    ? 'No bookings match your filters'
                    : 'No bookings found'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time Slot</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking: Booking) => (
                      <TableRow key={booking.id} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium">
                          {booking.service_provider_service?.service?.name ||
                            'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                            {booking.date}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {booking.time_slot}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {booking.user?.room_number || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyBookings;
