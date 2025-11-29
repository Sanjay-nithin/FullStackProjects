import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/services/api';
import { Checkbox } from '@/components/ui/checkbox';

interface ServiceProviderFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const predefined_services = {
  1: 'Laundry',
  2: 'Room Cleaning',
  3: 'Study Spaces',
  4: 'Room Repairs',
  5: 'Tech Support',
};

const ServiceProviderForm = ({ isOpen, onClose }: ServiceProviderFormProps) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    services: [] as string[],
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]); // temporary selection
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createProviderMutation = useMutation({
    mutationFn: adminAPI.createServiceProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'service-providers'] });
      toast({
        title: 'Success',
        description: 'Service provider created successfully.',
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      let message = 'Failed to create service provider.';

      if (error.data) {
        if (error.data.error) {
          message = error.data.error;
        } else if (typeof error.data === 'string') {
          message = error.data;
        } else if (error.data.detail) {
          message = error.data.detail;
        }
      } else if (error.message) {
        message = error.message;
      }

      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      phone: '',
      services: [],
    });
    setSelectedServices([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.services.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one service.',
        variant: 'destructive',
      });
      return;
    }
    createProviderMutation.mutate(formData);
  };

  const toggleSelection = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const addSelectedServices = () => {
    setFormData((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        ...selectedServices.filter((s) => !prev.services.includes(s)),
      ],
    }));
    setSelectedServices([]); // clear temp
  };

  const removeService = (serviceToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((service) => service !== serviceToRemove),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-[95%] sm:max-w-md p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add Service Provider</DialogTitle>
          <DialogDescription>
            Create a new service provider profile
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, username: e.target.value }))
              }
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              required
            />
          </div>

          {/* Services */}
          <div className="space-y-7">
            <Label>Services</Label>

            {/* Choice Selection (checkboxes) */}
            <div className="grid grid-cols-2 gap-7">
              {Object.values(predefined_services).map((service, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <Checkbox
                    id={service}
                    checked={selectedServices.includes(service)}
                    onCheckedChange={() => toggleSelection(service)}
                  />
                  <Label htmlFor={service}>{service}</Label>
                </div>
              ))}
            </div>

            {/* Temporary selection */}
            {selectedServices.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedServices.map((service, index) => (
                  <Badge key={index} variant="outline">
                    {service}
                  </Badge>
                ))}
              </div>
            )}
            <p>Click the add button to finalize the selected services</p>
            <Button
              type="button"
              onClick={addSelectedServices}
              disabled={selectedServices.length === 0}
              variant="outline"
            >
              Add
            </Button>

            {/* Final list */}
            {formData.services.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.services.map((service, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {service}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeService(service)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProviderMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              {createProviderMutation.isPending ? 'Creating...' : 'Create Provider'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceProviderForm;
