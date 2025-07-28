import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Calendar from "@/components/Calendar";
import Sidebar from "@/components/Sidebar";
import { Bell, ChevronDown, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User as UserType } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Неавторизован",
        description: "Вы не авторизованы. Перенаправление на страницу входа...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  const typedUser = user as UserType;
  const isAdmin = typedUser?.isAdmin || false;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <i className="fas fa-calendar-alt text-blue-600 text-xl"></i>
                <h1 className="text-xl font-semibold text-gray-900">Календарь Событий</h1>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isAdmin ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'
              }`}>
                {isAdmin ? <Shield className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                {isAdmin ? 'Администратор' : 'Пользователь'}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2 text-gray-500 hover:text-gray-700"
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-orange-500"></span>
              </Button>
              
              <div className="flex items-center space-x-3">
                <img 
                  src={typedUser?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"}
                  alt="Профиль пользователя" 
                  className="w-8 h-8 rounded-full object-cover"
                  data-testid="img-avatar"
                />
                <span className="text-sm font-medium text-gray-700" data-testid="text-username">
                  {typedUser?.firstName || typedUser?.email || 'Пользователь'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = '/api/logout'}
                  className="text-gray-500 hover:text-gray-700"
                  data-testid="button-logout"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3">
            <Calendar isAdmin={isAdmin} />
          </div>
          <div className="xl:col-span-1">
            <Sidebar isAdmin={isAdmin} />
          </div>
        </div>
      </div>
    </div>
  );
}
