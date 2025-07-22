import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, GraduationCap, MapPin } from "lucide-react";

interface StudentAcademySelectorProps {
  onAcademySelected: () => void;
  studentAcademies: Array<{
    academy_id: string;
    role: string;
    academy_name: string;
    city: string;
    state: string;
  }>;
}

export const StudentAcademySelector = ({ onAcademySelected, studentAcademies }: StudentAcademySelectorProps) => {
  const { switchAcademy } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedAcademyId, setSelectedAcademyId] = useState<string | null>(null);

  const handleAcademySelect = async (academyId: string) => {
    setLoading(true);
    setSelectedAcademyId(academyId);

    try {
      await switchAcademy(academyId);
      localStorage.setItem('student_academy_selected', 'true');
      onAcademySelected();
    } catch (error) {
      console.error('Error switching academy:', error);
      toast({
        title: "Error",
        description: "Failed to switch academy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setSelectedAcademyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Select Your Academy
          </CardTitle>
          <CardDescription>
            Choose which academy you'd like to access. You can only be logged into one academy at a time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {studentAcademies.map((academy) => (
            <Card 
              key={academy.academy_id} 
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
              onClick={() => !loading && handleAcademySelect(academy.academy_id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{academy.academy_name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {academy.role}
                      </Badge>
                    </div>
                    {(academy.city || academy.state) && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {[academy.city, academy.state].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                  <Button 
                    disabled={loading}
                    variant="outline"
                    className="ml-4"
                  >
                    {loading && selectedAcademyId === academy.academy_id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Entering...
                      </>
                    ) : (
                      'Enter Academy'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Need to switch to a different academy later?
            </p>
            <p className="text-xs text-muted-foreground">
              You'll need to log out and log back in to access other academies.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};