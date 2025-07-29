import { Users } from "lucide-react";

interface SidebarProps {
  isAdmin: boolean;
}

export default function Sidebar({ isAdmin }: SidebarProps) {

  return (
    <div className="space-y-6">
      {/* Admin Notice */}
      {!isAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <Users className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800" data-testid="title-user-notice">
                Режим просмотра
              </h4>
              <p className="text-sm text-yellow-700 mt-1" data-testid="text-user-notice">
                Вы можете просматривать события, но не можете их создавать или редактировать. 
                Только администраторы имеют права на управление событиями.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}