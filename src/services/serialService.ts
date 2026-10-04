/**
 * Arduino Serial Service
 * Supports Web Serial API with USB OTG on Android/Chrome,
 * plus a simulated Arduino board for testing without physical hardware.
 */

import { ConnectionState, SerialLogEntry } from '../types/serial';

// Declare Web Serial API types
interface WebSerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  getInfo(): { usbVendorId?: number; usbProductId?: number };
}

interface WebSerialManager {
  requestPort(options?: object): Promise<WebSerialPort>;
  getPorts(): Promise<WebSerialPort[]>;
  addEventListener(type: string, listener: (ev: Event) => void): void;
  removeEventListener(type: string, listener: (ev: Event) => void): void;
}

export class SerialService {
  private port: WebSerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<string> | null = null;
  private keepReading = false;
  private isSimulated = false;

  private onStateChangeCb: ((state: ConnectionState, info?: string) => void) | null = null;
  private onLogCb: ((entry: SerialLogEntry) => void) | null = null;
  private onRxActivityCb: (() => void) | null = null;
  private onTxActivityCb: (() => void) | null = null;
  private onSimulatedBoardUpdateCb: ((cmd: string) => void) | null = null;

  public isWebSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public setCallbacks(cbs: {
    onStateChange: (state: ConnectionState, info?: string) => void;
    onLog: (entry: SerialLogEntry) => void;
    onRxActivity?: () => void;
    onTxActivity?: () => void;
    onSimulatedBoardUpdate?: (cmd: string) => void;
  }) {
    this.onStateChangeCb = cbs.onStateChange;
    this.onLogCb = cbs.onLog;
    this.onRxActivityCb = cbs.onRxActivity || null;
    this.onTxActivityCb = cbs.onTxActivity || null;
    this.onSimulatedBoardUpdateCb = cbs.onSimulatedBoardUpdate || null;

    // Listen to physical connect/disconnect events if Web Serial is supported
    if (this.isWebSerialSupported()) {
      const serial = (navigator as unknown as { serial: WebSerialManager }).serial;
      serial.addEventListener('connect', () => {
        this.addLog('sys', 'Perangkat USB Serial baru terdeteksi di port OTG.');
      });
      serial.addEventListener('disconnect', () => {
        this.addLog('sys', 'Kabel USB Serial / Arduino dilepas dari Android.');
        this.disconnect();
      });
    }
  }

  private addLog(type: SerialLogEntry['type'], message: string) {
    if (this.onLogCb) {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
      this.onLogCb({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: timeStr,
        type,
        message,
      });
    }
  }

  /**
   * Connect to real Arduino using Web Serial API
   */
  public async connectReal(baudRate: number = 9600): Promise<boolean> {
    if (!this.isWebSerialSupported()) {
      this.addLog('error', 'Browser ini belum mendukung Web Serial API langsung. Gunakan Google Chrome di Android atau aktifkan Mode Simulasi.');
      return false;
    }

    try {
      this.onStateChangeCb?.('connecting', 'Memilih port USB OTG...');
      const serial = (navigator as unknown as { serial: WebSerialManager }).serial;
      
      const port = await serial.requestPort();
      this.port = port;

      await port.open({ baudRate });
      this.isSimulated = false;

      const info = port.getInfo();
      const vidPid = info.usbVendorId ? ` (VID: 0x${info.usbVendorId.toString(16).toUpperCase()})` : '';
      const portName = `Arduino USB Serial${vidPid}`;

      this.onStateChangeCb?.('connected', portName);
      this.addLog('sys', `Terhubung ke Arduino pada ${baudRate} baud.${vidPid}`);

      this.startReading();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('No port selected') || msg.includes('user cancelled')) {
        this.onStateChangeCb?.('disconnected');
        this.addLog('sys', 'Pemilihan port dibatalkan oleh pengguna.');
      } else {
        this.onStateChangeCb?.('error', msg);
        this.addLog('error', `Gagal menghubungkan: ${msg}`);
      }
      return false;
    }
  }

  /**
   * Connect via Simulated Arduino
   */
  public connectSimulated(baudRate: number = 9600): boolean {
    this.isSimulated = true;
    this.port = null;
    this.onStateChangeCb?.('connected', 'Arduino UNO R3 (Simulasi OTG)');
    this.addLog('sys', `Mode Simulasi Aktif: Arduino UNO R3 terhubung (Virtual Serial @ ${baudRate} baud)`);
    
    // Simulate Arduino startup banner
    setTimeout(() => {
      this.onRxActivityCb?.();
      this.addLog('rx', 'Arduino Boot: System Ready. Pins D8, D9, D10 configured.');
    }, 400);

    return true;
  }

  /**
   * Disconnect from current device
   */
  public async disconnect(): Promise<void> {
    this.keepReading = false;

    if (this.reader) {
      try {
        await this.reader.cancel();
        this.reader.releaseLock();
      } catch {
        // ignore release lock errors
      }
      this.reader = null;
    }

    if (this.writer) {
      try {
        await this.writer.close();
      } catch {
        // ignore
      }
      this.writer = null;
    }

    if (this.port) {
      try {
        await this.port.close();
      } catch {
        // ignore
      }
      this.port = null;
    }

    this.isSimulated = false;
    this.onStateChangeCb?.('disconnected', 'Terputus');
    this.addLog('sys', 'Koneksi Arduino diputus.');
  }

  private async startReading() {
    if (!this.port || !this.port.readable) return;

    this.keepReading = true;
    try {
      this.reader = this.port.readable.getReader();
      const textDecoder = new TextDecoder();
      let buffer = '';

      while (this.keepReading && this.reader) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          this.onRxActivityCb?.();
          buffer += textDecoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine) {
              this.addLog('rx', cleanLine);
            }
          }
        }
      }
    } catch (err: unknown) {
      if (this.keepReading) {
        const msg = err instanceof Error ? err.message : String(err);
        this.addLog('error', `Error pembacaan serial: ${msg}`);
      }
    }
  }

  /**
   * Send command string to Arduino
   */
  public async sendCommand(commandText: string, lineEnding: string = '\n'): Promise<boolean> {
    const payload = commandText + lineEnding;
    this.onTxActivityCb?.();
    this.addLog('tx', `KIRIM: ${commandText}`);

    // If simulated
    if (this.isSimulated) {
      this.onSimulatedBoardUpdateCb?.(commandText);
      setTimeout(() => {
        this.onRxActivityCb?.();
        this.addLog('rx', `ACK: Perintah "${commandText}" diterima & diterapkan pada pin Arduino.`);
      }, 120);
      return true;
    }

    // If real port connected
    if (!this.port || !this.port.writable) {
      this.addLog('error', 'Gagal mengirim: Arduino belum terhubung.');
      return false;
    }

    try {
      const encoder = new TextEncoder();
      const writer = this.port.writable.getWriter();
      await writer.write(encoder.encode(payload));
      writer.releaseLock();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.addLog('error', `Gagal menulis data ke Serial: ${msg}`);
      return false;
    }
  }

  public getIsSimulated(): boolean {
    return this.isSimulated;
  }
}

// Global Singleton
export const serialManager = new SerialService();

/**
 * Audio tactile feedback synthesizer
 */
export function playTactileTone(freq: number = 880, durationMs: number = 40, type: OscillatorType = 'sine') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    // Audio may be blocked by autoplay policies until user gesture
  }
}

/**
 * Trigger Android haptic vibration
 */
export function triggerHaptic(duration: number = 35) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(duration);
    } catch {
      // ignore
    }
  }
}
