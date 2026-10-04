import React from 'react';
import {
  RotateCw,
  Pause,
  CheckCircle,
  Play,
  Square,
  Clock,
  Repeat,
  Info,
  Timer,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import {
  MotorScheduleConfig,
  MotorPhase,
  AngleOption,
  ConnectionState,
} from '../types/serial';

interface ThreeButtonControlProps {
  scheduleConfig: MotorScheduleConfig;
  onUpdateScheduleConfig: (updated: Partial<MotorScheduleConfig>) => void;
  currentPhase: MotorPhase;
  isRunning: boolean;
  phaseSecondsLeft: number;
  totalSecondsLeft: number;
  connectionState: ConnectionState;
  onApply: () => void;
  onStop: () => void;
  onTestSingle: (target: 'motor1' | 'jeda' | 'motor2') => void;
}

export const ThreeButtonControl: React.FC<ThreeButtonControlProps> = ({
  scheduleConfig,
  onUpdateScheduleConfig,
  currentPhase,
  isRunning,
  phaseSecondsLeft,
  totalSecondsLeft,
  connectionState,
  onApply,
  onStop,
  onTestSingle,
}) => {
  const isConnected = connectionState === 'connected';

  // Format time remaining mm:ss
  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 sm:p-6 shadow-xl relative space-y-3.5 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 gap-2">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Panel Kontrol Servo Motor & Jeda
          </span>
          <h3 className="text-base sm:text-lg font-bold text-slate-100 mt-0.5">
            Siklus Bolak-Balik: 0° → Sudut → 0° dengan Jeda
          </h3>
        </div>

        {/* Live Running Status */}
        {isRunning ? (
          <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/50 px-3 py-1 rounded-xl animate-pulse self-start sm:self-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="text-xs font-mono font-bold text-emerald-300 uppercase">
              FASE: {currentPhase.toUpperCase()} ({phaseSecondsLeft}s)
            </span>
          </div>
        ) : (
          <div className="text-xs text-slate-400 font-mono">
            Status: Standby
          </div>
        )}
      </div>

      {/* Visual Sequence Flow Banner: Exactly explaining the user's intended sequence */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/90 text-xs">
        <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
          Alur Urutan Operasi yang Dijalankan:
        </span>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span
            className={`px-2.5 py-1 rounded-lg border transition-all ${
              isRunning && currentPhase === 'motor1'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold ring-2 ring-cyan-500/30'
                : 'bg-slate-900 text-slate-300 border-slate-800'
            }`}
          >
            1. Motor 1 (0° → {scheduleConfig.motor1Angle}° → 0°)
          </span>

          <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

          <span
            className={`px-2.5 py-1 rounded-lg border transition-all ${
              isRunning && currentPhase === 'jeda'
                ? 'bg-indigo-950 text-indigo-300 border-indigo-500 font-bold ring-2 ring-indigo-500/30'
                : 'bg-slate-900 text-slate-300 border-slate-800'
            }`}
          >
            2. Jeda Diam ({scheduleConfig.jedaSeconds} Detik)
          </span>

          <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

          <span
            className={`px-2.5 py-1 rounded-lg border transition-all ${
              isRunning && currentPhase === 'motor2'
                ? 'bg-amber-950 text-amber-300 border-amber-500 font-bold ring-2 ring-amber-500/30'
                : 'bg-slate-900 text-slate-300 border-slate-800'
            }`}
          >
            3. Motor 2 (0° → {scheduleConfig.motor2Angle}° → 0°)
          </span>
        </div>
      </div>

      {/* 
        BAGIAN ATAS: Kolom Kotak Input Detik untuk MOTOR 1, JEDA, dan MOTOR 2
        + Tiga Tombol (MOTOR 1, JEDA, MOTOR 2)
      */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {/* ===================== 1. MOTOR 1 ===================== */}
        <div
          className={`flex flex-col rounded-2xl border-2 p-3.5 sm:p-4 transition-all duration-200 ${
            isRunning && currentPhase === 'motor1'
              ? 'bg-cyan-950/50 border-cyan-400 ring-2 ring-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          {/* Kolom Kotak Input Detik di Atas MOTOR 1 */}
          <div className="mb-3 pb-2.5 border-b border-slate-800/80">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Perintah Waktu Gerak (Detik)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={3600}
                value={scheduleConfig.motor1Seconds || ''}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  onUpdateScheduleConfig({ motor1Seconds: val });
                }}
                disabled={isRunning}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-2 text-sm sm:text-base font-mono font-bold text-cyan-300 focus:outline-none disabled:opacity-60 text-center"
                placeholder="5"
              />
              <span className="text-xs font-mono text-slate-400 shrink-0">detik</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              Gerak: 0° ➔ {scheduleConfig.motor1Angle}° ➔ 0°
            </span>
          </div>

          {/* Tombol MOTOR 1 */}
          <button
            type="button"
            onClick={() => onTestSingle('motor1')}
            disabled={isRunning}
            className={`group flex-1 flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer select-none active:scale-98 min-h-[92px] ${
              isRunning && currentPhase === 'motor1'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-200'
            }`}
            title="Klik untuk uji gerak Motor 1 (0 -> 90 -> 0)"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-1.5 group-hover:rotate-45 transition-transform">
              <RotateCw className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold tracking-wider uppercase text-cyan-300">
              MOTOR 1
            </span>
            <span className="text-[10px] text-cyan-400 font-mono mt-0.5">
              0° ➔ {scheduleConfig.motor1Angle}° ➔ 0°
            </span>
          </button>

          {/* Pilihan Sudut: 90 Derajat dan 180 Derajat */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-semibold block mb-1.5 text-center">
              Pilihan Sudut Motor 1:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[90, 180].map((deg) => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => onUpdateScheduleConfig({ motor1Angle: deg as AngleOption })}
                  disabled={isRunning}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    scheduleConfig.motor1Angle === deg
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ===================== 2. JEDA ===================== */}
        <div
          className={`flex flex-col rounded-2xl border-2 p-3.5 sm:p-4 transition-all duration-200 ${
            isRunning && currentPhase === 'jeda'
              ? 'bg-indigo-950/50 border-indigo-400 ring-2 ring-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.25)]'
              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          {/* Kolom Kotak Input Detik di Atas JEDA (Minimal 2 Detik, default 8 detik) */}
          <div className="mb-3 pb-2.5 border-b border-slate-800/80">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-400">
                Perintah Jeda Diam (Detik)
              </label>
              <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60">
                Min. 2 Detik
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={2}
                max={3600}
                value={scheduleConfig.jedaSeconds || ''}
                onChange={(e) => {
                  const val = Math.max(2, parseInt(e.target.value) || 2);
                  onUpdateScheduleConfig({ jedaSeconds: val });
                }}
                disabled={isRunning}
                className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-400 rounded-xl px-3 py-2 text-sm sm:text-base font-mono font-bold text-indigo-300 focus:outline-none disabled:opacity-60 text-center"
                placeholder="8"
              />
              <span className="text-xs font-mono text-slate-400 shrink-0">detik</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              Contoh Anda: 8 detik jeda
            </span>
          </div>

          {/* Tombol JEDA */}
          <button
            type="button"
            onClick={() => onTestSingle('jeda')}
            disabled={isRunning}
            className={`group flex-1 flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer select-none active:scale-98 min-h-[92px] ${
              isRunning && currentPhase === 'jeda'
                ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-200'
            }`}
            title="Klik untuk uji jeda diam langsung"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
              <Pause className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold tracking-wider uppercase text-indigo-300">
              JEDA
            </span>
            <span className="text-[10px] text-amber-400 font-medium mt-0.5">
              Minimal 2 detik jeda
            </span>
          </button>

          {/* Keterangan Standby Jeda */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-center">
            <span className="text-[10px] text-slate-400 font-medium block">
              Kondisi Selama Jeda:
            </span>
            <span className="text-[11px] font-mono text-indigo-300 font-semibold mt-1 block">
              Kedua Motor Diam di Posisi 0°
            </span>
          </div>
        </div>

        {/* ===================== 3. MOTOR 2 ===================== */}
        <div
          className={`flex flex-col rounded-2xl border-2 p-3.5 sm:p-4 transition-all duration-200 ${
            isRunning && currentPhase === 'motor2'
              ? 'bg-amber-950/50 border-amber-400 ring-2 ring-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          {/* Kolom Kotak Input Detik di Atas MOTOR 2 */}
          <div className="mb-3 pb-2.5 border-b border-slate-800/80">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Perintah Waktu Gerak (Detik)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={3600}
                value={scheduleConfig.motor2Seconds || ''}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  onUpdateScheduleConfig({ motor2Seconds: val });
                }}
                disabled={isRunning}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-sm sm:text-base font-mono font-bold text-amber-300 focus:outline-none disabled:opacity-60 text-center"
                placeholder="5"
              />
              <span className="text-xs font-mono text-slate-400 shrink-0">detik</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              Gerak: 0° ➔ {scheduleConfig.motor2Angle}° ➔ 0°
            </span>
          </div>

          {/* Tombol MOTOR 2 */}
          <button
            type="button"
            onClick={() => onTestSingle('motor2')}
            disabled={isRunning}
            className={`group flex-1 flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer select-none active:scale-98 min-h-[92px] ${
              isRunning && currentPhase === 'motor2'
                ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-200'
            }`}
            title="Klik untuk uji gerak Motor 2 (0 -> 90 -> 0)"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-1.5 group-hover:rotate-45 transition-transform">
              <RotateCw className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold tracking-wider uppercase text-amber-300">
              MOTOR 2
            </span>
            <span className="text-[10px] text-amber-400 font-mono mt-0.5">
              0° ➔ {scheduleConfig.motor2Angle}° ➔ 0°
            </span>
          </button>

          {/* Pilihan Sudut: 90 Derajat dan 180 Derajat */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-semibold block mb-1.5 text-center">
              Pilihan Sudut Motor 2:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[90, 180].map((deg) => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => onUpdateScheduleConfig({ motor2Angle: deg as AngleOption })}
                  disabled={isRunning}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    scheduleConfig.motor2Angle === deg
                      ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 
        BAGIAN PILIHAN MODE DI BAWAH KETIGA TOMBOL:
        Pilihan 1: ALAT BEROPERASI TERUS MENERUS
        Pilihan 2: ALAT BEROPERASI DENGAN WAKTU (dengan kolom custom menit)
      */}
      <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
          Pilihan Mode Operasi Siklus
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Pilihan 1: ALAT BEROPERASI TERUS MENERUS */}
          <label
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
              scheduleConfig.operationMode === 'continuous'
                ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/40'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <input
              type="radio"
              name="operationMode"
              checked={scheduleConfig.operationMode === 'continuous'}
              onChange={() => onUpdateScheduleConfig({ operationMode: 'continuous' })}
              disabled={isRunning}
              className="w-4 h-4 mt-0.5 accent-emerald-500 shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-200">
                <Repeat className="w-4 h-4 text-emerald-400" />
                <span>ALAT BEROPERASI TERUS MENERUS</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Siklus berulang tanpa henti (Motor 1: 0°➔90°➔0° → Jeda {scheduleConfig.jedaSeconds}s → Motor 2: 0°➔90°➔0° → Jeda {scheduleConfig.jedaSeconds}s...) sampai dihentikan.
              </p>
            </div>
          </label>

          {/* Pilihan 2: ALAT BEROPERASI DENGAN WAKTU */}
          <label
            className={`flex flex-col p-3.5 rounded-xl border cursor-pointer transition-all ${
              scheduleConfig.operationMode === 'timed'
                ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/40'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="operationMode"
                checked={scheduleConfig.operationMode === 'timed'}
                onChange={() => onUpdateScheduleConfig({ operationMode: 'timed' })}
                disabled={isRunning}
                className="w-4 h-4 mt-0.5 accent-cyan-500 shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-200">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>ALAT BEROPERASI DENGAN WAKTU</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Alat otomatis berhenti setelah durasi batas waktu menit yang Anda tentukan habis.
                </p>
              </div>
            </div>

            {/* Kolom Kecil Hitungan Menit (Custom Pengguna) */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between pl-7">
              <span className="text-[11px] text-slate-300 font-medium">
                Atur Waktu Total:
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={1440}
                  value={scheduleConfig.timedMinutes || ''}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 1);
                    onUpdateScheduleConfig({ timedMinutes: val, operationMode: 'timed' });
                  }}
                  disabled={isRunning}
                  className="w-16 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-2 py-1 text-xs font-mono font-bold text-cyan-300 text-center focus:outline-none"
                  placeholder="15"
                />
                <span className="text-xs font-mono text-slate-400">menit</span>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* 
        TOMBOL UTAMA: TERAPKAN & HENTIKAN
      */}
      <div className="pt-1">
        {isRunning ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={onStop}
              className="w-full min-h-[54px] sm:min-h-[58px] rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-950/60 ring-2 ring-rose-400/50 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Square className="w-5 h-5 fill-current" />
              <span>HENTIKAN OPERASI SIKLUS</span>
            </button>

            {/* Live Progress Bar and countdown */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-slate-300">
                  Fase: <strong className="text-cyan-400 uppercase">{currentPhase}</strong> ({phaseSecondsLeft} detik tersisa)
                </span>
              </div>

              {scheduleConfig.operationMode === 'timed' && (
                <span className="font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                  Sisa Total: {formatTimeRemaining(totalSecondsLeft)}
                </span>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onApply}
            className="w-full min-h-[54px] sm:min-h-[58px] rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-xl shadow-emerald-950/60 ring-2 ring-emerald-400/30 hover:ring-emerald-400/50 transition-all active:scale-[0.98] cursor-pointer select-none"
          >
            <Play className="w-5 h-5 fill-current text-emerald-200" />
            <span>TERAPKAN</span>
          </button>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 px-1">
          <span className="flex items-center gap-1.5 truncate">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              Siklus: Motor 1 (0°➔{scheduleConfig.motor1Angle}°➔0°) → Jeda ({scheduleConfig.jedaSeconds}s) → Motor 2 (0°➔{scheduleConfig.motor2Angle}°➔0°)
            </span>
          </span>

          <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">
            {isConnected ? 'Hardware USB Siap' : 'Perangkat USB Terputus'}
          </span>
        </div>
      </div>
    </div>
  );
};
