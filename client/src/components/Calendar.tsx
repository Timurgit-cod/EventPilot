import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventModal from "./EventModal";
import { EventFilters, type FilterOptions } from "./EventFilters";
import { EventViewModal } from "./EventViewModal";
import type { Event } from "@shared/schema";

const DAYS_OF_WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const EVENT_COLORS = {
  internal: { bg: 'bg-yellow-200', text: 'text-yellow-900', dot: 'bg-yellow-600' },
  external: { bg: 'bg-pink-200', text: 'text-pink-800', dot: 'bg-pink-600' },
  foreign: { bg: 'bg-gray-200', text: 'text-gray-800', dot: 'bg-gray-600' },
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
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    internal: true,
    external: true,
    foreign: true,
  });

  // Загружаем события для всех видимых месяцев на календаре
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const prevMonth = month === 1 ? 12 : month - 1;
  const nextMonth = month === 12 ? 1 : month + 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextYear = month === 12 ? year + 1 : year;

  const { data: currentMonthEvents = [] } = useQuery<Event[]>({
    queryKey: ['/api/events', year, month],
  });

  const { data: prevMonthEvents = [] } = useQuery<Event[]>({
    queryKey: ['/api/events', prevYear, prevMonth], 
  });

  const { data: nextMonthEvents = [] } = useQuery<Event[]>({
    queryKey: ['/api/events', nextYear, nextMonth],
  });

  // Объединяем все события и удаляем дубликаты по ID
  const allEvents = [...currentMonthEvents, ...prevMonthEvents, ...nextMonthEvents];
  const events = Array.from(
    new Map(allEvents.map(event => [event.id, event])).values()
  );



  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert to Monday = 0

    const days = [];
    
    // Previous month days
    const prevMonth = new Date(year, month, 0); // Последний день предыдущего месяца
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      days.push({
        date: dayNum,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, dayNum),
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
    // Форматируем дату в локальном времени, избегая проблем с UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isToday = (date: Date) => {
    return formatDate(date) === formatDate(today);
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return events.filter(event => {
      // События, которые НАЧИНАЮТСЯ в этот день (для отображения блока)
      return dateStr === event.startDate;
    });
  };

  // Проверяет, продолжается ли событие в указанную дату
  const isEventContinuing = (event: Event, date: Date) => {
    const dateStr = formatDate(date);
    const startDate = event.startDate;
    const endDate = event.endDate;
    return dateStr >= startDate && dateStr <= endDate;
  };

  const getEventSpan = (event: Event, dayIndex: number) => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    // Вычисляем количество дней
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
    
    // Ограничиваем размах до конца недели
    const daysLeftInWeek = 7 - (dayIndex % 7);
    return Math.min(daysDiff, daysLeftInWeek);
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

  const handleViewEvent = (event: Event) => {
    setViewingEvent(event);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setSelectedDate(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingEvent(null);
  };

  const days = getDaysInMonth(currentDate);



  return (
    <>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
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
            
            <EventFilters 
              filters={filters} 
              onFiltersChange={setFilters} 
            />
            
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
        <div className="p-6 flex-1 flex flex-col">
          {/* Week Days Header */}
          <div className="flex gap-1 mb-1">
            {DAYS_OF_WEEK.map((day, index) => (
              <div 
                key={day} 
                className={`p-3 text-center text-sm font-semibold text-gray-600 bg-gray-50 ${
                  index >= 5 ? 'flex-[0.33]' : 'flex-1'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="relative bg-gray-200 flex-1">
            <div className="flex flex-col gap-1 h-full" id="calendar-grid">
              {Array.from({ length: 6 }, (_, weekIndex) => (
                <div key={weekIndex} className="flex gap-1 flex-1">
                  {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => {
                    const index = weekIndex * 7 + dayIndex;
                    const isCurrentDay = isToday(day.fullDate);
                    const dateStr = formatDate(day.fullDate);
                    
                    return (
                      <div
                        key={index}
                        className={`
                          bg-white min-h-[180px] p-3 relative transition-all
                          ${isAdmin ? 'cursor-pointer hover:bg-gray-50' : ''}
                          ${isCurrentDay ? 'bg-blue-50 border-2 border-blue-200' : ''}
                          ${selectedDate === dateStr ? 'ring-2 ring-blue-300' : ''}
                          ${dayIndex >= 5 ? 'flex-[0.33]' : 'flex-1'}
                        `}
                        onClick={() => {
                          if (!isAdmin) return;
                          setSelectedDate(dateStr);
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
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            
            {/* События как отдельный слой */}
            {(() => {
              // Группируем события по неделям и вычисляем их слои
              const eventsWithPositions: Array<{
                event: Event;
                row: number;
                col: number;
                span: number;
                layer: number;
              }> = [];
              
              // Фильтруем события - показываем те, которые пересекаются с видимыми днями
              const firstVisibleDay = days[0].fullDate;
              const lastVisibleDay = days[days.length - 1].fullDate;
              
              const visibleEvents = events.filter(event => {
                const eventStartDate = new Date(event.startDate);
                const eventEndDate = new Date(event.endDate);
                
                // Событие видимо, если оно пересекается с видимым диапазоном дней
                const isVisible = eventStartDate <= lastVisibleDay && eventEndDate >= firstVisibleDay;
                
                // Применяем фильтры категорий
                const categoryFilter = filters[event.category as keyof FilterOptions];
                
                return isVisible && categoryFilter;
              });
              
              visibleEvents.forEach(event => {
                const eventStartDate = new Date(event.startDate);
                const eventEndDate = new Date(event.endDate);
                
                // Находим первый видимый день события
                const effectiveStartDate = eventStartDate > firstVisibleDay ? eventStartDate : firstVisibleDay;
                const startDayIndex = days.findIndex(day => formatDate(day.fullDate) === formatDate(effectiveStartDate));
                
                if (startDayIndex === -1) return;
                
                // Вычисляем продолжительность до конца события или до конца видимых дней
                const effectiveEndDate = eventEndDate < lastVisibleDay ? eventEndDate : lastVisibleDay;
                const timeDiff = effectiveEndDate.getTime() - effectiveStartDate.getTime();
                const daysDuration = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
                
                const row = Math.floor(startDayIndex / 7);
                const col = startDayIndex % 7;
                const daysToEndOfWeek = 7 - col;
                const eventSpan = Math.min(daysDuration, daysToEndOfWeek);
                
                // Находим свободный слой для этого события
                let layer = 0;
                const eventsInSameRow = eventsWithPositions.filter(ep => ep.row === row);
                
                while (true) {
                  const conflict = eventsInSameRow.find(ep => 
                    ep.layer === layer && 
                    ((col >= ep.col && col < ep.col + ep.span) || 
                     (col + eventSpan > ep.col && col < ep.col + ep.span))
                  );
                  
                  if (!conflict) break;
                  layer++;
                }
                
                eventsWithPositions.push({
                  event,
                  row,
                  col,
                  span: eventSpan,
                  layer
                });
                
                // Если событие продолжается на следующую неделю, добавляем продолжение
                if (daysDuration > eventSpan) {
                  const remainingDays = daysDuration - eventSpan;
                  const nextWeekStartIndex = (row + 1) * 7;
                  
                  if (nextWeekStartIndex < days.length) {
                    const nextWeekSpan = Math.min(remainingDays, 7);
                    
                    // Находим слой для продолжения на следующей неделе
                    let nextWeekLayer = 0;
                    const nextWeekEvents = eventsWithPositions.filter(ep => ep.row === row + 1);
                    
                    while (true) {
                      const conflict = nextWeekEvents.find(ep => 
                        ep.layer === nextWeekLayer && 
                        (ep.col < nextWeekSpan)
                      );
                      
                      if (!conflict) break;
                      nextWeekLayer++;
                    }
                    
                    eventsWithPositions.push({
                      event,
                      row: row + 1,
                      col: 0,
                      span: nextWeekSpan,
                      layer: nextWeekLayer
                    });
                  }
                }
              });
              
              return eventsWithPositions.map(({ event, row, col, span, layer }) => {
                const colors = EVENT_COLORS[event.category as keyof typeof EVENT_COLORS] || EVENT_COLORS.internal;
                
                // Упрощенное позиционирование - все колонки одинакового размера
                const getLeftPosition = (colIndex: number) => {
                  const columnWidthPercent = 100 / 7; // каждая колонка занимает 1/7 ширины
                  const gapWidth = 4; // gap-1 = 4px
                  // Вторник (индекс 1) сдвигается дополнительно на 15px вправо
                  const tuesdayOffset = colIndex === 1 ? 15 : 0;
                  return `calc(${colIndex * columnWidthPercent}% + ${colIndex * gapWidth}px + ${tuesdayOffset}px)`;
                };
                
                const getWidth = (spanCount: number) => {
                  const columnWidthPercent = 100 / 7;
                  const gapWidth = 4;
                  // Увеличиваем ширину на 10% чтобы блоки соответствовали сетке + еще 10px
                  return `calc((${spanCount * columnWidthPercent}% + ${(spanCount - 1) * gapWidth}px - 12px) * 1.1 + 10px)`;
                };
                
                const left = getLeftPosition(col);
                const width = getWidth(span);
                const top = `calc(${row} * 180px + 48px + ${layer * 26}px + 4px)`;
                
                // Определяем выравнивание текста - по центру для больших блоков
                const isWideEvent = span >= 5; // события на 5+ дней считаем широкими
                const textAlignment = isWideEvent ? 'justify-center' : 'justify-start';
                
                return (
                  <div
                    key={event.id}
                    className={`absolute flex items-center ${textAlignment} text-sm py-1 cursor-pointer ${colors.bg} rounded z-20 whitespace-nowrap`}
                    style={{
                      left,
                      width,
                      top,
                      height: '22px',
                      margin: '0 12px' // добавляем внутренний отступ для визуального улучшения
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isAdmin) {
                        handleEditEvent(event);
                      } else {
                        handleViewEvent(event);
                      }
                    }}
                    data-testid={`event-${event.id}`}
                  >
                    <span className="truncate text-black font-semibold px-2">{event.title}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {isAdmin && (
        <EventModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          event={editingEvent}
          selectedDate={selectedDate || undefined}
          isAdmin={isAdmin}
        />
      )}
      
      <EventViewModal
        event={viewingEvent}
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
      />
    </>
  );
}