import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../api/endpoints.js';

export const AuthContext = createContext();

// Sanitize string: strip HTML tags, trim whitespace, limit length
const sanitizeString = (str, maxLength = 255) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')           // strip HTML tags
    .replace(/['"`;\\]/g, '')           // strip SQL/injection chars
    .trim()
    .slice(0, maxLength);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const register = async (data) => {
    setError(null);

    // Sanitize all inputs before sending
    const sanitizedData = {
      name: sanitizeString(data.name, 100),
      email: sanitizeString(data.email, 254).toLowerCase(),
      college: sanitizeString(data.college, 150),
      phone: sanitizeString(data.phone, 20).replace(/[^0-9+\-\s()]/g, ''),
      password: data.password, // Do NOT sanitize password — let backend hash it as-is
    };

    // Make API call — separate from state updates so errors don't cross-contaminate
    let response;
    try {
      response = await authAPI.register(sanitizedData);
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      throw err;
    }

    // API succeeded — now safely update state
    // These are synchronous and won't fail, but wrap just in case
    try {
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(token);
      setUser(user);
    } catch {
      // State update failed but registration succeeded — still return success
    }

    return response.data;
  };

  const login = async (email, password) => {
    setError(null);

    const sanitizedEmail = sanitizeString(email, 254).toLowerCase();

    let response;
    try {
      response = await authAPI.login({ email: sanitizedEmail, password });
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      throw err;
    }

    try {
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(token);
      setUser(user);
    } catch {
      // State update failed but login succeeded
    }

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.me();
      const userData = response.data.user;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      logout();
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, register, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};