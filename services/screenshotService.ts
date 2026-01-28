
import html2canvas from 'html2canvas';
import { APP_CONFIG } from '../constants';

/**
 * Captures a visual snapshot of the entire application page.
 * Optimized for low payload size to avoid 413 "Payload Too Large" and network timeouts.
 * Uses JPEG at 0.3 quality to ensure the base64 string remains compact.
 */
export async function captureAndUploadScreenshot(
  sessionId: string
): Promise<boolean> {
  const root = document.getElementById('root') || document.body;
  const uploadUrl = `${APP_CONFIG.SIGNALLING_URL}/api/screenshots/upload`;
  
  console.debug(`[ScreenshotService] Capturing Snapshot for ${sessionId}...`);

  try {
    // 1. Capture the visual DOM snapshot
    // Scale reduced to 0.4 to ensure the payload is small enough for cloud proxies
    const canvas = await html2canvas(root, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0a0a0a',
      logging: false,
      scale: 0.4, 
      imageTimeout: 5000,
    });

    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    // 2. Overlay live video frames
    const videos = document.querySelectorAll('video');
    const rootRect = root.getBoundingClientRect();

    videos.forEach((video) => {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        const rect = video.getBoundingClientRect();
        const offsetX = (rect.left - rootRect.left) * 0.4; 
        const offsetY = (rect.top - rootRect.top) * 0.4;
        const targetW = rect.width * 0.4;
        const targetH = rect.height * 0.4;

        try {
          ctx.drawImage(video, offsetX, offsetY, targetW, targetH);
        } catch (e) {
          console.warn('[ScreenshotService] Video overlay failed:', e);
        }
      }
    });

    // 3. Export as JPEG with low quality (0.3)
    const imageData = canvas.toDataURL('image/jpeg', 0.3); 

    // 4. Send to backend with a controlled timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const response = await fetch(uploadUrl, {
      method: 'POST',
      mode: 'cors',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sessionId,
        timestamp: Date.now(),
        imageData
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type");
    if (response.ok && contentType && contentType.includes("application/json")) {
      await response.json();
      console.debug(`[ScreenshotService] Snapshot uploaded successfully to ${uploadUrl}.`);
      return true;
    } else {
      const text = await response.text();
      console.error(`[ScreenshotService] Server Error (${response.status}) at ${uploadUrl}. Preview: ${text.substring(0, 100)}`);
      return false;
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`[ScreenshotService] Upload to ${uploadUrl} timed out.`);
    } else {
      console.error(`[ScreenshotService] Snapshot Error: ${error.message}. Target URL: ${uploadUrl}`);
    }
    return false;
  }
}
