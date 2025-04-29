
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Construction, Pothole, MapPin, StopCircle } from 'lucide-react';
import DetectionAlert from '@/components/DetectionAlert';
import PulseButton from '@/components/PulseButton';

// Mock data for simulated detections
const mockDetections = [
  { id: 1, type: 'pothole' as const, message: 'Pothole detected', time: 5000 },
  { id: 2, type: 'construction' as const, message: 'Construction zone ahead', time: 12000 },
  { id: 3, type: 'warning' as const, message: '⚠️ Faded lane markings', time: 18000 },
  { id: 4, type: 'warning' as const, message: 'Rough road ahead', time: 25000 },
  { id: 5, type: 'success' as const, message: '✓ Data logged for city crews', time: 30000 },
];

const RecordingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [recordingTime, setRecordingTime] = useState(0);
  const [showDetection, setShowDetection] = useState<{ type: 'pothole' | 'construction' | 'warning' | 'success', message: string } | null>(null);
  
  // Format seconds as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Handle stop recording
  const handleStopRecording = () => {
    navigate('/summary', { 
      state: { 
        recordingTime,
        detections: [
          { type: 'pothole', count: 1 },
          { type: 'construction', count: 1 },
          { type: 'faded-lanes', count: 2 },
          { type: 'violation', count: 1 },
        ]
      } 
    });
  };
  
  // Increment recording time
  useEffect(() => {
    const timer = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Show mock detections at specified times
  useEffect(() => {
    const detectionTimers: NodeJS.Timeout[] = [];
    
    mockDetections.forEach(detection => {
      const timer = setTimeout(() => {
        setShowDetection({ type: detection.type, message: detection.message });
        
        // Hide the detection after 3 seconds
        const hideTimer = setTimeout(() => {
          setShowDetection(null);
        }, 3000);
        
        detectionTimers.push(hideTimer);
      }, detection.time);
      
      detectionTimers.push(timer);
    });
    
    return () => detectionTimers.forEach(timer => clearTimeout(timer));
  }, []);
  
  return (
    <div className="relative min-h-screen bg-black">
      {/* Simulated camera view/dashcam footage */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
          {/* This would be replaced with actual camera feed */}
          <div className="w-full h-full bg-gradient-to-b from-gray-800 to-gray-900 relative">
            {/* Simulated road */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-gray-700 to-gray-800">
              <div className="absolute left-1/2 top-0 bottom-0 w-4 bg-urbanPulse-lightGray/30 transform -translate-x-1/2"></div>
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-urbanPulse-lightGray transform -translate-x-1/2 flex flex-col justify-between">
                <div className="h-12 w-1"></div>
                <div className="h-12 w-1 bg-urbanPulse-white"></div>
                <div className="h-12 w-1"></div>
                <div className="h-12 w-1 bg-urbanPulse-white"></div>
                <div className="h-12 w-1"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Status bar at the top */}
      <div className="absolute top-0 left-0 right-0 bg-urbanPulse-black/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-urbanPulse-green/30">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-urbanPulse-white font-medium">REC {formatTime(recordingTime)}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <MapPin className="w-4 h-4 text-urbanPulse-green" />
          <span className="text-xs text-urbanPulse-white">GPS Active</span>
        </div>
      </div>
      
      {/* Stop button at the bottom */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <PulseButton 
          variant="danger"
          size="lg"
          onClick={handleStopRecording}
          className="px-8 flex items-center space-x-2"
        >
          <StopCircle className="w-5 h-5" />
          <span>Stop Drive</span>
        </PulseButton>
      </div>
      
      {/* Detection alerts */}
      {showDetection && (
        <DetectionAlert type={showDetection.type} message={showDetection.message} />
      )}
      
      {/* Contextual indicators will appear here when detections happen */}
      {recordingTime > 4 && recordingTime < 8 && (
        <div className="absolute bottom-40 left-32 rounded-full w-12 h-12 border-2 border-urbanPulse-green animate-pulse flex items-center justify-center">
          <Pothole className="text-urbanPulse-green w-6 h-6" />
        </div>
      )}
      
      {recordingTime > 11 && recordingTime < 15 && (
        <div className="absolute top-48 right-12 rounded-full w-12 h-12 border-2 border-yellow-400 animate-pulse flex items-center justify-center">
          <Construction className="text-yellow-400 w-6 h-6" />
        </div>
      )}
    </div>
  );
};

export default RecordingScreen;
