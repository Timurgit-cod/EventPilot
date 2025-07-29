import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Calendar, Clock, FileText, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertEventSchema, type Event, type InsertEvent } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Event | null;
  selectedDate?: string;
  isAdmin: boolean;
}

type FormData = Omit<InsertEvent, 'userId'>;

export default function EventModal({ isOpen, onClose, event, selectedDate, isAdmin }: EventModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: selectedDate || new Date().toISOString().split('T')[0],
      endDate: selectedDate || new Date().toISOString().split('T')[0],
      category: "internal",
    },
  });

  // Update form when event changes
  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description || "",
        startDate: event.startDate,
        endDate: event.endDate,
        category: (event.category === 'internal' || event.category === 'external' || event.category === 'foreign') ? event.category : "internal",
      });
    } else if (selectedDate) {
      form.reset({
        title: "",
        description: "",
        startDate: selectedDate,
        endDate: selectedDate,
        category: "internal",
      });
    }
  }, [event, selectedDate, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("/api/events", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Успешно",
        description: "Событие создано",
      });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Неавторизован",
          description: "Вы вышли из системы. Выполняется повторный вход...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      console.error("Create error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать событие",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!event?.id) throw new Error("No event ID");
      return await apiRequest(`/api/events/${event.id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Успешно",
        description: "Событие обновлено",
      });
      onClose();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Неавторизован",
          description: "Вы вышли из системы. Выполняется повторный вход...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      console.error("Update error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить событие",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!event?.id) throw new Error("No event ID");
      await apiRequest(`/api/events/${event.id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Успешно",
        description: "Событие удалено",
      });
      onClose();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Неавторизован",
          description: "Вы вышли из системы. Выполняется повторный вход...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      console.error("Delete error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить событие",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (event) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      deleteMutation.mutate();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  if (!isOpen) return null;

  // If user is not admin, show read-only view
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900" data-testid="title-event-details">
              Детали события
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              data-testid="button-close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {event && (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название
                </label>
                <p className="text-gray-900" data-testid="text-event-title">
                  {event.title}
                </p>
              </div>

              {event.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <p className="text-gray-900" data-testid="text-event-description">
                    {event.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Дата начала
                  </label>
                  <p className="text-gray-900" data-testid="text-event-start-date">
                    {new Date(event.startDate).toLocaleDateString('ru-RU')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Дата окончания
                  </label>
                  <p className="text-gray-900" data-testid="text-event-end-date">
                    {new Date(event.endDate).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>

              {event.category && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Категория
                  </label>
                  <span 
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      event.category === 'internal' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : event.category === 'external'
                        ? 'bg-pink-100 text-pink-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                    data-testid="tag-event-category"
                  >
                    {event.category === 'internal' && 'Внутренняя активность'}
                    {event.category === 'external' && 'Внешняя активность'}
                    {event.category === 'foreign' && 'Зарубежная активность'}
                  </span>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-yellow-700" data-testid="text-readonly-notice">
                  Только администраторы могут редактировать события.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end p-6 border-t">
            <Button onClick={onClose} variant="outline" data-testid="button-close-details">
              Закрыть
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Admin edit/create form
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900" data-testid="title-event-modal">
            {event ? "Редактировать событие" : "Создать событие"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            data-testid="button-close-modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Название *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Введите название события" 
                      {...field} 
                      data-testid="input-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Описание
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Введите описание события" 
                      {...field} 
                      value={field.value || ''}
                      data-testid="input-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Дата начала *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value || ''}
                        data-testid="input-start-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Дата окончания *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value || ''}
                        data-testid="input-end-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    Категория
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="internal">Внутренняя активность</SelectItem>
                      <SelectItem value="external">Внешняя активность</SelectItem>
                      <SelectItem value="foreign">Зарубежная активность</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between pt-4 border-t">
              <div>
                {event && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className={showDeleteConfirm ? "bg-red-600" : ""}
                    data-testid="button-delete"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleteMutation.isPending
                      ? "Удаление..."
                      : showDeleteConfirm
                      ? "Подтвердить удаление"
                      : "Удалить"}
                  </Button>
                )}
              </div>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  data-testid="button-cancel"
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Сохранение..."
                    : event
                    ? "Сохранить"
                    : "Создать"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}