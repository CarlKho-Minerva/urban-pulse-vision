
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PulseButton from '@/components/PulseButton';
import { Construction, Pothole, AlertTriangle, Flag, Award } from 'lucide-react';

interface Detection {
  type: string;
  count: number;
}

interface LocationState {
  recordingTime: number;
  detections: Detection[];
}

const SummaryScreen: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { recordingTime, detections } = (location.state as LocationState) || { 
    recordingTime: 35, 
    detections: [
      { type: 'pothole', count: 1 },
      { type: 'construction', count: 1 },
      { type: 'faded-lanes', count: 2 },
      { type: 'violation', count: 1 },
    ]
  };
  
  const totalDetections = detections.reduce((sum, detection) => sum + detection.count, 0);
  const cityPoints = totalDetections * 10;
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'pothole':
        return <Pothole className="w-6 h-6 text-urbanPulse-green" />;
      case 'construction':
        return <Construction className="w-6 h-6 text-yellow-400" />;
      case 'faded-lanes':
        return <AlertTriangle className="w-6 h-6 text-orange-400" />;
      case 'violation':
        return <Flag className="w-6 h-6 text-red-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-urbanPulse-green" />;
    }
  };
  
  const getLabelText = (type: string): string => {
    switch (type) {
      case 'pothole':
        return 'Pothole';
      case 'construction':
        return 'Construction Zone';
      case 'faded-lanes':
        return 'Faded Lane Markings';
      case 'violation':
        return 'Parking Violation';
      default:
        return type;
    }
  };
  
  const handleStartNewDrive = () => {
    navigate('/');
  };
  
  return (
    <div className="min-h-screen bg-urbanPulse-black flex flex-col">
      {/* Confetti effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 left-0 w-full h-40 flex justify-around">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="w-2 h-2 bg-urbanPulse-green" 
              style={{
                animation: `fall ${Math.random() * 2 + 2}s linear ${Math.random() * 2}s infinite`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.7 + 0.3,
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Header */}
      <div className="bg-urbanPulse-darkGray pt-12 pb-8 px-6 rounded-b-3xl shadow-lg">
        <h1 className="text-2xl font-bold text-urbanPulse-white text-center mb-2">
          Trip Complete!
        </h1>
        <p className="text-urbanPulse-lightGray text-center">
          Here's the pulse you took
        </p>
        
        {/* Duration */}
        <div className="mt-6 flex justify-center">
          <div className="bg-urbanPulse-black/50 rounded-full px-5 py-2 text-urbanPulse-white">
            <span className="text-sm">Trip Duration: </span>
            <span className="font-medium">{formatTime(recordingTime)}</span>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 px-6 py-8">
        {/* Issues detected summary */}
        <div className="bg-urbanPulse-darkGray/50 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-urbanPulse-white">Issues Detected</h2>
            <span className="text-3xl font-bold text-urbanPulse-green">{totalDetections}</span>
          </div>
          
          <div className="space-y-4">
            {detections.map((detection, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getIcon(detection.type)}
                  <span className="text-urbanPulse-white">{getLabelText(detection.type)}</span>
                </div>
                <div className="bg-urbanPulse-black/40 rounded-full h-8 w-8 flex items-center justify-center">
                  <span className="text-urbanPulse-green font-medium">x{detection.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Rewards */}
        <div className="bg-urbanPulse-darkGray/50 rounded-2xl p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Award className="text-yellow-400 w-6 h-6" />
            <h2 className="text-xl font-bold text-urbanPulse-white">Rewards</h2>
          </div>
          
          <div className="bg-gradient-to-r from-urbanPulse-green/20 to-yellow-500/20 rounded-lg p-4 flex items-center justify-between">
            <span className="text-urbanPulse-white">CityPoints Earned</span>
            <span className="text-2xl font-bold text-urbanPulse-green">+{cityPoints}</span>
          </div>
          
          <p className="text-xs text-urbanPulse-lightGray mt-3">
            Thank you for making your city smarter! Use your points for discounts on parking or public transport.
          </p>
        </div>
        
        {/* Map preview (mock) */}
        <div className="bg-urbanPulse-darkGray/50 rounded-2xl overflow-hidden mb-8 h-32 relative">
          <div className="absolute inset-0 city-grid opacity-40"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-urbanPulse-black/80"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-urbanPulse-lightGray">Map view of detections</span>
          </div>
        </div>
      </div>
      
      {/* Bottom buttons */}
      <div className="px-6 py-8 mt-auto">
        <div className="grid grid-cols-2 gap-4">
          <PulseButton variant="secondary" onClick={() => alert("Sharing functionality would be implemented here")}>
            Share Results
          </PulseButton>
          <PulseButton onClick={handleStartNewDrive}>
            New Drive
          </PulseButton>
        </div>
      </div>
    </div>
  );
};

export default SummaryScreen;
