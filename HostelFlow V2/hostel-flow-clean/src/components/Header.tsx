
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, LogIn, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationsAPI } from '@/services/api';
import NotificationSidebar from './NotificationSidebar';

interface Notification {
  id: number;
  message: string;
  created_at: string;
  read: boolean;
  booking: number;
}

const Header = () => {
  const { user, logout } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Fetch notifications to show unread count
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: notificationsAPI.getUserNotifications,
    enabled: !!user, // Only fetch if user is logged in
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">HS</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">HostelFlow</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notification Bell */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsNotificationOpen(true)}
                  className="relative"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>

                {/* Profile Icon */}
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>

                {/* Logout Icon */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost">
                  <Link to="/login" className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Link>
                </Button>
                <Button asChild className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                  <Link to="/register" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Sign Up
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification Sidebar */}
      <NotificationSidebar 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)} 
      />
    </>
  );
};

export default Header;
