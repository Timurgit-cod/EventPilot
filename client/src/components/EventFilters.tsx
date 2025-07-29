import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

export interface FilterOptions {
  internal: boolean;
  external: boolean;
  foreign: boolean;
}

interface EventFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export function EventFilters({ filters, onFiltersChange }: EventFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const filterOptions = [
    { key: 'internal' as keyof FilterOptions, label: 'Внутренняя активность', color: 'bg-yellow-100 text-yellow-800' },
    { key: 'external' as keyof FilterOptions, label: 'Внешняя активность', color: 'bg-pink-100 text-pink-800' },
    { key: 'foreign' as keyof FilterOptions, label: 'Зарубежная активность', color: 'bg-gray-100 text-gray-800' },
  ];

  const handleFilterChange = (key: keyof FilterOptions, checked: boolean) => {
    onFiltersChange({
      ...filters,
      [key]: checked,
    });
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;
  const hasActiveFilters = activeFiltersCount > 0 && activeFiltersCount < 3;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={`text-sm font-medium relative ${
            hasActiveFilters 
              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
          }`}
          data-testid="button-filters"
        >
          <Filter className="h-4 w-4 mr-2" />
          Фильтры
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Фильтр событий
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600">
            Выберите категории событий для отображения:
          </p>
          
          <div className="space-y-3">
            {filterOptions.map(option => (
              <div key={option.key} className="flex items-center space-x-3">
                <Checkbox
                  id={option.key}
                  checked={filters[option.key]}
                  onCheckedChange={(checked) => handleFilterChange(option.key, checked as boolean)}
                  data-testid={`checkbox-${option.key}`}
                />
                <label
                  htmlFor={option.key}
                  className={`flex-1 text-sm font-medium px-3 py-2 rounded-lg cursor-pointer transition-colors ${option.color}`}
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onFiltersChange({ internal: true, external: true, foreign: true })}
              className="text-sm"
              data-testid="button-select-all"
            >
              Выбрать все
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onFiltersChange({ internal: false, external: false, foreign: false })}
              className="text-sm"
              data-testid="button-clear-all"
            >
              Очистить все
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}