import React, { useState, useEffect, useRef, useCallback } from 'react'; // Ensure useCallback is imported
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Construction, AlertCircle, MapPin, StopCircle, Gauge, Footprints, Spline, TrafficCone, Car, Ban, CloudRain } from 'lucide-react';
import DetectionAlert from '@/components/DetectionAlert';
import PulseButton from '@/components/PulseButton';
import mapboxgl, { LngLatLike } from 'mapbox-gl'; // Import LngLatLike
import 'mapbox-gl/dist/mapbox-gl.css';
import dashcamVideo from '/gemini-video/dashcam.mp4';

// Helper function to convert MM:SS to milliseconds
const timeToMs = (time: string): number => {
  const [minutes, seconds] = time.split(':').map(Number);
  return (minutes * 60 + seconds) * 1000;
};

// Refactored mock data for more Singapore-relevant, government-useful events
const newMockDetections = [
  { time: "00:03", message: "Pothole detected on left lane.", type: "pothole", displayPosition: { x: 0.35, y: 0.8 } },
  { time: "00:08", message: "Faded lane marking detected.", type: "faded-lanes", displayPosition: { x: 0.5, y: 0.7 } },
  { time: "00:15", message: "Illegal parking detected (double yellow line).", type: "illegal-parking", displayPosition: { x: 0.2, y: 0.6 } },
  { time: "00:22", message: "Construction zone detected ahead.", type: "construction", displayPosition: { x: 0.85, y: 0.4 } },
  { time: "00:29", message: "Pedestrian jaywalking detected.", type: "pedestrian-violation", displayPosition: { x: 0.6, y: 0.5 } },
  { time: "00:35", message: "Flood-prone area: water on road.", type: "flood", displayPosition: { x: 0.5, y: 0.85 } },
  { time: "00:41", message: "Roadwork sign detected.", type: "roadwork-sign", displayPosition: { x: 0.8, y: 0.4 } },
  { time: "00:48", message: "Speed bump detected.", type: "speed-bump", displayPosition: { x: 0.5, y: 0.8 } },
  { time: "00:55", message: "Blocked drain observed.", type: "blocked-drain", displayPosition: { x: 0.7, y: 0.9 } },
  { time: "01:02", message: "Tree branch fallen on road.", type: "road-hazard", displayPosition: { x: 0.4, y: 0.7 } },
  { time: "01:10", message: "Traffic light malfunction detected.", type: "traffic-light-issue", displayPosition: { x: 0.9, y: 0.3 } },
  { time: "01:18", message: "Bus stop shelter vandalism detected.", type: "vandalism", displayPosition: { x: 0.15, y: 0.5 } },
  { time: "01:25", message: "Cyclist riding on footpath.", type: "cyclist-violation", displayPosition: { x: 0.6, y: 0.6 } },
  { time: "01:32", message: "Overflowing rubbish bin detected.", type: "littering", displayPosition: { x: 0.8, y: 0.9 } },
  { time: "01:40", message: "Pedestrian crossing sign faded.", type: "faded-sign", displayPosition: { x: 0.85, y: 0.4 } },
  { time: "01:48", message: "Sharp bend ahead.", type: "curve-warning", displayPosition: { x: 0.8, y: 0.4 } },
  { time: "01:55", message: "Vehicle stopped in yellow box.", type: "yellow-box-violation", displayPosition: { x: 0.5, y: 0.5 } },
  { time: "02:03", message: "Pedestrian cluster at bus stop.", type: "pedestrian-cluster", displayPosition: { x: 0.15, y: 0.5 } },
  { time: "02:10", message: "Road surface uneven (subsidence).", type: "rough-road", displayPosition: { x: 0.5, y: 0.8 } }
].map((d, index) => ({
  id: index + 1,
  timeMs: timeToMs(d.time),
  message: d.message,
  alertType: d.type === 'construction' ? 'construction' : 'warning' as 'construction' | 'warning',
  originalType: d.type,
  displayPosition: d.displayPosition,
}));

// Moved outside component: Emoji/icon for each detection type
const getDetectionEmoji = (type: string): string => {
  switch (type) {
    case 'pothole': return '🕳️';
    case 'construction': return '🚧';
    case 'faded-lanes': return '🟨';
    case 'violation': return '🚫'; // Generic violation
    case 'illegal-parking': return '🅿️';
    case 'pedestrian-violation': return '🚶‍♂️🚫'; // Jaywalking
    case 'flood': return '💧';
    case 'roadwork-sign': return '🚧'; // Use construction
    case 'speed-bump': return '〰️';
    case 'blocked-drain': return '🧱';
    case 'road-hazard': return '⚠️'; // Fallen branch
    case 'traffic-light-issue': return '🚦❓';
    case 'vandalism': return '💥';
    case 'cyclist-violation': return '🚲🚫';
    case 'littering': return '🗑️';
    case 'faded-sign': return '🪧❓';
    case 'curve-warning': return '↪️';
    case 'yellow-box-violation': return '🟨🚗';
    case 'pedestrian-cluster': return '🧑‍🤝‍🧑';
    case 'rough-road': return '🪨'; // Subsidence
    default: return '❗';
  }
};

interface DetectionLocation {
  type: string;
  count: number;
  coordinates: [number, number][];
}

interface LocationState {
  recordingTime: number;
  detections: DetectionLocation[];
}

interface ActiveIndicator {
  id: number;
  x: number;
  y: number;
  type: string;
}

// Define type for map markers added during recording
interface MapMarkerInfo {
  id: number; // Corresponds to detection id
  marker: mapboxgl.Marker;
}

const RecordingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [recordingTime, setRecordingTime] = useState(0);
  const [showDetection, setShowDetection] = useState<{ type: 'construction' | 'warning', message: string } | null>(null);
  const [activeIndicators, setActiveIndicators] = useState<ActiveIndicator[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentCoords, setCurrentCoords] = useState<LngLatLike>([103.8198, 1.3521]); // Initial coords
  const [pathCoordinates, setPathCoordinates] = useState<LngLatLike[]>([]); // Store path
  const [detectionMapMarkers, setDetectionMapMarkers] = useState<MapMarkerInfo[]>([]); // Store map markers
  const detectionCoordsRef = useRef<{ [key: number]: LngLatLike }>({}); // Store coords per detection id
  const latestCoordsRef = useRef(currentCoords); // Ref to hold latest coordinates
  const animationFrameRef = useRef<number>();

  // Handle stop recording: navigate to summary screen
  const handleStopRecording = useCallback(() => {
    // Optionally, you can pass state such as recordingTime and detections
    // For example:
    // const detectionsSummary = Object.entries(detectionCoordsRef.current).map(([id, coords]) => {
    //   const detectionInfo = newMockDetections.find(d => d.id === parseInt(id));
    //   return { id: parseInt(id), type: detectionInfo?.originalType, coordinates: coords };
    // });
    // navigate('/summary', { state: { recordingTime, detections: detectionsSummary } });

    navigate('/summary'); // Simple navigation for now
  }, [navigate, recordingTime]); // Add recordingTime if you pass it in state

  // Format seconds as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Define a mock route with [lng, lat, timestamp_seconds]
  const mockRoute: [number, number, number][] = [
    [103.8198, 1.3521, 0],    // Start
    [103.8205, 1.3525, 10],   // Move slightly NE
    [103.8212, 1.3530, 20],
    [103.8218, 1.3535, 30],   // Continue NE
    [103.8225, 1.3540, 40],
    [103.8230, 1.3543, 50],   // Turn slightly E
    [103.8235, 1.3545, 60],
    [103.8238, 1.3548, 70],   // Continue E/NE
    [103.8242, 1.3552, 80],
    [103.8245, 1.3556, 90],
    [103.8248, 1.3560, 100],
    [103.8250, 1.3565, 110],
    [103.8252, 1.3570, 120],
    [103.8253, 1.3575, 130], // End (approx 2:10)
  ];

  // Function to interpolate coordinates based on time
  const getCoordsAtTime = (timeSeconds: number): LngLatLike => {
    for (let i = 0; i < mockRoute.length - 1; i++) {
      const [lng1, lat1, time1] = mockRoute[i];
      const [lng2, lat2, time2] = mockRoute[i + 1];

      if (timeSeconds >= time1 && timeSeconds <= time2) {
        const t = (timeSeconds - time1) / (time2 - time1);
        const lng = lng1 + (lng2 - lng1) * t;
        const lat = lat1 + (lat2 - lat1) * t;
        return [lng, lat];
      }
    }
    // If time is beyond the last point, return the last point
    return [mockRoute[mockRoute.length - 1][0], mockRoute[mockRoute.length - 1][1]];
  };

  // Show mock detections, contextual indicators, and add map markers
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const detectionTimers: NodeJS.Timeout[] = [];
    const indicatorTimeouts: NodeJS.Timeout[] = [];

    // --- Setup Detection Timers (runs once) ---
    newMockDetections.forEach(detection => {
      // Timer for the main notification alert
      const alertTimer = setTimeout(() => {
        setShowDetection({ type: detection.alertType, message: detection.message });
        const hideTimer = setTimeout(() => setShowDetection(null), 3000);
        detectionTimers.push(hideTimer);
      }, detection.timeMs);
      detectionTimers.push(alertTimer);

      // Timer for the contextual indicator AND map marker
      const indicatorTimer = setTimeout(() => {
        // Use the *latest* coordinates when the timer fires
        const currentMapCoord = latestCoordsRef.current;
        detectionCoordsRef.current[detection.id] = currentMapCoord; // Store coord for summary

        // Add video indicator
        setActiveIndicators(prev => [...prev, {
          id: detection.id,
          x: detection.displayPosition.x,
          y: detection.displayPosition.y,
          type: detection.originalType
        }]);

        // Add persistent emoji marker
        if (mapRef.current) {
          const el = document.createElement('div');
          el.style.fontSize = '22px';
          el.style.lineHeight = '1';
          el.style.background = 'none';
          el.style.width = '28px';
          el.style.height = '28px';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.textContent = getDetectionEmoji(detection.originalType);

          const newMarker = new mapboxgl.Marker(el)
            .setLngLat(currentMapCoord) // Use coord from ref
            .addTo(mapRef.current);

          setDetectionMapMarkers(prev => [...prev, { id: detection.id, marker: newMarker }]);
        }

        // Remove video indicator after ~4 seconds
        const removeTimer = setTimeout(() => {
          setActiveIndicators(prev => prev.filter(ind => ind.id !== detection.id));
        }, 4000);
        indicatorTimeouts.push(removeTimer);

      }, detection.timeMs);
      indicatorTimeouts.push(indicatorTimer);
    });

    // --- Animation Frame Loop for Time/Coordinate Updates ---
    const updateLoop = () => {
      if (videoElement && !videoElement.paused) {
        const currentTime = Math.floor(videoElement.currentTime);
        setRecordingTime(currentTime);

        const newCoords = getCoordsAtTime(videoElement.currentTime);
        setCurrentCoords(newCoords);
        latestCoordsRef.current = newCoords; // Update ref directly

        // Update path coordinates - add point if it's moved significantly
        setPathCoordinates(prevPath => {
          if (prevPath.length === 0) {
            return [newCoords];
          }
          const lastCoord = prevPath[prevPath.length - 1];
          // Basic distance check (simple difference)
          if (Array.isArray(lastCoord) && Array.isArray(newCoords) &&
              (Math.abs(lastCoord[0] - newCoords[0]) > 0.00001 || Math.abs(lastCoord[1] - newCoords[1]) > 0.00001)) {
            return [...prevPath, newCoords];
          }
          return prevPath;
        });

        animationFrameRef.current = requestAnimationFrame(updateLoop);
      } else {
        // If video paused or ended, ensure final state is set
        const finalTime = Math.floor(videoElement?.currentTime || 0);
        setRecordingTime(finalTime);
        const finalCoords = getCoordsAtTime(videoElement?.currentTime || 0);
        setCurrentCoords(finalCoords);
        latestCoordsRef.current = finalCoords;
      }
    };

    const handlePlay = () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(updateLoop);
    };

    const handlePauseOrEnd = () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      // Ensure final state is captured on pause/end
      updateLoop();
    };

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('playing', handlePlay); // Handle resuming
    videoElement.addEventListener('pause', handlePauseOrEnd);
    videoElement.addEventListener('ended', handlePauseOrEnd);

    // Start video playback
    videoElement.play().catch(error => console.error("Video playback failed:", error));
    if (!videoElement.paused) {
       handlePlay(); // Start loop if already playing
    }

    // --- Cleanup Function ---
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      detectionTimers.forEach(timer => clearTimeout(timer));
      indicatorTimeouts.forEach(timer => clearTimeout(timer));
      // Remove all markers on unmount
      detectionMapMarkers.forEach(mInfo => mInfo.marker.remove());
      setDetectionMapMarkers([]);
      setActiveIndicators([]); // Reset indicators on cleanup

      // Remove event listeners
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('playing', handlePlay);
      videoElement.removeEventListener('pause', handlePauseOrEnd);
      videoElement.removeEventListener('ended', handlePauseOrEnd);
    };
    // Run only once on mount
  }, []); // Empty dependency array - prevents re-running on coord change

  // Initialize MapBox
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoiY2FybGtob2N2ayIsImEiOiJjbWEybWNveHEyOXB4MmlzNzN5Z2xja3F3In0.ASmtqevARyohBUYjOyTrbw';

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      // center: currentCoords, // Center is set in the next effect
      zoom: 15,
      pitch: 45,
      bearing: -17.6,
      interactive: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      // Add source and layer for the path
      map.addSource('route', {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'properties': {},
          'geometry': {
            'type': 'LineString',
            'coordinates': [] // Start empty
          }
        }
      });
      map.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'route',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': '#00E676', // UrbanPulse Green
          'line-width': 5,
          'line-opacity': 0.8
        }
      });
      // Set initial center once map is loaded
      map.setCenter(currentCoords);
    });

    // Clean up map on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Update map center when currentCoords changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setCenter(currentCoords);
    }
  }, [currentCoords]); // Depend only on currentCoords

  // Update route source and pan map when pathCoordinates changes
  useEffect(() => {
    if (!mapRef.current) return;
    // Update the route source data
    const source = mapRef.current.getSource('route') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        'type': 'Feature',
        'properties': {},
        'geometry': {
          'type': 'LineString',
          'coordinates': pathCoordinates
        }
      });
    }
    // Pan to the latest coordinate, but only if it's significantly different
    if (pathCoordinates.length > 0) {
      const currentCenter = mapRef.current.getCenter();
      const targetCoord = pathCoordinates[pathCoordinates.length - 1];
      // Ensure targetCoord is in [lng, lat] format
      const targetLngLat = Array.isArray(targetCoord)
        ? targetCoord
        : [targetCoord.lng, targetCoord.lat];

      // Basic distance check (degrees, adjust threshold if needed)
      const distThreshold = 0.0001; // Smaller threshold for less panning
      const lngDiff = Math.abs(currentCenter.lng - targetLngLat[0]);
      const latDiff = Math.abs(currentCenter.lat - targetLngLat[1]);

      if (lngDiff > distThreshold || latDiff > distThreshold) {
         mapRef.current.panTo(targetCoord);
      }
    }
  }, [pathCoordinates]);


  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Video takes up top ~70% */}
      <div className="absolute inset-x-0 top-0 h-[70%] flex items-center justify-center pointer-events-none">
        <div className="w-full h-full bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            src={dashcamVideo}
            muted loop playsInline
          />
        </div>
      </div>

      {/* Mapbox map overlaps bottom ~35% */}
      <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gray-800 rounded-t-lg overflow-hidden z-0">
        <div ref={mapContainerRef} className="w-full h-full"></div>
      </div>

      {/* Status bar at the top */}
      <div className="absolute top-0 left-0 right-0 bg-urbanPulse-black/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-urbanPulse-green/30 z-10">
         <div className="flex items-center space-x-2">
           <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
           <span className="text-urbanPulse-white font-medium">REC {formatTime(recordingTime)}</span>
         </div>
         <div className="flex items-center space-x-1">
           <MapPin className="w-4 h-4 text-urbanPulse-green" />
           <span className="text-xs text-urbanPulse-white">GPS Active</span>
         </div>
      </div>

      {/* Stop button at the bottom center, above the map, z-10 */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <PulseButton
          variant="danger"
          size="lg"
          onClick={handleStopRecording} // Usage here
          className="px-8 flex items-center space-x-2 shadow-xl"
        >
          <StopCircle className="w-5 h-5" />
          <span>Stop Drive</span>
        </PulseButton>
      </div>

      {/* Detection alerts */}
      {showDetection && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10 w-4/5 max-w-md">
          <DetectionAlert type={showDetection.type} message={showDetection.message} />
        </div>
      )}

      {/* Contextual indicators on video */}
      {activeIndicators.map(indicator => {
         let IconComponent = AlertTriangle;
         let iconColor = "text-red-500";
         switch (indicator.type) {
           case 'construction': IconComponent = Construction; iconColor = "text-yellow-400"; break;
           case 'pothole': IconComponent = AlertCircle; iconColor = "text-urbanPulse-green"; break;
           case 'faded-lanes': IconComponent = Spline; iconColor = "text-orange-400"; break;
           case 'rough-road': IconComponent = MapPin; iconColor = "text-purple-400"; break;
           case 'wet-road': IconComponent = CloudRain; iconColor = "text-blue-400"; break;
           case 'speed-limit': IconComponent = Gauge; iconColor = "text-blue-300"; break;
           case 'curve-warning': case 'railroad-crossing-sign': case 'pedestrian-crossing-sign': IconComponent = AlertTriangle; iconColor = "text-yellow-500"; break;
           case 'pedestrian-cluster': IconComponent = Footprints; iconColor = "text-pink-400"; break;
           case 'illegal-parking': IconComponent = Ban; iconColor = "text-red-600"; break;
           case 'intersection': IconComponent = Spline; iconColor = "text-cyan-400"; break;
           case 'road-hazard': default: IconComponent = AlertTriangle; iconColor = "text-red-500"; break;
         }

        return (
          <div
            key={indicator.id}
            className="absolute rounded-full w-10 h-10 border-2 border-white/50 animate-pulse flex items-center justify-center bg-black/30 backdrop-blur-sm z-10"
            style={{
              left: `calc(${indicator.x * 100}% - 20px)`,
              top: `calc(${indicator.y * 70}vh - 20px)`,
              borderColor: iconColor.includes('-') ? `var(--color-${iconColor.split('-')[1]}-400, white)` : 'white',
            }}
          >
            <IconComponent className={`${iconColor} w-5 h-5`} />
          </div>
        );
      })}

    </div>
  );
};

export default RecordingScreen;
