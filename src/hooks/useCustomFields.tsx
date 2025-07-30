import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAcademy } from "@/hooks/useAcademy";
import { useToast } from "@/hooks/use-toast";

interface CustomFieldPage {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

interface CustomFieldDefinition {
  id: string;
  name: string;
  display_name: string;
  field_type: string;
  is_required: boolean;
  validation_rules: any;
  options: any;
  default_value?: string;
  placeholder_text?: string;
  help_text?: string;
  page_id?: string;
  sort_order: number;
  is_active: boolean;
  show_in_table: boolean;
  page?: CustomFieldPage;
}

interface CustomFieldValue {
  id: string;
  contact_id: string;
  field_id: string;
  value: string;
}

export const useCustomFields = () => {
  const [pages, setPages] = useState<CustomFieldPage[]>([]);
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const { academy } = useAcademy();
  const { toast } = useToast();

  const fetchCustomFields = async () => {
    if (!academy?.id) return;

    try {
      setLoading(true);
      
      // Fetch pages
      const { data: pagesData, error: pagesError } = await supabase
        .from('custom_field_pages')
        .select('*')
        .eq('academy_id', academy.id)
        .eq('is_active', true)
        .order('sort_order');

      if (pagesError) throw pagesError;

      // Fetch fields
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('custom_field_definitions')
        .select(`
          *,
          page:custom_field_pages(*)
        `)
        .eq('academy_id', academy.id)
        .eq('is_active', true)
        .order('sort_order');

      if (fieldsError) throw fieldsError;

      setPages(pagesData || []);
      setFields(fieldsData || []);
    } catch (error: any) {
      console.error('Error fetching custom fields:', error);
      toast({
        title: "Error loading custom fields",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFieldsByPage = (pageId?: string) => {
    return fields.filter(field => field.page_id === pageId);
  };

  const getFieldsForTable = () => {
    return fields.filter(field => field.show_in_table);
  };

  const fetchContactFieldValues = async (contactId: string) => {
    if (!contactId) return {};

    try {
      const { data, error } = await supabase
        .from('custom_field_values')
        .select('field_id, value')
        .eq('contact_id', contactId);

      if (error) throw error;

      // Convert to field_id -> value mapping
      const values: Record<string, string> = {};
      data?.forEach(item => {
        values[item.field_id] = item.value;
      });

      return values;
    } catch (error: any) {
      console.error('Error fetching contact field values:', error);
      return {};
    }
  };

  const saveContactFieldValues = async (contactId: string, fieldValues: Record<string, string>) => {
    if (!contactId) return;

    try {
      // Prepare data for upsert
      const upsertData = Object.entries(fieldValues).map(([fieldId, value]) => ({
        contact_id: contactId,
        field_id: fieldId,
        value: value || ''
      }));

      if (upsertData.length === 0) return;

      const { error } = await supabase
        .from('custom_field_values')
        .upsert(upsertData, { 
          onConflict: 'contact_id,field_id'
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error saving contact field values:', error);
      toast({
        title: "Error saving custom field values",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const validateFieldValues = (fieldValues: Record<string, string>) => {
    const errors: Record<string, string> = {};

    fields.forEach(field => {
      const value = fieldValues[field.id];
      
      // Check required fields
      if (field.is_required && (!value || value.trim() === '')) {
        errors[field.id] = `${field.display_name} is required`;
        return;
      }

      // Skip validation if field is empty and not required
      if (!value) return;

      // Type-specific validation
      switch (field.field_type) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors[field.id] = 'Please enter a valid email address';
          }
          break;

        case 'url':
          try {
            new URL(value);
          } catch {
            errors[field.id] = 'Please enter a valid URL';
          }
          break;

        case 'number':
          if (isNaN(Number(value))) {
            errors[field.id] = 'Please enter a valid number';
          }
          break;

        case 'phone':
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
            errors[field.id] = 'Please enter a valid phone number';
          }
          break;
      }
    });

    return errors;
  };

  useEffect(() => {
    fetchCustomFields();
  }, [academy?.id]);

  return {
    pages,
    fields,
    loading,
    getFieldsByPage,
    getFieldsForTable,
    fetchContactFieldValues,
    saveContactFieldValues,
    validateFieldValues,
    refreshFields: fetchCustomFields
  };
};