import React from 'react';
import { Plus } from 'lucide-react';

interface HeroProps {
  onAddSection: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onAddSection }) => {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-white border border-[#E7E5DD] p-6 sm:p-10 md:p-12 mb-10 shadow-xs">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Column: Typography & Action */}
        <div className="md:col-span-7 lg:col-span-8 space-y-4">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#26352C] leading-[1.15] text-balance">
            Selamat datang di <br className="hidden sm:inline" />
            <span className="italic font-normal">Catatan 7Smarts</span>
          </h1>

          <p className="text-[#778078] text-base sm:text-lg max-w-xl leading-relaxed">
            Tempat untuk menyimpan ide, catatan, dan berdiskusi bersama siapa saja.
          </p>

          <div className="pt-2">
            <button
              onClick={onAddSection}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#344F3D] hover:bg-[#263A2D] active:scale-98 text-white text-sm font-medium rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Section</span>
            </button>
          </div>
        </div>

        {/* Right Column: Botanical Art Matching Mockup (Hidden on mobile, visible from medium screens up) */}
        <div className="hidden md:col-span-5 lg:col-span-4 md:flex justify-end items-center relative min-h-[160px] sm:min-h-[200px]">
          {/* Subtle Organic Background Blob */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-56 h-56 sm:w-72 sm:h-72 bg-[#F5F1E8] rounded-full blur-2xl opacity-70 pointer-events-none" />

          {/* Botanical Leaf Art */}
          <div className="relative w-full max-w-[240px] sm:max-w-[280px] aspect-square flex items-center justify-center">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full text-[#879B83]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Stem */}
              <path
                d="M40 170 C70 140, 100 100, 160 40"
                stroke="#344F3D"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Leaves with organic calm sage fill */}
              <path
                d="M160 40 C170 30, 185 35, 175 55 C165 50, 160 45, 160 40Z"
                fill="#879B83"
                opacity="0.9"
              />
              <path
                d="M130 70 C145 55, 165 65, 150 85 C140 80, 135 75, 130 70Z"
                fill="#344F3D"
                opacity="0.8"
              />
              <path
                d="M125 75 C105 70, 95 90, 115 100 C120 90, 125 80, 125 75Z"
                fill="#879B83"
                opacity="0.85"
              />
              <path
                d="M95 105 C115 95, 125 115, 105 125 C100 115, 95 110, 95 105Z"
                fill="#344F3D"
                opacity="0.75"
              />
              <path
                d="M90 110 C70 105, 65 125, 80 135 C85 125, 90 115, 90 110Z"
                fill="#879B83"
                opacity="0.9"
              />
              <path
                d="M65 140 C85 130, 90 150, 75 160 C70 150, 65 145, 65 140Z"
                fill="#344F3D"
                opacity="0.85"
              />
              <path
                d="M60 145 C45 140, 40 155, 50 165 C55 158, 60 150, 60 145Z"
                fill="#879B83"
                opacity="0.7"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};