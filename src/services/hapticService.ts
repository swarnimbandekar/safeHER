export class HapticService {
  private static instance: HapticService;

  private constructor() {}

  public static getInstance(): HapticService {
    if (!HapticService.instance) {
      HapticService.instance = new HapticService();
    }
    return HapticService.instance;
  }

  public triggerSOSVibration(): void {
    // Check if vibration API is available
    if ('vibrate' in navigator) {
      try {
        // Pattern: [vibrate ms, pause ms, vibrate ms, pause ms, ...]
        navigator.vibrate([200, 100, 200, 100, 200]);
      } catch (error) {
        console.warn('Vibration not supported or failed:', error);
      }
    } else {
      console.warn('Vibration API not supported');
    }
  }

  public triggerConfirmationVibration(): void {
    // Check if vibration API is available
    if ('vibrate' in navigator) {
      try {
        // Simple short vibration for confirmation
        navigator.vibrate(200);
      } catch (error) {
        console.warn('Vibration not supported or failed:', error);
      }
    } else {
      console.warn('Vibration API not supported');
    }
  }
}

export const hapticService = HapticService.getInstance();