import { Calendar, Clock, Users, Plus, Video, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Meeting } from '@/types/workspace';
import { useAuth } from "@/components/providers/AuthProvider";
import { toast } from "sonner";

export function MeetingsView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      return data as Meeting[];
    }
  });

  const createMeeting = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");
      
      const newMeeting = {
        title: 'Nueva Reunión',
        date: new Date().toISOString(),
        participants: [user.email], // Add creator as participant
        notes: ''
      };
      
      const { data, error } = await supabase
        .from('meetings')
        .insert(newMeeting)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success("Reunión creada");
    },
    onError: (error) => {
      toast.error("Error al crear reunión: " + error.message);
    }
  });

  const todayMeetings = meetings.filter(m => isToday(new Date(m.date)));
  const upcomingMeetings = meetings.filter(m => !isToday(new Date(m.date)) && new Date(m.date) > new Date());

  if (isLoading) return <div className="p-8">Loading meetings...</div>;

  return (
    <div className="flex-1 overflow-auto p-8 animate-fade-up">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-info" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Meetings</h1>
              <p className="text-muted-foreground">
                Gestiona tus reuniones y notas
              </p>
            </div>
          </div>
          {user && (
            <Button className="gap-2" onClick={() => createMeeting.mutate()} disabled={createMeeting.isPending}>
              <Plus className="w-4 h-4" />
              {createMeeting.isPending ? "Creando..." : "Nueva Reunión"}
            </Button>
          )}
        </div>

        {/* Today's Meetings */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Hoy
          </h2>
          {todayMeetings.length > 0 ? (
            <div className="space-y-3">
              {todayMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} isToday />
              ))}
            </div>
          ) : (
            <Card className="border-border border-dashed">
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No hay reuniones programadas para hoy</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Upcoming Meetings */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Próximamente</h2>
          <div className="space-y-3">
            {upcomingMeetings.length > 0 ? (
              upcomingMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))
            ) : (
              <div className="text-muted-foreground text-sm">No hay reuniones próximas</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

interface MeetingCardProps {
  meeting: Meeting;
  isToday?: boolean;
}

function MeetingCard({ meeting, isToday: isTodayMeeting }: MeetingCardProps) {
  const date = new Date(meeting.date);
  const participants = meeting.participants || [];

  return (
    <Card className="border-border hover:border-info/30 transition-all cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Time Block */}
            <div className={`p-3 rounded-lg text-center min-w-[70px] ${isTodayMeeting ? 'bg-info/20' : 'bg-secondary'}`}>
              <p className={`text-lg font-bold ${isTodayMeeting ? 'text-info' : 'text-foreground'}`}>
                {format(date, 'HH:mm')}
              </p>
              <p className="text-xs text-muted-foreground">
                {isTodayMeeting ? 'Hoy' : format(date, 'd MMM', { locale: es })}
              </p>
            </div>

            {/* Meeting Info */}
            <div className="flex-1">
              <h3 className="font-semibold text-foreground group-hover:text-info transition-colors">
                {meeting.title}
              </h3>
              
              {/* Attendees */}
              <div className="flex items-center gap-2 mt-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div className="flex -space-x-2">
                  {participants.slice(0, 3).map((attendee, i) => (
                    <Avatar key={i} className="w-6 h-6 border-2 border-card">
                      <AvatarFallback className="text-[10px] bg-accent">
                        {attendee.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {participants.length} participantes
                </span>
              </div>

              {/* Notes preview */}
              {meeting.notes && (
                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {meeting.notes}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="outline" size="sm" className="gap-1">
              <Video className="w-4 h-4" />
              Unirse
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
