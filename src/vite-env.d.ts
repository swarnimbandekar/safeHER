/// <reference types="vite/client" />

interface DeviceMotionEvent extends Event {
  readonly acceleration: DeviceMotionEventAcceleration | null;
  readonly accelerationIncludingGravity: DeviceMotionEventAcceleration | null;
  readonly rotationRate: DeviceMotionEventRotationRate | null;
  readonly interval: number;
}

interface DeviceMotionEventAcceleration {
  readonly x: number | null;
  readonly y: number | null;
  readonly z: number | null;
}

interface DeviceMotionEventRotationRate {
  readonly alpha: number | null;
  readonly beta: number | null;
  readonly gamma: number | null;
}