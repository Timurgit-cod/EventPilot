import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventModal from "./EventModal";
import type { Event } from "@shared/schema";

const DAYS_OF_WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const EVENT_COLORS = {
  meeting: { bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500' },
  project: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
  deadline: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
};

interface CalendarProps {
  isAdmin?: boolean;
}

export default function Calendar({ isAdmin = false }: CalendarProps) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events', currentDate.getFullYear(), currentDate.getMonth() + 1],
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert to Monday = 0

    const days = [];
    
    // Previous month days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.getDate() - i,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, prevMonth.getDate() - i),
      });
    }
    
    // Current month days
    for (let date = 1; date <= daysInMonth; date++) {
      days.push({
        date,
        isCurrentMonth: true,
        fullDate: new Date(year, month, date),
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let date = 1; date <= remainingDays; date++) {
      days.push({
        date,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, date),
      });
    }
    
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date) => {
    return formatDate(date) === formatDate(today);
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return events.filter(event => event.date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const handleAddEvent = (date?: string) => {
    if (!isAdmin) return;
    setSelectedDate(date || null);
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    if (!isAdmin) return;
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setSelectedDate(null);
  };

  const days = getDaysInMonth(currentDate);

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              data-testid="button-prev-month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-semibold text-gray-900" data-testid="text-current-month">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              data-testid="button-next-month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={goToToday}
              className="text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
              data-testid="button-today"
            >
              Сегодня
            </Button>
            {isAdmin && (
              <Button
                onClick={() => handleAddEvent()}
                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm"
                data-testid="button-add-event"
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить событие
              </Button>
            )}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 bg-gray-50">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1 bg-gray-200">
            {days.map((day, index) => {
              const dayEvents = getEventsForDate(day.fullDate);
              const isCurrentDay = isToday(day.fullDate);
              const dateStr = formatDate(day.fullDate);
              
              return (
                <div
                  key={index}
                  className={`
                    bg-white min-h-[120px] p-3 relative transition-all ${isAdmin ? 'cursor-pointer hover:bg-gray-50' : ''}
                    ${isCurrentDay ? 'bg-blue-50 border-2 border-blue-200' : ''}
                    ${selectedDate === dateStr ? 'ring-2 ring-blue-300' : ''}
                  `}
                  onClick={() => {
                    if (!isAdmin) return;
                    setSelectedDate(dateStr);
                    if (dayEvents.length === 0) {
                      handleAddEvent(dateStr);
                    }
                  }}
                  data-testid={`calendar-day-${dateStr}`}
                >
                  <span className={`
                    text-sm font-medium
                    ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                    ${isCurrentDay ? 'font-bold text-blue-700' : ''}
                  `}>
                    {day.date}
                  </span>
                  
                  {isCurrentDay && (
                    <span className="absolute top-1 right-1 text-xs text-blue-600 font-medium">
                      Сегодня
                    </span>
                  )}
                  
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 2).map(event => {
                      const colors = EVENT_COLORS[event.category as keyof typeof EVENT_COLORS] || EVENT_COLORS.project;
                      return (
                        <div
                          key={event.id}
                          className={`flex items-center text-xs px-2 py-1 rounded ${isAdmin ? 'cursor-pointer' : ''} ${colors.bg} ${colors.text}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEvent(event);
                          }}
                          data-testid={`event-${event.id}`}
                        >
                          <span className={`w-2 h-2 rounded-full inline-block mr-1 ${colors.dot}`}></span>
                          <span className="truncate">{event.title}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 px-2">
                        +{dayEvents.length - 2} еще
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isAdmin && (
        <EventModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          event={editingEvent}
          selectedDate={selectedDate}
        />
      )}
    </>
  );
}