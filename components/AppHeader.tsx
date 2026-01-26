import React from 'react';
import { ArrowRight } from 'lucide-react';

interface AppHeaderProps {
  title?: React.ReactNode;
  onBack?: () => void;
  actionStart?: React.ReactNode;
  actionEnd?: React.ReactNode;
  className?: string;
  bgClassName?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  onBack,
  actionStart,
  actionEnd,
  className = '',
  bgClassName = 'bg-app-bg/95 backdrop-blur-md'
}) => {
  return (
    <header
      className={`absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 pt-6 pb-4 shadow-sm border-b border-app-card/30 transition-all ${bgClassName} ${className}`}
    >
      <div className="flex items-center gap-3 min-w-[40px]">
        {onBack ? (
          <button
            onClick={onBack}
            className="p-2 bg-white rounded-full shadow-sm text-app-text hover:bg-app-card transition-colors flex-shrink-0"
          >
            <ArrowRight size={20} />
          </button>
        ) : (
          actionStart
        )}
      </div>

      <div className="flex-1 flex items-center justify-center px-2 min-w-0">
        {typeof title === 'string' ? (
          <h1 className="text-lg font-semibold text-app-text truncate w-full text-right">{title}</h1>
        ) : (
          title
        )}
      </div>

      <div className="flex items-center justify-end gap-3 min-w-[40px]">
        {actionEnd}
      </div>
    </header>
  );
};

export default AppHeader;