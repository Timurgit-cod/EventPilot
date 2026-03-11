import { useState } from 'react';
import { Filter } from 'lucide-react';
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
    Китай: boolean;
  };
  macroregions: {
    межрегиональный: boolean;
    Moscow: boolean;
    West: boolean;
    SibUral: boolean;
    Centre: boolean;
  };
}

interface EventFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

const ALL_TRUE_CATEGORIES: FilterOptions['categories'] = { internal: true, external: true, foreign: true };
const ALL_FALSE_CATEGORIES: FilterOptions['categories'] = { internal: false, external: false, foreign: false };
const ALL_TRUE_INDUSTRIES: FilterOptions['industries'] = { межотраслевое: true, фарма: true, агро: true, IT: true, промышленность: true, ретейл: true };
const ALL_FALSE_INDUSTRIES: FilterOptions['industries'] = { межотраслевое: false, фарма: false, агро: false, IT: false, промышленность: false, ретейл: false };
const ALL_TRUE_COUNTRIES: FilterOptions['countries'] = { США: true, Великобритания: true, Евросоюз: true, Германия: true, Япония: true, Индия: true, Бразилия: true, Китай: true };
const ALL_FALSE_COUNTRIES: FilterOptions['countries'] = { США: false, Великобритания: false, Евросоюз: false, Германия: false, Япония: false, Индия: false, Бразилия: false, Китай: false };
const ALL_TRUE_MACROREGIONS: FilterOptions['macroregions'] = { межрегиональный: true, Moscow: true, West: true, SibUral: true, Centre: true };
const ALL_FALSE_MACROREGIONS: FilterOptions['macroregions'] = { межрегиональный: false, Moscow: false, West: false, SibUral: false, Centre: false };

export function EventFilters({ filters, onFiltersChange }: EventFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState<FilterOptions>(filters);

  const handleOpen = (open: boolean) => {
    if (open) setPending(filters);
    setIsOpen(open);
  };

  const handleApply = () => {
    onFiltersChange(pending);
    setIsOpen(false);
  };

  const categoryOptions = [
    { key: 'internal' as keyof FilterOptions['categories'], label: 'Корпоративная (внутри банка)', color: 'bg-[#FED500] text-[#5a4a00]' },
    { key: 'external' as keyof FilterOptions['categories'], label: 'Российская', color: 'bg-[#CCD9E2] text-[#1A5C7A]' },
    { key: 'foreign' as keyof FilterOptions['categories'], label: 'Международная', color: 'bg-[#FFD7D2] text-[#7A1A10]' },
  ];

  const macroregionOptions = [
    { key: 'межрегиональный' as keyof FilterOptions['macroregions'], label: 'Межрегиональный' },
    { key: 'Moscow' as keyof FilterOptions['macroregions'], label: 'Moscow' },
    { key: 'West' as keyof FilterOptions['macroregions'], label: 'West' },
    { key: 'SibUral' as keyof FilterOptions['macroregions'], label: 'SibUral' },
    { key: 'Centre' as keyof FilterOptions['macroregions'], label: 'Centre' },
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
    { key: 'Китай' as keyof FilterOptions['countries'], label: 'Китай' },
  ];

  const activeCategoriesCount = Object.values(filters.categories).filter(Boolean).length;
  const activeIndustriesCount = Object.values(filters.industries).filter(Boolean).length;
  const activeCountriesCount = Object.values(filters.countries).filter(Boolean).length;
  const activeMacroregionsCount = Object.values(filters.macroregions).filter(Boolean).length;
  const totalActiveFilters = activeCategoriesCount + activeIndustriesCount + activeCountriesCount + activeMacroregionsCount;
  const hasActiveFilters = (activeCategoriesCount > 0 && activeCategoriesCount < 3) || 
                          (activeIndustriesCount > 0 && activeIndustriesCount < 6) ||
                          (activeCountriesCount > 0 && activeCountriesCount < 8) ||
                          (activeMacroregionsCount > 0 && activeMacroregionsCount < 5);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
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
      
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Фильтр событий</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-2 overflow-y-auto flex-1 pr-2">
          {/* Категории */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Категории событий:</h4>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
                  onClick={() => setPending(p => ({ ...p, categories: { ...ALL_TRUE_CATEGORIES } }))}>
                  Все
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => setPending(p => ({ ...p, categories: { ...ALL_FALSE_CATEGORIES } }))}>
                  Очистить
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {categoryOptions.map(option => (
                <div key={option.key} className="flex items-center space-x-3">
                  <Checkbox
                    id={`category-${option.key}`}
                    checked={pending.categories[option.key]}
                    onCheckedChange={(checked) => setPending(p => ({
                      ...p,
                      categories: { ...p.categories, [option.key]: checked as boolean },
                    }))}
                    data-testid={`checkbox-category-${option.key}`}
                  />
                  <label htmlFor={`category-${option.key}`}
                    className={`flex-1 text-sm font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${option.color}`}>
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Макрорегионы */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Макрорегионы:</h4>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
                  onClick={() => setPending(p => ({ ...p, macroregions: { ...ALL_TRUE_MACROREGIONS } }))}>
                  Все
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => setPending(p => ({ ...p, macroregions: { ...ALL_FALSE_MACROREGIONS } }))}>
                  Очистить
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {macroregionOptions.map(option => (
                <div key={option.key} className="flex items-center space-x-3">
                  <Checkbox
                    id={`macroregion-${option.key}`}
                    checked={pending.macroregions[option.key]}
                    onCheckedChange={(checked) => setPending(p => ({
                      ...p,
                      macroregions: { ...p.macroregions, [option.key]: checked as boolean },
                    }))}
                    data-testid={`checkbox-macroregion-${option.key}`}
                  />
                  <label htmlFor={`macroregion-${option.key}`}
                    className="flex-1 text-sm font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-colors bg-purple-50 text-purple-800">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Отрасли */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Отрасли:</h4>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
                  onClick={() => setPending(p => ({ ...p, industries: { ...ALL_TRUE_INDUSTRIES } }))}>
                  Все
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => setPending(p => ({ ...p, industries: { ...ALL_FALSE_INDUSTRIES } }))}>
                  Очистить
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {industryOptions.map(option => (
                <div key={option.key} className="flex items-center space-x-3">
                  <Checkbox
                    id={`industry-${option.key}`}
                    checked={pending.industries[option.key]}
                    onCheckedChange={(checked) => setPending(p => ({
                      ...p,
                      industries: { ...p.industries, [option.key]: checked as boolean },
                    }))}
                    data-testid={`checkbox-industry-${option.key}`}
                  />
                  <label htmlFor={`industry-${option.key}`}
                    className="flex-1 text-sm font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-colors bg-blue-50 text-blue-800">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Страны */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Страны (зарубежные события):</h4>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
                  onClick={() => setPending(p => ({ ...p, countries: { ...ALL_TRUE_COUNTRIES } }))}>
                  Все
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => setPending(p => ({ ...p, countries: { ...ALL_FALSE_COUNTRIES } }))}>
                  Очистить
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {countryOptions.map(option => (
                <div key={option.key} className="flex items-center space-x-3">
                  <Checkbox
                    id={`country-${option.key}`}
                    checked={pending.countries[option.key]}
                    onCheckedChange={(checked) => setPending(p => ({
                      ...p,
                      countries: { ...p.countries, [option.key]: checked as boolean },
                    }))}
                    data-testid={`checkbox-country-${option.key}`}
                  />
                  <label htmlFor={`country-${option.key}`}
                    className="flex-1 text-sm font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-colors bg-green-50 text-green-800">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t mt-2">
          <Button
            onClick={handleApply}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
            data-testid="button-apply-filters"
          >
            Применить фильтры
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}