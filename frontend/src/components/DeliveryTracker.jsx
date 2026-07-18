import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Map Bound Setter to center map between Store and Customer
function MapController({ storeCoords, customerCoords }) {
  const map = useMap();
  
  useEffect(() => {
    if (storeCoords && customerCoords) {
      const bounds = L.latLngBounds([
        [storeCoords.lat, storeCoords.lng],
        [customerCoords.lat, customerCoords.lng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [storeCoords, customerCoords, map]);

  return null;
}

export default function DeliveryTracker({ storeCoords, customerCoords }) {
  // Setup custom SVG icons to prevent broken image references in Vite
  const storeIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="%2316A34A"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
    iconSize: [36, 36],
    iconAnchor: [18, 36]
  });

  const customerIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="%2322C55E"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
    iconSize: [36, 36],
    iconAnchor: [18, 36]
  });

  const defaultCenter = storeCoords || { lat: 12.9724, lng: 77.5951 };

  return (
    <div class="h-full w-full rounded-2xl overflow-hidden shadow-soft relative border border-[#E5E7EB] bg-slate-100">
      <MapContainer 
        center={[defaultCenter.lat, defaultCenter.lng]} 
        zoom={14} 
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Central Hub Marker */}
        {storeCoords && (
          <Marker position={[storeCoords.lat, storeCoords.lng]} icon={storeIcon}>
            <Popup>
              <div class="text-xs font-bold text-[#16A34A]">InstaDispatch Store</div>
            </Popup>
          </Marker>
        )}

        {/* Customer Delivery Location */}
        {customerCoords && (
          <Marker position={[customerCoords.lat, customerCoords.lng]} icon={customerIcon}>
            <Popup>
              <div class="text-xs font-bold text-[#22C55E]">Delivery Address</div>
            </Popup>
          </Marker>
        )}

        {/* Dynamic Map bounds adjuster */}
        <MapController 
          storeCoords={storeCoords}
          customerCoords={customerCoords}
        />
      </MapContainer>
    </div>
  );
}
