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
    resolver: zodResolver(insertEventSchema.omit({ userId: true })),
    defaultValues: {
      title: "",
      description: "",
      date: selectedDate || new Date().toISOString().split('T')[0],
      time: "",
      category: "meeting",
    },
  });

  // Update form when event changes
  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description || "",
        date: event.date,
        time: event.time || "",
        category: event.category || "meeting",
      });
    } else if (selectedDate) {
      form.reset({
        title: "",
        description: "",
        date: selectedDate,
        time: "",
        category: "meeting",
      });
    }
  }, [event, selectedDate, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("/api/events", {
        method: "POST",
        body: JSON.stringify(data),
      });
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
      return await apiRequest(`/api/events/${event.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
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
      await apiRequest(`/api/events/${event.id}`, {
        method: "DELETE",
      });
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
                    Дата
                  </label>
                  <p className="text-gray-900" data-testid="text-event-date">
                    {new Date(event.date).toLocaleDateString('ru-RU')}
                  </p>
                </div>

                {event.time && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Время
                    </label>
                    <p className="text-gray-900" data-testid="text-event-time">
                      {event.time}
                    </p>
                  </div>
                )}
              </div>

              {event.category && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Категория
                  </label>
                  <span 
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      event.category === 'meeting' 
                        ? 'bg-blue-100 text-blue-800'
                        : event.category === 'project'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                    data-testid="tag-event-category"
                  >
                    {event.category === 'meeting' && 'Встреча'}
                    {event.category === 'project' && 'Проект'}
                    {event.category === 'deadline' && 'Дедлайн'}
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Дата *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        data-testid="input-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Время
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field} 
                        data-testid="input-time"
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
                      <SelectItem value="meeting">Встреча</SelectItem>
                      <SelectItem value="project">Проект</SelectItem>
                      <SelectItem value="deadline">Дедлайн</SelectItem>
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