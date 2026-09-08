/**
 * Phone Live GPS & Motion Detection Tracker
 * Automatically detects whether the logged-in user is:
 * - "🚶‍♂️ កំពុងដើរ" (Walking / Moving)
 * - "🧍 នៅស្ងៀម" (Stationary / Standing still)
 * Using HTML5 Geolocation API, Accelerometer Motion Sensors, and real-time Firebase sync.
 */

import { saveUserLiveLocation } from './firebase';

// Haversine formula to compute distance between two GPS coordinates in meters
function getHaversineDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

class PhoneTrackerManager {
  constructor() {
    this.isActive = false;
    this.watchId = null;
    this.motionListener = null;
    this.syncIntervalId = null;
    this.listeners = new Set();

    this.currentUser = null;
    this.currentTempleId = 'khemavan';
    this.currentSpot = null; // { name, x, y }

    // State
    this.state = {
      isTracking: false,
      activity: 'stationary', // 'walking' | 'stationary'
      activityText: 'នៅស្ងៀម',
      speedKmh: 0,
      latitude: null,
      longitude: null,
      accuracy: null,
      stationarySince: Date.now(),
      lastMovedAt: Date.now(),
      motionVariance: 0,
      isManualOverride: false,
      lastSyncTime: null,
      error: null
    };

    this.prevPosition = null;
    this.recentAccelerations = [];
    this.lastSyncPayloadJson = '';
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  notify() {
    const currentState = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(currentState);
      } catch (e) {
        console.error('Tracker listener error:', e);
      }
    });
  }

  getState() {
    const now = Date.now();
    const stationaryMinutes = this.state.activity === 'stationary'
      ? Math.max(0, Math.floor((now - this.state.stationarySince) / 60000))
      : 0;

    return {
      ...this.state,
      stationaryMinutes
    };
  }

  /**
   * Start tracking phone GPS & motion
   */
  start({ user, templeId = 'khemavan', defaultSpot = null }) {
    if (!user || !user.id) return;
    this.currentUser = user;
    this.currentTempleId = templeId;
    if (defaultSpot) {
      this.currentSpot = defaultSpot;
    }

    if (this.isActive) {
      this.notify();
      return;
    }

    this.isActive = true;
    this.state.isTracking = true;
    this.state.error = null;

    // 1. Geolocation watch
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        this.watchId = navigator.geolocation.watchPosition(
          (pos) => this.handleGeoPosition(pos),
          (err) => {
            console.warn('Geolocation error / indoor signal:', err.message);
            this.state.error = err.message;
            this.notify();
          },
          {
            enableHighAccuracy: true,
            maximumAge: 3000,
            timeout: 10000
          }
        );
      } catch (e) {
        console.warn('Cannot start geolocation watch:', e);
      }
    }

    // 2. Device accelerometer motion sensor
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      this.motionListener = (event) => this.handleDeviceMotion(event);
      try {
        window.addEventListener('devicemotion', this.motionListener, { passive: true });
      } catch (e) {}
    }

    // 3. Periodic cloud sync (every 4 seconds)
    this.syncIntervalId = setInterval(() => {
      this.syncToFirebase();
    }, 4000);

    this.notify();
    // Initial sync
    this.syncToFirebase(true);
  }

  /**
   * Stop tracking
   */
  stop() {
    this.isActive = false;
    this.state.isTracking = false;

    if (this.watchId != null && typeof navigator !== 'undefined') {
      try {
        navigator.geolocation.clearWatch(this.watchId);
      } catch (e) {}
      this.watchId = null;
    }

    if (this.motionListener && typeof window !== 'undefined') {
      try {
        window.removeEventListener('devicemotion', this.motionListener);
      } catch (e) {}
      this.motionListener = null;
    }

    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }

    this.notify();
  }

  /**
   * Set user assigned spot or location name
   */
  setCurrentSpot(spot) {
    this.currentSpot = spot;
    this.syncToFirebase(true);
  }

  /**
   * Handle incoming GPS coordinates
   */
  handleGeoPosition(pos) {
    if (!pos || !pos.coords) return;
    const { latitude, longitude, accuracy, speed } = pos.coords;
    const now = Date.now();

    let calculatedSpeedKmh = 0;
    let hasMoved = false;

    if (speed != null && !isNaN(speed) && speed > 0) {
      calculatedSpeedKmh = speed * 3.6; // convert m/s to km/h
      if (calculatedSpeedKmh > 1.2) {
        hasMoved = true;
      }
    } else if (this.prevPosition) {
      // Calculate distance from previous position
      const distMeters = getHaversineDistanceMeters(
        this.prevPosition.latitude,
        this.prevPosition.longitude,
        latitude,
        longitude
      );
      const timeSec = (now - this.prevPosition.time) / 1000;
      if (timeSec > 1) {
        const estSpeedMs = distMeters / timeSec;
        calculatedSpeedKmh = estSpeedMs * 3.6;
        // If moved > 2.5 meters in a few seconds, user is walking
        if (distMeters > 2.5 && calculatedSpeedKmh > 1.2 && calculatedSpeedKmh < 25) {
          hasMoved = true;
        }
      }
    }

    this.prevPosition = { latitude, longitude, time: now };

    if (!this.state.isManualOverride) {
      const isWalking = hasMoved || this.checkMotionSensorWalking();
      this.updateActivityState(isWalking, calculatedSpeedKmh, latitude, longitude, accuracy);
    } else {
      this.state.latitude = latitude;
      this.state.longitude = longitude;
      this.state.accuracy = accuracy;
      this.notify();
    }
  }

  /**
   * Handle device motion (accelerometer vibrations from walking footsteps)
   */
  handleDeviceMotion(event) {
    if (!event.acceleration && !event.accelerationIncludingGravity) return;
    const acc = event.acceleration || event.accelerationIncludingGravity;
    const x = acc.x || 0;
    const y = acc.y || 0;
    const z = acc.z || 0;

    const magnitude = Math.sqrt(x * x + y * y + z * z);
    this.recentAccelerations.push({ mag: magnitude, time: Date.now() });

    // Keep last 30 samples (~1-2 seconds of motion)
    if (this.recentAccelerations.length > 30) {
      this.recentAccelerations.shift();
    }

    // Compute variance
    if (this.recentAccelerations.length >= 10) {
      const avg = this.recentAccelerations.reduce((s, a) => s + a.mag, 0) / this.recentAccelerations.length;
      const variance = this.recentAccelerations.reduce((s, a) => s + Math.pow(a.mag - avg, 2), 0) / this.recentAccelerations.length;
      this.state.motionVariance = parseFloat(variance.toFixed(2));
    }
  }

  checkMotionSensorWalking() {
    // Normal walking variance is usually > 0.8
    return this.state.motionVariance > 0.85;
  }

  /**
   * Update internal activity state
   */
  updateActivityState(isWalking, speedKmh, lat = null, lng = null, accuracy = null) {
    const now = Date.now();
    const prevActivity = this.state.activity;

    if (lat != null) this.state.latitude = lat;
    if (lng != null) this.state.longitude = lng;
    if (accuracy != null) this.state.accuracy = accuracy;

    if (isWalking) {
      this.state.activity = 'walking';
      this.state.activityText = 'កំពុងដើរ';
      this.state.speedKmh = parseFloat((speedKmh > 0 ? speedKmh : 3.2).toFixed(1));
      this.state.lastMovedAt = now;
      this.state.stationarySince = now;
    } else {
      // Stationary: check if was walking previously
      if (prevActivity === 'walking') {
        this.state.stationarySince = now;
      }
      this.state.activity = 'stationary';
      this.state.activityText = 'នៅស្ងៀម';
      this.state.speedKmh = 0;
    }

    this.notify();

    // Trigger fast sync on state transition
    if (prevActivity !== this.state.activity) {
      this.syncToFirebase(true);
    }
  }

  /**
   * Manual override for testing (walking vs stationary)
   */
  setManualOverride(activity, customSpeed = null) {
    this.state.isManualOverride = true;
    const now = Date.now();

    if (activity === 'walking') {
      this.state.activity = 'walking';
      this.state.activityText = 'កំពុងដើរ';
      this.state.speedKmh = customSpeed || 3.4;
      this.state.lastMovedAt = now;
      this.state.stationarySince = now;
    } else {
      this.state.activity = 'stationary';
      this.state.activityText = 'នៅស្ងៀម';
      this.state.speedKmh = 0;
      this.state.stationarySince = now - 180000; // pretend standing still for 3 min
    }

    this.notify();
    this.syncToFirebase(true);
  }

  resetToAutoGps() {
    this.state.isManualOverride = false;
    this.notify();
    this.syncToFirebase(true);
  }

  /**
   * Sync location and motion state to Firebase
   */
  async syncToFirebase(force = false) {
    if (!this.currentUser || !this.currentUser.id) return;

    const now = Date.now();
    const spot = this.currentSpot || {};
    const stationaryMinutes = this.state.activity === 'stationary'
      ? Math.max(0, Math.floor((now - this.state.stationarySince) / 60000))
      : 0;

    const payload = {
      userId: this.currentUser.id,
      userName: this.currentUser.name || this.currentUser.username || 'ក្រុមការងារ',
      role: this.currentUser.role || 'assistant',
      phone: this.currentUser.phone || '',
      assignedZone: this.currentUser.assignedZone || 'ផែន១ ៖ ធម្មសភា',
      locationName: spot.name || this.currentUser.assignedZone || 'ធម្មសភា',
      x: spot.x != null ? spot.x : 16.15,
      y: spot.y != null ? spot.y : 44.31,
      activity: this.state.activity,
      activityText: this.state.activityText,
      speedKmh: this.state.speedKmh,
      stationaryMinutes: stationaryMinutes,
      latitude: this.state.latitude,
      longitude: this.state.longitude,
      accuracy: this.state.accuracy,
      isAutoGps: !this.state.isManualOverride,
      lastSyncAt: new Date().toISOString()
    };

    // Deduplicate identical payloads unless forced
    const json = JSON.stringify({
      u: payload.userId,
      act: payload.activity,
      spd: payload.speedKmh,
      min: payload.stationaryMinutes,
      loc: payload.locationName,
      x: payload.x,
      y: payload.y
    });

    if (!force && json === this.lastSyncPayloadJson) {
      return;
    }

    this.lastSyncPayloadJson = json;
    this.state.lastSyncTime = new Date();

    try {
      await saveUserLiveLocation(payload, this.currentTempleId);
    } catch (e) {
      console.warn('Failed to sync live phone location:', e);
    }
  }
}

// Export singleton instance
export const phoneTracker = new PhoneTrackerManager();
