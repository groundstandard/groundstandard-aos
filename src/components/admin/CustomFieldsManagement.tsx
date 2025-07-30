import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Settings, Save, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAcademy } from "@/hooks/useAcademy";

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
  options: any; // Can be Json type from Supabase
  default_value?: string;
  placeholder_text?: string;
  help_text?: string;
  page_id?: string;
  sort_order: number;
  is_active: boolean;
  show_in_table: boolean;
  page?: CustomFieldPage;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown (Single)' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'url', label: 'URL' },
];

export const CustomFieldsManagement = () => {
  const [pages, setPages] = useState<CustomFieldPage[]>([]);
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [showPageDialog, setShowPageDialog] = useState(false);
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [editingPage, setEditingPage] = useState<CustomFieldPage | null>(null);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { academy: currentAcademy } = useAcademy();

  const [pageForm, setPageForm] = useState({
    name: '',
    display_name: '',
    description: '',
    is_active: true
  });

  const [fieldForm, setFieldForm] = useState({
    name: '',
    display_name: '',
    field_type: 'text',
    is_required: false,
    options: [] as string[],
    default_value: '',
    placeholder_text: '',
    help_text: '',
    page_id: '',
    is_active: true,
    show_in_table: false
  });

  const fetchPages = async () => {
    if (!currentAcademy?.id) return;

    const { data, error } = await supabase
      .from('custom_field_pages')
      .select('*')
      .eq('academy_id', currentAcademy.id)
      .order('sort_order');

    if (error) {
      toast({
        title: "Error fetching pages",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setPages(data || []);
    }
  };

  const fetchFields = async () => {
    if (!currentAcademy?.id) return;

    const { data, error } = await supabase
      .from('custom_field_definitions')
      .select(`
        *,
        page:custom_field_pages(*)
      `)
      .eq('academy_id', currentAcademy.id)
      .order('sort_order');

    if (error) {
      toast({
        title: "Error fetching fields",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setFields(data || []);
    }
  };

  useEffect(() => {
    if (currentAcademy?.id) {
      Promise.all([fetchPages(), fetchFields()]).finally(() => setLoading(false));
    }
  }, [currentAcademy?.id]);

  const handleSavePage = async () => {
    if (!currentAcademy?.id) return;

    const pageData = {
      ...pageForm,
      academy_id: currentAcademy.id,
      sort_order: editingPage ? editingPage.sort_order : pages.length
    };

    let result;
    if (editingPage) {
      result = await supabase
        .from('custom_field_pages')
        .update(pageData)
        .eq('id', editingPage.id);
    } else {
      result = await supabase
        .from('custom_field_pages')
        .insert([pageData]);
    }

    if (result.error) {
      toast({
        title: "Error saving page",
        description: result.error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Page ${editingPage ? 'updated' : 'created'} successfully`,
      });
      setShowPageDialog(false);
      setEditingPage(null);
      setPageForm({ name: '', display_name: '', description: '', is_active: true });
      fetchPages();
    }
  };

  const handleSaveField = async () => {
    if (!currentAcademy?.id) return;

    const fieldData = {
      ...fieldForm,
      academy_id: currentAcademy.id,
      name: fieldForm.name.toLowerCase().replace(/\s+/g, '_'),
      sort_order: editingField ? editingField.sort_order : fields.length,
      options: fieldForm.options.length > 0 ? fieldForm.options : []
    };

    let result;
    if (editingField) {
      result = await supabase
        .from('custom_field_definitions')
        .update(fieldData)
        .eq('id', editingField.id);
    } else {
      result = await supabase
        .from('custom_field_definitions')
        .insert([fieldData]);
    }

    if (result.error) {
      toast({
        title: "Error saving field",
        description: result.error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Field ${editingField ? 'updated' : 'created'} successfully`,
      });
      setShowFieldDialog(false);
      setEditingField(null);
      setFieldForm({
        name: '',
        display_name: '',
        field_type: 'text',
        is_required: false,
        options: [],
        default_value: '',
        placeholder_text: '',
        help_text: '',
        page_id: '',
        is_active: true,
        show_in_table: false
      });
      fetchFields();
    }
  };

  const handleDeletePage = async (page: CustomFieldPage) => {
    if (!confirm(`Are you sure you want to delete the page "${page.display_name}"?`)) return;

    const { error } = await supabase
      .from('custom_field_pages')
      .delete()
      .eq('id', page.id);

    if (error) {
      toast({
        title: "Error deleting page",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Page deleted successfully",
      });
      fetchPages();
      fetchFields(); // Refresh fields since they might be affected
    }
  };

  const handleDeleteField = async (field: CustomFieldDefinition) => {
    if (!confirm(`Are you sure you want to delete the field "${field.display_name}"?`)) return;

    const { error } = await supabase
      .from('custom_field_definitions')
      .delete()
      .eq('id', field.id);

    if (error) {
      toast({
        title: "Error deleting field",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Field deleted successfully",
      });
      fetchFields();
    }
  };

  const openEditPage = (page: CustomFieldPage) => {
    setEditingPage(page);
    setPageForm({
      name: page.name,
      display_name: page.display_name,
      description: page.description || '',
      is_active: page.is_active
    });
    setShowPageDialog(true);
  };

  const openEditField = (field: CustomFieldDefinition) => {
    setEditingField(field);
    setFieldForm({
      name: field.name,
      display_name: field.display_name,
      field_type: field.field_type,
      is_required: field.is_required,
      options: Array.isArray(field.options) ? field.options : [],
      default_value: field.default_value || '',
      placeholder_text: field.placeholder_text || '',
      help_text: field.help_text || '',
      page_id: field.page_id || '',
      is_active: field.is_active,
      show_in_table: field.show_in_table
    });
    setShowFieldDialog(true);
  };

  const addOption = () => {
    setFieldForm(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const updateOption = (index: number, value: string) => {
    setFieldForm(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const removeOption = (index: number) => {
    setFieldForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const filteredFields = selectedPage ? fields.filter(f => f.page_id === selectedPage) : fields;

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Custom Fields Management</h1>
        <div className="flex gap-2">
          <Dialog open={showPageDialog} onOpenChange={setShowPageDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingPage(null);
                setPageForm({ name: '', display_name: '', description: '', is_active: true });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Page
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPage ? 'Edit Page' : 'Create Page'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={pageForm.display_name}
                    onChange={(e) => {
                      const displayName = e.target.value;
                      setPageForm(prev => ({
                        ...prev,
                        display_name: displayName,
                        name: displayName.toLowerCase().replace(/\s+/g, '_')
                      }));
                    }}
                    placeholder="Page Display Name"
                  />
                </div>
                <div>
                  <Label htmlFor="name">System Name</Label>
                  <Input
                    id="name"
                    value={pageForm.name}
                    onChange={(e) => setPageForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="page_system_name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={pageForm.description}
                    onChange={(e) => setPageForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={pageForm.is_active}
                    onCheckedChange={(checked) => setPageForm(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSavePage}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => setShowPageDialog(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showFieldDialog} onOpenChange={setShowFieldDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => {
                setEditingField(null);
                setFieldForm({
                  name: '',
                  display_name: '',
                  field_type: 'text',
                  is_required: false,
                  options: [],
                  default_value: '',
                  placeholder_text: '',
                  help_text: '',
                  page_id: '',
                  is_active: true,
                  show_in_table: false
                });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingField ? 'Edit Field' : 'Create Field'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="field_display_name">Display Name</Label>
                    <Input
                      id="field_display_name"
                      value={fieldForm.display_name}
                      onChange={(e) => {
                        const displayName = e.target.value;
                        setFieldForm(prev => ({
                          ...prev,
                          display_name: displayName,
                          name: displayName.toLowerCase().replace(/\s+/g, '_')
                        }));
                      }}
                      placeholder="Field Display Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="field_name">System Name</Label>
                    <Input
                      id="field_name"
                      value={fieldForm.name}
                      onChange={(e) => setFieldForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="field_system_name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="field_type">Field Type</Label>
                    <Select value={fieldForm.field_type} onValueChange={(value) => setFieldForm(prev => ({ ...prev, field_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="page_id">Page</Label>
                    <Select value={fieldForm.page_id} onValueChange={(value) => setFieldForm(prev => ({ ...prev, page_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select page (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No page</SelectItem>
                        {pages.map(page => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(fieldForm.field_type === 'select' || fieldForm.field_type === 'multiselect') && (
                  <div>
                    <Label>Options</Label>
                    <div className="space-y-2">
                      {fieldForm.options.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                          />
                          <Button variant="outline" size="sm" onClick={() => removeOption(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" onClick={addOption}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="placeholder_text">Placeholder Text</Label>
                    <Input
                      id="placeholder_text"
                      value={fieldForm.placeholder_text}
                      onChange={(e) => setFieldForm(prev => ({ ...prev, placeholder_text: e.target.value }))}
                      placeholder="Enter placeholder text..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="default_value">Default Value</Label>
                    <Input
                      id="default_value"
                      value={fieldForm.default_value}
                      onChange={(e) => setFieldForm(prev => ({ ...prev, default_value: e.target.value }))}
                      placeholder="Default value"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="help_text">Help Text</Label>
                  <Textarea
                    id="help_text"
                    value={fieldForm.help_text}
                    onChange={(e) => setFieldForm(prev => ({ ...prev, help_text: e.target.value }))}
                    placeholder="Optional help text for users"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_required"
                      checked={fieldForm.is_required}
                      onCheckedChange={(checked) => setFieldForm(prev => ({ ...prev, is_required: checked }))}
                    />
                    <Label htmlFor="is_required">Required</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show_in_table"
                      checked={fieldForm.show_in_table}
                      onCheckedChange={(checked) => setFieldForm(prev => ({ ...prev, show_in_table: checked }))}
                    />
                    <Label htmlFor="show_in_table">Show in Table</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="field_is_active"
                      checked={fieldForm.is_active}
                      onCheckedChange={(checked) => setFieldForm(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="field_is_active">Active</Label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveField}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => setShowFieldDialog(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="pages" className="w-full">
        <TabsList>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="fields">Fields</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-4">
          <div className="grid gap-4">
            {pages.map((page) => (
              <Card key={page.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {page.display_name}
                      {!page.is_active && <Badge variant="secondary">Inactive</Badge>}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{page.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditPage(page)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeletePage(page)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Fields: {fields.filter(f => f.page_id === page.id).length}
                  </div>
                </CardContent>
              </Card>
            ))}
            {pages.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No pages created yet. Click "Add Page" to get started.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="fields" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <Select value={selectedPage} onValueChange={setSelectedPage}>
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Filter by page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All fields</SelectItem>
                {pages.map(page => (
                  <SelectItem key={page.id} value={page.id}>
                    {page.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredFields.map((field) => (
              <Card key={field.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      {field.display_name}
                      {field.is_required && <Badge variant="destructive">Required</Badge>}
                      {field.show_in_table && <Badge variant="default">Table Column</Badge>}
                      {!field.is_active && <Badge variant="secondary">Inactive</Badge>}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {FIELD_TYPES.find(t => t.value === field.field_type)?.label} • 
                      Page: {field.page?.display_name || 'None'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditField(field)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteField(field)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                {field.help_text && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{field.help_text}</p>
                  </CardContent>
                )}
              </Card>
            ))}
            {filteredFields.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">
                    {selectedPage ? 'No fields in this page.' : 'No fields created yet.'} Click "Add Field" to get started.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};