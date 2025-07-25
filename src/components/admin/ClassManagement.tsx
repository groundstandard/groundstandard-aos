import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { Plus, Edit2, Clock, Users, Calendar, ArrowUpDown, ArrowUp, ArrowDown, LayoutGrid, List } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAcademy } from '@/hooks/useAcademy';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Class {
  id: string;
  name: string;
  description: string;
  instructor_id: string;
  max_students: number;
  duration_minutes: number;
  skill_level: string;
  age_group: string;
  is_active: boolean;
  created_at: string;
  start_date: string;
}

interface ClassSchedule {
  id?: string;
  class_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

type SortField = 'name' | 'max_students' | 'duration_minutes' | 'skill_level' | 'age_group' | 'is_active' | 'created_at';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export const ClassManagement = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const { profile } = useAuth();
  const { currentAcademyId } = useAcademy();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructor_id: '',
    max_students: 20,
    unlimited_students: false,
    duration_minutes: 60,
    skill_level: 'all',
    age_group: 'all',
    class_length_type: 'indefinite', // 'indefinite' | 'weeks' | 'sessions'
    class_length_value: '',
    start_date: new Date().toISOString().split('T')[0], // Default to today
  });

  const [scheduleData, setScheduleData] = useState<ClassSchedule[]>([
    { class_id: '', day_of_week: 1, start_time: '18:00', end_time: '19:00' }
  ]);
  
  const [instructors, setInstructors] = useState<Array<{id: string, first_name: string, last_name: string}>>([]);

  // View and sorting state with persistence
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() => {
    return (localStorage.getItem('classManagement-viewMode') as 'card' | 'table') || 'card';
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    const saved = localStorage.getItem('classManagement-sortConfig');
    return saved ? JSON.parse(saved) : { field: 'created_at', direction: 'desc' };
  });

  // Update localStorage when view mode changes
  useEffect(() => {
    localStorage.setItem('classManagement-viewMode', viewMode);
  }, [viewMode]);

  // Update localStorage when sort config changes
  useEffect(() => {
    localStorage.setItem('classManagement-sortConfig', JSON.stringify(sortConfig));
  }, [sortConfig]);

  useEffect(() => {
    if (profile?.role === 'admin' || profile?.role === 'owner') {
      fetchClasses();
      fetchInstructors();
    }
  }, [profile]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          profiles!classes_instructor_id_fkey (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch classes'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('role', ['instructor', 'admin', 'owner'])
        .order('first_name');

      if (error) throw error;
      setInstructors(data || []);
    } catch (error: any) {
      console.error('Failed to fetch instructors:', error);
    }
  };

  const fetchClassSchedules = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from('class_schedules')
        .select('*')
        .eq('class_id', classId)
        .order('day_of_week');

      if (error) throw error;
      
      if (data && data.length > 0) {
        setScheduleData(data.map(schedule => ({
          id: schedule.id,
          class_id: schedule.class_id,
          day_of_week: schedule.day_of_week,
          start_time: schedule.start_time,
          end_time: schedule.end_time
        })));
      } else {
        // No schedules found, set default
        setScheduleData([
          { class_id: classId, day_of_week: 1, start_time: '18:00', end_time: '19:00' }
        ]);
      }
    } catch (error: any) {
      console.error('Failed to fetch class schedules:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingClass) {
        // Update existing class
        const updateData = {
          name: formData.name,
          description: formData.description,
          instructor_id: formData.instructor_id || null,
          duration_minutes: formData.duration_minutes,
          max_students: formData.unlimited_students ? null : formData.max_students,
          skill_level: formData.skill_level,
          age_group: formData.age_group,
          class_length_type: formData.class_length_type,
          class_length_value: formData.class_length_type === 'indefinite' ? null : parseInt(formData.class_length_value),
          start_date: formData.start_date,
        };
        
        const { error } = await supabase
          .from('classes')
          .update(updateData)
          .eq('id', editingClass.id);

        if (error) throw error;

        // Delete existing schedules
        const { error: deleteError } = await supabase
          .from('class_schedules')
          .delete()
          .eq('class_id', editingClass.id);

        if (deleteError) throw deleteError;

        // Create new schedules
        const schedulesToInsert = scheduleData.map(schedule => ({
          class_id: editingClass.id,
          day_of_week: schedule.day_of_week,
          start_time: schedule.start_time,
          end_time: schedule.end_time
        }));

        const { error: scheduleError } = await supabase
          .from('class_schedules')
          .insert(schedulesToInsert);

        if (scheduleError) throw scheduleError;

        toast({
          title: 'Success',
          description: 'Class updated successfully'
        });
      } else {
        // Create new class
        const insertData = {
          name: formData.name,
          description: formData.description,
          instructor_id: formData.instructor_id || null,
          duration_minutes: formData.duration_minutes,
          max_students: formData.unlimited_students ? null : formData.max_students,
          skill_level: formData.skill_level,
          age_group: formData.age_group,
          class_length_type: formData.class_length_type,
          class_length_value: formData.class_length_type === 'indefinite' ? null : parseInt(formData.class_length_value),
          start_date: formData.start_date,
          academy_id: currentAcademyId || '',
        };
        
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .insert(insertData)
          .select()
          .single();

        if (classError) throw classError;

        // Create schedules for the new class
        const schedulesToInsert = scheduleData.map(schedule => ({
          ...schedule,
          class_id: classData.id
        }));

        const { error: scheduleError } = await supabase
          .from('class_schedules')
          .insert(schedulesToInsert);

        if (scheduleError) throw scheduleError;

        toast({
          title: 'Success',
          description: 'Class created successfully'
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchClasses();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save class'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      instructor_id: '',
      max_students: 20,
      unlimited_students: false,
      duration_minutes: 60,
      skill_level: 'all',
      age_group: 'all',
      class_length_type: 'indefinite',
      class_length_value: '',
      start_date: new Date().toISOString().split('T')[0],
    });
    setScheduleData([
      { class_id: '', day_of_week: 1, start_time: '18:00', end_time: '19:00' }
    ]);
    setEditingClass(null);
  };

  const addScheduleSlot = () => {
    setScheduleData([
      ...scheduleData,
      { class_id: '', day_of_week: 1, start_time: '18:00', end_time: '19:00' }
    ]);
  };

  const updateScheduleSlot = (index: number, field: keyof ClassSchedule, value: any) => {
    const updated = [...scheduleData];
    updated[index] = { ...updated[index], [field]: value };
    setScheduleData(updated);
  };

  const removeScheduleSlot = (index: number) => {
    if (scheduleData.length > 1) {
      setScheduleData(scheduleData.filter((_, i) => i !== index));
    }
  };

  const toggleClassStatus = async (classId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('classes')
        .update({ is_active: !currentStatus })
        .eq('id', classId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Class ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });

      fetchClasses();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update class status'
      });
    }
  };

  // Sorting functionality
  const handleSort = (field: SortField) => {
    setSortConfig(prevConfig => ({
      field,
      direction: prevConfig.field === field && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  // Sorted classes using useMemo for performance
  const sortedClasses = useMemo(() => {
    const classesToSort = [...classes];
    
    return classesToSort.sort((a, b) => {
      const aVal = a[sortConfig.field];
      const bVal = b[sortConfig.field];
      
      // Handle different data types
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        const comparison = aVal === bVal ? 0 : aVal ? 1 : -1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      
      // Handle dates (created_at)
      if (sortConfig.field === 'created_at') {
        const dateA = new Date(aVal as string).getTime();
        const dateB = new Date(bVal as string).getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      return 0;
    });
  }, [classes, sortConfig]);

  if (profile?.role !== 'admin' && profile?.role !== 'owner') {
    return (
      <Card className="shadow-card border-0">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Admin access required
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      <Card className="shadow-card border-0 max-w-full overflow-hidden">
        <CardHeader>
          <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'justify-between items-center'}`}>
            <div className="flex items-center gap-4">
              <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                <Calendar className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                Class Management
              </CardTitle>
              
              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'card' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                  className="h-8 px-3"
                >
                  <LayoutGrid className="h-4 w-4" />
                  {!isMobile && <span className="ml-1">Cards</span>}
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-8 px-3"
                >
                  <List className="h-4 w-4" />
                  {!isMobile && <span className="ml-1">Table</span>}
                </Button>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className={`shadow-soft ${isMobile ? 'w-full' : ''}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Class
                </Button>
              </DialogTrigger>
              <DialogContent className={`${isMobile ? 'max-w-[95vw] w-full h-[90vh]' : 'max-w-2xl max-h-[90vh]'} overflow-y-auto bg-white`}>
                <DialogHeader>
                  <DialogTitle className={isMobile ? 'text-base' : ''}>
                    {editingClass ? 'Edit Class' : 'Create New Class'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div>
                    <Label htmlFor="name" className={isMobile ? 'text-sm' : ''}>Class Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="input-clean"
                    />
                  </div>

                  <div className={`space-y-4`}>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="unlimited_students"
                        checked={formData.unlimited_students}
                        onChange={(e) => setFormData({ ...formData, unlimited_students: e.target.checked })}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <Label htmlFor="unlimited_students" className={isMobile ? 'text-sm' : ''}>Unlimited Students</Label>
                    </div>
                    
                    {!formData.unlimited_students && (
                      <div>
                        <Label htmlFor="max_students" className={isMobile ? 'text-sm' : ''}>Max Students</Label>
                        <Input
                          id="max_students"
                          type="number"
                          value={formData.max_students}
                          onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
                          required
                          className="input-clean"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description" className={isMobile ? 'text-sm' : ''}>Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input-clean"
                    />
                  </div>

                  <div>
                    <Label htmlFor="instructor" className={isMobile ? 'text-sm' : ''}>Instructor</Label>
                    <Select
                      value={formData.instructor_id}
                      onValueChange={(value) => setFormData({ ...formData, instructor_id: value })}
                    >
                      <SelectTrigger className="input-clean">
                        <SelectValue placeholder="Select an instructor" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {instructors.map((instructor) => (
                          <SelectItem key={instructor.id} value={instructor.id}>
                            {instructor.first_name} {instructor.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                    <div>
                      <Label htmlFor="duration" className={isMobile ? 'text-sm' : ''}>Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                        required
                        className="input-clean"
                      />
                    </div>
                    <div>
                      <Label htmlFor="skill_level" className={isMobile ? 'text-sm' : ''}>Skill Level</Label>
                      <Select
                        value={formData.skill_level}
                        onValueChange={(value) => setFormData({ ...formData, skill_level: value })}
                      >
                        <SelectTrigger className="input-clean">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="all">All Levels</SelectItem>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="age_group" className={isMobile ? 'text-sm' : ''}>Age Group</Label>
                      <Select
                        value={formData.age_group}
                        onValueChange={(value) => setFormData({ ...formData, age_group: value })}
                      >
                        <SelectTrigger className="input-clean">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="all">All Ages</SelectItem>
                          <SelectItem value="kids">Kids (6-12)</SelectItem>
                          <SelectItem value="teens">Teens (13-17)</SelectItem>
                          <SelectItem value="adults">Adults (18+)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className={isMobile ? 'text-sm' : ''}>Class Duration</Label>
                    <div className="space-y-3">
                      <Select
                        value={formData.class_length_type}
                        onValueChange={(value) => setFormData({ ...formData, class_length_type: value, class_length_value: '' })}
                      >
                        <SelectTrigger className="input-clean">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="indefinite">Ongoing/Indefinite</SelectItem>
                          <SelectItem value="weeks">Number of Weeks</SelectItem>
                          <SelectItem value="sessions">Number of Sessions</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {formData.class_length_type !== 'indefinite' && (
                        <Input
                          type="number"
                          placeholder={`Enter number of ${formData.class_length_type}`}
                          value={formData.class_length_value}
                          onChange={(e) => setFormData({ ...formData, class_length_value: e.target.value })}
                          className="input-clean"
                          min="1"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="start_date" className={isMobile ? 'text-sm' : ''}>Class Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                      className="input-clean"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <Label>Class Schedule</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addScheduleSlot}>
                          <Plus className="h-3 w-3 mr-1" />
                          Add Time Slot
                        </Button>
                      </div>
                      
                      {scheduleData.map((schedule, index) => (
                        <div key={index} className="grid grid-cols-4 gap-2 mb-3 p-3 border rounded-lg bg-muted/20">
                          <Select
                            value={schedule.day_of_week.toString()}
                            onValueChange={(value) => updateScheduleSlot(index, 'day_of_week', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              {DAYS.map(day => (
                                <SelectItem key={day.value} value={day.value.toString()}>
                                  {day.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="time"
                            value={schedule.start_time}
                            onChange={(e) => updateScheduleSlot(index, 'start_time', e.target.value)}
                          />
                          <Input
                            type="time"
                            value={schedule.end_time}
                            onChange={(e) => updateScheduleSlot(index, 'end_time', e.target.value)}
                          />
                          {scheduleData.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeScheduleSlot(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingClass ? 'Update Class' : 'Create Class'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center">Loading classes...</div>
          ) : viewMode === 'table' ? (
            // Table View - Responsive design
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none min-w-[200px]"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Class Name
                        {getSortIcon('name')}
                      </div>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[120px]">Instructor</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none min-w-[100px]"
                      onClick={() => handleSort('max_students')}
                    >
                      <div className="flex items-center gap-2">
                        <span className="hidden sm:inline">Max Students</span>
                        <span className="sm:hidden">Max</span>
                        {getSortIcon('max_students')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none min-w-[90px]"
                      onClick={() => handleSort('duration_minutes')}
                    >
                      <div className="flex items-center gap-2">
                        Duration
                        {getSortIcon('duration_minutes')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none hidden md:table-cell min-w-[100px]"
                      onClick={() => handleSort('skill_level')}
                    >
                      <div className="flex items-center gap-2">
                        Skill Level
                        {getSortIcon('skill_level')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none hidden md:table-cell min-w-[100px]"
                      onClick={() => handleSort('age_group')}
                    >
                      <div className="flex items-center gap-2">
                        Age Group
                        {getSortIcon('age_group')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none min-w-[80px]"
                      onClick={() => handleSort('is_active')}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        {getSortIcon('is_active')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none hidden xl:table-cell min-w-[80px]"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-2">
                        Created
                        {getSortIcon('created_at')}
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedClasses.map((classItem) => (
                    <TableRow key={classItem.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{classItem.name}</div>
                          {classItem.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {classItem.description}
                            </div>
                          )}
                          {/* Show instructor on mobile */}
                          <div className="lg:hidden text-xs text-muted-foreground mt-1">
                            {(classItem as any).profiles ? 
                              `${(classItem as any).profiles.first_name} ${(classItem as any).profiles.last_name}` : 
                              'Unassigned'
                            }
                          </div>
                          {/* Show skill/age on smaller screens */}
                          <div className="md:hidden flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {classItem.skill_level}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {classItem.age_group}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-sm">
                          {(classItem as any).profiles ? 
                            `${(classItem as any).profiles.first_name} ${(classItem as any).profiles.last_name}` : 
                            'Unassigned'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          {classItem.max_students}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {classItem.duration_minutes}min
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {classItem.skill_level}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {classItem.age_group}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={classItem.is_active ? "default" : "secondary"} className="text-xs">
                          {classItem.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                        {new Date(classItem.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleClassStatus(classItem.id, classItem.is_active)}
                            className="text-xs px-2"
                          >
                            {classItem.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                          onClick={() => {
                            setEditingClass(classItem);
                            setFormData({
                              name: classItem.name,
                              description: classItem.description || '',
                              instructor_id: classItem.instructor_id || '',
                              max_students: classItem.max_students,
                              unlimited_students: false,
                              duration_minutes: classItem.duration_minutes,
                              skill_level: classItem.skill_level || 'all',
                              age_group: classItem.age_group || 'all',
                              class_length_type: 'indefinite',
                              class_length_value: '',
                              start_date: classItem.start_date || new Date().toISOString().split('T')[0],
                            });
                            fetchClassSchedules(classItem.id);
                            setIsDialogOpen(true);
                          }}
                            className="px-2"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            // Card View
            <div className="space-y-4">
              {sortedClasses.map((classItem) => (
                <Card key={classItem.id} className="shadow-soft border hover:shadow-medium transition-smooth max-w-full overflow-hidden">
                  <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
                    <div className={`${isMobile ? 'space-y-3' : 'flex justify-between items-start'}`}>
                      <div className="flex-1 min-w-0">
                        <div className={`flex items-center gap-2 mb-2 ${isMobile ? 'flex-wrap' : 'gap-3'}`}>
                          <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'} truncate flex-1`}>{classItem.name}</h3>
                          <Badge variant={classItem.is_active ? "default" : "secondary"} className={isMobile ? 'text-xs' : ''}>
                            {classItem.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className={`text-muted-foreground ${isMobile ? 'text-xs mb-2' : 'text-sm mb-3'} line-clamp-2`}>{classItem.description}</p>
                        <div className={`flex items-center gap-3 ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground ${isMobile ? 'flex-wrap gap-2' : 'gap-4'}`}>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span className="truncate">Max {classItem.max_students}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="truncate">{classItem.duration_minutes}min</span>
                          </div>
                          <Badge variant="outline" className={`${isMobile ? 'text-xs px-1' : ''} flex-shrink-0`}>{classItem.skill_level}</Badge>
                          <Badge variant="outline" className={`${isMobile ? 'text-xs px-1' : ''} flex-shrink-0`}>{classItem.age_group}</Badge>
                        </div>
                      </div>
                      <div className={`flex gap-2 ${isMobile ? 'w-full' : 'flex-shrink-0'}`}>
                        <Button
                          variant="outline"
                          size={isMobile ? "sm" : "sm"}
                          onClick={() => toggleClassStatus(classItem.id, classItem.is_active)}
                          className={`${isMobile ? 'flex-1 text-xs' : ''}`}
                        >
                          {classItem.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingClass(classItem);
                            setFormData({
                              name: classItem.name,
                              description: classItem.description || '',
                              instructor_id: classItem.instructor_id || '',
                              max_students: classItem.max_students,
                              unlimited_students: false,
                              duration_minutes: classItem.duration_minutes,
                              skill_level: classItem.skill_level || 'all',
                              age_group: classItem.age_group || 'all',
                              class_length_type: 'indefinite',
                              class_length_value: '',
                              start_date: classItem.start_date || new Date().toISOString().split('T')[0],
                            });
                            fetchClassSchedules(classItem.id);
                            setIsDialogOpen(true);
                          }}
                          className={`${isMobile ? 'px-2' : ''}`}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};