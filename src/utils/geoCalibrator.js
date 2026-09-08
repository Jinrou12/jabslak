/**
 * GeoCalibrator: 2-Point Georeferencing Engine for Static JPEG Temple Drone Maps
 * 
 * Maps real-world satellite GPS coordinates (Latitude, Longitude) onto percentage coordinates
 * (X%, Y%) on a static aerial JPEG image of the temple grounds.
 */

import { INITIAL_TEMPLE_LOCATIONS } from '../data/templeLocations.js';

/**
 * Default calibration for Wat Khemavan (Boeung Snay, Kampong Cham)
 * Based on real mobile GPS coordinates captured on-site (11.984407° N, 105.440369° E).
 * 
 * Image orientation:
 * - Top = North (higher latitude -> smaller Y%)
 * - Bottom = South (lower latitude -> larger Y%)
 * - Left = West (lower longitude -> smaller X%)
 * - Right = East (higher longitude -> larger X%)
 */
export const DEFAULT_KHEMAVAN_CALIBRATION = {
  templeId: 'khemavan',
  p1: {
    name: 'ធម្មសាលាសភា',
    x: 16.15,
    y: 44.31,
    lat: 11.984407,
    lon: 105.440369
  },
  p2: {
    name: 'ព្រះវិហារ',
    x: 37.47,
    y: 54.24,
    lat: 11.984020,
    lon: 105.440850
  },
  updatedAt: '2026-09-08T00:00:00.000Z'
};

/**
 * Clamp a number between min and max
 */
export function clamp(val, min = 2, max = 98) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Convert GPS (Latitude, Longitude) into (X%, Y%) map percentage coordinates
 * using a 2-point georeferenced calibration.
 */
export function gpsToMapCoords(lat, lon, customCalibration = null) {
  if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
    return null;
  }

  const cal = customCalibration && customCalibration.p1 && customCalibration.p2
    ? customCalibration
    : DEFAULT_KHEMAVAN_CALIBRATION;

  const { p1, p2 } = cal;
  const dLon = p2.lon - p1.lon;
  const dLat = p2.lat - p1.lat;
  const dX = p2.x - p1.x;
  const dY = p2.y - p1.y;

  // Safeguard against zero delta
  if (Math.abs(dLon) < 0.000001 || Math.abs(dLat) < 0.000001) {
    return { x: p1.x, y: p1.y };
  }

  const scaleX = dX / dLon;
  const scaleY = dY / dLat;

  const rawX = p1.x + (lon - p1.lon) * scaleX;
  const rawY = p1.y + (lat - p1.lat) * scaleY;

  return {
    x: parseFloat(clamp(rawX).toFixed(2)),
    y: parseFloat(clamp(rawY).toFixed(2))
  };
}

/**
 * Find the nearest temple landmark / building for a given (x%, y%) coordinate
 */
export function getNearestLandmark(x, y, landmarks = INITIAL_TEMPLE_LOCATIONS, maxThreshold = 15) {
  if (x == null || y == null || !Array.isArray(landmarks) || landmarks.length === 0) {
    return { name: 'ទីតាំងលើ Map', landmark: null, distance: 999 };
  }

  let nearest = null;
  let minDist = 9999;

  for (const b of landmarks) {
    if (b.x != null && b.y != null) {
      const dist = Math.hypot(b.x - x, b.y - y);
      if (dist < minDist) {
        minDist = dist;
        nearest = b;
      }
    }
  }

  if (nearest && minDist < maxThreshold) {
    const name = minDist < 4.5 ? nearest.name : `ជិត ${nearest.name}`;
    return { name, landmark: nearest, distance: parseFloat(minDist.toFixed(1)) };
  }

  return { name: 'ទីតាំងលើ Map', landmark: null, distance: parseFloat(minDist.toFixed(1)) };
}
