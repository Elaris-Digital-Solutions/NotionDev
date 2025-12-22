import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { DatabaseRow, DatabaseProperty } from "@/hooks/useDatabase";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
    rows: DatabaseRow[];
    properties: DatabaseProperty[];
    pageId: string;
}

export function CalendarView({ rows, properties, pageId }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    // 1. Find the Date Property to use for scheduling
    // We default to the FIRST property of type 'date'.
    // If none exists, we fallback to created_at or show specific "No Date Property" state.
    const dateProperty = properties.find(p => p.type === 'date');

    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    // Calendar Grid Logic
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    if (!dateProperty) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground p-8">
                No "Date" property found in this database. Add one to use Calendar View.
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth} className="h-7 w-7">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-lg font-semibold min-w-[140px] text-center">
                        {format(currentDate, "MMMM yyyy")}
                    </h2>
                    <Button variant="outline" size="icon" onClick={nextMonth} className="h-7 w-7">
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                    Today
                </Button>
            </div>

            {/* Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-[auto_1fr] border rounded-lg overflow-hidden bg-background">
                {/* Days Header */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-2 text-xs font-medium text-center border-b border-r last:border-r-0 bg-muted/30">
                        {day}
                    </div>
                ))}

                {/* Days Cells */}
                <div className="contents">
                    {calendarDays.map((day, idx) => {
                        const isCurrentMonth = isSameMonth(day, monthStart);

                        // Find rows for this day
                        const dayRows = rows.filter(row => {
                            const cellValue = row.properties[dateProperty.name];
                            if (!cellValue) return false;
                            return isSameDay(new Date(cellValue), day);
                        });

                        return (
                            <div
                                key={day.toISOString()}
                                className={cn(
                                    "min-h-[100px] border-b border-r p-1 flex flex-col gap-1 transition-colors hover:bg-accent/5",
                                    (idx + 1) % 7 === 0 && "border-r-0", // No right border for last col
                                    !isCurrentMonth && "bg-muted/10 text-muted-foreground"
                                )}
                            >
                                <div className={cn(
                                    "text-xs font-medium p-1 w-6 h-6 flex items-center justify-center rounded-full mb-1",
                                    isSameDay(day, new Date()) ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                                )}>
                                    {format(day, "d")}
                                </div>

                                {/* Events */}
                                <div className="flex flex-col gap-1 overflow-y-auto max-h-[120px]">
                                    {dayRows.map(row => (
                                        <Link
                                            key={row.id}
                                            to={`/page/${row.id}`}
                                            className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-1.5 py-1 rounded truncate hover:bg-primary/20 transition-colors block"
                                            title={row.title}
                                        >
                                            {row.icon} {row.title}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
