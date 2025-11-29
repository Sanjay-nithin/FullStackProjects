
import Header from '@/components/Header';
import QuickStats from '@/components/QuickStats';
import RecentBookings from '@/components/RecentBookings';
import ProtectedRoute from '@/components/ProtectedRoute';
import CategoryCard from '@/components/CategoryCard';
import AnimatedSection from '@/components/AnimatedSection';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Shirt, Sparkles, BookOpen, Wrench, Laptop, Bot } from 'lucide-react';
import { useState, useEffect } from 'react';

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const categories = [
    {
      id: 'laundry',
      title: 'Smart Laundry',
      description: 'Professional laundry and dry cleaning services',
      icon: Shirt,
      bgColor: 'bg-blue-50/80',
      keywords: ['laundry', 'wash', 'dry', 'clean']
    },
    {
      id: 'cleaning',
      title: 'Room Cleaning',
      description: 'Complete room and housekeeping services',
      icon: Sparkles,
      bgColor: 'bg-green-50/80',
      keywords: ['cleaning', 'clean', 'housekeeping']
    },
    {
      id: 'study',
      title: 'Study Spaces',
      description: 'Library and study area bookings',
      icon: BookOpen,
      bgColor: 'bg-purple-50/80',
      keywords: ['study', 'library', 'reading']
    },
    {
      id: 'repair',
      title: 'Room Repairs',
      description: 'Maintenance and repair services',
      icon: Wrench,
      bgColor: 'bg-orange-50/80',
      keywords: ['repair', 'fix', 'maintenance']
    },
    {
      id: 'tech',
      title: 'Tech Support',
      description: 'Technical assistance and IT support',
      icon: Laptop,
      bgColor: 'bg-indigo-50/80',
      keywords: ['tech', 'wifi', 'computer', 'technical']
    },
    {
      id: 'ai',
      title: 'AI Voice Assistant',
      description: 'Smart voice-enabled booking assistance',
      icon: Bot,
      bgColor: 'bg-pink-50/80',
      keywords: ['ai', 'smart', 'booking', 'intelligent', 'voice']
    }
  ];

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading HostelFlow..." />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <AnimatedSection animation="fade-in" delay={0}>
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-slide-in-up">
                <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  Welcome to HostelFlow
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                Your one-stop solution for laundry pickup, room cleaning, study spaces, repairs, tech support, and intelligent voice-enabled booking assistance.
              </p>
            </div>
          </AnimatedSection>

          {/* Quick Stats */}
          <AnimatedSection animation="slide-up" delay={100}>
            <QuickStats />
          </AnimatedSection>

          {/* Service Categories */}
          <AnimatedSection animation="fade-in" delay={200}>
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
                Our Enhanced Services
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.map((category, index) => (
                  <AnimatedSection
                    key={category.id}
                    animation="scale-in"
                    delay={500 + index * 100}
                  >
                    <CategoryCard category={category} />
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* Recent Bookings */}
          <AnimatedSection animation="slide-up" delay={330}>
            <RecentBookings />
          </AnimatedSection>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Index;
