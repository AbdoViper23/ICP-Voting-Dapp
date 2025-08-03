import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { voting_app_backend } from 'declarations/voting-app-backend';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [authClient, setAuthClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState(null);
  const [actor, setActor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth client
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const client = await AuthClient.create();
      setAuthClient(client);
      
      const isAuth = await client.isAuthenticated();
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        await updateActor(client);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateActor = async (client = authClient) => {
    if (!client) return;
    
    try {
      const identity = client.getIdentity();
      const newActor = voting_app_backend;
      
      // Update the actor with the authenticated identity
      Object.defineProperty(newActor, 'agent', {
        value: {
          ...newActor.agent,
          identity
        }
      });
      
      setActor(newActor);
      
      // Get principal
      const principalId = identity.getPrincipal().toString();
      setPrincipal(principalId);
    } catch (error) {
      console.error('Error updating actor:', error);
    }
  };

  const login = async () => {
    if (!authClient) return;
    
    const network = process.env.DFX_NETWORK;
    const identityProvider =
      network === 'ic'
        ? 'https://identity.ic0.app' // Mainnet
        : 'http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943'; // Local

    await authClient.login({
      identityProvider,
      onSuccess: async () => {
        setIsAuthenticated(true);
        await updateActor();
      }
    });
  };

  const logout = async () => {
    if (!authClient) return;
    
    await authClient.logout();
    setIsAuthenticated(false);
    setPrincipal(null);
    setActor(null);
  };

  const value = {
    authClient,
    isAuthenticated,
    principal,
    actor,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 