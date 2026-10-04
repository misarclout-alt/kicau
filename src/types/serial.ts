/**
 * Types for Web Serial API and Arduino Motor Controller
 */

export interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
  bluetoothServiceClassId?: string;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export type MotorPhase = 'idle' | 'motor1' | 'jeda' | 'motor2' | 'stopped';

export type MotionDirection = 'maju' | 'kembali' | 'diam';

export type OperationMode = 'continuous' | 'timed';

export type AngleOption = 90 | 180;

export interface SerialLogEntry {
  id: string;
  timestamp: string;
  type: 'tx' | 'rx' | 'sys' | 'error';
  message: string;
}

export interface MotorScheduleConfig {
  motor1Seconds: number;
  jedaSeconds: number; // min 2 detik (contoh: 8 detik)
  motor2Seconds: number;
  motor1Angle: AngleOption; // 90 atau 180
  motor2Angle: AngleOption; // 90 atau 180
  operationMode: OperationMode; // continuous vs timed
  timedMinutes: number; // custom waktu dalam menit
}

export interface ArduinoConfig {
  baudRate: number;
  commandMotor1: string;
  commandJeda: string;
  commandMotor2: string;
  lineEnding: '\n' | '\r\n' | '';
  hapticFeedback: boolean;
  soundFeedback: boolean;
}

export interface MotorDeviceState {
  isRunning: boolean;
  currentPhase: MotorPhase;
  phaseSecondsLeft: number;
  totalSecondsLeft: number; // untuk mode timed (dalam detik)
  motor1Angle: number; // live current angle (0 - 180)
  motor2Angle: number; // live current angle (0 - 180)
  motor1Direction: MotionDirection; // 'maju' (0->target), 'kembali' (target->0), 'diam' (0)
  motor2Direction: MotionDirection;
  motor1TargetAngle: AngleOption;
  motor2TargetAngle: AngleOption;
  cycleCount: number;
  pinStates: {
    pinServo1: boolean;
    pinServo2: boolean;
    pinStatusLed: boolean;
  };
}
