import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PageLoader, Spinner } from './DesignSystem';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const selectedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function LocationMarker({ position, setPosition }: { position: [number, number] | null; setPosition: (p: [number, number]) => void }) {
  useMapEvents({ click(e) { setPosition([e.latlng.lat, e.latlng.lng]); } });
  return position ? <Marker position={position} icon={selectedIcon} /> : null;
}

function FlyToLocation({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => { if (position) map.flyTo(position, 16, { duration: 1.5 }); }, [position, map]);
  return null;
}

function SearchControl({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number, addr: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchLocation = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      setResults(await res.json()); setShowResults(true);
    } catch {} finally { setSearching(false); }
  };

  const handleSelect = (r: any) => {
    onLocationSelect(parseFloat(r.lat), parseFloat(r.lon), r.display_name);
    setQuery(r.display_name.split(',')[0]); setShowResults(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none' }}>🔍</span>
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchLocation()}
            placeholder="Search location (e.g., Hitech City, Hyderabad)"
            className="ss-input" style={{ paddingLeft: 40 }} />
        </div>
        <button type="button" onClick={searchLocation} disabled={searching} className="ss-btn ss-btn-emerald" style={{ whiteSpace: 'nowrap' }}>
          {searching ? <Spinner size={14} /> : '🔍'} Search
        </button>
      </div>
      {showResults && results.length > 0 && (
        <div className="ap-search-dropdown glass">
          {results.map((r, i) => (
            <button key={i} type="button" onClick={() => handleSelect(r)} className="ap-search-result">
              <p className="ap-search-result-name">{r.display_name.split(',')[0]}</p>
              <p className="ap-search-result-full">{r.display_name}</p>
            </button>
          ))}
        </div>
      )}
      {showResults && results.length === 0 && !searching && (
        <div className="ap-search-dropdown glass" style={{ padding: '14px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No locations found. Try a different search.</p>
        </div>
      )}
    </div>
  );
}

export default function AddProperty() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const editId = searchParams.get('edit');
  const isEditMode = !!editId;

  const [loading, setLoading] = useState(false);
  const [fetchingProperty, setFetchingProperty] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]);

  const [formData, setFormData] = useState({
    name: '', type: 'hostel', address: '', city: '', state: '', pincode: '',
    contactPhone: '', description: '', pricePerMonth: '', totalRooms: '', amenities: [] as string[],
  });

  const amenitiesList = ['WiFi', 'AC', 'Parking', 'Laundry', 'Mess/Food', 'Gym', 'Security', 'CCTV', 'Power Backup', 'Water Supply', 'Attached Bathroom', 'Study Room', 'Common Area'];

  useEffect(() => { if (isEditMode && editId) fetchPropertyData(); }, [editId]);

  const fetchPropertyData = async () => {
    setFetchingProperty(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/accommodations/${editId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.data) {
        const p = data.data;
        setFormData({ name: p.name || '', type: p.type || 'hostel', address: p.address || '', city: p.city || '', state: p.state || '', pincode: p.pincode || '', contactPhone: p.contactPhone || '', description: p.description || '', pricePerMonth: p.pricePerMonth?.toString() || '', totalRooms: p.totalRooms?.toString() || '', amenities: p.amenities || [] });
        if (p.latitude && p.longitude) { const pos: [number, number] = [p.latitude, p.longitude]; setSelectedPosition(pos); setMapCenter(pos); }
      } else setError('Failed to load property data');
    } catch { setError('Error loading property data'); }
    finally { setFetchingProperty(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const toggleAmenity = (a: string) => setFormData(p => ({ ...p, amenities: p.amenities.includes(a) ? p.amenities.filter(x => x !== a) : [...p.amenities, a] }));

  const handleLocationSelect = (lat: number, lng: number, addr: string) => {
    setSelectedPosition([lat, lng]); setMapCenter([lat, lng]);
    const parts = addr.split(',').map(p => p.trim());
    setFormData(p => ({ ...p, address: parts.slice(0, -2).join(', ') || addr, city: p.city || parts[0], state: p.state || parts[parts.length - 2] || '' }));
  };

  const handlePositionChange = async (pos: [number, number]) => {
    setSelectedPosition(pos);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos[0]}&lon=${pos[1]}`);
      const data = await res.json();
      if (data.address) setFormData(p => ({ ...p, address: data.display_name?.split(',').slice(0, 3).join(',') || p.address, city: data.address.city || data.address.town || data.address.village || p.city, state: data.address.state || p.state, pincode: data.address.postcode || p.pincode }));
    } catch {}
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => { const p: [number, number] = [pos.coords.latitude, pos.coords.longitude]; setSelectedPosition(p); setMapCenter(p); await handlePositionChange(p); setGettingLocation(false); },
      () => { alert('Unable to get location.'); setGettingLocation(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!selectedPosition) { setError('Please select a location on the map'); return; }
    if (!formData.name.trim()) { setError('Property name is required'); return; }
    if (!formData.address.trim()) { setError('Address is required'); return; }
    if (!formData.city.trim()) { setError('City is required'); return; }
    if (!formData.description.trim()) { setError('Description is required'); return; }
    if (!formData.totalRooms || parseInt(formData.totalRooms) <= 0) { setError('Total rooms must be greater than 0'); return; }
    if (!formData.pricePerMonth || parseInt(formData.pricePerMonth) <= 0) { setError('Price per month must be greater than 0'); return; }
    if (!formData.contactPhone.trim()) { setError('Contact phone is required'); return; }

    setLoading(true);
    const requestData = { name: formData.name.trim(), address: formData.address.trim(), city: formData.city.trim(), description: formData.description.trim(), totalRooms: parseInt(formData.totalRooms), pricePerMonth: parseInt(formData.pricePerMonth), contactPhone: formData.contactPhone.trim(), amenities: formData.amenities, latitude: selectedPosition[0], longitude: selectedPosition[1], location: { type: 'Point', coordinates: [selectedPosition[1], selectedPosition[0]] } };

    try {
      const token = localStorage.getItem('token');
      const url = isEditMode ? `${API}/api/owner/accommodations/${editId}` : `${API}/api/owner/accommodations`;
      const res = await fetch(url, { method: isEditMode ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(requestData) });
      const data = await res.json();
      if (res.ok && data.success) { setSuccess(true); setTimeout(() => navigate('/owner/dashboard'), 2000); }
      else setError(data.message || `Failed to ${isEditMode ? 'update' : 'add'} property.`);
    } catch { setError('Connection error. Please try again.'); }
    finally { setLoading(false); }
  };

  if (fetchingProperty) return <PageLoader />;

  if (success) return (
    <>
      <style>{CSS}</style>
      <div className="ap-success-page">
        <div className="ap-success-card glass-hi fade-up">
          <div className="ap-success-icon">✓</div>
          <h2 className="ap-success-title">{isEditMode ? 'Property Updated!' : 'Property Added!'}</h2>
          <p className="ap-success-sub">Redirecting to dashboard…</p>
          <Spinner size={28} color="var(--emerald)" />
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="ap-page">

        {/* Header */}
        <header className="ap-header fade-up">
          <div className="ap-header-inner">
            <Link to="/owner/dashboard" className="ap-back-link">← Back to Dashboard</Link>
            <p className="ap-eyebrow">Owner Portal</p>
            <h1 className="ap-title">{isEditMode ? '✏️ Edit Property' : '🏠 Add New Property'}</h1>
            <p className="ap-sub">{isEditMode ? 'Update your property details below' : 'Register your accommodation to start building trust with students'}</p>
          </div>
        </header>

        <div className="ap-body">
          <form onSubmit={handleSubmit} className="ap-form glass fade-up fade-up-2">

            {error && <div className="ss-error" style={{ marginBottom: 24 }}>{error}</div>}
            {isEditMode && <div className="ss-success" style={{ marginBottom: 20 }}>✏️ You are editing an existing property.</div>}

            {/* Section: Basic Info */}
            <div className="ap-section">
              <h2 className="ap-section-title">🏠 Basic Information</h2>
              <div className="ap-grid-2">
                <div className="field-group">
                  <label className="field-label">Property Name *</label>
                  <input name="name" type="text" className="ss-input" placeholder="e.g. Sunshine Hostel" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="field-group">
                  <label className="field-label">Property Type *</label>
                  <select name="type" className="ss-input" value={formData.type} onChange={handleChange} style={{ appearance: 'none', cursor: 'pointer' }}>
                    <option value="hostel">Hostel</option>
                    <option value="pg">PG (Paying Guest)</option>
                    <option value="apartment">Apartment</option>
                    <option value="flat">Flat</option>
                    <option value="room">Single Room</option>
                  </select>
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Description *</label>
                <textarea name="description" className="ss-input ap-textarea" placeholder="Describe your property, facilities, rules, nearby landmarks…" value={formData.description} onChange={handleChange} required />
              </div>
            </div>

            {/* Section: Location + Map */}
            <div className="ap-section">
              <h2 className="ap-section-title">📍 Select Location on Map *</h2>

              <div style={{ marginBottom: 14 }}>
                <SearchControl onLocationSelect={handleLocationSelect} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <button type="button" onClick={getCurrentLocation} disabled={gettingLocation} className="ss-btn ss-btn-ghost" style={{ fontSize: 13 }}>
                  {gettingLocation ? <Spinner size={14} /> : '📍'} Use My Location
                </button>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Or click directly on the map</span>
              </div>

              <div className="ap-map-wrap">
                <MapContainer center={mapCenter} zoom={isEditMode && selectedPosition ? 16 : 5} style={{ height: '380px', width: '100%' }}>
                  <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker position={selectedPosition} setPosition={handlePositionChange} />
                  <FlyToLocation position={selectedPosition} />
                </MapContainer>
              </div>

              {selectedPosition ? (
                <div className="ap-coords-ok">
                  <span style={{ color: 'var(--emerald)' }}>✓</span>
                  <span>Location selected: {selectedPosition[0].toFixed(5)}, {selectedPosition[1].toFixed(5)}</span>
                </div>
              ) : (
                <div className="ap-coords-warn">⚠️ Please select a location on the map by clicking or using search/GPS</div>
              )}

              <div style={{ marginTop: 20 }}>
                <div className="field-group">
                  <label className="field-label">Full Address *</label>
                  <input name="address" type="text" className="ss-input" placeholder="Building name, street, area" value={formData.address} onChange={handleChange} required />
                </div>
                <div className="ap-grid-3">
                  <div className="field-group">
                    <label className="field-label">City *</label>
                    <input name="city" type="text" className="ss-input" placeholder="e.g. Hyderabad" value={formData.city} onChange={handleChange} required />
                  </div>
                  <div className="field-group">
                    <label className="field-label">State</label>
                    <input name="state" type="text" className="ss-input" placeholder="e.g. Telangana" value={formData.state} onChange={handleChange} />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Pincode</label>
                    <input name="pincode" type="text" className="ss-input" placeholder="e.g. 500001" value={formData.pincode} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Contact */}
            <div className="ap-section">
              <h2 className="ap-section-title">📞 Contact Information</h2>
              <div className="field-group">
                <label className="field-label">Contact Phone *</label>
                <input name="contactPhone" type="tel" className="ss-input" placeholder="+91 9876543210" value={formData.contactPhone} onChange={handleChange} required />
              </div>
            </div>

            {/* Section: Pricing */}
            <div className="ap-section">
              <h2 className="ap-section-title">💰 Pricing & Capacity</h2>
              <div className="ap-grid-2">
                <div className="field-group">
                  <label className="field-label">Price Per Month (₹) *</label>
                  <input name="pricePerMonth" type="number" min="1" className="ss-input" placeholder="e.g. 5000" value={formData.pricePerMonth} onChange={handleChange} required />
                </div>
                <div className="field-group">
                  <label className="field-label">Total Rooms *</label>
                  <input name="totalRooms" type="number" min="1" className="ss-input" placeholder="e.g. 20" value={formData.totalRooms} onChange={handleChange} required />
                </div>
              </div>
            </div>

            {/* Section: Amenities */}
            <div className="ap-section">
              <h2 className="ap-section-title">✨ Amenities (Optional)</h2>
              <div className="ap-amenities">
                {amenitiesList.map(a => (
                  <button key={a} type="button" onClick={() => toggleAmenity(a)}
                    className={`ap-amenity-btn ${formData.amenities.includes(a) ? 'ap-amenity-active' : ''}`}>
                    {formData.amenities.includes(a) ? '✓ ' : ''}{a}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" disabled={loading || !selectedPosition} className="ss-btn ss-btn-emerald" style={{ flex: 1 }}>
                {loading ? <Spinner /> : null}
                {loading ? (isEditMode ? 'Updating…' : 'Adding Property…') : (isEditMode ? '✓ Update Property' : '🏠 Add Property')}
              </button>
              <Link to="/owner/dashboard" className="ss-btn ss-btn-ghost" style={{ textDecoration: 'none', padding: '13px 24px' }}>Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

const CSS = `
  .ap-page { min-height: 100vh; background: var(--void); padding-bottom: 80px; }

  /* Success */
  .ap-success-page { min-height: 100vh; background: var(--void); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .ap-success-card { max-width: 400px; width: 100%; padding: 48px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .ap-success-icon { width: 72px; height: 72px; border-radius: 50%; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3); display: flex; align-items: center; justify-content: center; font-size: 28px; color: var(--emerald); }
  .ap-success-title { font-size: 1.6rem; font-weight: 700; color: var(--text-1); letter-spacing: -0.03em; }
  .ap-success-sub { font-size: 13px; color: var(--text-2); }

  /* Header */
  .ap-header {
    background: rgba(5,5,10,0.96); border-bottom: 1px solid var(--border);
    padding: 40px 0 36px; margin-bottom: 40px;
  }
  .ap-header-inner { max-width: 860px; margin: 0 auto; padding: 0 32px; }
  .ap-back-link { display: inline-block; font-size: 12px; font-weight: 600; color: var(--emerald); text-decoration: none; margin-bottom: 20px; transition: color 0.2s; }
  .ap-back-link:hover { color: #34d399; }
  .ap-eyebrow { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: var(--emerald); margin-bottom: 10px; }
  .ap-title { font-size: 2rem; font-weight: 700; letter-spacing: -0.04em; color: var(--text-1); margin-bottom: 6px; }
  .ap-sub { font-size: 13px; color: var(--text-2); }

  /* Body */
  .ap-body { max-width: 860px; margin: 0 auto; padding: 0 32px; }

  /* Form */
  .ap-form { padding: 40px; }

  .ap-section { margin-bottom: 36px; padding-bottom: 36px; border-bottom: 1px solid var(--border); }
  .ap-section:last-of-type { border-bottom: none; margin-bottom: 24px; }
  .ap-section-title { font-size: 15px; font-weight: 700; color: var(--text-1); margin-bottom: 20px; letter-spacing: -0.02em; }

  .ap-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media(max-width: 600px) { .ap-grid-2 { grid-template-columns: 1fr; } }
  .ap-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  @media(max-width: 600px) { .ap-grid-3 { grid-template-columns: 1fr; } }

  .ap-textarea { resize: vertical; min-height: 100px; }
  .field-group { margin-bottom: 16px; }

  /* Map */
  .ap-map-wrap {
    border-radius: var(--r-md); overflow: hidden;
    border: 1px solid var(--border); margin-bottom: 12px;
  }

  .ap-coords-ok {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 14px; border-radius: var(--r-sm);
    background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2);
    font-size: 12px; font-weight: 600; color: var(--text-2);
  }
  .ap-coords-warn {
    padding: 10px 14px; border-radius: var(--r-sm);
    background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);
    font-size: 12px; color: var(--amber);
  }

  /* Search dropdown */
  .ap-search-dropdown {
    position: absolute; z-index: 1000; width: 100%; margin-top: 6px;
    border-radius: var(--r-md); overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  }
  .ap-search-result {
    width: 100%; padding: 12px 16px; text-align: left;
    background: transparent; border: none; cursor: pointer;
    border-bottom: 1px solid var(--border); transition: background 0.15s;
  }
  .ap-search-result:last-child { border-bottom: none; }
  .ap-search-result:hover { background: rgba(255,255,255,0.04); }
  .ap-search-result-name { font-size: 13px; font-weight: 600; color: var(--text-1); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ap-search-result-full { font-size: 11px; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* Amenities */
  .ap-amenities { display: flex; flex-wrap: wrap; gap: 8px; }
  .ap-amenity-btn {
    padding: 8px 16px; border-radius: 100px;
    border: 1px solid var(--border); background: var(--panel);
    cursor: pointer; font-family: var(--font-body); font-size: 12px; font-weight: 600;
    color: var(--text-2); transition: all 0.2s;
  }
  .ap-amenity-btn:hover { border-color: rgba(16,185,129,0.3); color: var(--text-1); }
  .ap-amenity-active {
    border-color: rgba(16,185,129,0.5) !important;
    background: rgba(16,185,129,0.1) !important;
    color: var(--emerald) !important;
  }
`;
