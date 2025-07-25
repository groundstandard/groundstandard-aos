import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Database, Users, Calendar, Package, DollarSign, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SampleDataResults {
  academies: number;
  students: number;
  instructors: number;
  classes: number;
  schedules: number;
  membershipPlans: number;
  inventory: number;
  payments: number;
}

export const SampleDataCreator = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SampleDataResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const createSampleData = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-sample-data');

      if (error) throw error;

      if (data.success) {
        setResults(data.results);
        toast({
          title: "Sample Data Created",
          description: "Demo data has been successfully created for testing",
        });
      } else {
        throw new Error(data.error || "Failed to create sample data");
      }
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Sample Data Creator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Create sample academies, students, classes, and other demo data to test the system functionality.
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {results && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Sample data created successfully! Check the system to see the new demo data.
            </AlertDescription>
          </Alert>
        )}

        {results && (
          <div className="grid gap-2 md:grid-cols-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Academies:</span>
              <Badge variant="secondary">{results.academies}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-500" />
              <span className="text-sm">Classes:</span>
              <Badge variant="secondary">{results.classes}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-500" />
              <span className="text-sm">Inventory:</span>
              <Badge variant="secondary">{results.inventory}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-500" />
              <span className="text-sm">Plans:</span>
              <Badge variant="secondary">{results.membershipPlans}</Badge>
            </div>
          </div>
        )}

        <Button 
          onClick={createSampleData} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Sample Data...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Create Sample Data
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground">
          <strong>Note:</strong> This will create demo data including a sample academy, 
          classes with schedules, membership plans, and inventory items. 
          Existing data with the same names will be updated.
        </div>
      </CardContent>
    </Card>
  );
};