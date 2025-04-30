import React, { useState, useEffect, useRef, useCallback } from 'react'; // Added useCallback
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

// Updated mock data with all entries
const newMockDetections = [
  { time: "00:01", message: "Wet road surface detected ahead.", type: "wet-road", displayPosition: { x: 0.5, y: 0.8 } },
  { time: "00:02", message: "Speed limit 50 zone approaching.", type: "speed-limit", displayPosition: { x: 0.8, y: 0.4 } },
  { time: "00:13", message: "Curve warning sign visible ahead.", type: "curve-warning", displayPosition: { x: 0.8, y: 0.45 } },
  { time: "00:15", message: "Faded 'X' road marking ahead.", type: "faded-lanes", displayPosition: { x: 0.5, y: 0.7 } },
  { time: "00:15", message: "Railroad crossing advance warning sign visible.", type: "railroad-crossing-sign", displayPosition: { x: 0.8, y: 0.4 } },
  { time: "00:23", message: "Railroad crossing crossbuck sign ahead.", type: "railroad-crossing-sign", displayPosition: { x: 0.85, y: 0.3 } },
  { time: "00:28", message: "Rough road surface at railroad crossing.", type: "rough-road", displayPosition: { x: 0.5, y: 0.8 } },
  { time: "00:33", message: "Construction or work zone warning sign ahead.", type: "construction", displayPosition: { x: 0.85, y: 0.4 } },
  { time: "00:35", message: "Pedestrian activity possible, crossing sign ahead.", type: "pedestrian-crossing-sign", displayPosition: { x: 0.85, y: 0.4 } },
  { time: "00:50", message: "Faded center lane markings visible.", type: "faded-lanes", displayPosition: { x: 0.5, y: 0.7 } },
  { time: "00:52", message: "Vehicle entering road from left.", type: "road-hazard", displayPosition: { x: 0.2, y: 0.6 } },
  { time: "00:57", message: "Speed limit reduced to 40.", type: "speed-limit", displayPosition: { x: 0.9, y: 0.35 } },
  { time: "01:02", message: "Vehicle potentially parked illegally, narrowing road.", type: "illegal-parking", displayPosition: { x: 0.2, y: 0.6 } },
  { time: "01:05", message: "Vehicle potentially parked too close to driveway.", type: "illegal-parking", displayPosition: { x: 0.2, y: 0.65 } },
  { time: "01:06", message: "Pedestrian cluster observed near sidewalk.", type: "pedestrian-cluster", displayPosition: { x: 0.15, y: 0.5 } },
  { time: "01:07", message: "Road narrows due to parked vehicles.", type: "road-hazard", displayPosition: { x: 0.5, y: 0.6 } },
  { time: "01:17", message: "Object near road edge (decoration).", type: "road-hazard", displayPosition: { x: 0.85, y: 0.6 } },
  { time: "01:48", message: "Sharp right turn warning sign ahead.", type: "curve-warning", displayPosition: { x: 0.8, y: 0.4 } },
  { time: "01:50", message: "Vehicle potentially parked illegally, narrowing road.", type: "illegal-parking", displayPosition: { x: 0.2, y: 0.6 } },
  { time: "01:59", message: "Approaching roundabout or complex intersection.", type: "intersection", displayPosition: { x: 0.5, y: 0.5 } },
  { time: "02:10", message: "Vehicle potentially parked too close to junction.", type: "illegal-parking", displayPosition: { x: 0.15, y: 0.6 } }
].map((d, index) => ({
  id: index + 1,
  timeMs: timeToMs(d.time),
  message: d.message,
  alertType: d.type === 'construction' ? 'construction' : 'warning' as 'construction' | 'warning',
  originalType: d.type,
  displayPosition: d.displayPosition,
}));

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

  // Format seconds as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Function to get marker SVG (similar to SummaryScreen, maybe move to utils?)
  const getMarkerSvg = useCallback((type: string): string => {
    let color = '#EF4444'; // Default red (road-hazard)
    switch (type) {
      case 'pothole': color = '#00E676'; break;
      case 'construction': color = '#FACC15'; break;
      case 'faded-lanes': color = '#FB923C'; break;
      case 'violation': color = '#EF4444'; break;
      case 'rough-road': color = '#A855F7'; break;
      case 'wet-road': color = '#60A5FA'; break;
      case 'speed-limit': color = '#93C5FD'; break;
      case 'curve-warning':
      case 'railroad-crossing-sign':
      case 'pedestrian-crossing-sign': color = '#F59E0B'; break;
      case 'pedestrian-cluster': color = '#EC4899'; break;
      case 'illegal-parking': color = '#DC2626'; break;
      case 'intersection': color = '#22D3EE'; break;
    }
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="${color}" stroke="white" stroke-width="10"/></svg>`;
  }, []);


  // Handle stop recording - Use actual recorded coordinates
  const handleStopRecording = () => {
    const aggregatedDetections: { [key: string]: { count: number; coordinates: [number, number][] } } = {};

    // Use the coordinates recorded when detections happened
    newMockDetections.forEach(det => {
      const type = det.originalType;
      const recordedCoord = detectionCoordsRef.current[det.id]; // Get coord saved for this detection

      if (!aggregatedDetections[type]) {
        aggregatedDetections[type] = { count: 0, coordinates: [] };
      }
      aggregatedDetections[type].count++;

      // Use the actual coordinate if available, otherwise fallback (shouldn't happen often)
      if (recordedCoord) {
         // Ensure coordinate is in [number, number] format
         const coordArray: [number, number] = Array.isArray(recordedCoord)
           ? [recordedCoord[0], recordedCoord[1]]
           : [recordedCoord.lng, recordedCoord.lat];
         aggregatedDetections[type].coordinates.push(coordArray);
      } else {
         // Fallback: Add a slightly varied coordinate based on the last known position
         const lastCoord = pathCoordinates.length > 0 ? pathCoordinates[pathCoordinates.length - 1] : [103.8198, 1.3521];
         const fallbackCoord: [number, number] = Array.isArray(lastCoord)
            ? [lastCoord[0] + (Math.random() - 0.5) * 0.0005, lastCoord[1] + (Math.random() - 0.5) * 0.0005]
            : [lastCoord.lng + (Math.random() - 0.5) * 0.0005, lastCoord.lat + (Math.random() - 0.5) * 0.0005];
         aggregatedDetections[type].coordinates.push(fallbackCoord);
         console.warn(`No specific coordinate found for detection ID ${det.id}, using fallback.`);
      }
    });

    const detectionsForSummary: DetectionLocation[] = Object.entries(aggregatedDetections).map(([type, data]) => ({
      type: type,
      count: data.count,
      coordinates: data.coordinates,
    }));

    navigate('/summary', {
      state: {
        recordingTime,
        detections: detectionsForSummary
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

  // Show mock detections, contextual indicators, and add map markers
  useEffect(() => {
    const detectionTimers: NodeJS.Timeout[] = [];
    const indicatorTimeouts: NodeJS.Timeout[] = [];
    const markerRemoveTimeouts: NodeJS.Timeout[] = []; // For removing map markers

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
        const currentMapCoord = currentCoords; // Capture coords at time of detection
        detectionCoordsRef.current[detection.id] = currentMapCoord; // Store coord for summary

        // Add video indicator
        setActiveIndicators(prev => [...prev, {
          id: detection.id,
          x: detection.displayPosition.x,
          y: detection.displayPosition.y,
          type: detection.originalType
        }]);

        // Add map marker
        if (mapRef.current) {
          const el = document.createElement('div');
          el.style.backgroundImage = `url('data:image/svg+xml;utf8,${encodeURIComponent(getMarkerSvg(detection.originalType))}')`;
          el.style.width = `15px`; // Smaller markers for recording screen
          el.style.height = `15px`;
          el.style.backgroundSize = '100%';

          const newMarker = new mapboxgl.Marker(el)
            .setLngLat(currentMapCoord)
            .addTo(mapRef.current);

          setDetectionMapMarkers(prev => [...prev, { id: detection.id, marker: newMarker }]);

          // Schedule marker removal slightly after indicator removal
           const markerRemoveTimer = setTimeout(() => {
             newMarker.remove();
             setDetectionMapMarkers(prev => prev.filter(m => m.id !== detection.id));
           }, 5000); // Remove marker after 5s
           markerRemoveTimeouts.push(markerRemoveTimer);
        }


        // Remove video indicator after ~4 seconds
        const removeTimer = setTimeout(() => {
          setActiveIndicators(prev => prev.filter(ind => ind.id !== detection.id));
        }, 4000);
        indicatorTimeouts.push(removeTimer);

      }, detection.timeMs);
      indicatorTimeouts.push(indicatorTimer);
    });

    // Start video playback
    if (videoRef.current) {
      videoRef.current.play().catch(error => console.error("Video playback failed:", error));
    }

    // Cleanup function
    return () => {
      detectionTimers.forEach(timer => clearTimeout(timer));
      indicatorTimeouts.forEach(timer => clearTimeout(timer));
      markerRemoveTimeouts.forEach(timer => clearTimeout(timer)); // Clear marker removal timers
      // Remove any remaining markers on unmount
      detectionMapMarkers.forEach(mInfo => mInfo.marker.remove());
      setDetectionMapMarkers([]);
    };
    // Add dependencies: currentCoords and getMarkerSvg
  }, [currentCoords, getMarkerSvg]);

  // Initialize MapBox, draw path
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoiY2FybGtob2N2ayIsImEiOiJjbWEybWNveHEyOXB4MmlzNzN5Z2xja3F3In0.ASmtqevARyohBUYjOyTrbw';

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: currentCoords, // Use state for center
      zoom: 15, // Zoom in a bit more
      pitch: 45, // Increase pitch
      bearing: -17.6, // Slight rotation
      interactive: false, // Make map non-interactive during recording
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

      // Start simulation
      let i = 0;
      const intervalId = setInterval(() => {
        if (mapRef.current) {
          const center = mapRef.current.getCenter();
          const newLng = center.lng + 0.00015; // Slightly faster movement
          const newLat = center.lat + (Math.random() - 0.5) * 0.0001;
          const newCoords: LngLatLike = [newLng, newLat];

          setCurrentCoords(newCoords); // Update state
          setPathCoordinates(prev => [...prev, newCoords]); // Add to path

          // Update map source data
          const source = mapRef.current.getSource('route') as mapboxgl.GeoJSONSource;
          if (source) {
            source.setData({
              'type': 'Feature',
              'properties': {},
              'geometry': {
                'type': 'LineString',
                // Use pathCoordinates directly from state in the effect dependency array
                'coordinates': pathCoordinates
              }
            });
          }

          mapRef.current.panTo(newCoords); // Pan map
        }
        i++;
        // Stop simulation after a while (e.g., > video length)
        if (i > 300) { // ~2.5 minutes
           clearInterval(intervalId);
        }
      }, 500); // Update every 500ms

      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    });

    // Clean up map on unmount
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Add pathCoordinates to dependency array to ensure source.setData uses the latest path
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
      <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gray-800 rounded-t-lg overflow-hidden z-0"> {/* z-0 to be behind button */}
        <div ref={mapContainerRef} className="w-full h-full"></div>
      </div>

      {/* Status bar at the top */}
      <div className="absolute top-0 left-0 right-0 bg-urbanPulse-black/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-urbanPulse-green/30 z-10"> {/* z-10 */}
         <div className="flex items-center space-x-2">
           <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
           <span className="text-urbanPulse-white font-medium">REC {formatTime(recordingTime)}</span>
         </div>
         <div className="flex items-center space-x-1">
           <MapPin className="w-4 h-4 text-urbanPulse-green" />
           <span className="text-xs text-urbanPulse-white">GPS Active</span>
         </div>
      </div>

      {/* Stop button at the bottom center */}
      {/* Positioned slightly above the absolute bottom, centered, z-10 */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <PulseButton
          variant="danger"
          size="lg"
          onClick={handleStopRecording}
          className="px-8 flex items-center space-x-2 shadow-xl" // Added shadow
        >
          <StopCircle className="w-5 h-5" />
          <span>Stop Drive</span>
        </PulseButton>
      </div>

      {/* Detection alerts */}
      {showDetection && (
        // Positioned below status bar, z-10
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10 w-4/5 max-w-md">
          <DetectionAlert type={showDetection.type} message={showDetection.message} />
        </div>
      )}

      {/* Contextual indicators on video */}
      {/* Positioned within the video area (top 70%), z-10 */}
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
            // Adjusted top calculation to be relative to video container height (70vh)
            className="absolute rounded-full w-10 h-10 border-2 border-white/50 animate-pulse flex items-center justify-center bg-black/30 backdrop-blur-sm z-10"
            style={{
              left: `calc(${indicator.x * 100}% - 20px)`,
              top: `calc(${indicator.y * 70}vh - 20px)`, // Use vh for vertical positioning within video area
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
