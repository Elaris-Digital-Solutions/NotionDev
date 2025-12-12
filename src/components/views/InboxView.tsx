import { Bell, MessageSquare, UserPlus, RefreshCw, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/types/workspace';

const iconMap: Record<string, any> = {
  mention: MessageSquare,
  assignment: UserPlus,
  'status-change': RefreshCw,
  comment: MessageSquare,
};

export function InboxView() {
  const queryClient = useQueryClient();
  
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Notification[];
    }
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
       const { error } = await supabase.from('notifications').update({ read: true }).neq('read', true);
       if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (isLoading) return <div className="p-8">Loading notifications...</div>;

  return (
    <div className="flex-1 overflow-auto p-8 animate-fade-up">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Inbox</h1>
              <p className="text-muted-foreground">
                {unreadCount} notificaciones sin leer
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => markAllRead.mutate()}>
            <Check className="w-4 h-4" />
            Marcar todo como leído
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length === 0 && (
            <div className="text-center text-muted-foreground py-8">No notifications</div>
          )}
          {notifications.map((notification, index) => {
            const Icon = iconMap[notification.type] || MessageSquare;
            return (
              <Card 
                key={notification.id}
                className={cn(
                  "border-border hover:border-primary/30 transition-all cursor-pointer group",
                  !notification.read && "bg-accent/30 border-l-2 border-l-primary"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={cn(
                    "p-2 rounded-lg",
                    notification.read ? "bg-secondary" : "bg-primary/20"
                  )}>
                    <Icon className={cn(
                      "w-4 h-4",
                      notification.read ? "text-muted-foreground" : "text-primary"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn(
                        "font-medium",
                        notification.read ? "text-muted-foreground" : "text-foreground"
                      )}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {notifications.length === 0 && (
          <div className="text-center py-16">
            <Bell className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No hay notificaciones
            </h3>
            <p className="text-muted-foreground">
              Cuando alguien te mencione o asigne una tarea, aparecerá aquí.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
