/**
 * Safe, cross-browser clipboard copy with legacy fallback.
 * Reliable on Desktop, Android Chrome, and iOS Safari webviews.
 */
export async function copyToClipboard(text) {
  if (!text) return false;

  // 1. Try modern async Clipboard API if available
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback to execCommand if modern clipboard is blocked by permission or context
    }
  }

  // 2. Fallback to execCommand('copy')
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback copy to clipboard failed:', err);
    return false;
  }
}
