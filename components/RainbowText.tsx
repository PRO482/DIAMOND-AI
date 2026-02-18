
import React from 'react';

interface RainbowTextProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

const RainbowText: React.FC<RainbowTextProps> = ({ children, className = '', animate = false }) => {
  return (
    <span className={`${animate ? 'animated-rainbow' : 'rainbow-text'} font-bold ${className}`}>
      {children}
    </span>
  );
};

export default RainbowText;
