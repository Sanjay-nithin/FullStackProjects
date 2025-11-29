
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  authAPI, 
  getAuthToken, 
  setAuthToken, 
  removeAuthToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  serviceProviderAPI 
} from '@/services/api';

interface User {
  id: string;
  email: string;
  username: string;
  room_number: string;
  is_superuser?: boolean;
  is_serviceprovider?: boolean;
  service_provider_id?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { email: string; password: string; username: string; room_number: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const userData = await authAPI.getProfile();
      // Check if user is a service provider
      if (userData.is_serviceprovider) {
        try {
          const providerData = await serviceProviderAPI.getProfile();
          userData.service_provider_id = providerData.id;
        } catch (error) {
          console.error('Failed to load service provider data:', error);
        }
      }
      
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
      removeAuthToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authAPI.login({ email, password });
    setAuthToken(response.tokens.access);
    setRefreshToken(response.tokens.refresh);

    // Check if user is a service provider
    if (response.user.is_serviceprovider) {
      try {
        const providerData = await serviceProviderAPI.getProfile();
        response.user.service_provider_id = providerData.id;
      } catch (error) {
        console.error('Failed to load service provider data:', error);
      }
    }
    
    setUser(response.user);
  };

  const register = async (userData: { email: string; password: string; username: string; room_number: string }) => {
    const response = await authAPI.register(userData);
    setAuthToken(response.tokens.access);
    setRefreshToken(response.tokens.refresh);
    setUser(response.user);
  };

  const logout = () => {
    removeAuthToken();
    removeRefreshToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
