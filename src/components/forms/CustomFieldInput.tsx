import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface CustomFieldDefinition {
  id: string;
  name: string;
  display_name: string;
  field_type: string;
  is_required: boolean;
  options: any;
  default_value?: string;
  placeholder_text?: string;
  help_text?: string;
}

interface CustomFieldInputProps {
  field: CustomFieldDefinition;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export const CustomFieldInput = ({ field, value = '', onChange, error }: CustomFieldInputProps) => {
  const safeParseMultiSelect = (raw: unknown): string[] => {
    if (Array.isArray(raw)) return raw.filter((v) => typeof v === 'string') as string[];
    if (typeof raw !== 'string') return [];
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
    } catch (_e) {
      return [];
    }
  };

  const [multiSelectValues, setMultiSelectValues] = useState<string[]>(safeParseMultiSelect(value));

  const handleMultiSelectChange = (optionValue: string, checked: boolean) => {
    let newValues;
    if (checked) {
      newValues = [...multiSelectValues, optionValue];
    } else {
      newValues = multiSelectValues.filter(v => v !== optionValue);
    }
    setMultiSelectValues(newValues);
    onChange(JSON.stringify(newValues));
  };

  const removeMultiSelectValue = (valueToRemove: string) => {
    const newValues = multiSelectValues.filter(v => v !== valueToRemove);
    setMultiSelectValues(newValues);
    onChange(JSON.stringify(newValues));
  };

  const renderInput = () => {
    const options = Array.isArray(field.options) ? field.options : [];

    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <Input
            type={field.field_type === 'email' ? 'email' : field.field_type === 'phone' ? 'tel' : field.field_type === 'url' ? 'url' : 'text'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder_text}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder_text}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder_text}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'select':
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder={field.placeholder_text || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: string, index: number) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        return (
          <div className="space-y-3">
            <div className="border rounded-md p-3 min-h-[40px] flex flex-wrap gap-2">
              {multiSelectValues.length === 0 ? (
                <span className="text-muted-foreground text-sm">
                  {field.placeholder_text || 'Select options'}
                </span>
              ) : (
                multiSelectValues.map((selectedValue, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {selectedValue}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeMultiSelectValue(selectedValue)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))
              )}
            </div>
            <div className="space-y-2">
              {options.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.name}_${index}`}
                    checked={multiSelectValues.includes(option)}
                    onCheckedChange={(checked) => handleMultiSelectChange(option, checked as boolean)}
                  />
                  <Label htmlFor={`${field.name}_${index}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={value === 'true'}
              onCheckedChange={(checked) => onChange(checked ? 'true' : 'false')}
            />
            <Label htmlFor={field.name} className="text-sm">
              {field.placeholder_text || field.display_name}
            </Label>
          </div>
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder_text}
            className={error ? 'border-destructive' : ''}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name} className="text-sm font-medium">
        {field.display_name}
        {field.is_required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderInput()}
      {field.help_text && (
        <p className="text-xs text-muted-foreground">{field.help_text}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};