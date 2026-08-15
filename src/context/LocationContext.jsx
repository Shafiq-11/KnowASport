import React, { createContext, useContext, useState, useEffect } from 'react';
import { MAJOR_CITIES } from '../utils/constants.js';

const LocationContext = createContext(undefined);

export function LocationProvider({ children }) {
  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem('kas_user_city') || 'Coimbatore';
  });

  const [geoState, setGeoState] = useState({
    loading: false,
    error: null,
    permission: 'prompt',
  });

  useEffect(() => {
    if (selectedCity) {
      localStorage.setItem('kas_user_city', selectedCity);
    } else {
      localStorage.removeItem('kas_user_city');
    }
  }, [selectedCity]);

  const setCity = (cityName) => {
    setSelectedCity(cityName);
  };

  const clearCity = () => {
    setSelectedCity('');
  };

  // Mock auto-detection simulation
  const detectLocation = () => {
    setGeoState({ loading: true, error: null, permission: 'granted' });
    setTimeout(() => {
      // Pick Coimbatore as detected default or random TN city
      setSelectedCity('Coimbatore');
      setGeoState({ loading: false, error: null, permission: 'granted' });
    }, 600);
  };

  return (
    <LocationContext.Provider
      value={{
        selectedCity,
        setCity,
        clearCity,
        detectLocation,
        geoState,
        cities: MAJOR_CITIES,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
}
