import { X, Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: number;
  message: string;
  created_at: string;
  read: boolean;
  booking: number;
}

interface NotificationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSidebar = ({ isOpen, onClose }: NotificationSidebarProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: notificationsAPI.getUserNotifications,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationsAPI.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsAPI.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    },
  });

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId.toString());
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-green-600">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-white" />
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
              {unreadCount > 0 && (
                <span className="bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Mark all as read button */}
          {unreadCount > 0 && (
            <div className="p-3 border-b bg-gray-50">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
                className="w-full"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            </div>
          )}

          {/* Notifications list */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Bell className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 transition-colors hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${
                            !notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'
                          }`}
                        >
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="flex-shrink-0 h-8 w-8 p-0"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </>
  );
};

export default NotificationSidebar;
