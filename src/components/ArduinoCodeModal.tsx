import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode, Cpu, Lightbulb, Smartphone, AlertTriangle } from 'lucide-react';
import { ArduinoConfig, MotorScheduleConfig } from '../types/serial';

interface ArduinoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ArduinoConfig;
  scheduleConfig: MotorScheduleConfig;
}

export const ArduinoCodeModal: React.FC<ArduinoCodeModalProps> = ({
  isOpen,
  onClose,
  config,
  scheduleConfig,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sketchCode = `/*
 * =========================================================================
 * SKETCH ARDUINO: PENGONTROL SERVO MOTOR 1 & MOTOR 2 DENGAN JEDA
 * Dikontrol dari HP Android melalui Kabel USB OTG
 * PERINGATAN: MATIKAN ADAPTOR/LISTRIK PENGHUBUNG SEBELUM MELANJUTKAN KABEL!
 * =========================================================================
 * 
 * Konfigurasi Pin:
 * - Pin D9  : Sinyal PWM Servo Motor 1
 * - Pin D10 : Sinyal PWM Servo Motor 2
 * - Pin D13 : Indikator Status Sistem On-Board
 */

#include <Servo.h>

// Definisi Pin Sesuai Permintaan
const int PIN_SERVO_1 = 9;   // Sinyal PWM Servo Motor 1 (Pin D9)
const int PIN_SERVO_2 = 10;  // Sinyal PWM Servo Motor 2 (Pin D10)
const int PIN_STATUS  = 13;  // LED Built-in Arduino Board (Indikator Aktif)

Servo servoMotor1;
Servo servoMotor2;

// Parameter Waktu & Sudut
unsigned long durasiMotor1Ms = ${scheduleConfig.motor1Seconds * 1000};
unsigned long durasiJedaMs   = ${Math.max(2, scheduleConfig.jedaSeconds) * 1000}; // Minimal 2 detik
unsigned long durasiMotor2Ms = ${scheduleConfig.motor2Seconds * 1000};
int sudutMotor1 = ${scheduleConfig.motor1Angle}; // 90 atau 180 derajat
int sudutMotor2 = ${scheduleConfig.motor2Angle}; // 90 atau 180 derajat

bool isRunning = false;
bool isContinuous = ${scheduleConfig.operationMode === 'continuous' ? 'true' : 'false'};
unsigned long timerBatasMs = ${scheduleConfig.timedMinutes * 60 * 1000}UL;
unsigned long waktuMulaiOperasi = 0;

String bufferSerial = "";

void setup() {
  Serial.begin(${config.baudRate});

  pinMode(PIN_STATUS, OUTPUT);

  // Hubungkan Pin Sinyal Servo Motor (Pin D9 & Pin D10)
  servoMotor1.attach(PIN_SERVO_1);
  servoMotor2.attach(PIN_SERVO_2);

  // Posisi Awal Netral (0 Derajat)
  servoMotor1.write(0);
  servoMotor2.write(0);

  // Startup Test LED Status
  digitalWrite(PIN_STATUS, HIGH);
  delay(300);
  digitalWrite(PIN_STATUS, LOW);

  Serial.println("ARDUINO_READY");
  Serial.println("Sistem Servo Motor 1 (Pin D9) & Motor 2 (Pin D10) Siap.");
}

void loop() {
  // 1. Baca Perintah Masuk dari Android via USB OTG
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\\n' || c == '\\r') {
      if (bufferSerial.length() > 0) {
        eksekusiPerintah(bufferSerial);
        bufferSerial = "";
      }
    } else {
      bufferSerial += c;
    }
  }

  // 2. Jalankan Siklus jika mode Berjalan (Running)
  if (isRunning) {
    // Cek jika mode beroperasi dengan waktu sudah mencapai batas menit
    if (!isContinuous && (millis() - waktuMulaiOperasi >= timerBatasMs)) {
      isRunning = false;
      resetSemuaMotor();
      Serial.println("STATUS: WAKTU_HABIS (Operasi Selesai)");
      return;
    }

    // FASE 1: SERVO MOTOR 1 (Pin D9: Maju ke sudut target, lalu kembali ke 0)
    digitalWrite(PIN_STATUS, HIGH);
    Serial.print("PHASE:MOTOR1_MAJU (Pin D9: 0 ke ");
    Serial.print(sudutMotor1);
    Serial.println(" deg)");
    servoMotor1.write(sudutMotor1);
    delay(durasiMotor1Ms / 2);

    // Kembali ke titik 0
    Serial.println("PHASE:MOTOR1_KEMBALI (Pin D9: ke 0 deg)");
    servoMotor1.write(0);
    delay(durasiMotor1Ms / 2);
    digitalWrite(PIN_STATUS, LOW);

    // FASE 2: JEDA (Asumsi 8 Detik / Sesuai Pengaturan, Minimal 2 Detik)
    Serial.print("PHASE:JEDA_DIAM (Durasi: ");
    Serial.print(durasiJedaMs / 1000);
    Serial.println(" detik)");
    delay(durasiJedaMs);

    // FASE 3: SERVO MOTOR 2 (Pin D10: Maju ke sudut target, lalu kembali ke 0)
    digitalWrite(PIN_STATUS, HIGH);
    Serial.print("PHASE:MOTOR2_MAJU (Pin D10: 0 ke ");
    Serial.print(sudutMotor2);
    Serial.println(" deg)");
    servoMotor2.write(sudutMotor2);
    delay(durasiMotor2Ms / 2);

    // Kembali ke titik 0
    Serial.println("PHASE:MOTOR2_KEMBALI (Pin D10: ke 0 deg)");
    servoMotor2.write(0);
    delay(durasiMotor2Ms / 2);
    digitalWrite(PIN_STATUS, LOW);

    // FASE 4: JEDA AKHIR SIKLUS (Sebelum mengulang siklus)
    delay(durasiJedaMs);

    // Jika bukan continuous, matikan
    if (!isContinuous && (millis() - waktuMulaiOperasi >= timerBatasMs)) {
      isRunning = false;
      Serial.println("STATUS: Selesai");
    }
  }
}

void resetSemuaMotor() {
  servoMotor1.write(0);
  servoMotor2.write(0);
  digitalWrite(PIN_STATUS, LOW);
}

void eksekusiPerintah(String cmd) {
  cmd.trim();
  Serial.print("ACK_CMD: ");
  Serial.println(cmd);

  if (cmd.startsWith("START")) {
    isRunning = true;
    waktuMulaiOperasi = millis();
    Serial.println("STATUS: OPERASI_DIMULAI");
  } 
  else if (cmd.startsWith("STOP")) {
    isRunning = false;
    resetSemuaMotor();
    Serial.println("STATUS: OPERASI_DIHENTIKAN");
  } 
  else if (cmd.startsWith("TEST:M1")) {
    servoMotor1.write(sudutMotor1);
    digitalWrite(PIN_LED_M1, HIGH);
    delay(1000);
    servoMotor1.write(0);
    digitalWrite(PIN_LED_M1, LOW);
  }
  else if (cmd.startsWith("TEST:M2")) {
    servoMotor2.write(sudutMotor2);
    digitalWrite(PIN_LED_M2, HIGH);
    delay(1000);
    servoMotor2.write(0);
    digitalWrite(PIN_LED_M2, LOW);
  }
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sketchCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([sketchCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'arduino_motor_controller.ino';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <FileCode className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Kode Arduino (.ino) Motor 1, Jeda, & Motor 2
              </h3>
              <p className="text-xs text-slate-400">
                Upload sketsa ini ke Arduino Uno/Nano via Arduino IDE
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Prominent Safety Warning */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-950/70 border border-amber-600/70 text-amber-200 text-xs font-bold shadow-lg">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
            <span>
              PERINGATAN KESELAMATAN: MATIKAN ADAPTOR/LISTRIK PENGHUBUNG SEBELUM MELANJUTKAN MENYAMBUNGKAN KABEL!
            </span>
          </div>

          {/* Quick guide cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-start gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200 block mb-0.5">1. Sambungan USB OTG</strong>
                <span className="text-slate-400 text-[11px]">
                  Gunakan adapter USB OTG dari port HP Android ke kabel USB Arduino.
                </span>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-start gap-2">
              <Cpu className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200 block mb-0.5">2. Pin Servo Motor</strong>
                <span className="text-slate-400 text-[11px]">
                  Servo 1 di Pin D9, Servo 2 di Pin D10, baud rate: <strong className="text-cyan-300 font-mono">{config.baudRate}</strong>.
                </span>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200 block mb-0.5">3. Jeda Waktu</strong>
                <span className="text-slate-400 text-[11px]">
                  Jeda otomatis minimal 2 detik sebelum pergantian gerak motor.
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">arduino_motor_controller.ino</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Kode</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File .ino</span>
              </button>
            </div>
          </div>

          {/* Code block */}
          <div className="relative">
            <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs font-mono text-slate-300 overflow-x-auto max-h-96 leading-relaxed select-all">
              {sketchCode}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
