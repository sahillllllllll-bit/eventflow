import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'eg_attendee';

const AttendeeContext = createContext(null);

// ─────────────────────────────────────────────────────────────
//  Reads attendee from localStorage, checks expiry
// ─────────────────────────────────────────────────────────────
const readStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Check expiry
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

export const AttendeeProvider = ({ children }) => {
  const [attendee, setAttendeeState] = useState(() => readStorage());

  // Save to localStorage with expiry
  const setAttendee = useCallback((data) => {
    if (!data) {
      localStorage.removeItem(STORAGE_KEY);
      setAttendeeState(null);
      return;
    }
    // Default expiry: 4 days from now if not provided
    const expiresAt = data.expiresAt || new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();
    const toStore = { ...data, expiresAt };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    setAttendeeState(toStore);
  }, []);

  // Extend expiry when user joins a new event
  const extendExpiry = useCallback((newExpiresAt) => {
    if (!attendee) return;
    const current = new Date(attendee.expiresAt || 0);
    const next = new Date(newExpiresAt || Date.now() + 4 * 24 * 60 * 60 * 1000);
    // Only extend, never shorten
    if (next > current) {
      setAttendee({ ...attendee, expiresAt: next.toISOString() });
    }
  }, [attendee, setAttendee]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAttendeeState(null);
  }, []);

  // Check expiry on focus (catches tab reopen)
  useEffect(() => {
    const check = () => {
      const fresh = readStorage();
      if (!fresh && attendee) setAttendeeState(null);
    };
    window.addEventListener('focus', check);
    return () => window.removeEventListener('focus', check);
  }, [attendee]);

  const isLoggedIn = !!attendee?.userId;

  return (
    <AttendeeContext.Provider value={{ attendee, setAttendee, extendExpiry, logout, isLoggedIn }}>
      {children}
    </AttendeeContext.Provider>
  );
};

export const useAttendee = () => {
  const ctx = useContext(AttendeeContext);
  if (!ctx) throw new Error('useAttendee must be used inside AttendeeProvider');
  return ctx;
};