import React from 'react';
import { ChevronLeft } from 'lucide-react';

export const BackButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button onClick={onClick} className="flex items-center gap-0.5 -ml-1 text-[15px] text-accent-500 w-fit">
    <ChevronLeft size={20} /> {label}
  </button>
);
