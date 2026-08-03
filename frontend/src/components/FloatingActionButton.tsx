import React from 'react';
import { Plus } from 'lucide-react';

interface FABProps {
  onClick: () => void;
}

export const FloatingActionButton: React.FC<FABProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 z-40 flex items-center justify-center w-14 h-14 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-300"
      aria-label="Add Gratitude Post"
      title="Share your gratitude"
    >
      <Plus className="w-7 h-7 stroke-[2.5]" />
    </button>
  );
};
