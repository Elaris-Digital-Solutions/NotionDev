import {
  CheckCircle2,
  Clock,
  Calendar,
  Star,
  ArrowRight,
  FileText,
  Users,
  Zap,
  Layout,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, PriorityBadge } from "@/components/badges/StatusBadge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { format, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Page, Meeting } from '@/types/workspace';
import { Link } from "react-router-dom";
import { useAuth } from "@/components/providers/AuthProvider";

export function HomeView() {
  const today = new Date();
  const { user } = useAuth();

  const { data: recentPages = [] } = useQuery({
    queryKey: ['recentPages', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(4);

      if (error) {
        console.error('Error fetching recent pages:', error);
        return [];
      }
      return (data || []) as Page[];
    },
    enabled: !!user
  });

  const { data: upcomingMeetings = [] } = useQuery({
    queryKey: ['upcomingMeetings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .gte('date', new Date().toISOString())
        .order('date')
        .limit(5);

      if (error) {
        console.error('Error fetching meetings:', error);
        return [];
      }
      return (data || []) as Meeting[];
    },
    enabled: !!user
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('owner_id', user.id)
        .eq('is_favorite', true);

      if (error) {
        console.error('Error fetching favorites:', error);
        return [];
      }
      return (data || []) as Page[];
    },
    enabled: !!user
  });

  const { data: recentTasks = [] } = useQuery({
    queryKey: ['recentTasks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Fetch pages that are part of a database (rows)
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('owner_id', user.id)
        .not('parent_database_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching recent tasks:', error);
        return [];
      }
      return (data || []) as Page[];
    },
    enabled: !!user
  });

  const meetingsToday = upcomingMeetings.filter(m => isToday(new Date(m.date))).length;
  const totalTasks = recentTasks.length; // This is just the recent ones, ideally we'd count all

  return (
    <div className="flex-1 overflow-auto p-8 animate-fade-up">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Buenos días 👋
        </h1>
        <p className="text-muted-foreground">
          {format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Layout}
          label="Ítems Recientes"
          value={totalTasks.toString()}
          color="text-primary"
        />
        <StatCard
          icon={Star}
          label="Favoritos"
          value={favorites.length.toString()}
          color="text-info"
        />
        <StatCard
          icon={Calendar}
          label="Reuniones Hoy"
          value={meetingsToday.toString()}
          color="text-success"
        />
        <StatCard
          icon={Clock}
          label="Páginas Recientes"
          value={recentPages.length.toString()}
          color="text-warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks (Recent Database Items) */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Ítems Recientes
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Ver todos
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay ítems recientes</div>
            ) : (
              recentTasks.map((task) => (
                <Link
                  to={`/page/${task.id}`}
                  key={task.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer group"
                >
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <span className="text-lg">{task.icon || '📄'}</span>
                    <div>
                      <p className="font-medium text-foreground truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Creado el {format(new Date(task.created_at), "d MMM", { locale: es })}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Meetings */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-info" />
              Próximas Reuniones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay reuniones programadas</div>
            ) : (
              upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <p className="font-medium text-foreground">{meeting.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(meeting.date), "d MMM, HH:mm", { locale: es })}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {(meeting.participants || []).length} participantes
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Pages */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          Páginas Recientes
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {recentPages.map((page) => (
            <Link
              to={`/page/${page.id}`}
              key={page.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-accent/30 transition-all text-left group"
            >
              <span className="text-2xl">{page.icon || '📄'}</span>
              <span className="font-medium text-foreground truncate">{page.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Favorites */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          Favoritos
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {favorites.length === 0 ? (
            <div className="col-span-4 text-muted-foreground text-sm italic">No tienes favoritos aún</div>
          ) : (
            favorites.map((page) => (
              <Link
                to={`/page/${page.id}`}
                key={page.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-accent/30 transition-all text-left"
              >
                <span className="text-2xl">{page.icon || '📄'}</span>
                <span className="font-medium text-foreground truncate">{page.title}</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-colors">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-2 rounded-lg bg-secondary ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
