
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { bookingsAPI } from '@/services/api';

interface ReviewFormProps {
  bookingId: string;
  serviceName: string;
  onReviewSubmitted: () => void;
}

const ReviewForm = ({ bookingId, serviceName, onReviewSubmitted }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a rating before submitting.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await bookingsAPI.rate(bookingId, {
        rating,
        comment
      });

      toast({
        title: 'Review Submitted!',
        description: 'Thank you for your feedback.',
      });

      onReviewSubmitted();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle>Rate Your Experience</CardTitle>
        <CardDescription>
          How was your experience with {serviceName}?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Star Rating */}
        <div>
          <p className="text-sm font-medium mb-3">Rating</p>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-colors duration-200"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <p className="text-sm font-medium mb-3">Comment (Optional)</p>
          <Textarea
            placeholder="Share your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmitReview}
          disabled={rating === 0 || isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium py-2 rounded-xl transition-all duration-300"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;
