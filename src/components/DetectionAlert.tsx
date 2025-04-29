
import React from 'react';
import { AlertTriangle, Construction, Pothole, Check } from 'lucide-react';

interface DetectionAlertProps {
  type: 'pothole' | 'construction' | 'warning' | 'success';
  message: string;
}

const DetectionAlert: React.FC<DetectionAlertProps> = ({ type, message }) => {
  const icons = {
    pothole: <Pothole className="w-5 h-5 text-urbanPulse-green" />,
    construction: <Construction className="w-5 h-5 text-yellow-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-red-500" />,
    success: <Check className="w-5 h-5 text-urbanPulse-green" />,
  };

  return (
    <div className="detection-indicator absolute bottom-24 left-4 right-4 bg-urbanPulse-black/80 backdrop-blur-md border border-urbanPulse-green/50 rounded-lg px-4 py-3 flex items-center space-x-3">
      {icons[type]}
      <span className="text-urbanPulse-white font-medium">{message}</span>
    </div>
  );
};

export default DetectionAlert;
