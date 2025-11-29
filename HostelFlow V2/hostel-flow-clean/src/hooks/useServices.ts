
import { useQuery } from '@tanstack/react-query';
import { servicesAPI } from '@/services/api';

export const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: servicesAPI.getAll,
    refetchOnWindowFocus: false,       
    refetchOnReconnect: false,     
    retry: 1,                      
    staleTime: 1000 * 60, 
  });
};
