
import React from 'react';

const LogoIcon: React.FC = () => {
  return (
    <div className="relative w-24 h-24">
      <div className="absolute inset-0 bg-urbanPulse-black rounded-full border-4 border-urbanPulse-green flex items-center justify-center">
        <div className="w-16 h-16 city-grid rounded-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-urbanPulse-green/30 to-urbanPulse-green/10"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-urbanPulse-green rounded-full animate-city-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoIcon;
