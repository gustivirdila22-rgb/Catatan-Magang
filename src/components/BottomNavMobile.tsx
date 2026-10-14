import React from 'react';
import { Home, Search, Folder, ShieldCheck, Lock } from 'lucide-react';

interface BottomNavMobileProps {
  currentView: 'home' | 'section' | 'note' | 'owner';
  onGoHome: () => void;
  onOpenSearch: () => void;
  onOpenOwner: () => void;
  isOwner: boolean;
}

export const BottomNavMobile: React.FC<BottomNavMobileProps> = ({
  currentView,
  onGoHome,
  onOpenSearch,
  onOpenOwner,
  isOwner,
}) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E7E5DD] px-4 py-2 flex items-center justify-around">
      <button
        onClick={onGoHome}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
          currentView === 'home' ? 'text-[#344F3D]' : 'text-[#778078] hover:text-[#26352C]'
        }`}
      >
        <Home className="w-5 h-5" />
        <span>Beranda</span>
      </button>

      <button
        onClick={onOpenSearch}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium text-[#778078] hover:text-[#26352C] transition-colors"
      >
        <Search className="w-5 h-5" />
        <span>Cari</span>
      </button>

      <button
        onClick={onGoHome}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
          currentView === 'section' ? 'text-[#344F3D]' : 'text-[#778078] hover:text-[#26352C]'
        }`}
      >
        <Folder className="w-5 h-5" />
        <span>Section</span>
      </button>

      <button
        onClick={onOpenOwner}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
          isOwner ? 'text-[#344F3D]' : 'text-[#778078] hover:text-[#26352C]'
        }`}
      >
        {isOwner ? (
          <ShieldCheck className="w-5 h-5 text-[#344F3D]" />
        ) : (
          <Lock className="w-5 h-5" />
        )}
        <span>{isOwner ? 'Kelola' : 'Akses'}</span>
      </button>
    </nav>
  );
};
