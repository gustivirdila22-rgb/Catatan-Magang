import React from 'react';
import { Search, ShieldCheck, Lock, SlidersHorizontal } from 'lucide-react';

interface HeaderProps {
  onGoHome: () => void;
  onOpenSearch: () => void;
  onOpenOwner: () => void;
  isOwner: boolean;
  searchQuery?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onGoHome,
  onOpenSearch,
  onOpenOwner,
  isOwner,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#F5F1E8]/90 backdrop-blur-md border-b border-[#E7E5DD] px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-left group transition-transform active:scale-98"
        >
          <div className="w-8 h-8 rounded-lg bg-[#344F3D] flex items-center justify-center text-white shadow-xs group-hover:bg-[#263A2D] transition-colors">
            {/* Custom stylized leaf icon matching mockup */}
            <svg
              className="w-4.5 h-4.5 fill-current text-[#E4EADF]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <span className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#26352C]">
            Catatan 7Smarts
          </span>
        </button>

        {/* Search Bar Affordance */}
        <div className="flex-1 max-w-md hidden sm:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 bg-white/80 hover:bg-white text-[#778078] text-sm rounded-full border border-[#E7E5DD] shadow-2xs hover:border-[#879B83] transition-all text-left"
          >
            <Search className="w-4 h-4 text-[#879B83]" />
            <span className="flex-1 truncate">Cari section atau catatan...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono text-[#778078] bg-[#F5F1E8] border border-[#E7E5DD] rounded">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile search button */}
          <button
            onClick={onOpenSearch}
            className="sm:hidden p-2 text-[#26352C] hover:bg-black/5 rounded-full transition-colors"
            aria-label="Cari catatan"
          >
            <Search className="w-5 h-5 text-[#344F3D]" />
          </button>

          {/* Owner status button */}
          <button
            onClick={onOpenOwner}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isOwner
                ? 'bg-[#E4EADF] text-[#344F3D] hover:bg-[#d8e0d2] border border-[#879B83]/30 shadow-2xs'
                : 'text-[#778078] hover:text-[#26352C] hover:bg-black/5 border border-transparent'
            }`}
            title={isOwner ? 'Dashboard Pengelolaan Pemilik' : 'Akses Pengelolaan Pemilik'}
          >
            {isOwner ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[#344F3D]" />
                <span className="hidden md:inline">Dashboard Pemilik</span>
                <span className="md:hidden">Kelola</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Akses Pemilik</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
