
import React, { useEffect, useRef, useState } from 'react';

interface AnimatedSectionProps {
  children: React.ReactNode;
  animation?: 'fade-in' | 'slide-up' | 'slide-left' | 'slide-right' | 'scale-in';
  delay?: number;
  className?: string;
}

const AnimatedSection = ({ 
  children, 
  animation = 'fade-in', 
  delay = 0, 
  className = '' 
}: AnimatedSectionProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  const animationClasses = {
    'fade-in': 'animate-fade-in',
    'slide-up': 'animate-slide-in-up',
    'slide-left': 'animate-slide-in-left',
    'slide-right': 'animate-slide-in-right',
    'scale-in': 'animate-scale-in'
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? animationClasses[animation] : 'opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;
