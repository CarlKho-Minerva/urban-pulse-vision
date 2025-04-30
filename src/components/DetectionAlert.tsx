import React from 'react';
import { AlertTriangle, Construction, AlertCircle, Check } from 'lucide-react';

interface DetectionAlertProps {
  type: 'construction' | 'warning' | 'success' | 'pothole'; // Added 'pothole' just in case, ensure 'warning' covers road-hazard, rough-road, faded-lanes
  message: string;
}

const DetectionAlert: React.FC<DetectionAlertProps> = ({ type, message }) => {
  const icons = {
    pothole: <AlertCircle className="w-5 h-5 text-urbanPulse-green" />, // Kept for potential future use
    construction: <Construction className="w-5 h-5 text-yellow-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-red-500" />, // 'warning' now covers multiple original types
    success: <Check className="w-5 h-5 text-urbanPulse-green" />,
  };

  // Determine background/border based on type for better visual distinction
  let alertStyle = "border-urbanPulse-green/50"; // Default/Success/Pothole?
  if (type === 'construction') alertStyle = "border-yellow-400/50";
  if (type === 'warning') alertStyle = "border-red-500/50";


  return (
    // Removed absolute positioning, rely on parent div in RecordingScreen
    // Added dynamic border color
    <div className={`detection-indicator w-full bg-urbanPulse-black/80 backdrop-blur-md border ${alertStyle} rounded-lg px-4 py-3 flex items-center space-x-3 shadow-lg`}>
      {icons[type]}
      <span className="text-urbanPulse-white font-medium text-sm">{message}</span> {/* Reduced text size slightly */}
    </div>
  );
};

export default DetectionAlert;
