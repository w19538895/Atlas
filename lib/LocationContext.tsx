"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Location {
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  locationError: string | null;
  isLocating: boolean;
}

interface LocationContextType extends Location {
  // Context values
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location>({
    latitude: null,
    longitude: null,
    locationName: null,
    locationError: null,
    isLocating: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        locationError: "Geolocation not supported",
        isLocating: false,
      }));
      return;
    }

    // Use watchPosition for continuous location tracking
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse geocode to get location name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.address;
          const specific = address.suburb || address.neighbourhood || address.village || address.town || address.city_district || address.city;
          const country = address.country;
          const locationName = `${specific}, ${country}`;

          setLocation({
            latitude,
            longitude,
            locationName,
            locationError: null,
            isLocating: false,
          });
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          setLocation({
            latitude,
            longitude,
            locationName: null,
            locationError: null,
            isLocating: false,
          });
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Location access denied";

        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Location access denied";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Location unavailable";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Location request timed out";
        }

        setLocation((prev) => ({
          ...prev,
          locationError: errorMessage,
          isLocating: false,
        }));
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 30000, // Cache location for 30 seconds
      }
    );

    // Cleanup on unmount
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return (
    <LocationContext.Provider value={location}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within LocationProvider");
  }
  return context;
}
