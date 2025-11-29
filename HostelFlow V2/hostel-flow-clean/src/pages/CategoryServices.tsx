
import { useParams, useNavigate } from 'react-router-dom';
import { useServices } from '@/hooks/useServices';
import Header from '@/components/Header';
import ServiceCard from '@/components/ServiceCard';
import Chatbot from '@/components/Chatbot';
import ProtectedRoute from '@/components/ProtectedRoute';
import AnimatedSection from '@/components/AnimatedSection';
import LoadingSpinner from '@/components/LoadingSpinner';
import LoadingBar from '@/components/LoadingBar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

const CategoryServices = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { data: services, isLoading } = useServices();
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const categoryNames = {
    laundry: 'Smart Laundry',
    cleaning: 'Room Cleaning',
    study: 'Study Spaces',
    repair: 'Room Repairs',
    tech: 'Tech Support',
    ai: 'AI Voice Assistant'
  };

  const filterServicesByCategory = (services: any[], categoryId: string) => {
    const keywords = {
      laundry: ['laundry', 'wash', 'dry', 'clean'],
      cleaning: ['cleaning', 'clean', 'housekeeping'],
      study: ['study', 'library', 'reading'],
      repair: ['repair', 'fix', 'maintenance'],
      tech: ['tech', 'wifi', 'computer', 'technical'],
      ai: ['ai', 'smart', 'booking', 'intelligent', 'voice']
    };

    const categoryKeywords = keywords[categoryId as keyof typeof keywords] || [];
    
    return services?.filter(service => 
      categoryKeywords.some(keyword => 
        service.name.toLowerCase().includes(keyword) || 
        service.description.toLowerCase().includes(keyword)
      )
    ) || [];
  };

  const filteredServices = filterServicesByCategory(services || [], categoryId || '');
  const categoryName = categoryNames[categoryId as keyof typeof categoryNames] || 'Services';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <AnimatedSection animation="slide-right" delay={0}>
            <div className="flex items-center mb-8">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="mr-4 hover-scale"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Categories
              </Button>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="fade-in" delay={100}>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 animate-slide-in-up">
                <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  {categoryName}
                </span>
              </h1>
              <p className="text-xl text-gray-600 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                {categoryId === 'ai' 
                  ? 'Chat with our AI voice assistant for smart booking help'
                  : `Choose from our available ${categoryName.toLowerCase()} services`
                }
              </p>
            </div>
          </AnimatedSection>

          {/* Show Chatbot for AI category */}
          {categoryId === 'ai' ? (
            <AnimatedSection animation="scale-in" delay={200}>
              <Chatbot />
            </AnimatedSection>
          ) : (
            <>
              {isLoading ? (
                <div className="space-y-6">
                  <LoadingBar 
                    progress={loadingProgress} 
                    label="Loading services..." 
                    className="max-w-md mx-auto"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                        <div className="h-32 bg-gray-200 rounded mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map((service: any, index: number) => (
                    <AnimatedSection
                      key={service.id}
                      animation="slide-up"
                      delay={index * 100}
                    >
                      <ServiceCard
                        id={service.id}
                        title={service.name}
                        description={service.description}
                        price={service.price}
                        duration={service.duration}
                        rating={service.rating}
                        availability={service.availability}
                      />
                    </AnimatedSection>
                  ))}
                </div>
              ) : (
                <AnimatedSection animation="fade-in" delay={200}>
                  <div className="text-center py-12">
                    <p className="text-xl text-gray-600 mb-4">
                      No services available in this category yet.
                    </p>
                    <p className="text-gray-500">Check back soon for updates!</p>
                  </div>
                </AnimatedSection>
              )}
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default CategoryServices;
