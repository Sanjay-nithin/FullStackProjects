
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CategoryCardProps {
  category: {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    bgColor: string;
    keywords: string[];
  };
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  const navigate = useNavigate();
  const Icon = category.icon;

  const handleViewServices = () => {
    navigate(`/category/${category.id}`);
  };

  return (
    <Card className={`${category.bgColor} backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-700 group hover:-translate-y-3 hover:scale-105 cursor-pointer transform-gpu`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl text-white group-hover:scale-125 transition-all duration-500 group-hover:rotate-12 group-hover:shadow-xl">
            <Icon className="h-8 w-8" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center text-gray-800 group-hover:text-primary transition-colors duration-500 group-hover:scale-105">
          {category.title}
        </CardTitle>
        <CardDescription className="text-center text-gray-600 text-lg group-hover:text-gray-800 transition-all duration-500 group-hover:scale-102">
          {category.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="text-center">
        <Button 
          onClick={handleViewServices}
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium px-8 py-3 rounded-xl transition-all duration-500 hover:scale-110 hover:shadow-2xl group-hover:animate-bounce-gentle transform-gpu"
        >
          {category.id === 'ai' ? 'Start Voice Chat' : 'View Services'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;
