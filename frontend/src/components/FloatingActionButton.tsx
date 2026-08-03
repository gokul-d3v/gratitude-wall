import React from 'react';

interface FABProps {
  onClick: () => void;
}

export const FloatingActionButton: React.FC<FABProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-10 right-10 w-16 h-16 bg-[#0058bd] text-white rounded-full shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95 group fab-pulse z-50 cursor-pointer"
      aria-label="Add Gratitude Post"
      title="Post your gratitude"
    >
      <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform duration-300">
        add
      </span>
      <span className="absolute right-full mr-4 bg-slate-900 text-white px-4 py-1.5 rounded-xl text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none translate-x-2 group-hover:translate-x-0 font-bold shadow-lg">
        New Gratitude
      </span>
    </button>
  );
};
