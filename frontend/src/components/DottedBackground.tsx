import React from 'react';

interface DottedBackgroundProps {
  children: React.ReactNode;
}

export const DottedBackground: React.FC<DottedBackgroundProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full dotted-canvas overflow-x-hidden">
      {children}
    </div>
  );
};
