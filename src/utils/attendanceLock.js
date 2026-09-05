/**
 * Attendance Auto-Lock Utilities
 * 
 * Rule: When a tag is marked arrived (គ្រីសមកដល់), after 5 minutes it is auto-locked.
 * Only Admin or Owner can uncheck (ដកគ្រីស) a locked tag.
 * Regular users / Assistants can only uncheck within the first 5 minutes (grace period).
 */

import { westernToKhmerDigits } from './khmerSearch.js';

export const AUTO_LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Check if a single tag or grouped tag is auto-locked (arrived >= 5 minutes ago)
 * @param {Object} tag 
 * @returns {boolean}
 */
export function isTagAttendanceLocked(tag) {
  if (!tag) return false;

  // If this is a grouped tag container with sub-tags
  if (tag.tags && tag.tags.length > 0) {
    const arrivedSubTags = tag.tags.filter((t) => !!t.arrived);
    if (arrivedSubTags.length === 0) return false;
    // If any arrived sub-tag is locked, the group uncheck is considered locked
    return arrivedSubTags.some((t) => isSingleTagLocked(t));
  }

  return isSingleTagLocked(tag);
}

/**
 * Check if an individual tag is locked
 * @param {Object} tag 
 * @returns {boolean}
 */
export function isSingleTagLocked(tag) {
  if (!tag || !tag.arrived) return false;
  if (!tag.arrivedAt) return true; // Arrived previously without timestamp -> locked

  const arrivedTime = new Date(tag.arrivedAt).getTime();
  if (isNaN(arrivedTime)) return true;

  const elapsed = Date.now() - arrivedTime;
  return elapsed >= AUTO_LOCK_DURATION_MS;
}

/**
 * Get remaining grace period in seconds before auto-lock takes effect
 * @param {Object} tag 
 * @returns {number} seconds remaining (0 if already locked or not arrived)
 */
export function getRemainingLockSeconds(tag) {
  if (!tag || !tag.arrived) return 0;
  
  // For group tags, get the minimum remaining time among arrived sub-tags
  if (tag.tags && tag.tags.length > 0) {
    const arrivedSubTags = tag.tags.filter((t) => !!t.arrived);
    if (arrivedSubTags.length === 0) return 0;
    const remainingList = arrivedSubTags.map((t) => getSingleRemainingSeconds(t));
    return Math.min(...remainingList);
  }

  return getSingleRemainingSeconds(tag);
}

function getSingleRemainingSeconds(tag) {
  if (!tag || !tag.arrived || !tag.arrivedAt) return 0;
  const arrivedTime = new Date(tag.arrivedAt).getTime();
  if (isNaN(arrivedTime)) return 0;

  const elapsed = Date.now() - arrivedTime;
  if (elapsed >= AUTO_LOCK_DURATION_MS) return 0;

  return Math.max(0, Math.floor((AUTO_LOCK_DURATION_MS - elapsed) / 1000));
}

/**
 * Format remaining seconds to Khmer string (e.g. "៤:២៥ នាទី")
 * @param {number} totalSeconds 
 * @returns {string}
 */
export function formatRemainingTimeKhmer(totalSeconds) {
  if (totalSeconds <= 0) return '';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const minsStr = westernToKhmerDigits(mins);
  const secsStr = westernToKhmerDigits(String(secs).padStart(2, '0'));
  return `${minsStr}:${secsStr} នាទី`;
}

/**
 * Verify if current user has permission to uncheck/toggle attendance
 * @param {Object} tag 
 * @param {Object} currentUser 
 * @returns {{ canToggle: boolean, isLocked: boolean, isAdminOrOwner: boolean, reason?: string }}
 */
export function checkAttendanceTogglePermission(tag, currentUser) {
  const role = currentUser?.role || 'guest';
  const isAdminOrOwner = role === 'owner' || role === 'admin';

  if (role === 'guest') {
    return {
      canToggle: false,
      isLocked: false,
      isAdminOrOwner: false,
      reason: 'សិទ្ធិ Guest អាចមើល និងស្វែងរកប៉ុណ្ណោះ! មិនអាចគ្រីសមកដល់បានទេ (សម្រាប់តែក្រុមការងារ)'
    };
  }

  const isLocked = isTagAttendanceLocked(tag);

  // If tag is already arrived and locked, only Admin or Owner can uncheck
  const isArrived = !!tag?.arrived;
  if (isArrived && isLocked && !isAdminOrOwner) {
    const tagDisplay = tag.tagNumberDisplay || westernToKhmerDigits(tag.tagNumber) || '';
    const tagName = tag.name || '';
    return {
      canToggle: false,
      isLocked: true,
      isAdminOrOwner: false,
      reason: `🔒 មិនអាចដកគ្រីសបានទេ!\n\nស្លាកលេខ ${tagDisplay ? '#' + tagDisplay : ''} ${tagName ? `(${tagName})` : ''} នេះត្រូវបានចាក់សោស្វ័យប្រវត្តិ (Lock Auto លើសពី ៥ នាទី)។\n\nមានតែ Admin ឬ Owner ប៉ុណ្ណោះដែលអាចដកគ្រីសបាន!\nប្រសិនបើចង់ដោះវិញ សូមទាក់ទង Admin ឱ្យជួយដោះជូន។`
    };
  }

  return {
    canToggle: true,
    isLocked,
    isAdminOrOwner
  };
}
