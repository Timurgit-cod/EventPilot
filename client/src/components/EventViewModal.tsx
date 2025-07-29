import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { X, Calendar, Clock, Tag } from 'lucide-react';
import type { Event } from '@shared/schema';

interface EventViewModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

const EVENT_CATEGORIES = {
  internal: { label: 'Внутренняя активность', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  external: { label: 'Внешняя активность', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  foreign: { label: 'Зарубежная активность', color: 'bg-gray-100 text-gray-800 border-gray-200' },
};

export function EventViewModal({ event, isOpen, onClose }: EventViewModalProps) {
  if (!event) return null;

  const categoryInfo = EVENT_CATEGORIES[event.category as keyof typeof EVENT_CATEGORIES];
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateRange = () => {
    const startDate = formatDate(event.startDate);
    const endDate = formatDate(event.endDate);
    
    if (event.startDate === event.endDate) {
      return startDate;
    }
    
    return `${startDate} — ${endDate}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-900 pr-8 leading-tight">
              {event.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              data-testid="button-close-event-view"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Event metadata */}
          <div className="space-y-3">
            {/* Category */}
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-gray-500" />
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${categoryInfo.color}`}>
                {categoryInfo.label}
              </span>
            </div>
            
            {/* Date range */}
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">
                {formatDateRange()}
              </span>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-6 space-y-6">
          {/* Description */}
          {event.description && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <span>Описание</span>
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 border">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </div>
          )}
          
          {/* If no description, show a placeholder */}
          {!event.description && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Описание</h3>
              <div className="bg-gray-50 rounded-lg p-4 border">
                <p className="text-gray-500 italic">
                  Описание для этого события не указано.
                </p>
              </div>
            </div>
          )}
          
          {/* Additional event details */}
          <div className="border-t pt-4 space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Дополнительная информация
            </h4>
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>ID события:</span>
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {event.id}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end pt-6 border-t">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-6"
            data-testid="button-close-event"
          >
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}