export class AudioService {
  private static instance: AudioService;
  private audioContext: AudioContext | null = null;

  private constructor() {}

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  public playSOSAlert(): void {
    try {
      const context = this.getAudioContext();
      
      // Create a simple alert sound using oscillators
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Configure the sound
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, context.currentTime); // High pitch
      
      // Configure volume envelope
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
      
      // Play the sound
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.5);
    } catch (error) {
      console.warn('Failed to play alert sound:', error);
    }
  }

  public playSOSConfirmation(): void {
    try {
      const context = this.getAudioContext();
      
      // Create a confirmation sound using oscillators
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Configure the sound
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, context.currentTime); // C5
      
      // Configure volume envelope
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
      
      // Play the sound
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.3);
    } catch (error) {
      console.warn('Failed to play confirmation sound:', error);
    }
  }
}

export const audioService = AudioService.getInstance();