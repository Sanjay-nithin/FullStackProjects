
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface LoadingBarProps {
  progress: number;
  label?: string;
  className?: string;
}

const LoadingBar = ({ progress, label, className = '' }: LoadingBarProps) => {
  return (
    <div className={`w-full space-y-2 ${className}`}>
      {label && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{label}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <Progress 
        value={progress} 
        className="w-full h-2 animate-fade-in"
      />
    </div>
  );
};

export default LoadingBar;
