
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useStats';

const QuickStats = () => {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: 'Upcoming Bookings',
      value: stats?.upcoming_bookings || '0',
      icon: <Calendar className="h-5 w-5" />,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'In Progress',
      value: stats?.in_progress || '0',
      icon: <Clock className="h-5 w-5" />,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Completed',
      value: stats?.completed || '0',
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Pending Review',
      value: stats?.pending_review || '0',
      icon: <AlertCircle className="h-5 w-5" />,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <div className={stat.textColor}>
                  {stat.icon}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuickStats;
