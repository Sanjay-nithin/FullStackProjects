
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { serviceProviderAPI } from '@/services/api';
import { Calendar, CheckCircle, Clock, Wrench, Search, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Booking {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    room_number: string;
  };
  service_provider_service: {
    id: number;
    service: {
      id: number;
      name: string;
      description: string;
      price: string;
    };
    availability: boolean;
  };
  date: string;
  time_slot: string;
  status: string;
  special_instructions?: string;
  comment?: string;
}

const ServiceProviderDashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [stats, setStats] = useState({
    pending: 0,
    in_progress: 0,
    completed: 0,
    total_today: 0,
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const bookingsData = await serviceProviderAPI.getAssignedBookings();

      setBookings(bookingsData);
      
      // Calculate stats from bookings
      const today = new Date().toDateString();
      const todayBookings = bookingsData.filter((b: Booking) => 
        new Date(b.date).toDateString() === today
      );
      
      setStats({
        pending: bookingsData.filter((b: Booking) => b.status === 'Booked').length,
        in_progress: bookingsData.filter((b: Booking) => b.status === 'In Progress').length,
        completed: bookingsData.filter((b: Booking) => b.status === 'Completed').length,
        total_today: todayBookings.length,
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: number, newStatus: string) => {
    try {
      await serviceProviderAPI.updateBookingStatus(bookingId.toString(), newStatus);
      
      toast({
        title: 'Success',
        description: `Booking status updated to ${newStatus}`,
      });
      
      loadData(); // Refresh data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update booking status.',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Booked':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Service Provider Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.username}! Manage your assigned bookings and track your progress.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.in_progress}</p>
                  </div>
                  <Wrench className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Total</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.total_today}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Section */}
          <Card className="mb-6 bg-white/80 backdrop-blur-sm">
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
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateFilter ? format(dateFilter, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
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
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Assigned Bookings ({filteredBookings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredBookings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {hasActiveFilters ? 'No bookings match your filters' : 'No bookings assigned'}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          {booking.service_provider_service?.service?.name || 'N/A'}
                        </TableCell>
                        <TableCell>{booking.user?.username || 'N/A'}</TableCell>
                        <TableCell>{booking.user?.room_number || 'N/A'}</TableCell>
                        <TableCell>{formatDate(booking.date)}</TableCell>
                        <TableCell>{booking.time_slot}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {booking.status === 'Booked' && (
                              <Button
                                size="sm"
                                onClick={() => updateBookingStatus(booking.id, 'In Progress')}
                                className="bg-yellow-600 hover:bg-yellow-700"
                              >
                                Start
                              </Button>
                            )}
                            {booking.status === 'In Progress' && (
                              <Button
                                size="sm"
                                onClick={() => updateBookingStatus(booking.id, 'Completed')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ServiceProviderDashboard;
