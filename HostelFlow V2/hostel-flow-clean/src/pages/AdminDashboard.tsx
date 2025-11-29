import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Users, Calendar, UserPlus, Settings, Search, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { adminAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import ServiceProviderForm from '@/components/ServiceProviderForm';

const AdminDashboard = () => {
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['admin', 'bookings'],
    queryFn: adminAPI.getAllBookings,
    refetchOnWindowFocus: false,   
    refetchOnReconnect: false,  
    retry: 1,                 
    staleTime: 1000 * 60, 
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminAPI.getAllUsers,
    refetchOnWindowFocus: false,   
    refetchOnReconnect: false,  
    retry: 1,                 
    staleTime: 1000 * 60, 
  });

  const { data: serviceProviders, isLoading: providersLoading } = useQuery({
    queryKey: ['admin', 'service-providers'],
    queryFn: adminAPI.getServiceProviders,
    refetchOnWindowFocus: false,   
    refetchOnReconnect: false,  
    retry: 1,                 
    staleTime: 1000 * 60, 
  });
  
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

  const updateStatusMutation = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: number; status: string }) =>
      adminAPI.updateBookingStatus(bookingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      toast({
        title: 'Success',
        description: 'Booking status updated successfully. User has been notified.',
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

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => adminAPI.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({
        title: 'Success',
        description: 'User deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.data?.error || 'Failed to delete user.',
        variant: 'destructive',
      });
    },
  });

  const deleteProviderMutation = useMutation({
    mutationFn: (providerId: string) => adminAPI.deleteServiceProvider(providerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'service-providers'] });
      toast({
        title: 'Success',
        description: 'Service provider deleted successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete service provider.',
        variant: 'destructive',
      });
    },
  });

  const handleStatusChange = (bookingId: number, newStatus: string) => {
    updateStatusMutation.mutate({ bookingId, status: newStatus });
  };

  const handleDeleteUser = (userId: number, username: string) => {
    if (confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleDeleteProvider = (providerId: string, providerName: string) => {
    if (confirm(`Are you sure you want to delete service provider "${providerName}"? This action cannot be undone.`)) {
      deleteProviderMutation.mutate(providerId);
    }
  };

  // Filter bookings
  const filteredBookings = (bookings || []).filter((booking: any) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, bookings, and service providers</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Active users in system</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings?.length || 0}</div>
              <p className="text-xs text-muted-foreground">All time bookings</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Service Providers</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serviceProviders?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Active providers</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="providers">Service Providers</TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            {/* Filters Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
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
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>All Bookings ({filteredBookings.length})</CardTitle>
                <CardDescription>Manage and view all user bookings</CardDescription>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="text-center py-8">Loading bookings...</div>
                ) : filteredBookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {hasActiveFilters ? 'No bookings match your filters' : 'No bookings found'}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Room</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((booking: any) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">
                            {booking.service_provider_service?.service?.name || 'N/A'}
                          </TableCell>
                          <TableCell>{booking.user?.username || 'N/A'}</TableCell>
                          <TableCell>{formatDate(booking.date)}</TableCell>
                          <TableCell>{booking.time_slot}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>{booking.user?.room_number || 'N/A'}</TableCell>
                          
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>View all registered users</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-8">Loading users...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Room Number</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.filter((user: any) => !user.is_superuser).map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.room_number}</TableCell>
                          <TableCell>
                          <Badge variant="secondary">
                            {user.is_serviceprovider ? 'Service Provider' : 'Student'}
                          </Badge>
                          </TableCell>
                          <TableCell>
                            {!user.is_serviceprovider && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteUser(user.id, user.username)}
                                disabled={deleteUserMutation.isPending}
                              >
                                Delete
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Service Providers Tab */}
          <TabsContent value="providers" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Service Providers</CardTitle>
                    <CardDescription>Manage service providers</CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowProviderForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Provider
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {providersLoading ? (
                  <div className="text-center py-8">Loading providers...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Services</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviceProviders?.map((provider: any) => (
                        <TableRow key={provider.id}>
                          <TableCell className="font-medium">{provider.name}</TableCell>
                          <TableCell>{provider.email}</TableCell>
                          <TableCell>{provider.phone}</TableCell>
                          <TableCell>
                            {provider.services?.map((s: any) => s.service.name).join(", ")}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteProvider(provider.id, provider.name)}
                              disabled={deleteProviderMutation.isPending}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Service Provider Form Modal */}
      {showProviderForm && (
        <ServiceProviderForm
          isOpen={showProviderForm}
          onClose={() => setShowProviderForm(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
