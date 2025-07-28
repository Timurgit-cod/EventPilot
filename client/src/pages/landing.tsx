import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Shield, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Calendar className="h-12 w-12 text-blue-600 mr-2" />
            <h1 className="text-4xl font-bold text-gray-900">Календарь Событий</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8">
            Административная панель для управления событиями
          </p>
          
          <Card className="max-w-md mx-auto shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center mb-6">
                <Shield className="h-16 w-16 text-blue-600" />
              </div>
              
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Доступ только для администраторов
              </h2>
              
              <p className="text-gray-600 mb-6">
                Войдите в систему для управления календарем событий
              </p>
              
              <Button 
                onClick={() => window.location.href = '/api/login'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
                data-testid="button-login"
              >
                Войти в систему
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Управление событиями
            </h3>
            <p className="text-gray-600">
              Создавайте, редактируйте и удаляйте события в календаре
            </p>
          </div>
          
          <div className="text-center">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Категории событий
            </h3>
            <p className="text-gray-600">
              Организуйте события по категориям с цветовой кодировкой
            </p>
          </div>
          
          <div className="text-center">
            <Shield className="h-8 w-8 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Безопасный доступ
            </h3>
            <p className="text-gray-600">
              Только авторизованные администраторы могут управлять календарем
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
