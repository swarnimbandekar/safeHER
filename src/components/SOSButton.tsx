import { AlertTriangle } from 'lucide-react';

interface SOSButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function SOSButton({ onClick, disabled }: SOSButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative group focus:outline-none"
    >
      {/* Pulsing animation ring with pink/white palette */}
      <div className="absolute inset-0 bg-pink-500 rounded-full animate-ping opacity-75"></div>
      
      {/* Main button with gradient and enhanced styling */}
      <div className="relative flex items-center justify-center w-64 h-64 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full shadow-2xl transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-pink-500/30 hover:shadow-2xl focus:ring-4 focus:ring-pink-300 focus:ring-opacity-50">
        <div className="text-center">
          <AlertTriangle className="w-24 h-24 text-white mx-auto mb-4 drop-shadow-lg" />
          <span className="text-3xl font-bold text-white drop-shadow-lg">SOS</span>
          <p className="text-sm text-pink-100 mt-2 drop-shadow">Tap for Emergency</p>
        </div>
      </div>
    </button>
  );
}