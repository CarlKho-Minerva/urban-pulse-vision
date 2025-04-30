import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PulseButton from '@/components/PulseButton';
// Added icons for new types
import { Construction, AlertCircle, AlertTriangle, Flag, Award, MapPin, Route, Gauge, Footprints, Spline, TrafficCone, Car, Ban, CloudRain } from 'lucide-react';
import mapboxgl from 'mapbox-gl'; // Import mapboxgl
import 'mapbox-gl/dist/mapbox-gl.css'; // Import mapboxgl CSS

interface DetectionLocation {
  type: string; // Expecting original types like 'wet-road', 'speed-limit' etc.
  count: number;
  coordinates: [number, number][];
}

interface LocationState {
  recordingTime: number;
  detections: DetectionLocation[];
}

const SummaryScreen: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null); // Ref for map container
  const mapRef = useRef<mapboxgl.Map | null>(null); // Ref for map instance

  // Updated default state to reflect potential new types from full Gemini data
  const { recordingTime, detections } = (location.state as LocationState) || {
    recordingTime: 130, // Example time based on last detection ~2:10
    detections: [
      { type: 'wet-road', count: 1, coordinates: [[103.8195, 1.3515]] },
      { type: 'speed-limit', count: 2, coordinates: [[103.8205, 1.3525], [103.8205, 1.3525]] },
      { type: 'curve-warning', count: 2, coordinates: [[103.8215, 1.3535], [103.8215, 1.3535]] },
      { type: 'faded-lanes', count: 2, coordinates: [[103.822, 1.354], [103.822, 1.354]] },
      { type: 'railroad-crossing-sign', count: 2, coordinates: [[103.8185, 1.3505], [103.8185, 1.3505]] },
      { type: 'rough-road', count: 1, coordinates: [[103.820, 1.352]] },
      { type: 'construction', count: 1, coordinates: [[103.818, 1.351]] },
      { type: 'pedestrian-crossing-sign', count: 1, coordinates: [[103.8175, 1.3500]] },
      { type: 'road-hazard', count: 3, coordinates: [[103.819, 1.351], [103.819, 1.351], [103.819, 1.351]] },
      { type: 'illegal-parking', count: 4, coordinates: [[103.821, 1.353], [103.821, 1.353], [103.821, 1.353], [103.821, 1.353]] },
      { type: 'pedestrian-cluster', count: 1, coordinates: [[103.817, 1.3495]] },
      { type: 'intersection', count: 1, coordinates: [[103.8225, 1.3545]] },
    ]
  };

  const totalDetections = detections.reduce((sum, detection) => sum + detection.count, 0);
  const cityPoints = totalDetections * 10;

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Updated getIcon to handle all new types
  const getIcon = (type: string) => {
    switch (type) {
      case 'pothole': return <AlertCircle className="w-6 h-6 text-urbanPulse-green" />;
      case 'construction': return <Construction className="w-6 h-6 text-yellow-400" />;
      case 'faded-lanes': return <Spline className="w-6 h-6 text-orange-400" />;
      case 'violation': return <Flag className="w-6 h-6 text-red-500" />; // Keep violation example if needed
      case 'road-hazard': return <AlertTriangle className="w-6 h-6 text-red-400" />;
      case 'rough-road': return <MapPin className="w-6 h-6 text-purple-400" />;
      case 'wet-road': return <CloudRain className="w-6 h-6 text-blue-400" />;
      case 'speed-limit': return <Gauge className="w-6 h-6 text-blue-300" />;
      case 'curve-warning':
      case 'railroad-crossing-sign':
      case 'pedestrian-crossing-sign': return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'pedestrian-cluster': return <Footprints className="w-6 h-6 text-pink-400" />;
      case 'illegal-parking': return <Ban className="w-6 h-6 text-red-600" />;
      case 'intersection': return <Spline className="w-6 h-6 text-cyan-400" />;
      default: return <AlertTriangle className="w-6 h-6 text-urbanPulse-lightGray" />;
    }
  };

  // Updated getLabelText to handle all new types
  const getLabelText = (type: string): string => {
    switch (type) {
      case 'pothole': return 'Pothole';
      case 'construction': return 'Construction';
      case 'faded-lanes': return 'Faded Lanes';
      case 'violation': return 'Parking Violation'; // Keep if needed
      case 'road-hazard': return 'Road Hazard';
      case 'rough-road': return 'Rough Road';
      case 'wet-road': return 'Wet Road';
      case 'speed-limit': return 'Speed Limit Zone';
      case 'curve-warning': return 'Curve Warning';
      case 'railroad-crossing-sign': return 'Railroad Crossing';
      case 'pedestrian-crossing-sign': return 'Pedestrian Crossing';
      case 'pedestrian-cluster': return 'Pedestrian Cluster';
      case 'illegal-parking': return 'Illegal Parking';
      case 'intersection': return 'Intersection/Roundabout';
      default: return type.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  // Initialize MapBox and add markers
  useEffect(() => {
    if (!mapContainerRef.current || !detections || detections.length === 0) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoiY2FybGtob2N2ayIsImEiOiJjbWEybWNveHEyOXB4MmlzNzN5Z2xja3F3In0.ASmtqevARyohBUYjOyTrbw'; // Use your Mapbox token

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [103.8198, 1.3521], // Default center (Singapore)
      zoom: 12, // Default zoom
    });

    mapRef.current = map;

    const bounds = new mapboxgl.LngLatBounds();

    detections.forEach(detection => {
      detection.coordinates.forEach(coord => {
        if (coord && coord.length === 2) {
          const el = document.createElement('div');
          el.className = 'marker'; // Add a class for potential styling
          el.style.backgroundImage = `url('data:image/svg+xml;utf8,${encodeURIComponent(getMarkerSvg(detection.type))}')`;
          el.style.width = `25px`;
          el.style.height = `25px`;
          el.style.backgroundSize = '100%';

          // Create a custom HTML element for the popup for better styling
          const popupContent = document.createElement('div');
          popupContent.className = 'bg-urbanPulse-darkGray text-urbanPulse-white px-3 py-1 rounded shadow-md text-sm';
          popupContent.textContent = `${getLabelText(detection.type)} detected`;

          new mapboxgl.Marker(el)
            .setLngLat(coord)
            .setPopup(new mapboxgl.Popup({ offset: 25, closeButton: false }) // Add popups, remove close button
              // .setText(`${getLabelText(detection.type)} detected`) // Use setDOMContent instead of setText
              .setDOMContent(popupContent) // Use custom HTML for styling
            )
            .addTo(map);
          bounds.extend(coord);
        }
      });
    });

    // Fit map to bounds if markers were added
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 60 // Add padding around markers
      });
    }

    // Clean up on unmount
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [detections]); // Re-run effect if detections change

  // Updated getMarkerSvg to handle all new types with different colors
  const getMarkerSvg = (type: string): string => {
    let color = '#EF4444'; // Default red (road-hazard)
    switch (type) {
      case 'pothole': color = '#00E676'; break; // urbanPulse-green
      case 'construction': color = '#FACC15'; break; // yellow-400
      case 'faded-lanes': color = '#FB923C'; break; // orange-400
      case 'violation': color = '#EF4444'; break; // red-500
      case 'rough-road': color = '#A855F7'; break; // purple-400
      case 'wet-road': color = '#60A5FA'; break; // blue-400
      case 'speed-limit': color = '#93C5FD'; break; // blue-300
      case 'curve-warning':
      case 'railroad-crossing-sign':
      case 'pedestrian-crossing-sign': color = '#F59E0B'; break; // yellow-500
      case 'pedestrian-cluster': color = '#EC4899'; break; // pink-400
      case 'illegal-parking': color = '#DC2626'; break; // red-600
      case 'intersection': color = '#22D3EE'; break; // cyan-400
      // road-hazard uses default red
    }
    // Simple circle SVG marker with thicker stroke
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="${color}" stroke="white" stroke-width="10"/></svg>`; // Increased stroke-width to 10
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

        {/* Map preview */}
        <div className="bg-urbanPulse-darkGray/50 rounded-2xl overflow-hidden mb-8 h-64 relative"> {/* Increased height */}
          <div ref={mapContainerRef} className="absolute inset-0"></div>
          {(!detections || detections.length === 0 || !detections.some(d => d.coordinates && d.coordinates.length > 0)) && (
             <div className="absolute inset-0 flex items-center justify-center">
               <span className="text-urbanPulse-lightGray">No detection locations available</span>
             </div>
          )}
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
