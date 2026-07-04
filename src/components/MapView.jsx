import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAppContext } from '../AppContext';

// Fix leaflet default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to dynamically update map center
const MapUpdater = ({ center }) => {
  const map = useMap();
  const prevCenterRef = React.useRef(null);
  
  useEffect(() => {
    if (!center) return;
    const [lat, lng] = center;
    if (prevCenterRef.current && prevCenterRef.current[0] === lat && prevCenterRef.current[1] === lng) {
      return;
    }
    prevCenterRef.current = center;
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const MapView = ({ users }) => {
  const { location, sendRequest } = useAppContext();

  if (!location) return <div className="panel" style={{ textAlign: 'center' }}>Loading map...</div>;

  return (
    <div style={{ height: '400px', width: '100%', borderRadius: 'var(--border-radius)', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
      <MapContainer 
        center={[location.lat, location.lng]} 
        zoom={14} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <MapUpdater center={[location.lat, location.lng]} />
        
        {/* Current User Marker */}
        <Marker position={[location.lat, location.lng]}>
          <Popup>You are here</Popup>
        </Marker>

        {/* Nearby Users Markers */}
        {users.map(user => {
          if (!user.location) return null;
          return (
            <Marker key={user.id} position={[user.location.lat, user.location.lng]}>
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <img src={user.avatar} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', marginBottom: '0.5rem' }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>{user.name}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{user.bio}</p>
                  <button 
                    className="btn btn-primary" 
                    style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', marginTop: '0.5rem', width: '100%' }}
                    onClick={() => sendRequest(user, 'Casual Hangout')}
                  >
                    Connect
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;
