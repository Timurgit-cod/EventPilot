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
import { Separator } from '@/components/ui/separator';

export interface FilterOptions {
  categories: {
    internal: boolean;
    external: boolean;
    foreign: boolean;
  };
  industries: {
    межотраслевое: boolean;
    фарма: boolean;
    агро: boolean;
    IT: boolean;
    промышленность: boolean;
    ретейл: boolean;
  };
  countries: {
    США: boolean;
    Великобритания: boolean;
    Евросоюз: boolean;
    Германия: boolean;
    Япония: boolean;
    Индия: boolean;
    Бразилия: boolean;
  };
}

interface EventFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export function EventFilters({ filters, onFiltersChange }: EventFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const categoryOptions = [
    { key: 'internal' as keyof FilterOptions['categories'], label: 'Внутренняя активность', color: 'bg-yellow-100 text-yellow-800' },
    { key: 'external' as keyof FilterOptions['categories'], label: 'Внешняя активность', color: 'bg-pink-100 text-pink-800' },
    { key: 'foreign' as keyof FilterOptions['categories'], label: 'Зарубежная активность', color: 'bg-gray-100 text-gray-800' },
  ];

  const industryOptions = [
    { key: 'межотраслевое' as keyof FilterOptions['industries'], label: 'Межотраслевое' },
    { key: 'фарма' as keyof FilterOptions['industries'], label: 'Фарма' },
    { key: 'агро' as keyof FilterOptions['industries'], label: 'Агро' },
    { key: 'IT' as keyof FilterOptions['industries'], label: 'IT' },
    { key: 'промышленность' as keyof FilterOptions['industries'], label: 'Промышленность' },
    { key: 'ретейл' as keyof FilterOptions['industries'], label: 'Ретейл' },
  ];

  const countryOptions = [
    { key: 'США' as keyof FilterOptions['countries'], label: 'США' },
    { key: 'Великобритания' as keyof FilterOptions['countries'], label: 'Великобритания' },
    { key: 'Евросоюз' as keyof FilterOptions['countries'], label: 'Евросоюз' },
    { key: 'Германия' as keyof FilterOptions['countries'], label: 'Германия' },
    { key: 'Япония' as keyof FilterOptions['countries'], label: 'Япония' },
    { key: 'Индия' as keyof FilterOptions['countries'], label: 'Индия' },
    { key: 'Бразилия' as keyof FilterOptions['countries'], label: 'Бразилия' },
  ];

  const handleCategoryChange = (key: keyof FilterOptions['categories'], checked: boolean) => {
    onFiltersChange({
      ...filters,
      categories: {
        ...filters.categories,
        [key]: checked,
      },
    });
  };

  const handleIndustryChange = (key: keyof FilterOptions['industries'], checked: boolean) => {
    onFiltersChange({
      ...filters,
      industries: {
        ...filters.industries,
        [key]: checked,
      },
    });
  };

  const handleCountryChange = (key: keyof FilterOptions['countries'], checked: boolean) => {
    onFiltersChange({
      ...filters,
      countries: {
        ...filters.countries,
        [key]: checked,
      },
    });
  };

  const activeCategoriesCount = Object.values(filters.categories).filter(Boolean).length;
  const activeIndustriesCount = Object.values(filters.industries).filter(Boolean).length;
  const activeCountriesCount = Object.values(filters.countries).filter(Boolean).length;
  const totalActiveFilters = activeCategoriesCount + activeIndustriesCount + activeCountriesCount;
  const hasActiveFilters = (activeCategoriesCount > 0 && activeCategoriesCount < 3) || 
                          (activeIndustriesCount > 0 && activeIndustriesCount < 6) ||
                          (activeCountriesCount > 0 && activeCountriesCount < 7);

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
              {totalActiveFilters}
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
        
        <div className="space-y-6 py-4">
          {/* Категории */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Категории событий:
            </h4>
            <div className="space-y-3">
              {categoryOptions.map(option => (
                <div key={option.key} className="flex items-center space-x-3">
                  <Checkbox
                    id={`category-${option.key}`}
                    checked={filters.categories[option.key]}
                    onCheckedChange={(checked) => handleCategoryChange(option.key, checked as boolean)}
                    data-testid={`checkbox-category-${option.key}`}
                  />
                  <label
                    htmlFor={`category-${option.key}`}
                    className={`flex-1 text-sm font-medium px-3 py-2 rounded-lg cursor-pointer transition-colors ${option.color}`}
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Отрасли */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Отрасли:
            </h4>
            <div className="space-y-3">
              {industryOptions.map(option => (
                <div key={option.key} className="flex items-center space-x-3">
                  <Checkbox
                    id={`industry-${option.key}`}
                    checked={filters.industries[option.key]}
                    onCheckedChange={(checked) => handleIndustryChange(option.key, checked as boolean)}
                    data-testid={`checkbox-industry-${option.key}`}
                  />
                  <label
                    htmlFor={`industry-${option.key}`}
                    className="flex-1 text-sm font-medium px-3 py-2 rounded-lg cursor-pointer transition-colors bg-blue-50 text-blue-800"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Страны для зарубежных событий */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Страны (зарубежные события):
            </h4>
            <div className="space-y-3">
              {countryOptions.map(option => (
                <div key={option.key} className="flex items-center space-x-3">
                  <Checkbox
                    id={`country-${option.key}`}
                    checked={filters.countries[option.key]}
                    onCheckedChange={(checked) => handleCountryChange(option.key, checked as boolean)}
                    data-testid={`checkbox-country-${option.key}`}
                  />
                  <label
                    htmlFor={`country-${option.key}`}
                    className="flex-1 text-sm font-medium px-3 py-2 rounded-lg cursor-pointer transition-colors bg-green-50 text-green-800"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <Separator />

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => onFiltersChange({ 
                categories: { internal: true, external: true, foreign: true },
                industries: { межотраслевое: true, фарма: true, агро: true, IT: true, промышленность: true, ретейл: true },
                countries: { США: true, Великобритания: true, Евросоюз: true, Германия: true, Япония: true, Индия: true, Бразилия: true }
              })}
              className="text-sm"
              data-testid="button-select-all"
            >
              Выбрать все
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onFiltersChange({ 
                categories: { internal: false, external: false, foreign: false },
                industries: { межотраслевое: false, фарма: false, агро: false, IT: false, промышленность: false, ретейл: false },
                countries: { США: false, Великобритания: false, Евросоюз: false, Германия: false, Япония: false, Индия: false, Бразилия: false }
              })}
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