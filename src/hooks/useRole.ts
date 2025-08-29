import React, { useState, useEffect } from 'react';
import { UserService } from '@/services/userService';
import { useAuth } from '@/contexts/AuthContext';

export const useRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isDisplay, setIsDisplay] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserRoles = async () => {
      if (!user) {
        setRoles([]);
        setIsAdmin(false);
        setIsClient(false);
        setIsDisplay(false);
        setIsLoading(false);
        return;
      }

      try {
        const { success, roles: userRoles } = await UserService.getUserRoles();
        
        if (success && userRoles) {
          const roleNames = userRoles.map(r => r.role);
          setRoles(roleNames);
          setIsAdmin(roleNames.includes('admin'));
          setIsClient(roleNames.includes('client'));
          setIsDisplay(roleNames.includes('display'));
        }
      } catch (error) {
        console.error('Error loading user roles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserRoles();
  }, [user]);

  const hasRole = (role: 'admin' | 'client' | 'display') => {
    return roles.includes(role);
  };

  return {
    roles,
    isAdmin,
    isClient,
    isDisplay,
    isLoading,
    hasRole
  };
};