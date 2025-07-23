import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CalendarIcon,
  Plus,
  Edit,
  Trash2,
  Clock,
  Users,
  MapPin,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  event_type: 'class' | 'event' | 'maintenance' | 'meeting';
  is_recurring: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly';
  recurrence_end_date?: string;
  instructor_id?: string;
  max_participants?: number;
  location?: string;
  status: 'scheduled' | 'cancelled' | 'completed';
  created_by: string;
  academy_id: string;
}

interface RecurringEventForm {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  event_type: 'class' | 'event' | 'maintenance' | 'meeting';
  instructor_id: string;
  max_participants: number;
  location: string;
  is_recurring: boolean;
  recurrence_pattern: 'daily' | 'weekly' | 'monthly';
  recurrence_end_date: string;
}

const EVENT_TYPES = [
  { value: 'class', label: 'Class', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'event', label: 'Event', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'meeting', label: 'Meeting', color: 'bg-purple-100 text-purple-800 border-purple-200' }
];

export const EnhancedCalendarView = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventForm, setEventForm] = useState<RecurringEventForm>({
    title: '',
    description: '',
    start_time: '09:00',
    end_time: '10:00',
    event_type: 'class',
    instructor_id: '',
    max_participants: 20,
    location: '',
    is_recurring: false,
    recurrence_pattern: 'weekly',
    recurrence_end_date: format(addMonths(new Date(), 3), 'yyyy-MM-dd')
  });

  // Fetch calendar events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events', currentMonth],
    queryFn: async () => {
      const startDate = startOfMonth(currentMonth);
      const endDate = endOfMonth(currentMonth);

      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          profiles:instructor_id (
            first_name,
            last_name
          )
        `)
        .gte('start_date', format(startDate, 'yyyy-MM-dd'))
        .lte('start_date', format(endDate, 'yyyy-MM-dd'))
        .order('start_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile
  });

  // Fetch instructors for dropdown
  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('role', ['instructor', 'admin', 'owner'])
        .eq('membership_status', 'active');

      if (error) throw error;
      return data || [];
    }
  });

  // Create or update event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: Partial<CalendarEvent>) => {
      if (editingEvent) {
        const { data, error } = await supabase
          .from('calendar_events')
          .update(eventData)
          .eq('id', editingEvent.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('calendar_events')
          .insert([{
            ...eventData,
            start_date: format(selectedDate, 'yyyy-MM-dd'),
            end_date: format(selectedDate, 'yyyy-MM-dd'),
            created_by: profile?.id,
            academy_id: profile?.academy_id,
            status: 'scheduled'
          }])
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({
        title: 'Success',
        description: `Event ${editingEvent ? 'updated' : 'created'} successfully`
      });
      setEventDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || `Failed to ${editingEvent ? 'update' : 'create'} event`
      });
    }
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({
        title: 'Success',
        description: 'Event deleted successfully'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete event'
      });
    }
  });

  const resetForm = () => {
    setEventForm({
      title: '',
      description: '',
      start_time: '09:00',
      end_time: '10:00',
      event_type: 'class',
      instructor_id: '',
      max_participants: 20,
      location: '',
      is_recurring: false,
      recurrence_pattern: 'weekly',
      recurrence_end_date: format(addMonths(new Date(), 3), 'yyyy-MM-dd')
    });
    setEditingEvent(null);
  };

  const handleCreateEvent = () => {
    if (!eventForm.title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Event title is required'
      });
      return;
    }

    createEventMutation.mutate({
      title: eventForm.title,
      description: eventForm.description,
      start_time: eventForm.start_time,
      end_time: eventForm.end_time,
      event_type: eventForm.event_type,
      instructor_id: eventForm.instructor_id || null,
      max_participants: eventForm.max_participants,
      location: eventForm.location,
      is_recurring: eventForm.is_recurring,
      recurrence_pattern: eventForm.is_recurring ? eventForm.recurrence_pattern : null,
      recurrence_end_date: eventForm.is_recurring ? eventForm.recurrence_end_date : null
    });
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      start_time: event.start_time,
      end_time: event.end_time,
      event_type: event.event_type,
      instructor_id: event.instructor_id || '',
      max_participants: event.max_participants || 20,
      location: event.location || '',
      is_recurring: event.is_recurring,
      recurrence_pattern: event.recurrence_pattern || 'weekly',
      recurrence_end_date: event.recurrence_end_date || format(addMonths(new Date(), 3), 'yyyy-MM-dd')
    });
    setEventDialogOpen(true);
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.start_date), date)
    );
  };

  const getEventTypeStyle = (eventType: string) => {
    return EVENT_TYPES.find(type => type.value === eventType)?.color || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const canManageEvents = profile?.role && ['admin', 'owner', 'instructor'].includes(profile.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Calendar</h2>
          <p className="text-muted-foreground">Manage classes, events, and schedules</p>
        </div>
        {canManageEvents && (
          <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={eventForm.title}
                    onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Event title"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={eventForm.description}
                    onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Event description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={eventForm.start_time}
                      onChange={(e) => setEventForm(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={eventForm.end_time}
                      onChange={(e) => setEventForm(prev => ({ ...prev, end_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="event_type">Event Type</Label>
                  <Select
                    value={eventForm.event_type}
                    onValueChange={(value: any) => setEventForm(prev => ({ ...prev, event_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="instructor">Instructor</Label>
                  <Select
                    value={eventForm.instructor_id}
                    onValueChange={(value) => setEventForm(prev => ({ ...prev, instructor_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors.map(instructor => (
                        <SelectItem key={instructor.id} value={instructor.id}>
                          {instructor.first_name} {instructor.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max_participants">Max Participants</Label>
                    <Input
                      id="max_participants"
                      type="number"
                      value={eventForm.max_participants}
                      onChange={(e) => setEventForm(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 0 }))}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={eventForm.location}
                      onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Location"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_recurring"
                      checked={eventForm.is_recurring}
                      onCheckedChange={(checked) => setEventForm(prev => ({ ...prev, is_recurring: checked }))}
                    />
                    <Label htmlFor="is_recurring">Recurring Event</Label>
                  </div>

                  {eventForm.is_recurring && (
                    <div className="space-y-3 pl-6">
                      <div>
                        <Label htmlFor="recurrence_pattern">Repeat</Label>
                        <Select
                          value={eventForm.recurrence_pattern}
                          onValueChange={(value: any) => setEventForm(prev => ({ ...prev, recurrence_pattern: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="recurrence_end_date">End Date</Label>
                        <Input
                          id="recurrence_end_date"
                          type="date"
                          value={eventForm.recurrence_end_date}
                          onChange={(e) => setEventForm(prev => ({ ...prev, recurrence_end_date: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEventDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateEvent}
                    disabled={createEventMutation.isPending}
                  >
                    {createEventMutation.isPending ? 'Saving...' : (editingEvent ? 'Update' : 'Create')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {format(currentMonth, 'MMMM yyyy')}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  Next
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="w-full"
              modifiers={{
                hasEvent: (date) => getEventsForDate(date).length > 0
              }}
              modifiersStyles={{
                hasEvent: {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  fontWeight: 'bold'
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Selected Date Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {format(selectedDate, 'MMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="text-center py-8">Loading events...</div>
              ) : getEventsForDate(selectedDate).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No events scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getEventsForDate(selectedDate).map((event) => (
                    <Card key={event.id} className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{event.title}</h4>
                          {canManageEvents && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditEvent(event)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteEventMutation.mutate(event.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <Badge className={cn('text-xs', getEventTypeStyle(event.event_type))}>
                          {EVENT_TYPES.find(t => t.value === event.event_type)?.label}
                        </Badge>

                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.start_time} - {event.end_time}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </div>
                          )}
                          {event.max_participants && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Max: {event.max_participants}
                            </div>
                          )}
                          {event.is_recurring && (
                            <div className="flex items-center gap-1">
                              <RefreshCw className="h-3 w-3" />
                              Repeats {event.recurrence_pattern}
                            </div>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-sm text-muted-foreground">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};