import { ArrowLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({ title, showBack, onBack }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b calm-pink-border">
      <div className="flex items-center gap-4 px-4 py-4">
        {showBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
        )}
        <h1 className="text-xl font-bold high-contrast-text">{title}</h1>
      </div>
    </header>
  );
}