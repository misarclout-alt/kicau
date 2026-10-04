import React from 'react';
import { X, Sliders, Volume2, Vibrate, RefreshCcw } from 'lucide-react';
import { ArduinoConfig } from '../types/serial';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ArduinoConfig;
  onUpdateConfig: (updated: Partial<ArduinoConfig>) => void;
  onResetDefaults: () => void;
}

const AVAILABLE_BAUD_RATES = [9600, 19200, 38400, 57600, 115200];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onResetDefaults,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">
              Pengaturan Serial & Perintah
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {/* Baud Rate */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Kecepatan Baud Rate Serial
            </label>
            <div className="grid grid-cols-3 gap-2">
              {AVAILABLE_BAUD_RATES.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => onUpdateConfig({ baudRate: rate })}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-medium border transition-colors cursor-pointer ${
                    config.baudRate === rate
                      ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {rate}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Standar Arduino: 9600 baud. Pastikan sama dengan yang ada di Serial.begin() sketch Arduino Anda.
            </p>
          </div>

          {/* Custom Command Strings */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-300">
              Kustomisasi Teks String Perintah Serial
            </label>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">MOTOR 1</span>
                <input
                  type="text"
                  value={config.commandMotor1}
                  onChange={(e) => onUpdateConfig({ commandMotor1: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1">JEDA</span>
                <input
                  type="text"
                  value={config.commandJeda}
                  onChange={(e) => onUpdateConfig({ commandJeda: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1">MOTOR 2</span>
                <input
                  type="text"
                  value={config.commandMotor2}
                  onChange={(e) => onUpdateConfig({ commandMotor2: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Feedback Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Efek Respon HP Android
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <span className="flex items-center gap-2 text-xs text-slate-300">
                <Vibrate className="w-4 h-4 text-emerald-400" />
                <span>Getaran Sentuhan (Haptic Feedback)</span>
              </span>
              <input
                type="checkbox"
                checked={config.hapticFeedback}
                onChange={(e) => onUpdateConfig({ hapticFeedback: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <span className="flex items-center gap-2 text-xs text-slate-300">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>Suara Klik Audio (Tactile Beep)</span>
              </span>
              <input
                type="checkbox"
                checked={config.soundFeedback}
                onChange={(e) => onUpdateConfig({ soundFeedback: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onResetDefaults}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Reset Standar</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
