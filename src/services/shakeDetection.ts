export class ShakeDetectionService {
  private static instance: ShakeDetectionService;
  private threshold: number;
  private lastX: number;
  private lastY: number;
  private lastZ: number;
  private lastUpdate: number;
  private shakeCallback: (() => void) | null;

  private constructor() {
    this.threshold = 15;
    this.lastX = 0;
    this.lastY = 0;
    this.lastZ = 0;
    this.lastUpdate = 0;
    this.shakeCallback = null;
  }

  public static getInstance(): ShakeDetectionService {
    if (!ShakeDetectionService.instance) {
      ShakeDetectionService.instance = new ShakeDetectionService();
    }
    return ShakeDetectionService.instance;
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        return permission === 'granted';
      } catch (err) {
        console.error('Device motion permission request failed:', err);
        return false;
      }
    } else {
      // Non-iOS devices don't require permission
      return true;
    }
  }

  public startListening(callback: () => void): void {
    this.shakeCallback = callback;
    window.addEventListener('devicemotion', this.handleMotionEvent.bind(this));
  }

  public stopListening(): void {
    window.removeEventListener('devicemotion', this.handleMotionEvent.bind(this));
    this.shakeCallback = null;
  }

  private handleMotionEvent(event: DeviceMotionEvent): void {
    if (!event.accelerationIncludingGravity) return;

    const acceleration = event.accelerationIncludingGravity;
    const currentTime = new Date().getTime();

    if ((currentTime - this.lastUpdate) > 100) {
      const diffTime = (currentTime - this.lastUpdate);
      this.lastUpdate = currentTime;

      const x = acceleration.x || 0;
      const y = acceleration.y || 0;
      const z = acceleration.z || 0;

      const speed = Math.abs(x + y + z - this.lastX - this.lastY - this.lastZ) / diffTime * 10000;

      if (speed > this.threshold) {
        console.log('Shake detected!');
        if (this.shakeCallback) {
          this.shakeCallback();
        }
      }

      this.lastX = x;
      this.lastY = y;
      this.lastZ = z;
    }
  }
}

export const shakeDetectionService = ShakeDetectionService.getInstance();