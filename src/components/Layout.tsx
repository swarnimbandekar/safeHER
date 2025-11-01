import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function Layout({ children, title, showBack, onBack }: LayoutProps) {
  return (
    <div className="min-h-screen calm-pink-bg flex flex-col">
      {title && <Header title={title} showBack={showBack} onBack={onBack} />}
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}