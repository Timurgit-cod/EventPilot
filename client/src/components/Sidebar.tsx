import { useQuery } from "@tanstack/react-query";
import { Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Event } from "@shared/schema";
import { useState } from "react";
import EventModal from "./EventModal";

const EVENT_COLORS = {
  meeting: { bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500' },
  project: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
  deadline: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
};

const CATEGORY_NAMES = {
  meeting: 'Встречи',
  project: 'Проекты',
  deadline: 'Дедлайны',
};

export default function Sidebar() {
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Filter events for current month
  const currentMonthEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
  });

  // Filter upcoming events (today and future)
  const todayStr = today.toISOString().split('T')[0];
  const upcomingEvents = events
    .filter(event => event.date >= todayStr)
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return (a.time || '00:00').localeCompare(b.time || '00:00');
    })
    .slice(0, 5);

  // Calculate category statistics
  const categoryStats = events.reduce((acc, event) => {
    acc[event.category] = (acc[event.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatEventDateTime = (event: Event) => {
    const date = new Date(event.date);
    const monthNames = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const time = event.time ? `, ${event.time}` : '';
    
    return `${day} ${month}${time}`;
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Статистика</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Всего событий</span>
              <span className="text-lg font-semibold text-gray-900" data-testid="text-total-events">
                {events.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Этот месяц</span>
              <span className="text-lg font-semibold text-blue-600" data-testid="text-month-events">
                {currentMonthEvents.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Предстоящие</span>
              <span className="text-lg font-semibold text-green-600" data-testid="text-upcoming-events">
                {upcomingEvents.length}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">Предстоящие события</CardTitle>
            <Button
              variant="link"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium p-0 h-auto"
              data-testid="button-view-all-events"
            >
              Все события
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4" data-testid="text-no-upcoming-events">
                Нет предстоящих событий
              </div>
            ) : (
              upcomingEvents.map(event => {
                const colors = EVENT_COLORS[event.category as keyof typeof EVENT_COLORS] || EVENT_COLORS.project;
                return (
                  <div
                    key={event.id}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    data-testid={`upcoming-event-${event.id}`}
                  >
                    <div className="flex-shrink-0 pt-1">
                      <span className={`w-2 h-2 rounded-full inline-block ${colors.dot}`}></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate" data-testid={`event-title-${event.id}`}>
                        {event.title}
                      </p>
                      <p className="text-sm text-gray-500" data-testid={`event-datetime-${event.id}`}>
                        {formatEventDateTime(event)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditEvent(event)}
                      className="text-gray-400 hover:text-gray-600 p-1 h-auto"
                      data-testid={`button-edit-event-${event.id}`}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Event Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Категории</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(CATEGORY_NAMES).map(([category, name]) => {
              const count = categoryStats[category] || 0;
              const colors = EVENT_COLORS[category as keyof typeof EVENT_COLORS];
              return (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${colors.dot}`}></span>
                    <span className="text-sm text-gray-700">{name}</span>
                  </div>
                  <span className="text-sm text-gray-500" data-testid={`category-count-${category}`}>
                    {count}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        event={editingEvent}
      />
    </>
  );
}
