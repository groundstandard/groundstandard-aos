import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from './use-toast';

export const useExport = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const exportData = async (exportType: 'students' | 'payments' | 'attendance') => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('export-data', {
        body: { exportType }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Create blob and download
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exportType}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `${exportType} data exported successfully`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: `Failed to export ${exportType} data`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return { exportData, loading };
};