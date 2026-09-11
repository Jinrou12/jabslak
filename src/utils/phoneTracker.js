/**
 * Phone Live GPS & Motion Detection Tracker with 2-Point JPEG Georeferencing
 * 
 * Automatically detects:
 * - "🚶‍♂️ កំពុងដើរ" (Walking / Moving)
 * - "🧍 នៅស្ងៀម" (Stationary / Standing still)
 * 
 * Real-time Georeferencing:
 * Converts satellite GPS (Latitude, Longitude) into percentage coordinates (X%, Y%)
 * on the static aerial JPEG temple map, while preserving manual spot positioning (Hybrid).
 */

import { saveUserLiveLocation, deleteUserLiveLocation, subscribeToGpsCalibration } from './firebase';
import { gpsToMapCoords, getNearestLandmark, DEFAULT_KHEMAVAN_CALIBRATION } from './geoCalibrator.js';
import { getDeviceId, getLastDeviceUserId, setLastDeviceUserId } from './storage.js';

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
    this.calibrationUnsub = null;
    this.listeners = new Set();
    this.initialLockListeners = new Set();
    this.hasInitialLocationLock = false;
    this.initialLockData = null;
    this.filteredLat = null;
    this.filteredLon = null;
    this.acquiredFixCount = 0;

    this.currentUser = null;
    this.deviceId = getDeviceId();
    this.currentTempleId = 'khemavan';
    this.manualSpot = null; // { name, x, y } (when user manually sets spot)
    this.currentGpsSpot = null; // { name, x, y } (auto-calculated from GPS)
    this.gpsCalibration = DEFAULT_KHEMAVAN_CALIBRATION;

    // State
    this.state = {
      isTracking: false,
      activity: 'stationary', // 'walking' | 'stationary'
      activityText: 'នៅស្ងៀម',
      speedKmh: 0,
      latitude: null,
      longitude: null,
      accuracy: null,
      x: 16.15,
      y: 44.31,
      locationName: 'ធម្មសភា',
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

  onInitialLocationLock(listener) {
    this.initialLockListeners.add(listener);
    if (this.hasInitialLocationLock && this.initialLockData) {
      try {
        listener(this.initialLockData);
      } catch (e) {
        console.error('Initial lock listener error:', e);
      }
    }
    return () => this.initialLockListeners.delete(listener);
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

    // 📱 Device-Centric User Switching:
    // If a different user was previously active on THIS physical device,
    // immediately delete the previous user's live location from Firebase!
    const prevUserId = (this.currentUser && this.currentUser.id !== user.id)
      ? this.currentUser.id
      : getLastDeviceUserId();

    if (prevUserId && prevUserId !== user.id) {
      deleteUserLiveLocation(prevUserId, this.currentTempleId || templeId);
    }
    setLastDeviceUserId(user.id);

    if (this.currentUser?.id !== user.id) {
      this.hasInitialLocationLock = false;
      this.initialLockData = null;
      this.filteredLat = null;
      this.filteredLon = null;
      this.acquiredFixCount = 0;
    }
    this.currentUser = user;
    this.currentTempleId = templeId;
    if (defaultSpot) {
      this.manualSpot = defaultSpot;
      this.state.isManualOverride = true;
      this.state.x = defaultSpot.x;
      this.state.y = defaultSpot.y;
      this.state.locationName = defaultSpot.name;
    }

    // Subscribe to temple GPS calibration from Firebase
    if (!this.calibrationUnsub) {
      this.calibrationUnsub = subscribeToGpsCalibration((cal) => {
        if (cal && cal.p1 && cal.p2) {
          this.gpsCalibration = cal;
          // Re-project if we already have GPS coordinates
          if (this.state.latitude != null && this.state.longitude != null) {
            const mapped = gpsToMapCoords(this.state.latitude, this.state.longitude, this.gpsCalibration);
            if (mapped) {
              const landmark = getNearestLandmark(mapped.x, mapped.y);
              this.currentGpsSpot = { x: mapped.x, y: mapped.y, name: landmark.name };
              if (!this.manualSpot) {
                this.state.x = mapped.x;
                this.state.y = mapped.y;
                this.state.locationName = landmark.name;
              }
              this.notify();
            }
          }
        }
      }, templeId);
    }

    if (this.isActive) {
      this.notify();
      return;
    }

    this.isActive = true;
    this.state.isTracking = true;
    this.state.error = null;

    // 1. Geolocation watch (Satellite GPS)
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        // Fast initial position acquisition
        navigator.geolocation.getCurrentPosition(
          (pos) => this.handleGeoPosition(pos, true),
          (err) => {
            console.warn('Initial geolocation check:', err.message);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000
          }
        );

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

    // Clean up current user live location when tracking stops
    if (this.currentUser?.id && this.currentUser.role !== 'guest') {
      deleteUserLiveLocation(this.currentUser.id, this.currentTempleId);
    }

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

    if (this.calibrationUnsub) {
      this.calibrationUnsub();
      this.calibrationUnsub = null;
    }

    this.filteredLat = null;
    this.filteredLon = null;
    this.acquiredFixCount = 0;

    this.notify();
  }

  /**
   * Set user assigned spot manually (click on map or choose building)
   */
  setCurrentSpot(spot) {
    this.manualSpot = spot;
    this.state.isManualOverride = true;
    if (spot) {
      this.state.x = spot.x;
      this.state.y = spot.y;
      this.state.locationName = spot.name;
    }
    this.notify();
    this.syncToFirebase(true);
  }

  /**
   * Switch back to Auto-GPS mode
   */
  resetToAutoGps() {
    this.manualSpot = null;
    this.state.isManualOverride = false;
    if (this.state.latitude != null && this.state.longitude != null) {
      const mapped = gpsToMapCoords(this.state.latitude, this.state.longitude, this.gpsCalibration);
      if (mapped) {
        const landmark = getNearestLandmark(mapped.x, mapped.y);
        this.currentGpsSpot = { x: mapped.x, y: mapped.y, name: landmark.name };
        this.state.x = mapped.x;
        this.state.y = mapped.y;
        this.state.locationName = landmark.name;
      }
    }
    this.notify();
    this.syncToFirebase(true);
  }

  /**
   * Manually trigger location request & camera glide to current GPS spot
   */
  requestLocationPermissionAndCenter() {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      alert('ឧបករណ៍របស់អ្នកមិនគាំទ្រ Geolocation/GPS ទេ!');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.handleGeoPosition(pos, true);
        const mapped = gpsToMapCoords(pos.coords.latitude, pos.coords.longitude, this.gpsCalibration);
        const landmark = mapped ? getNearestLandmark(mapped.x, mapped.y) : null;
        const spot = {
          x: mapped ? mapped.x : this.state.x,
          y: mapped ? mapped.y : this.state.y,
          locationName: landmark ? landmark.name : this.state.locationName,
          name: landmark ? landmark.name : this.state.locationName,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          user: this.currentUser,
          forceFly: true,
          timestamp: Date.now()
        };
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('phone-location-allowed', {
            detail: { spot, user: this.currentUser, forceFly: true }
          }));
        }
      },
      (err) => {
        console.warn('Geolocation permission error:', err);
        if (err.code === 1) {
          alert('សូមបើកសិទ្ធិ Location (Allow Location Access) ក្នុងកម្មវិធីរុករក (Browser) ដើម្បីអាចដៅទីតាំងផ្ទាល់ខ្លួនបាន!');
        } else {
          alert('មិនអាចចាប់សញ្ញា GPS បានទេ! សូមសាកល្បងម្តងទៀតនៅទីវាល ឬបើក GPS ទូរស័ព្ទ។');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  /**
   * Update active GPS calibration
   */
  setGpsCalibration(cal) {
    if (!cal) return;
    this.gpsCalibration = cal;
    if (this.state.latitude != null && this.state.longitude != null) {
      const mapped = gpsToMapCoords(this.state.latitude, this.state.longitude, this.gpsCalibration);
      if (mapped) {
        const landmark = getNearestLandmark(mapped.x, mapped.y);
        this.currentGpsSpot = { x: mapped.x, y: mapped.y, name: landmark.name };
        if (!this.manualSpot) {
          this.state.x = mapped.x;
          this.state.y = mapped.y;
          this.state.locationName = landmark.name;
        }
        this.notify();
        this.syncToFirebase(true);
      }
    }
  }

  /**
   * Handle incoming GPS coordinates
   */
  handleGeoPosition(pos) {
    if (!pos || !pos.coords) return;
    const { latitude, longitude, accuracy, speed } = pos.coords;
    const now = Date.now();
    const acc = typeof accuracy === 'number' && !isNaN(accuracy) ? accuracy : 999;
    this.acquiredFixCount = (this.acquiredFixCount || 0) + 1;

    // 1. Initial Accuracy Gate (Prevents wild jumping during GPS cold start)
    // Mobile browsers often start with cached/cell tower location with accuracy 40m - 500m.
    // We skip wildly inaccurate initial readings to let true satellite GPS settle (with a 4-attempt fallback for indoors).
    if (!this.hasInitialLocationLock && acc > 35 && this.acquiredFixCount < 4) {
      return;
    }

    let calculatedSpeedKmh = 0;
    let hasMoved = false;

    if (speed != null && !isNaN(speed) && speed > 0) {
      calculatedSpeedKmh = speed * 3.6; // convert m/s to km/h
      if (calculatedSpeedKmh > 1.2) {
        hasMoved = true;
      }
    } else if (this.prevPosition) {
      const distMeters = getHaversineDistanceMeters(
        this.prevPosition.latitude,
        this.prevPosition.longitude,
        latitude,
        longitude
      );
      const timeSec = (now - this.prevPosition.time) / 1000;
      if (timeSec > 0.5) {
        const estSpeedMs = distMeters / timeSec;
        calculatedSpeedKmh = estSpeedMs * 3.6;
        if (distMeters > 4.0 && calculatedSpeedKmh > 1.2 && calculatedSpeedKmh < 25) {
          hasMoved = true;
        }
      }
    }

    // 2. Kalman / Low-Pass Filter (EMA) & Stationary Deadband
    let effectiveLat = latitude;
    let effectiveLon = longitude;

    if (this.filteredLat == null || this.filteredLon == null) {
      this.filteredLat = latitude;
      this.filteredLon = longitude;
    } else {
      const distFromFiltered = getHaversineDistanceMeters(
        this.filteredLat,
        this.filteredLon,
        latitude,
        longitude
      );

      // Deadband: when stationary and displacement is within GPS noise threshold (< 6.5m),
      // DO NOT shift coordinates! Lock the pin solidly in place to eliminate jitter!
      if (!hasMoved && distFromFiltered < 6.5) {
        effectiveLat = this.filteredLat;
        effectiveLon = this.filteredLon;
      } else {
        // Adaptive smoothing: responsive when moving, stable when slow
        const alpha = hasMoved ? 0.55 : 0.25;
        this.filteredLat = this.filteredLat * (1 - alpha) + latitude * alpha;
        this.filteredLon = this.filteredLon * (1 - alpha) + longitude * alpha;
        effectiveLat = this.filteredLat;
        effectiveLon = this.filteredLon;
      }
    }

    this.prevPosition = { latitude, longitude, time: now };

    // 🛰️ Georeferencing: Map smoothed real GPS (lat, lon) -> JPEG map percentage (x%, y%)
    const mapped = gpsToMapCoords(effectiveLat, effectiveLon, this.gpsCalibration);
    let landmark = null;
    if (mapped) {
      landmark = getNearestLandmark(mapped.x, mapped.y);
      this.currentGpsSpot = { x: mapped.x, y: mapped.y, name: landmark.name };
      if (!this.manualSpot) {
        this.state.x = mapped.x;
        this.state.y = mapped.y;
        this.state.locationName = landmark.name;
      }
    }

    // 🎯 Initial Location Permission Granted & Lock Notification
    if (!this.hasInitialLocationLock) {
      this.hasInitialLocationLock = true;
      const spotData = {
        x: mapped ? mapped.x : this.state.x,
        y: mapped ? mapped.y : this.state.y,
        locationName: landmark ? landmark.name : this.state.locationName,
        name: landmark ? landmark.name : this.state.locationName,
        latitude: effectiveLat,
        longitude: effectiveLon,
        accuracy,
        user: this.currentUser,
        timestamp: Date.now()
      };
      this.initialLockData = spotData;
      this.initialLockListeners.forEach((fn) => {
        try { fn(spotData); } catch (e) { console.error('Initial lock listener error:', e); }
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('phone-location-allowed', {
          detail: { spot: spotData, user: this.currentUser }
        }));
      }
    }

    if (!this.state.isManualOverride) {
      const isWalking = hasMoved || this.checkMotionSensorWalking();
      this.updateActivityState(isWalking, calculatedSpeedKmh, effectiveLat, effectiveLon, accuracy);
    } else {
      this.state.latitude = effectiveLat;
      this.state.longitude = effectiveLon;
      if (accuracy != null) this.state.accuracy = accuracy;
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

    if (this.recentAccelerations.length > 30) {
      this.recentAccelerations.shift();
    }

    if (this.recentAccelerations.length >= 10) {
      const avg = this.recentAccelerations.reduce((s, a) => s + a.mag, 0) / this.recentAccelerations.length;
      const variance = this.recentAccelerations.reduce((s, a) => s + Math.pow(a.mag - avg, 2), 0) / this.recentAccelerations.length;
      this.state.motionVariance = parseFloat(variance.toFixed(2));
    }
  }

  checkMotionSensorWalking() {
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
      if (prevActivity === 'walking') {
        this.state.stationarySince = now;
      }
      this.state.activity = 'stationary';
      this.state.activityText = 'នៅស្ងៀម';
      this.state.speedKmh = 0;
    }

    this.notify();

    // Fast sync on state transition
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
      this.state.stationarySince = now - 180000;
    }

    this.notify();
    this.syncToFirebase(true);
  }

  /**
   * Sync location and motion state to Firebase
   */
  async syncToFirebase(force = false) {
    if (!this.currentUser || !this.currentUser.id) return;
    // Regular users / guests are never tracked
    if (
      this.currentUser.role === 'guest' ||
      this.currentUser.role === 'user' ||
      this.currentUser.id === 'u-guest' ||
      String(this.currentUser.name || '').includes('អ្នកមើលធម្មតា')
    ) {
      return;
    }

    const now = Date.now();
    const isManual = Boolean(this.manualSpot);
    const activeSpot = this.manualSpot || this.currentGpsSpot || {
      name: this.currentUser.assignedZone || 'វត្តខេមវ័ន',
      x: 16.15,
      y: 44.31
    };

    const stationaryMinutes = this.state.activity === 'stationary'
      ? Math.max(0, Math.floor((now - this.state.stationarySince) / 60000))
      : 0;

    const payload = {
      deviceId: this.deviceId,
      userId: this.currentUser.id,
      userName: this.currentUser.name || this.currentUser.username || 'ក្រុមការងារ',
      role: this.currentUser.role || 'assistant',
      phone: this.currentUser.phone || '',
      assignedZone: this.currentUser.assignedZone || '',
      locationName: activeSpot.name || this.currentUser.assignedZone || 'ទីតាំងលើ Map',
      x: activeSpot.x != null ? activeSpot.x : 16.15,
      y: activeSpot.y != null ? activeSpot.y : 44.31,
      activity: this.state.activity,
      activityText: this.state.activityText,
      speedKmh: this.state.speedKmh,
      stationaryMinutes: stationaryMinutes,
      latitude: this.state.latitude,
      longitude: this.state.longitude,
      accuracy: this.state.accuracy,
      isAutoGps: !isManual,
      lastSyncAt: new Date().toISOString()
    };

    const json = JSON.stringify({
      u: payload.userId,
      act: payload.activity,
      spd: payload.speedKmh,
      min: payload.stationaryMinutes,
      loc: payload.locationName,
      x: payload.x,
      y: payload.y,
      lat: payload.latitude,
      lon: payload.longitude
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
