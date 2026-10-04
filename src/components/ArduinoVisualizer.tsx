import React from 'react';
import { MotorDeviceState, AngleOption } from '../types/serial';
import { Gauge, Radio, Pause, ArrowRight, CornerDownLeft } from 'lucide-react';

interface ArduinoVisualizerProps {
  deviceState: MotorDeviceState;
  txActive: boolean;
  rxActive: boolean;
  isConnected: boolean;
  onApplyManualAngle?: (motor: 'motor1' | 'motor2', angle: AngleOption) => void;
}

export const ArduinoVisualizer: React.FC<ArduinoVisualizerProps> = ({
  deviceState,
  txActive,
  rxActive,
  isConnected,
  onApplyManualAngle,
}) => {
  const {
    currentPhase,
    isRunning,
    phaseSecondsLeft,
    motor1Angle,
    motor2Angle,
    motor1Direction,
    motor2Direction,
    motor1TargetAngle,
    motor2TargetAngle,
    cycleCount,
  } = deviceState;

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 shadow-xl space-y-4">
      {/* Header: Exact requested title "Simulasi Respon Perangkat Motor" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-100 tracking-tight uppercase">
              Simulasi Respon Perangkat Motor
            </h4>
            <p className="text-[11px] text-slate-400">
              Respon Gerakan Servo Motor 1 (0°➔Sudut➔0°), Jeda, dan Servo Motor 2
            </p>
          </div>
        </div>

        {/* Cycle & Phase Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isRunning ? (
            <span className="text-xs font-mono bg-cyan-950/80 text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              Siklus #{cycleCount + 1}
            </span>
          ) : (
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              Status: Standby
            </span>
          )}
        </div>
      </div>

      {/* Main Dual Motor & Jeda Visualization Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* ================= Motor 1 Visualizer ================= */}
        <div
          className={`flex flex-col items-center justify-between p-4 rounded-xl border transition-all ${
            currentPhase === 'motor1' && isRunning
              ? 'bg-cyan-950/40 border-cyan-500/70 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
              : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <div className="w-full flex items-center justify-between text-xs mb-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" />
                SERVO MOTOR 1
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                PIN D9
              </span>
            </div>
            <span className="font-mono text-xs text-cyan-400 font-bold">
              {Math.round(motor1Angle)}°
            </span>
          </div>

          {/* Direction sub-badge */}
          <div className="w-full mb-2">
            {isRunning && currentPhase === 'motor1' ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1 w-fit bg-cyan-900/60 text-cyan-200 border border-cyan-700">
                {motor1Direction === 'maju' ? (
                  <>
                    <ArrowRight className="w-3 h-3 text-cyan-400 animate-pulse" />
                    <span>0° ➔ {motor1TargetAngle}° (Maju)</span>
                  </>
                ) : (
                  <>
                    <CornerDownLeft className="w-3 h-3 text-cyan-300 animate-pulse" />
                    <span>{motor1TargetAngle}° ➔ 0° (Kembali)</span>
                  </>
                )}
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-500">
                Posisi: 0° (Diam Standby)
              </span>
            )}
          </div>

          {/* Dial Arc Visualizer */}
          <div className="relative w-36 h-20 flex items-end justify-center overflow-hidden my-2">
            <div className="absolute w-32 h-32 border-8 border-slate-800 rounded-full top-0" />
            
            {/* Markers */}
            <span className="absolute left-1 bottom-0 text-[9px] font-mono text-slate-400 font-bold">0°</span>
            <span className="absolute top-0 text-[9px] font-mono text-cyan-400 font-bold">90°</span>
            <span className="absolute right-1 bottom-0 text-[9px] font-mono text-indigo-400 font-bold">180°</span>

            {/* Needle */}
            <div
              className="absolute bottom-0 w-1 bg-gradient-to-t from-cyan-500 to-cyan-300 rounded-full origin-bottom transition-transform duration-300 shadow-[0_0_8px_#22d3ee]"
              style={{
                height: '56px',
                transform: `rotate(${motor1Angle - 90}deg)`,
              }}
            />

            {/* Pivot */}
            <div className="w-5 h-5 bg-slate-200 border-2 border-slate-900 rounded-full z-10 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full" />
            </div>
          </div>

          {/* Quick Angle Selection & Terapkan Manual */}
          <div className="w-full mt-2 pt-2 border-t border-slate-800/80">
            <div className="text-[10px] text-slate-400 text-center mb-1 font-medium">
              Uji Cepat Sudut:
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[90, 180].map((angle) => (
                <button
                  key={angle}
                  type="button"
                  onClick={() => onApplyManualAngle?.('motor1', angle as AngleOption)}
                  className={`py-1 px-1.5 rounded text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                    motor1TargetAngle === angle
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {angle}°
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ================= Status Jeda Phase ================= */}
        <div
          className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center ${
            currentPhase === 'jeda' && isRunning
              ? 'bg-indigo-950/40 border-indigo-500/70 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
              : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2">
            <Pause className={`w-6 h-6 ${currentPhase === 'jeda' && isRunning ? 'animate-pulse' : ''}`} />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
            Fase Jeda Antar Motor
          </span>

          <div className="my-2">
            {currentPhase === 'jeda' && isRunning ? (
              <span className="text-3xl font-mono font-bold text-indigo-400 animate-pulse">
                {phaseSecondsLeft}s
              </span>
            ) : (
              <span className="text-xs font-mono text-slate-500">
                Min. 2 Detik Jeda (Asumsi 8s)
              </span>
            )}
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed px-1">
            Motor 1 telah kembali ke 0°. Kedua motor diam selama jeda sebelum Motor 2 dinyalakan.
          </p>
        </div>

        {/* ================= Motor 2 Visualizer ================= */}
        <div
          className={`flex flex-col items-center justify-between p-4 rounded-xl border transition-all ${
            currentPhase === 'motor2' && isRunning
              ? 'bg-amber-950/40 border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <div className="w-full flex items-center justify-between text-xs mb-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" />
                SERVO MOTOR 2
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                PIN D10
              </span>
            </div>
            <span className="font-mono text-xs text-amber-400 font-bold">
              {Math.round(motor2Angle)}°
            </span>
          </div>

          {/* Direction sub-badge */}
          <div className="w-full mb-2">
            {isRunning && currentPhase === 'motor2' ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1 w-fit bg-amber-900/60 text-amber-200 border border-amber-700">
                {motor2Direction === 'maju' ? (
                  <>
                    <ArrowRight className="w-3 h-3 text-amber-400 animate-pulse" />
                    <span>0° ➔ {motor2TargetAngle}° (Maju)</span>
                  </>
                ) : (
                  <>
                    <CornerDownLeft className="w-3 h-3 text-amber-300 animate-pulse" />
                    <span>{motor2TargetAngle}° ➔ 0° (Kembali)</span>
                  </>
                )}
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-500">
                Posisi: 0° (Diam Standby)
              </span>
            )}
          </div>

          {/* Dial Arc Visualizer */}
          <div className="relative w-36 h-20 flex items-end justify-center overflow-hidden my-2">
            <div className="absolute w-32 h-32 border-8 border-slate-800 rounded-full top-0" />
            
            {/* Markers */}
            <span className="absolute left-1 bottom-0 text-[9px] font-mono text-slate-400 font-bold">0°</span>
            <span className="absolute top-0 text-[9px] font-mono text-amber-400 font-bold">90°</span>
            <span className="absolute right-1 bottom-0 text-[9px] font-mono text-rose-400 font-bold">180°</span>

            {/* Needle */}
            <div
              className="absolute bottom-0 w-1 bg-gradient-to-t from-amber-500 to-amber-300 rounded-full origin-bottom transition-transform duration-300 shadow-[0_0_8px_#fbbf24]"
              style={{
                height: '56px',
                transform: `rotate(${motor2Angle - 90}deg)`,
              }}
            />

            {/* Pivot */}
            <div className="w-5 h-5 bg-slate-200 border-2 border-slate-900 rounded-full z-10 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-amber-600 rounded-full" />
            </div>
          </div>

          {/* Quick Angle Selection & Terapkan Manual */}
          <div className="w-full mt-2 pt-2 border-t border-slate-800/80">
            <div className="text-[10px] text-slate-400 text-center mb-1 font-medium">
              Uji Cepat Sudut:
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[90, 180].map((angle) => (
                <button
                  key={angle}
                  type="button"
                  onClick={() => onApplyManualAngle?.('motor2', angle as AngleOption)}
                  className={`py-1 px-1.5 rounded text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                    motor2TargetAngle === angle
                      ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {angle}°
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
