import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Users, TrendingUp } from "lucide-react";
import type { Event } from "@shared/schema";

interface SidebarProps {
  isAdmin: boolean;
}

export default function Sidebar({ isAdmin }: SidebarProps) {
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const getUpcomingEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return events
      .filter(event => event.date >= today)
      .slice(0, 5);
  };

  const getEventStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);
    
    return {
      total: events.length,
      thisMonth: events.filter(event => event.date.startsWith(thisMonth)).length,
      upcoming: events.filter(event => event.date >= today).length,
      meetings: events.filter(event => event.category === 'meeting').length,
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = getEventStats();
  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          Статистика
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">Всего событий</span>
            </div>
            <span className="font-semibold text-gray-900" data-testid="text-total-events">
              {stats.total}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">В этом месяце</span>
            </div>
            <span className="font-semibold text-gray-900" data-testid="text-month-events">
              {stats.thisMonth}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">Предстоящие</span>
            </div>
            <span className="font-semibold text-gray-900" data-testid="text-upcoming-events">
              {stats.upcoming}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">Встречи</span>
            </div>
            <span className="font-semibold text-gray-900" data-testid="text-meeting-events">
              {stats.meetings}
            </span>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-600" />
          Предстоящие события
        </h3>
        {upcomingEvents.length === 0 ? (
          <p className="text-gray-500 text-sm" data-testid="text-no-upcoming">
            Нет предстоящих событий
          </p>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div 
                key={event.id} 
                className="border-l-4 border-blue-500 pl-3 py-2"
                data-testid={`event-upcoming-${event.id}`}
              >
                <h4 className="font-medium text-gray-900 text-sm" data-testid={`text-event-title-${event.id}`}>
                  {event.title}
                </h4>
                <p className="text-xs text-gray-500 mt-1" data-testid={`text-event-date-${event.id}`}>
                  {new Date(event.date).toLocaleDateString('ru-RU')} 
                  {event.time && ` в ${event.time}`}
                </p>
                {event.category && (
                  <span 
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                      event.category === 'meeting' 
                        ? 'bg-blue-100 text-blue-800'
                        : event.category === 'project'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                    data-testid={`tag-category-${event.id}`}
                  >
                    {event.category === 'meeting' && 'Встреча'}
                    {event.category === 'project' && 'Проект'}
                    {event.category === 'deadline' && 'Дедлайн'}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Notice */}
      {!isAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <Users className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800" data-testid="title-user-notice">
                Режим просмотра
              </h4>
              <p className="text-sm text-yellow-700 mt-1" data-testid="text-user-notice">
                Вы можете просматривать события, но не можете их создавать или редактировать. 
                Только администраторы имеют права на управление событиями.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}