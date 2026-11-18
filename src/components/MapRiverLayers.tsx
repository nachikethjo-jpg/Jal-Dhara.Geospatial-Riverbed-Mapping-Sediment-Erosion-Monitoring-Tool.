import React, { useEffect, useMemo } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { RiverCase, lerpLine, morphT } from '../lib/rivers';

interface MapRiverLayersProps {
  river: RiverCase;
  year: number;
  layers: {
    lost: boolean;
    born: boolean;
    water: boolean;
  };
}

export const MapRiverLayers: React.FC<MapRiverLayersProps> = ({
  river,
  year,
  layers,
}) => {
  const map = useMap();
  const t = morphT(river, year);

  // Compute animated water path
  const waterPath = useMemo(() => {
    return lerpLine(river.lost, river.born, t);
  }, [river, t]);

  useEffect(() => {
    if (!map || typeof google === 'undefined') return;

    const polylines: google.maps.Polyline[] = [];

    // 1. Scars (Old paleochannels)
    river.scars.forEach((scar) => {
      const line = new google.maps.Polyline({
        path: scar.map(([lng, lat]) => ({ lat, lng })),
        strokeColor: '#ea580c',
        strokeOpacity: 0.35,
        strokeWeight: 2,
        map,
      });
      polylines.push(line);
    });

    // 2. Lost Bed (Terracotta / Orange)
    if (layers.lost) {
      const lostLine = new google.maps.Polyline({
        path: river.lost.map(([lng, lat]) => ({ lat, lng })),
        strokeColor: '#f97316',
        strokeOpacity: 0.85,
        strokeWeight: 3.5,
        map,
      });
      polylines.push(lostLine);
    }

    // 3. New Bed / Born Channel (Teal / Cyan)
    if (layers.born) {
      const bornLine = new google.maps.Polyline({
        path: river.born.map(([lng, lat]) => ({ lat, lng })),
        strokeColor: '#14b8a6',
        strokeOpacity: 0.85,
        strokeWeight: 3.5,
        map,
      });
      polylines.push(bornLine);
    }

    // 4. Active Water Thread (White / Bright Cyan)
    if (layers.water) {
      const waterLine = new google.maps.Polyline({
        path: waterPath.map(([lng, lat]) => ({ lat, lng })),
        strokeColor: '#ffffff',
        strokeOpacity: 0.95,
        strokeWeight: 4,
        map,
      });
      polylines.push(waterLine);
    }

    return () => {
      polylines.forEach((p) => p.setMap(null));
    };
  }, [map, river, layers, waterPath]);

  // Smooth camera pan to river bounds/center when river changes
  useEffect(() => {
    if (!map) return;
    map.panTo({ lat: river.view.center[1], lng: river.view.center[0] });
    map.setZoom(river.view.zoom);
  }, [map, river.id]);

  return null;
};
