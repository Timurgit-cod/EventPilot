import Calendar from "@/components/Calendar";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function Home() {
  const { user, isAdmin, logout } = useSimpleAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with user info and logout */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Календарь событий
          </h1>
          {user && (
            <span className="text-sm text-gray-600">
              Добро пожаловать, {user.username} 
              {isAdmin && <span className="text-blue-600 font-medium"> (Администратор)</span>}
            </span>
          )}
        </div>
        
        <Button
          variant="outline"
          onClick={logout}
          className="flex items-center space-x-2"
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          <span>Выйти</span>
        </Button>
      </div>
      
      <Calendar isAdmin={isAdmin} />
    </div>
  );
}
