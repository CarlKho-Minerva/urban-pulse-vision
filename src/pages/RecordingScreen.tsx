
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Construction, AlertCircle, MapPin, StopCircle } from 'lucide-react';
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
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

  // Initialize MapBox if needed
  useEffect(() => {
    // Here we would normally initialize Mapbox but we're not doing it in this prototype
    // since we don't have an actual API key
  }, []);
  
  return (
    <div className="relative min-h-screen bg-black">
      {/* YouTube video as dashcam footage */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-2/3 bg-gray-900 flex items-center justify-center overflow-hidden">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/6ZFs7zolVHk?autoplay=1&mute=1&controls=0&disablekb=1&loop=1&modestbranding=1&showinfo=0&playlist=6ZFs7zolVHk"
            title="Road Map Footage"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
      
      {/* Mapbox map at bottom */}
      <div className="absolute bottom-24 left-4 right-4 h-1/4 bg-gray-800 rounded-lg overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full">
          {/* Placeholder for MapBox */}
          <div className="w-full h-full bg-gradient-to-r from-urbanPulse-darkGray to-gray-800 flex items-center justify-center">
            <div className="city-grid absolute inset-0 opacity-30"></div>
            <div className="text-urbanPulse-lightGray text-sm">
              <MapPin className="w-5 h-5 mb-2 mx-auto text-urbanPulse-green animate-pulse" />
              Real-time location tracking
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
      
      {/* Contextual indicators that appear during detections */}
      {recordingTime > 4 && recordingTime < 8 && (
        <div className="absolute bottom-40 left-32 rounded-full w-12 h-12 border-2 border-urbanPulse-green animate-pulse flex items-center justify-center">
          <AlertCircle className="text-urbanPulse-green w-6 h-6" />
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
