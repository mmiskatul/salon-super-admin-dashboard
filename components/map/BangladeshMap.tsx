'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  Compass,
  Layers,
  MapPin,
  Store,
  Scissors,
  Users,
  AlertTriangle,
  ChevronDown,
  Navigation,
} from 'lucide-react';
import type { MapData } from '@/lib/api/insights';
import 'leaflet/dist/leaflet.css';

// Dynamically import Leaflet only on the client
let L: typeof import('leaflet');
if (typeof window !== 'undefined') {
  L = require('leaflet');
}

export interface QuickArea {
  id: string;
  name: string;
  division: string;
  lat: number;
  lng: number;
  zoom: number;
}

export const BANGLADESH_AREAS: QuickArea[] = [
  { id: 'bd_all', name: 'Whole Bangladesh', division: 'National', lat: 23.6850, lng: 90.3563, zoom: 7 },
  { id: 'dhaka_metro', name: 'Dhaka Metropolitan', division: 'Dhaka', lat: 23.8103, lng: 90.4125, zoom: 12 },
  { id: 'dhaka_gulshan', name: 'Gulshan & Banani', division: 'Dhaka', lat: 23.7925, lng: 90.4078, zoom: 14 },
  { id: 'dhaka_dhanmondi', name: 'Dhanmondi', division: 'Dhaka', lat: 23.7461, lng: 90.3742, zoom: 14 },
  { id: 'dhaka_uttara', name: 'Uttara', division: 'Dhaka', lat: 23.8759, lng: 90.3795, zoom: 14 },
  { id: 'dhaka_mirpur', name: 'Mirpur', division: 'Dhaka', lat: 23.8223, lng: 90.3654, zoom: 14 },
  { id: 'chattogram', name: 'Chattogram City', division: 'Chattogram', lat: 22.3569, lng: 91.7832, zoom: 12 },
  { id: 'sylhet', name: 'Sylhet City', division: 'Sylhet', lat: 24.8949, lng: 91.8687, zoom: 13 },
  { id: 'rajshahi', name: 'Rajshahi City', division: 'Rajshahi', lat: 24.3745, lng: 88.6042, zoom: 13 },
  { id: 'khulna', name: 'Khulna City', division: 'Khulna', lat: 22.8456, lng: 89.5403, zoom: 13 },
  { id: 'barishal', name: 'Barishal City', division: 'Barishal', lat: 22.7010, lng: 90.3535, zoom: 13 },
  { id: 'rangpur', name: 'Rangpur City', division: 'Rangpur', lat: 25.7439, lng: 89.2752, zoom: 13 },
  { id: 'mymensingh', name: 'Mymensingh City', division: 'Mymensingh', lat: 24.7471, lng: 90.4203, zoom: 13 },
  { id: 'cumilla', name: 'Cumilla City', division: 'Chattogram', lat: 23.4682, lng: 91.1788, zoom: 13 },
];

// Map API Keys for geospatial supply & demand map
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const CARTO_API_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY || '';
const cartoKeyParam = CARTO_API_KEY ? `?api_key=${CARTO_API_KEY}` : '';

export interface TileProviderSpec {
  name: string;
  url: string;
  attribution: string;
  subdomains?: string[] | string;
  maxZoom?: number;
  tileSize?: number;
  zoomOffset?: number;
}

export const TILE_PROVIDERS: Record<string, TileProviderSpec> = {

  // Mapbox HD options (High-performance vector rasterization)
  mapbox_streets: {
    name: 'Mapbox Streets (Default)',
    url: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
    attribution: '&copy; Mapbox &copy; OpenStreetMap',
    maxZoom: 20,
  },
  mapbox_outdoors: {
    name: 'Mapbox Outdoors',
    url: `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
    attribution: '&copy; Mapbox &copy; OpenStreetMap',
    maxZoom: 20,
  },
  mapbox_satellite: {
    name: 'Mapbox Satellite Hybrid',
    url: `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/256/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
    attribution: '&copy; Mapbox &copy; OpenStreetMap',
    maxZoom: 20,
  },
  mapbox_dark: {
    name: 'Mapbox Dark Mode',
    url: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
    attribution: '&copy; Mapbox &copy; OpenStreetMap',
    maxZoom: 20,
  },


  // Standard Open Providers
  voyager: {
    name: 'CartoDB Voyager (Clean)',
    url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${cartoKeyParam}`,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  },
  streets: {
    name: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    subdomains: 'abc',
    maxZoom: 19,
  },
  dark: {
    name: 'Dark Matter',
    url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${cartoKeyParam}`,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  },
  satellite: {
    name: 'Satellite Terrain',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Sources: Esri, USGS, NOAA',
    maxZoom: 19,
  },
};

const createLeafletTileLayer = (themeKey: string) => {
  const provider = TILE_PROVIDERS[themeKey] || TILE_PROVIDERS.voyager;
  const options: any = {
    attribution: provider.attribution,
    maxZoom: provider.maxZoom ?? 19,
  };
  if (provider.subdomains) options.subdomains = provider.subdomains;
  if (provider.tileSize) options.tileSize = provider.tileSize;
  if (provider.zoomOffset !== undefined) options.zoomOffset = provider.zoomOffset;

  return L.tileLayer(provider.url, options);
};

interface BangladeshMapProps {
  data: MapData;
  activeTarget?: { lat: number; lng: number; zoom?: number; name?: string } | null;
  height?: string;
  onSelectPlace?: (place: MapData['places'][0]) => void;
}

export default function BangladeshMap({
  data,
  activeTarget,
  height = '620px',
  onSelectPlace,
}: BangladeshMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const demandLayerRef = useRef<any>(null);

  // Default to Mapbox if token is present, else Voyager
  const defaultTheme = MAPBOX_TOKEN ? 'mapbox_streets' : 'voyager';
  const [theme, setTheme] = useState<string>(defaultTheme);
  const [showVisible, setShowVisible] = useState(true);
  const [showHidden, setShowHidden] = useState(true);
  const [showDemand, setShowDemand] = useState(true);
  const [showUnserved, setShowUnserved] = useState(true);
  const [selectedArea, setSelectedArea] = useState<string>('bd_all');
  const [currentZoom, setCurrentZoom] = useState<number>(7);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || typeof window === 'undefined' || !L) return;

    if (!mapInstanceRef.current) {
      // Default centered on Bangladesh
      const map = L.map(mapContainerRef.current, {
        center: [23.6850, 90.3563],
        zoom: 7,
        minZoom: 6,
        maxZoom: 19,
        zoomControl: false, // We use custom styled controls
      });

      // Add default tile layer
      const tile = createLeafletTileLayer(defaultTheme).addTo(map);
      tileLayerRef.current = tile;

      const markersGroup = L.layerGroup().addTo(map);
      const demandGroup = L.layerGroup().addTo(map);

      markersLayerRef.current = markersGroup;
      demandLayerRef.current = demandGroup;
      mapInstanceRef.current = map;

      map.on('zoomend', () => {
        setCurrentZoom(map.getZoom());
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when theme changes
  useEffect(() => {
    if (!mapInstanceRef.current || !L) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const newTile = createLeafletTileLayer(theme).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [theme]);

  // Render Markers and Demand Layers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !demandLayerRef.current || !L) return;

    markersLayerRef.current.clearLayers();
    demandLayerRef.current.clearLayers();

    // 1. Render Places (Shops & Barbers)
    data.places.forEach((p) => {
      if (p.listed && !showVisible) return;
      if (!p.listed && !showHidden) return;

      const isShop = p.kind === 'shop';
      const isListed = p.listed;

      const bgColor = isListed ? '#10B981' : '#EF4444';
      const shadowColor = isListed ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';
      const iconSvg = isShop
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></svg>`;

      const customHtml = `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: ${bgColor}; box-shadow: 0 4px 14px ${shadowColor}; display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; transition: transform 0.2s ease;">
            ${iconSvg}
          </div>
          ${isListed ? `<span style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; border-radius: 50%; background-color: #34D399; border: 1.5px solid white;"></span>` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        html: customHtml,
        className: 'custom-salon-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([p.lat, p.lng], { icon: customIcon });

      const linkUrl = isShop ? `/shops/${p.id}` : `/barbers/${p.id}`;
      const statusBadge = isListed
        ? `<span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; background-color: #D1FAE5; color: #065F46;">Visible to Customers</span>`
        : `<span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; background-color: #FEE2E2; color: #991B1B;">Hidden (Incomplete)</span>`;

      const popupHtml = `
        <div style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif; padding: 4px; min-width: 190px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase;">${isShop ? 'Studio / Salon' : 'Independent Stylist'}</span>
            ${statusBadge}
          </div>
          <h4 style="font-size: 14px; font-weight: 800; color: #0F172A; margin: 0 0 6px 0;">${p.name}</h4>
          <p style="font-size: 11px; color: #64748B; margin: 0 0 10px 0;">Coordinates: ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}</p>
          <a href="${linkUrl}" style="display: inline-block; padding: 6px 12px; background-color: #635BFF; color: white; border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none; text-align: center; width: 100%; box-sizing: border-box;">
            View Details & Profile &rarr;
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => onSelectPlace?.(p));
      markersLayerRef.current.addLayer(marker);
    });

    // 2. Render Demand Cells (Saved Addresses Circles)
    if (showDemand) {
      const maxCount = Math.max(1, ...data.demand.map((d) => d.count));

      data.demand.forEach((d) => {
        const radius = Math.min(2400, Math.max(450, 400 + (d.count / maxCount) * 1600));
        const circle = L.circle([d.lat, d.lng], {
          radius,
          color: '#F59E0B',
          fillColor: '#F59E0B',
          fillOpacity: Math.min(0.55, 0.2 + (d.count / maxCount) * 0.35),
          weight: 1.5,
        });

        const nearestText =
          d.nearestListedKm === null
            ? '<b style="color: #EF4444;">No visible studio anywhere</b>'
            : `Nearest visible studio: <b>${d.nearestListedKm} km</b>`;

        circle.bindPopup(`
          <div style="font-family: 'Manrope', sans-serif; padding: 4px;">
            <p style="font-size: 10px; font-weight: 800; color: #D97706; text-transform: uppercase; margin: 0 0 2px 0;">Customer Demand Area</p>
            <h4 style="font-size: 14px; font-weight: 800; color: #1E293B; margin: 0 0 4px 0;">${d.count} Saved Address${d.count === 1 ? '' : 'es'}</h4>
            <p style="font-size: 11px; color: #64748B; margin: 0;">${nearestText}</p>
          </div>
        `);

        demandLayerRef.current.addLayer(circle);
      });
    }

    // 3. Highlight Unserved Opportunity Gaps
    if (showUnserved) {
      data.unservedAreas.forEach((area) => {
        const pingIcon = L.divIcon({
          html: `
            <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
              <span style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background-color: rgba(239, 68, 68, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
              <span style="position: absolute; width: 14px; height: 14px; border-radius: 50%; background-color: #EF4444; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.25);"></span>
            </div>
          `,
          className: 'unserved-gap-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -14],
        });

        const gapMarker = L.marker([area.lat, area.lng], { icon: pingIcon });
        gapMarker.bindPopup(`
          <div style="font-family: 'Manrope', sans-serif; padding: 4px; min-width: 180px;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; background-color: #FEE2E2; color: #991B1B; margin-bottom: 6px;">
              Unserved Expansion Opportunity
            </span>
            <h4 style="font-size: 14px; font-weight: 800; color: #0F172A; margin: 0 0 4px 0;">${area.count} Customers Waiting</h4>
            <p style="font-size: 11px; color: #64748B; margin: 0 0 8px 0;">
              No visible salon within ${area.nearestListedKm ? `${area.nearestListedKm} km` : 'any range'}.
            </p>
            <a href="https://www.google.com/maps?q=${area.lat},${area.lng}" target="_blank" rel="noreferrer" style="font-size: 11px; font-weight: 700; color: #635BFF; text-decoration: underline;">
              View on Google Maps &rarr;
            </a>
          </div>
        `);
        demandLayerRef.current.addLayer(gapMarker);
      });
    }
  }, [data, showVisible, showHidden, showDemand, showUnserved, onSelectPlace]);

  // Handle fly-to active target when user clicks from list/table
  useEffect(() => {
    if (!mapInstanceRef.current || !activeTarget) return;

    mapInstanceRef.current.flyTo([activeTarget.lat, activeTarget.lng], activeTarget.zoom || 15, {
      duration: 1.4,
      easeLinearity: 0.25,
    });
  }, [activeTarget]);

  // Jump to Predefined Bangladesh Region
  const handleJumpToArea = (areaId: string) => {
    setSelectedArea(areaId);
    const target = BANGLADESH_AREAS.find((a) => a.id === areaId);
    if (target && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([target.lat, target.lng], target.zoom, {
        duration: 1.2,
      });
    }
  };

  // Zoom controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetView = () => handleJumpToArea('bd_all');

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm font-manrope">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left Side: Division & City Zoom Dropdown */}
        <div className="flex items-center gap-2 pointer-events-auto bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-[#E2E8F0] shadow-lg">
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-bold text-[#64748B]">
            <Compass className="h-4 w-4 text-[#635BFF]" />
            <span>Zoom Area:</span>
          </div>
          <select
            value={selectedArea}
            onChange={(e) => handleJumpToArea(e.target.value)}
            className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-[12px] font-bold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20"
          >
            <optgroup label="Nationwide">
              <option value="bd_all">Whole Bangladesh</option>
            </optgroup>
            <optgroup label="Dhaka Hubs">
              <option value="dhaka_metro">Dhaka Metropolitan</option>
              <option value="dhaka_gulshan">Gulshan & Banani</option>
              <option value="dhaka_dhanmondi">Dhanmondi</option>
              <option value="dhaka_uttara">Uttara</option>
              <option value="dhaka_mirpur">Mirpur</option>
            </optgroup>
            <optgroup label="Major Divisions & Districts">
              <option value="chattogram">Chattogram (Chittagong)</option>
              <option value="sylhet">Sylhet</option>
              <option value="rajshahi">Rajshahi</option>
              <option value="khulna">Khulna</option>
              <option value="barishal">Barishal</option>
              <option value="rangpur">Rangpur</option>
              <option value="mymensingh">Mymensingh</option>
              <option value="cumilla">Cumilla</option>
            </optgroup>
          </select>

          {/* Quick Dhaka Button */}
          <button
            type="button"
            onClick={() => handleJumpToArea('dhaka_metro')}
            className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-indigo-50 text-[#635BFF] hover:bg-indigo-100 transition-colors"
          >
            Dhaka
          </button>
          {/* Quick Reset Button */}
          <button
            type="button"
            onClick={handleResetView}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            All BD
          </button>
        </div>

        {/* Right Side: Map Theme & Layer Toggles */}
        <div className="flex items-center gap-2 pointer-events-auto bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-[#E2E8F0] shadow-lg">
          {/* Tile Layer Selector */}
          <div className="flex items-center gap-1.5 border-r border-[#E2E8F0] pr-2.5 mr-1">
            <Layers className="h-4 w-4 text-[#635BFF] ml-1" />
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="rounded-lg border-none bg-transparent text-[11px] font-extrabold text-[#1E293B] focus:outline-none cursor-pointer"
            >
              <optgroup label="Mapbox HD (Active)">
                <option value="mapbox_streets">Mapbox Streets (Default)</option>
                <option value="mapbox_outdoors">Mapbox Outdoors</option>
                <option value="mapbox_satellite">Mapbox Satellite Hybrid</option>
                <option value="mapbox_dark">Mapbox Dark</option>
              </optgroup>

              <optgroup label="Open Providers">
                <option value="voyager">CartoDB Voyager (Clean)</option>
                <option value="streets">OpenStreetMap Standard</option>
                <option value="dark">Dark Matter</option>
                <option value="satellite">Esri Satellite</option>
              </optgroup>
            </select>

            {MAPBOX_TOKEN && (
              <span className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <span className="h-1.5 w-1.5 rounded-full bg-[#635BFF] animate-pulse" />
                Mapbox Active
              </span>
            )}
          </div>

          {/* Layer Visibility Pills */}
          <button
            type="button"
            onClick={() => setShowVisible(!showVisible)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
              showVisible
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live ({data.totals.listed})
          </button>

          <button
            type="button"
            onClick={() => setShowHidden(!showHidden)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
              showHidden
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Hidden ({data.totals.places - data.totals.listed})
          </button>

          <button
            type="button"
            onClick={() => setShowDemand(!showDemand)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
              showDemand
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Customers ({data.totals.savedAddresses})
          </button>

          <button
            type="button"
            onClick={() => setShowUnserved(!showUnserved)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
              showUnserved
                ? 'bg-red-50 text-red-700 border border-red-300'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <AlertTriangle className="h-3 w-3 text-red-500" />
            Gaps ({data.unservedAreas.length})
          </button>
        </div>
      </div>

      {/* Actual Leaflet Map Canvas */}
      <div
        ref={mapContainerRef}
        style={{ height, width: '100%', zIndex: 1 }}
        className="w-full bg-[#F1F5F9]"
      />

      {/* Floating Bottom Left: Zoom Controls & Coords */}
      <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-2 pointer-events-auto bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#E2E8F0] shadow-md text-[11px] font-bold text-[#64748B]">
        <span>Zoom: {currentZoom}x</span>
        <span>·</span>
        <span>
          {theme.startsWith('mapbox')
            ? 'Mapbox Vector Tiles HD'
            : 'OpenStreetMap / CartoDB'}
        </span>
      </div>

      {/* Floating Bottom Right: Navigation Controls */}
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-1.5 pointer-events-auto bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-[#E2E8F0] shadow-lg">
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 rounded-xl hover:bg-slate-100 text-[#1E293B] transition-colors"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 rounded-xl hover:bg-slate-100 text-[#1E293B] transition-colors"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleResetView}
          title="Reset Whole Country View"
          className="p-2 rounded-xl hover:bg-slate-100 text-[#635BFF] transition-colors"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
