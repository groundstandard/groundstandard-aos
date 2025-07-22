import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, Clock, Users, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
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
}

interface ClassSchedule {
  id?: string;
  class_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
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
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    max_students: 20,
    duration_minutes: 60,
    skill_level: 'all',
    age_group: 'all',
  });

  const [scheduleData, setScheduleData] = useState<ClassSchedule[]>([
    { class_id: '', day_of_week: 1, start_time: '18:00', end_time: '19:00' }
  ]);

  useEffect(() => {
    if (profile?.role === 'admin' || profile?.role === 'owner') {
      fetchClasses();
    }
  }, [profile]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingClass) {
        // Update existing class
        const { error } = await supabase
          .from('classes')
          .update(formData)
          .eq('id', editingClass.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Class updated successfully'
        });
      } else {
        // Create new class
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .insert({
            ...formData,
            instructor_id: profile?.id
          })
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
      max_students: 20,
      duration_minutes: 60,
      skill_level: 'all',
      age_group: 'all',
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
            <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
              <Calendar className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              Class Management
            </CardTitle>
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
                  <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
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
                    {!isMobile && (
                      <div>
                        <Label htmlFor="max_students">Max Students</Label>
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

                  {isMobile && (
                    <div>
                      <Label htmlFor="max_students_mobile" className="text-sm">Max Students</Label>
                      <Input
                        id="max_students_mobile"
                        type="number"
                        value={formData.max_students}
                        onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
                        required
                        className="input-clean"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="description" className={isMobile ? 'text-sm' : ''}>Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input-clean"
                    />
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

                  {!editingClass && (
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
                  )}

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
          ) : (
            <div className="space-y-4">
              {classes.map((classItem) => (
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
                              max_students: classItem.max_students,
                              duration_minutes: classItem.duration_minutes,
                              skill_level: classItem.skill_level || 'all',
                              age_group: classItem.age_group || 'all',
                            });
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