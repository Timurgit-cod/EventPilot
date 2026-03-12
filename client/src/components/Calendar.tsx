import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, FileEdit, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EventModal from "./EventModal";
import { EventFilters, type FilterOptions } from "./EventFilters";
import { EventViewModal } from "./EventViewModal";
import type { Event, InsertEvent } from "@shared/schema";

type DraftFormData = Omit<InsertEvent, 'userId'>;

interface DraftEvent {
  id: string;
  title: string;
  savedAt: string;
  formData: DraftFormData;
}

const DRAFTS_STORAGE_KEY = 'calendar_event_drafts';

const DAYS_OF_WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const EVENT_COLORS = {
  internal: { bg: 'bg-[#FED500]', text: 'text-[#5a4a00]', dot: 'bg-[#b39700]' },
  external: { bg: 'bg-[#CCD9E2]', text: 'text-[#1A5C7A]', dot: 'bg-[#1A5C7A]' },
  foreign: { bg: 'bg-[#AFE1E1]', text: 'text-[#1A5C5C]', dot: 'bg-[#1A5C5C]' },
};

interface CalendarProps {
  isAdmin?: boolean;
}

type ViewMode = 'month' | 'week' | 'day';

export default function Calendar({ isAdmin = false }: CalendarProps) {
  const today = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date(today);
    const dayOfWeek = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dayOfWeek);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });
  const [currentDay, setCurrentDay] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [templateEvent, setTemplateEvent] = useState<Event | null>(null);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [drafts, setDrafts] = useState<DraftEvent[]>(() => {
    try {
      const stored = localStorage.getItem(DRAFTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isDraftsOpen, setIsDraftsOpen] = useState(false);
  const [draftFormData, setDraftFormData] = useState<DraftFormData | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    } catch {}
  }, [drafts]);

  const [filters, setFilters] = useState<FilterOptions>({
    categories: {
      internal: true,
      external: true,
      foreign: true,
    },
    industries: {
      межотраслевое: true,
      фарма: true,
      агро: true,
      IT: true,
      промышленность: true,
      ретейл: true,
    },
    countries: {
      США: true,
      Великобритания: true,
      Евросоюз: true,
      Германия: true,
      Япония: true,
      Индия: true,
      Бразилия: true,
      Китай: true,
    },
    macroregions: {
      межрегиональный: true,
      Moscow: true,
      West: true,
      SibUral: true,
      Centre: true,
    },
  });

  const visibleMonths = useMemo(() => {
    const months = new Set<string>();
    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const prevM = month === 1 ? 12 : month - 1;
      const nextM = month === 12 ? 1 : month + 1;
      const prevY = month === 1 ? year - 1 : year;
      const nextY = month === 12 ? year + 1 : year;
      months.add(`${year}-${month}`);
      months.add(`${prevY}-${prevM}`);
      months.add(`${nextY}-${nextM}`);
    } else if (viewMode === 'week') {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      months.add(`${currentWeekStart.getFullYear()}-${currentWeekStart.getMonth() + 1}`);
      months.add(`${weekEnd.getFullYear()}-${weekEnd.getMonth() + 1}`);
    } else {
      months.add(`${currentDay.getFullYear()}-${currentDay.getMonth() + 1}`);
    }
    return Array.from(months).map(m => {
      const [y, mo] = m.split('-').map(Number);
      return { year: y, month: mo };
    });
  }, [viewMode, currentDate, currentWeekStart, currentDay]);

  const q0 = useQuery<Event[]>({ queryKey: ['/api/events', visibleMonths[0]?.year, visibleMonths[0]?.month], enabled: !!visibleMonths[0] });
  const q1 = useQuery<Event[]>({ queryKey: ['/api/events', visibleMonths[1]?.year, visibleMonths[1]?.month], enabled: !!visibleMonths[1] });
  const q2 = useQuery<Event[]>({ queryKey: ['/api/events', visibleMonths[2]?.year, visibleMonths[2]?.month], enabled: !!visibleMonths[2] });

  const events = useMemo(() => {
    const allEvents = [...(q0.data || []), ...(q1.data || []), ...(q2.data || [])];
    return Array.from(
      new Map(allEvents.map(event => [event.id, event])).values()
    );
  }, [q0.data, q1.data, q2.data]);



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

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + (direction === 'next' ? 7 : -7));
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    });
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDay(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + (direction === 'next' ? 1 : -1));
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    });
  };

  const getWeekDays = (weekStart: Date) => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const getEventsForDateRange = (start: Date, end: Date) => {
    const startStr = formatDate(start);
    const endStr = formatDate(end);
    return events.filter(event => {
      const isVisible = event.startDate <= endStr && event.endDate >= startStr;

      const categoryFilter = filters.categories[event.category as keyof FilterOptions['categories']];
      const eventIndustries = Array.isArray(event.industry) ? event.industry : [event.industry || 'межотраслевое'];
      const industryFilter = eventIndustries.some(
        (ind: string) => filters.industries[ind as keyof FilterOptions['industries']]
      );
      let countryFilter = true;
      if (event.category === 'foreign') {
        countryFilter = event.country ?
          filters.countries[event.country as keyof FilterOptions['countries']] : true;
      }
      const macroregionFilter = event.macroregion ?
        filters.macroregions[event.macroregion as keyof FilterOptions['macroregions']] :
        filters.macroregions['межрегиональный'];

      return isVisible && categoryFilter && industryFilter && countryFilter && macroregionFilter;
    });
  };

  const MONTHS_GENITIVE = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];

  const DAYS_OF_WEEK_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

  const getNavigationTitle = () => {
    if (viewMode === 'month') {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    if (viewMode === 'week') {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const startStr = `${currentWeekStart.getDate()} ${MONTHS_GENITIVE[currentWeekStart.getMonth()]}`;
      const endStr = `${weekEnd.getDate()} ${MONTHS_GENITIVE[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;
      return `${startStr} — ${endStr}`;
    }
    const dayOfWeekIdx = (currentDay.getDay() + 6) % 7;
    return `${DAYS_OF_WEEK_FULL[dayOfWeekIdx]}, ${currentDay.getDate()} ${MONTHS_GENITIVE[currentDay.getMonth()]} ${currentDay.getFullYear()}`;
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') navigateMonth(direction);
    else if (viewMode === 'week') navigateWeek(direction);
    else navigateDay(direction);
  };

  const handleAddEvent = (date?: string) => {
    if (!isAdmin) return;
    setSelectedDate(date || null);
    setEditingEvent(null);
    setTemplateEvent(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    if (!isAdmin) return;
    setTemplateEvent(null);
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleViewEvent = (event: Event) => {
    setViewingEvent(event);
    setIsViewModalOpen(true);
  };

  const handleCreateFromTemplate = (event: Event) => {
    setEditingEvent(null);
    setTemplateEvent(event);
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setTemplateEvent(null);
    setSelectedDate(null);
    setDraftFormData(null);
  };

  const handleMinimize = (formData: DraftFormData, title: string) => {
    const newDraft: DraftEvent = {
      id: Date.now().toString(),
      title,
      savedAt: new Date().toISOString(),
      formData,
    };
    setDrafts(prev => [newDraft, ...prev]);
    setIsModalOpen(false);
    setEditingEvent(null);
    setTemplateEvent(null);
    setSelectedDate(null);
    setDraftFormData(null);
  };

  const handleOpenDraft = (draft: DraftEvent) => {
    setDrafts(prev => prev.filter(d => d.id !== draft.id));
    setEditingEvent(null);
    setTemplateEvent(null);
    setSelectedDate(null);
    setDraftFormData(draft.formData);
    setIsDraftsOpen(false);
    setIsModalOpen(true);
  };

  const handleDeleteDraft = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
  };

  const formatDraftDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
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
              onClick={() => handleNavigate('prev')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              data-testid="button-prev"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-semibold text-gray-900 min-w-[200px] text-center" data-testid="text-current-period">
              {getNavigationTitle()}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigate('next')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              data-testid="button-next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-3">
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <SelectTrigger className="w-[160px] text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border-gray-300">
                <SelectValue placeholder="Вид отображения" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Месяц</SelectItem>
                <SelectItem value="week">Неделя</SelectItem>
                <SelectItem value="day">День</SelectItem>
              </SelectContent>
            </Select>
            
            <EventFilters 
              filters={filters} 
              onFiltersChange={setFilters} 
            />
            
            {isAdmin && (
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Button
                    variant="outline"
                    onClick={() => setIsDraftsOpen(prev => !prev)}
                    className="text-sm font-medium text-gray-700 border-gray-300 hover:bg-gray-50 relative"
                    data-testid="button-drafts"
                  >
                    <FileEdit className="h-4 w-4 mr-2" />
                    Черновики
                    {drafts.length > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-xs font-bold">
                        {drafts.length}
                      </span>
                    )}
                  </Button>

                  {isDraftsOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsDraftsOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-xl">
                        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-800">Черновики</span>
                          <span className="text-xs text-gray-500">{drafts.length} шт.</span>
                        </div>
                        {drafts.length === 0 ? (
                          <div className="p-6 text-center text-sm text-gray-400">
                            Нет сохранённых черновиков
                          </div>
                        ) : (
                          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                            {drafts.map(draft => (
                              <div key={draft.id} className="flex items-start p-3 hover:bg-gray-50 group">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">{draft.title}</p>
                                  <p className="text-xs text-gray-400 flex items-center mt-0.5">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatDraftDate(draft.savedAt)}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-1 ml-2 shrink-0">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleOpenDraft(draft)}
                                    className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs"
                                    title="Продолжить редактирование"
                                  >
                                    Открыть
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteDraft(draft.id)}
                                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                    title="Удалить черновик"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <Button
                  onClick={() => handleAddEvent()}
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm"
                  data-testid="button-add-event"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить событие
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6 flex-1 flex flex-col">

          {/* Week View */}
          {viewMode === 'week' && (() => {
            const weekDays = getWeekDays(currentWeekStart);
            const weekEnd = new Date(currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            const weekEvents = getEventsForDateRange(currentWeekStart, weekEnd);

            return (
              <div className="flex-1 flex flex-col">
                <div className="flex gap-1 mb-1">
                  {DAYS_OF_WEEK.map((day, index) => (
                    <div key={day} className={`p-3 text-center text-sm font-semibold text-gray-600 bg-gray-50 ${index >= 5 ? 'flex-[0.33]' : 'flex-1'}`}>
                      {day}
                    </div>
                  ))}
                </div>
                <div className="flex gap-1 flex-1">
                  {weekDays.map((day, index) => {
                    const dateStr = formatDate(day);
                    const isCurrentDay = isToday(day);
                    const dayEvents = weekEvents.filter(event => {
                      const start = event.startDate;
                      const end = event.endDate;
                      return dateStr >= start && dateStr <= end;
                    });

                    return (
                      <div
                        key={dateStr}
                        className={`bg-white border border-gray-200 rounded p-3 flex flex-col min-h-[400px] ${
                          index >= 5 ? 'flex-[0.33]' : 'flex-1'
                        } ${isCurrentDay ? 'bg-blue-50 border-2 border-blue-200' : ''} ${
                          isAdmin ? 'cursor-pointer hover:bg-gray-50' : ''
                        }`}
                        onClick={() => {
                          if (!isAdmin) return;
                          setSelectedDate(dateStr);
                          handleAddEvent(dateStr);
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-lg font-semibold ${isCurrentDay ? 'text-blue-700' : 'text-gray-900'}`}>
                            {day.getDate()}
                          </span>
                          {isCurrentDay && (
                            <span className="text-xs text-blue-600 font-medium">Сегодня</span>
                          )}
                        </div>
                        <div className="space-y-1 flex-1">
                          {dayEvents.map(event => {
                            const colors = EVENT_COLORS[event.category as keyof typeof EVENT_COLORS] || EVENT_COLORS.internal;
                            return (
                              <div
                                key={event.id}
                                className={`${colors.bg} rounded px-2 py-1 cursor-pointer`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isAdmin) handleEditEvent(event);
                                  else handleViewEvent(event);
                                }}
                              >
                                <span className="text-xs font-semibold text-black truncate block">{event.title}</span>
                                {event.time && event.category === 'internal' && (
                                  <span className="text-xs text-gray-600">{event.time}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Day View */}
          {viewMode === 'day' && (() => {
            const dateStr = formatDate(currentDay);
            const isCurrentDay = isToday(currentDay);
            const dayEvents = getEventsForDateRange(currentDay, currentDay);
            const filteredDayEvents = dayEvents.filter(event => {
              return dateStr >= event.startDate && dateStr <= event.endDate;
            });

            return (
              <div className="flex-1 flex flex-col">
                <div className={`bg-white border border-gray-200 rounded p-6 flex-1 min-h-[400px] ${
                  isCurrentDay ? 'bg-blue-50 border-2 border-blue-200' : ''
                }`}>
                  {isCurrentDay && (
                    <div className="mb-4">
                      <span className="text-sm text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">Сегодня</span>
                    </div>
                  )}
                  {filteredDayEvents.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-lg">
                      Нет событий на этот день
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredDayEvents.map(event => {
                        const colors = EVENT_COLORS[event.category as keyof typeof EVENT_COLORS] || EVENT_COLORS.internal;
                        const categoryLabels: Record<string, string> = {
                          internal: 'Корпоративные (внутри банка)',
                          external: 'Российские',
                          foreign: 'Международные',
                        };
                        return (
                          <div
                            key={event.id}
                            className={`${colors.bg} rounded-lg p-4 cursor-pointer hover:opacity-90 transition-opacity`}
                            onClick={() => {
                              if (isAdmin) handleEditEvent(event);
                              else handleViewEvent(event);
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-black">{event.title}</h3>
                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-700">
                                  <span>{categoryLabels[event.category] || event.category}</span>
                                  {event.time && event.category === 'internal' && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> {event.time}
                                    </span>
                                  )}
                                  <span>{event.startDate}{event.startDate !== event.endDate ? ` — ${event.endDate}` : ''}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {isAdmin && (
                    <div className="mt-4">
                      <Button
                        onClick={() => handleAddEvent(dateStr)}
                        className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Добавить событие
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Month View */}
          {viewMode === 'month' && <>
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
                const categoryFilter = filters.categories[event.category as keyof FilterOptions['categories']];
                
                // Применяем фильтры отраслей (industry теперь массив)
                const eventIndustries = Array.isArray(event.industry) ? event.industry : [event.industry || 'межотраслевое'];
                const industryFilter = eventIndustries.some(
                  (ind: string) => filters.industries[ind as keyof FilterOptions['industries']]
                );

                // Применяем фильтры стран (только для зарубежных событий)
                let countryFilter = true;
                if (event.category === 'foreign') {
                  countryFilter = event.country ? 
                    filters.countries[event.country as keyof FilterOptions['countries']] : 
                    true; // показываем зарубежные события без указанной страны (legacy события)
                }

                // Применяем фильтры макрорегионов
                const macroregionFilter = event.macroregion ? 
                  filters.macroregions[event.macroregion as keyof FilterOptions['macroregions']] : 
                  filters.macroregions['межрегиональный']; // fallback для событий без макрорегиона
                
                return isVisible && categoryFilter && industryFilter && countryFilter && macroregionFilter;
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
              
              return eventsWithPositions.map(({ event, row, col, span, layer }, index) => {
                const colors = EVENT_COLORS[event.category as keyof typeof EVENT_COLORS] || EVENT_COLORS.internal;
                
                // Упрощенное позиционирование - все колонки одинакового размера
                const getLeftPosition = (colIndex: number, spanCount: number) => {
                  const columnWidthPercent = 100 / 7; // каждая колонка занимает 1/7 ширины
                  const gapWidth = 0.28; // gap-1 в vw (4px при 1400px = 0.286vw)
                  // Специальные сдвиги для отдельных дней в vw
                  let dayOffset = 0;
                  if (colIndex === 0) dayOffset = -0.28; // понедельник влево
                  if (colIndex === 1) dayOffset = 2; // вторник
                  if (colIndex === 2) dayOffset = 4.86; // среда
                  if (colIndex === 3) dayOffset = 7.71; // четверг
                  if (colIndex === 4) dayOffset = 10.57; // пятница
                  
                  let pxAdjust = 0;
                  if (colIndex === 1) pxAdjust = -2;
                  if (colIndex === 2) pxAdjust = -6;
                  if (colIndex === 3) pxAdjust = -12;
                  if (colIndex === 4) pxAdjust = -14;
                  if (colIndex === 3 && spanCount >= 2) pxAdjust = -6;
                  
                  // Дополнительный сдвиг для событий со среды по пятницу (3 дня начиная со среды)
                  if (colIndex === 2 && spanCount === 3) {
                    dayOffset -= 0.07; // события ср-пт подвинуть влево
                  }
                  return `calc(${colIndex * columnWidthPercent}% + ${colIndex * gapWidth}vw + ${dayOffset}vw + ${pxAdjust + 2}px)`;
                };
                
                const getWidth = (spanCount: number, colIndex: number) => {
                  const columnWidthPercent = 100 / 7;
                  const gapWidth = 0.28; // gap в vw
                  // Дополнительная длина для разных дней в vw
                  let extraLength = 0;
                  if (colIndex === 0) extraLength = 0.57; // понедельник
                  if (colIndex === 1) extraLength = 1.14; // вторник
                  if (colIndex === 2) extraLength = 1.14; // среда
                  if (colIndex === 3) extraLength = 1.14; // четверг
                  if (colIndex === 4) extraLength = 1.14; // пятница
                  
                  // Дополнительная длина для блоков разной длительности в vw
                  let durationBonus = 0;
                  if (spanCount === 2) durationBonus = 1.14; // 2-дневные блоки
                  if (spanCount === 3) durationBonus = 2.57; // 3-дневные блоки
                  if (spanCount === 4) durationBonus = 3.43; // 4-дневные блоки
                  if (spanCount === 5) durationBonus = 5.14; // 5-дневные блоки
                  if (spanCount === 7) durationBonus = -18; // 7-дневные блоки (укорочены на 120px)
                  
                  // Увеличиваем ширину на 10% чтобы блоки соответствовали сетке + дополнительная длина + бонус по длительности
                  return `calc((${spanCount * columnWidthPercent}% + ${(spanCount - 1) * gapWidth}vw - 0.86vw) * 1.1 + 1vw + ${extraLength}vw + ${durationBonus}vw - 4px)`;
                };
                
                const left = getLeftPosition(col, span);
                const width = getWidth(span, col);
                const top = `calc(${row} * 180px + 48px + ${layer * 26}px + 4px)`;
                
                // Определяем выравнивание текста - по центру для 2-дневных, 3-дневных и больших блоков
                const isCenteredEvent = span >= 2; // события на 2+ дня выравниваем по центру
                const textAlignment = isCenteredEvent ? 'justify-center' : 'justify-start';
                
                return (
                  <div
                    key={`${event.id}-${row}-${col}-${layer}`}
                    className={`absolute flex items-center ${textAlignment} text-sm py-1 cursor-pointer ${colors.bg} rounded z-20 whitespace-nowrap`}
                    style={{
                      left,
                      width,
                      top,
                      height: '22px',
                      margin: '0 0.86vw' // адаптивный отступ (12px при 1400px = 0.857vw)
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
          </>}
        </div>
      </div>

      {isAdmin && (
        <EventModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          event={editingEvent}
          selectedDate={selectedDate || undefined}
          isAdmin={isAdmin}
          templateEvent={templateEvent}
          onCreateFromTemplate={handleCreateFromTemplate}
          onMinimize={handleMinimize}
          draftFormData={draftFormData}
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