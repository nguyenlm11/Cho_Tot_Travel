import React, { createContext, useState, useContext, useCallback } from 'react';
import authApi from '../services/api/authApi';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [userData, setUserData] = useState(null);

  const refreshUserData = useCallback(async () => {
    try {
      const user = await authApi.getCurrentUser();
      setUserData(user);
      return user;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return null;
    }
  }, []);

  return (
    <UserContext.Provider value={{ userData, refreshUserData }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext); 