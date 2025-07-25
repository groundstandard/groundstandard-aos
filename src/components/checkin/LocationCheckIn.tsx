import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle, AlertCircle, Loader2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

export const LocationCheckIn = () => {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [academyLocations, setAcademyLocations] = useState<AcademyLocation[]>([]);
  const [reservations, setReservations] = useState<ClassReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    getCurrentLocation();
    fetchAcademyLocations();
    fetchUserReservations();
  }, []);

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

  const handleLocationCheckIn = async (classId: string, academyLocationId: string) => {
    if (!location || !profile?.id) return;

    setLoading(true);
    try {
      // Verify location on server side
      const { data: isVerified, error: verifyError } = await supabase
        .rpc('verify_location_check_in', {
          user_latitude: location.coords.latitude,
          user_longitude: location.coords.longitude,
          academy_location_id: academyLocationId
        });

      if (verifyError) throw verifyError;

      if (!isVerified) {
        toast({
          title: "Check-in Failed",
          description: "You're not within the required distance of the academy",
          variant: "destructive",
        });
        return;
      }

      // Update reservation with location verification
      const { error: updateError } = await supabase
        .from('class_reservations')
        .update({
          status: 'checked_in',
          check_in_verified: true,
          check_in_verification_time: new Date().toISOString(),
          check_in_distance_meters: Math.round(calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            academyLocations.find(l => l.id === academyLocationId)?.latitude || 0,
            academyLocations.find(l => l.id === academyLocationId)?.longitude || 0
          ))
        })
        .eq('class_id', classId)
        .eq('student_id', profile.id);

      if (updateError) throw updateError;

      // Create attendance record
      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert({
          student_id: profile.id,
          class_id: classId,
          date: new Date().toISOString().split('T')[0],
          status: 'present',
          notes: 'Location-verified check-in'
        });

      if (attendanceError) throw attendanceError;

      toast({
        title: "Check-in Successful",
        description: "You've been checked in with location verification!",
      });

      fetchUserReservations();
    } catch (error: any) {
      toast({
        title: "Check-in Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (locationError) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
          <Button onClick={getCurrentLocation} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!location) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Getting your location...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const availableLocations = academyLocations.filter(loc => isWithinCheckInRadius(loc));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location-Based Check-In
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {availableLocations.length > 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  You're within check-in range of {availableLocations.length} location(s)
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You're not within check-in range of any academy locations
                </AlertDescription>
              </Alert>
            )}

            {academyLocations.map(academyLocation => {
              const isWithinRange = isWithinCheckInRadius(academyLocation);
              const distance = calculateDistance(
                location.coords.latitude,
                location.coords.longitude,
                academyLocation.latitude,
                academyLocation.longitude
              );

              return (
                <div key={academyLocation.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{academyLocation.name}</h3>
                    <Badge variant={isWithinRange ? "default" : "secondary"}>
                      {Math.round(distance)}m away
                    </Badge>
                  </div>
                  {academyLocation.address && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {academyLocation.address}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Check-in radius: {academyLocation.check_in_radius_meters}m
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Reservations */}
      {reservations.filter(r => r.status === 'reserved').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Your Class Reservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reservations
                .filter(r => r.status === 'reserved')
                .map(reservation => (
                  <div key={reservation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{reservation.classes?.name}</h4>
                      <p className="text-sm text-muted-foreground">Ready for check-in</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleLocationCheckIn(
                        reservation.class_id,
                        availableLocations[0]?.id
                      )}
                      disabled={loading || availableLocations.length === 0}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check In"}
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checked-in Classes */}
      {reservations.filter(r => r.status === 'checked_in').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Checked In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reservations
                .filter(r => r.status === 'checked_in')
                .map(reservation => (
                  <div key={reservation.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                    <div>
                      <h4 className="font-medium">{reservation.classes?.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {reservation.check_in_verified ? "Location verified" : "Checked in"}
                      </p>
                    </div>
                    <Badge variant="default" className="bg-green-600">
                      Checked In
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};