import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AcademyLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  check_in_radius_meters: number;
}

interface ClassReservation {
  id: string;
  class_id: string;
  status: string;
  check_in_verified: boolean;
  classes: {
    name: string;
  };
}

export const useLocationCheckIn = () => {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [academyLocations, setAcademyLocations] = useState<AcademyLocation[]>([]);
  const [reservations, setReservations] = useState<ClassReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { profile } = useAuth();

  useEffect(() => {
    getCurrentLocation();
    fetchAcademyLocations();
    fetchUserReservations();
  }, [profile?.id]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
        setLocationError(null);
      },
      (error) => {
        setLocationError(`Unable to get location: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const fetchAcademyLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('academy_locations')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setAcademyLocations(data || []);
    } catch (error) {
      console.error('Error fetching academy locations:', error);
    }
  };

  const fetchUserReservations = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('class_reservations')
        .select(`
          *,
          classes(name)
        `)
        .eq('student_id', profile.id)
        .in('status', ['reserved', 'checked_in']);

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const isWithinCheckInRadius = (academyLocation: AcademyLocation) => {
    if (!location) return false;

    const distance = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      academyLocation.latitude,
      academyLocation.longitude
    );

    return distance <= academyLocation.check_in_radius_meters;
  };

  const availableLocations = academyLocations.filter(loc => isWithinCheckInRadius(loc));
  const availableReservations = reservations.filter(r => r.status === 'reserved');
  const canCheckIn = availableLocations.length > 0 && availableReservations.length > 0;

  return {
    location,
    academyLocations,
    reservations,
    loading,
    locationError,
    availableLocations,
    availableReservations,
    canCheckIn,
    getCurrentLocation,
    fetchUserReservations
  };
};