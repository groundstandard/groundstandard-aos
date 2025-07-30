import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomFieldInput } from "@/components/forms/CustomFieldInput";
import { useCustomFields } from "@/hooks/useCustomFields";

interface CustomFieldsInContactFormProps {
  contactId?: string;
  onFieldsChange: (fieldValues: Record<string, string>) => void;
  fieldValues: Record<string, string>;
  errors?: Record<string, string>;
}

export const CustomFieldsInContactForm = ({ 
  contactId, 
  onFieldsChange, 
  fieldValues = {},
  errors = {}
}: CustomFieldsInContactFormProps) => {
  const { pages, fields, loading, getFieldsByPage, fetchContactFieldValues } = useCustomFields();
  const [localFieldValues, setLocalFieldValues] = useState<Record<string, string>>(fieldValues);

  // Load existing field values when editing a contact
  useEffect(() => {
    if (contactId) {
      fetchContactFieldValues(contactId).then(values => {
        setLocalFieldValues(values);
        onFieldsChange(values);
      });
    }
  }, [contactId]);

  const handleFieldChange = (fieldId: string, value: string) => {
    const updatedValues = { ...localFieldValues, [fieldId]: value };
    setLocalFieldValues(updatedValues);
    onFieldsChange(updatedValues);
  };

  // If no fields are configured, don't render anything
  if (loading || fields.length === 0) {
    return null;
  }

  // Get fields that are not assigned to any page
  const unassignedFields = getFieldsByPage(undefined);

  // If there are no pages, render all fields in a single section
  if (pages.length === 0) {
    if (fields.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map(field => (
            <CustomFieldInput
              key={field.id}
              field={field}
              value={localFieldValues[field.id] || ''}
              onChange={(value) => handleFieldChange(field.id, value)}
              error={errors[field.id]}
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Tabs defaultValue={pages[0]?.id || 'unassigned'} className="w-full">
        <TabsList className="grid w-full grid-cols-auto">
          {pages.map(page => (
            <TabsTrigger key={page.id} value={page.id}>
              {page.display_name}
            </TabsTrigger>
          ))}
          {unassignedFields.length > 0 && (
            <TabsTrigger value="unassigned">Other</TabsTrigger>
          )}
        </TabsList>

        {pages.map(page => {
          const pageFields = getFieldsByPage(page.id);
          if (pageFields.length === 0) return null;

          return (
            <TabsContent key={page.id} value={page.id}>
              <Card>
                <CardHeader>
                  <CardTitle>{page.display_name}</CardTitle>
                  {page.description && (
                    <p className="text-sm text-muted-foreground">{page.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {pageFields.map(field => (
                    <CustomFieldInput
                      key={field.id}
                      field={field}
                      value={localFieldValues[field.id] || ''}
                      onChange={(value) => handleFieldChange(field.id, value)}
                      error={errors[field.id]}
                    />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}

        {unassignedFields.length > 0 && (
          <TabsContent value="unassigned">
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {unassignedFields.map(field => (
                  <CustomFieldInput
                    key={field.id}
                    field={field}
                    value={localFieldValues[field.id] || ''}
                    onChange={(value) => handleFieldChange(field.id, value)}
                    error={errors[field.id]}
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};