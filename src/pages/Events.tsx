import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/ui/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Plus, Clock, Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Events = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const { data, error } = await supabase
        .from('events')
        .insert([{
          title: eventData.title,
          description: eventData.description,
          event_type: eventData.type,
          date: eventData.date,
          start_time: eventData.time,
          end_time: eventData.endTime || '23:59',
          location: eventData.location,
          max_participants: parseInt(eventData.maxParticipants) || null,
          status: 'published',
          created_by: profile?.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Event created successfully!" });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['upcoming-events'] });
      queryClient.invalidateQueries({ queryKey: ['events-stats'] });
    },
    onError: (error) => {
      console.error('Event creation error:', error);
      toast({ title: "Error creating event", variant: "destructive" });
    }
  });

  const handleCreateEvent = (eventData: any) => {
    createEventMutation.mutate(eventData);
  };

  const registerForEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { data, error } = await supabase
        .from('event_registrations')
        .insert([{
          event_id: eventId,
          student_id: profile?.id,
          status: 'registered',
          payment_status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Registration successful!" });
      queryClient.invalidateQueries({ queryKey: ['upcoming-events'] });
    },
    onError: (error: any) => {
      console.error('Registration error:', error);
      if (error.code === '23505') {
        toast({ title: "You're already registered for this event", variant: "destructive" });
      } else {
        toast({ title: "Error registering for event", variant: "destructive" });
      }
    }
  });

  const handleRegisterForEvent = (eventId: string) => {
    if (!profile?.id) {
      toast({ title: "Please log in to register for events", variant: "destructive" });
      return;
    }
    registerForEventMutation.mutate(eventId);
  };

  const { data: upcomingEvents } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0])
        .in('status', ['published', 'registration_open', 'registration_closed'])
        .order('date', { ascending: true })
        .limit(10);

      if (error) throw error;

      // Get registration counts for each event
      const eventsWithCounts = await Promise.all(
        (data || []).map(async (event) => {
          const { data: registrations } = await supabase
            .from('event_registrations')
            .select('id')
            .eq('event_id', event.id)
            .eq('status', 'registered');

          return {
            ...event,
            participants: registrations?.length || 0
          };
        })
      );

      return eventsWithCounts;
    }
  });

  const { data: eventsStats } = useQuery({
    queryKey: ['events-stats'],
    queryFn: async () => {
      const { data: events } = await supabase
        .from('events')
        .select('event_type, date, status');

      const { data: registrations } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('status', 'registered');

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      return {
        totalEvents: events?.length || 0,
        upcomingEvents: events?.filter(e => new Date(e.date) >= new Date()).length || 0,
        competitions: events?.filter(e => e.event_type === 'tournament').length || 0,
        thisMonthEvents: events?.filter(e => {
          const eventDate = new Date(e.date);
          return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
        }).length || 0,
        totalParticipants: registrations?.length || 0
      };
    }
  });

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              Events & Calendar
            </h1>
            <p className="text-muted-foreground mt-1">
              Academy events, competitions, and special activities
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eventsStats?.upcomingEvents || 0}</div>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Competitions</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eventsStats?.competitions || 0}</div>
              <p className="text-xs text-muted-foreground">Tournaments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eventsStats?.totalParticipants || 0}</div>
              <p className="text-xs text-muted-foreground">Total registrations</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="competitions">Competitions</TabsTrigger>
              <TabsTrigger value="workshops">Workshops</TabsTrigger>
              <TabsTrigger value="past">Past Events</TabsTrigger>
            </TabsList>
            
            {isAdmin && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>
                      Add a new event to the academy calendar
                    </DialogDescription>
                  </DialogHeader>
                  <CreateEventForm onSubmit={handleCreateEvent} />
                </DialogContent>
              </Dialog>
            )}
          </div>

          <TabsContent value="upcoming" className="space-y-6">
            <div className="grid gap-4">
              {upcomingEvents?.map((event: any) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                         <CardDescription className="flex items-center gap-4 mt-2">
                           <span className="flex items-center gap-1">
                             <Calendar className="h-4 w-4" />
                             {new Date(event.date).toLocaleDateString()}
                           </span>
                           <span className="flex items-center gap-1">
                             <Clock className="h-4 w-4" />
                             {event.start_time} - {event.end_time}
                           </span>
                         </CardDescription>
                      </div>
                       <Badge variant={event.event_type === 'tournament' ? 'default' : 'secondary'}>
                         {event.event_type}
                       </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {event.participants} registered
                        </span>
                      </div>
                       <div className="flex gap-2">
                         <Dialog>
                           <DialogTrigger asChild>
                             <Button variant="outline" size="sm">
                               View Details
                             </Button>
                           </DialogTrigger>
                           <DialogContent>
                             <DialogHeader>
                               <DialogTitle>{event.title}</DialogTitle>
                               <DialogDescription>Event Details</DialogDescription>
                             </DialogHeader>
                             <div className="space-y-4">
                               <div>
                                 <p className="font-medium">Description</p>
                                 <p className="text-sm text-muted-foreground">{event.description}</p>
                               </div>
                               <div className="grid grid-cols-2 gap-4 text-sm">
                                 <div>
                                   <p className="font-medium">Date</p>
                                   <p className="text-muted-foreground">{new Date(event.date).toLocaleDateString()}</p>
                                 </div>
                                 <div>
                                   <p className="font-medium">Time</p>
                                   <p className="text-muted-foreground">{event.start_time} - {event.end_time}</p>
                                 </div>
                                 <div>
                                   <p className="font-medium">Location</p>
                                   <p className="text-muted-foreground">{event.location}</p>
                                 </div>
                                 <div>
                                   <p className="font-medium">Type</p>
                                   <p className="text-muted-foreground">{event.event_type}</p>
                                 </div>
                               </div>
                               {event.max_participants && (
                                 <div>
                                   <p className="font-medium">Capacity</p>
                                   <p className="text-sm text-muted-foreground">
                                     {event.participants} / {event.max_participants} registered
                                   </p>
                                 </div>
                               )}
                             </div>
                           </DialogContent>
                         </Dialog>
                          {(event.status === 'registration_open' || event.status === 'published') && (
                            <Button size="sm" onClick={() => handleRegisterForEvent(event.id)}>
                              Register
                            </Button>
                          )}
                       </div>
                    </div>
                  </CardContent>
                </Card>
              )) || (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No upcoming events</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="competitions" className="space-y-6">
            <div className="grid gap-4">
              {[
                {
                  title: "Regional Karate Championship",
                  date: "2025-08-15",
                  location: "City Sports Center",
                  prize: "$2,000 total prizes",
                  divisions: ["Youth", "Adult", "Senior"],
                  deadline: "2025-08-01"
                },
                {
                  title: "State Martial Arts Tournament",
                  date: "2025-09-22",
                  location: "State Convention Center", 
                  prize: "$5,000 total prizes",
                  divisions: ["Kata", "Kumite", "Team"],
                  deadline: "2025-09-01"
                }
              ].map((comp, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {comp.title}
                      <Badge variant="default">Competition</Badge>
                    </CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-4">
                        <span>{comp.date}</span>
                        <span>•</span>
                        <span>{comp.location}</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-green-600">{comp.prize}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Divisions:</p>
                        <div className="flex gap-2 mt-1">
                          {comp.divisions.map((division, i) => (
                            <Badge key={i} variant="outline">{division}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <p className="text-sm text-muted-foreground">
                          Registration deadline: {comp.deadline}
                        </p>
                        <Button size="sm" onClick={() => handleRegisterForEvent('competition-' + index)}>Register</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="workshops" className="space-y-6">
            <div className="grid gap-4">
              {[
                {
                  title: "Self-Defense Workshop",
                  date: "2025-07-28",
                  instructor: "Sensei Johnson",
                  level: "All levels",
                  duration: "2 hours",
                  spots: "20 spots available"
                },
                {
                  title: "Advanced Kata Techniques",
                  date: "2025-08-05",
                  instructor: "Master Chen",
                  level: "Brown belt and above",
                  duration: "3 hours",
                  spots: "15 spots available"
                }
              ].map((workshop, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {workshop.title}
                      <Badge variant="secondary">Workshop</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">{workshop.date}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Instructor</p>
                        <p className="font-medium">{workshop.instructor}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Level</p>
                        <p className="font-medium">{workshop.level}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Duration</p>
                        <p className="font-medium">{workshop.duration}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-sm text-muted-foreground">{workshop.spots}</p>
                      <Button variant="outline" size="sm" onClick={() => handleRegisterForEvent('workshop-' + index)}>Register</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="past" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Past Events</CardTitle>
                <CardDescription>Previously held events and their outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { title: "Summer Karate Camp", date: "2025-06-15", participants: 25, outcome: "Successful" },
                    { title: "Spring Tournament", date: "2025-04-20", participants: 30, outcome: "3 gold medals" },
                    { title: "Beginner Workshop", date: "2025-03-10", participants: 18, outcome: "High satisfaction" }
                  ].map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">{event.date} • {event.participants} participants</p>
                      </div>
                      <Badge variant="outline">{event.outcome}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

interface CreateEventFormProps {
  onSubmit: (data: any) => void;
}

const CreateEventForm = ({ onSubmit }: CreateEventFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: '',
    maxParticipants: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Event Title</Label>
        <Input
          placeholder="Event name"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
        />
      </div>

      <div>
        <Label htmlFor="type">Event Type</Label>
        <Select 
          value={formData.type}
          onValueChange={(value) => setFormData({...formData, type: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tournament">Tournament</SelectItem>
            <SelectItem value="workshop">Workshop</SelectItem>
            <SelectItem value="seminar">Seminar</SelectItem>
            <SelectItem value="belt_test">Belt Testing</SelectItem>
            <SelectItem value="social">Social Event</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="time">Time</Label>
          <Input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({...formData, time: e.target.value})}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          placeholder="Event location"
          value={formData.location}
          onChange={(e) => setFormData({...formData, location: e.target.value})}
        />
      </div>

      <div>
        <Label htmlFor="maxParticipants">Max Participants</Label>
        <Input
          type="number"
          placeholder="Maximum number of participants"
          value={formData.maxParticipants}
          onChange={(e) => setFormData({...formData, maxParticipants: e.target.value})}
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          placeholder="Event description and details"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
      </div>

      <Button type="submit" className="w-full">Create Event</Button>
    </form>
  );
};

export default Events;