
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Star, Wrench, Shirt, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  price: string;
  duration: string;
  rating: number;
  availability: string;
}

const ServiceCard = ({ 
  id,
  title, 
  description, 
  price, 
}: ServiceCardProps) => {
  const navigate = useNavigate();

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes('laundry')) return <Shirt className="h-6 w-6" />;
    if (name.includes('cleaning')) return <Sparkles className="h-6 w-6" />;
    return <Wrench className="h-6 w-6" />;
  };

  const handleBook = () => {
    navigate(`/book/${id}`);
  };

  return (
    <Card className="service-card group cursor-pointer hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border border-white/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="p-3 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl text-white group-hover:scale-110 transition-transform duration-300">
            {getServiceIcon(title)}
          </div>
          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
            {true}
          </Badge>
        </div>
        <CardTitle className="text-xl font-semibold text-gray-800">{title}</CardTitle>
        <CardDescription className="text-gray-600">{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{"Two Hours"}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{3.331.toFixed(1)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-600">
            ₹{price}
          </div>
          <Button 
            onClick={handleBook}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium px-6 py-2 rounded-xl transition-all duration-300 hover:scale-105"
          >
            Book Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;
