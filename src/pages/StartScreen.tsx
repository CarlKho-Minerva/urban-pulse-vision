
import React from 'react';
import { useNavigate } from 'react-router-dom';
import LogoIcon from '@/components/LogoIcon';
import PulseButton from '@/components/PulseButton';

const StartScreen: React.FC = () => {
  const navigate = useNavigate();
  
  const handleStartDrive = () => {
    navigate('/recording');
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-urbanPulse-black relative overflow-hidden">
      <div className="city-grid absolute inset-0 opacity-20"></div>
      
      <div className="absolute inset-0 bg-gradient-radial from-urbanPulse-green/5 to-transparent"></div>
      
      <div className="relative z-10 flex flex-col items-center space-y-8 px-6 text-center">
        <LogoIcon />
        
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-urbanPulse-white">
            Urban<span className="text-urbanPulse-green">Pulse</span>
          </h1>
          <p className="text-urbanPulse-lightGray text-lg">
            Every Drive Makes Your City Smarter
          </p>
        </div>
        
        <div className="mt-12">
          <PulseButton size="lg" onClick={handleStartDrive} className="animate-pulse">
            Start Drive
          </PulseButton>
        </div>
        
        <p className="text-urbanPulse-lightGray text-xs max-w-xs mt-8">
          Your smartphone will automatically detect road and urban issues while driving
        </p>
      </div>
      
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <div className="text-urbanPulse-lightGray text-xs">
          © 2025 UrbanPulse
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
