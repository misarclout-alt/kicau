import React from 'react';
import { Usb, Unplug, CheckCircle2, AlertCircle, RefreshCw, Cpu, Activity } from 'lucide-react';
import { ConnectionState } from '../types/serial';

interface ConnectionCardProps {
  connectionState: ConnectionState;
  connectionInfo: string;
  isSimulated: boolean;
  baudRate: number;
  isWebSerialSupported: boolean;
  rxActive: boolean;
  txActive: boolean;
  onConnectReal: () => void;
  onToggleSimulated: () => void;
  onDisconnect: () => void;
  onOpenSettings: () => void;
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({
  connectionState,
  connectionInfo,
  isSimulated,
  baudRate,
  isWebSerialSupported,
  rxActive,
  txActive,
  onConnectReal,
  onToggleSimulated,
  onDisconnect,
  onOpenSettings,
}) => {
  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-3.5 sm:p-5 shadow-xl transition-all">
      {/* Background glow when connected */}
      {isConnected && (
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Top row: Status header and TX/RX indicators */}
      <div className="flex items-center justify-between gap-2.5 mb-2.5 sm:mb-4 pb-2.5 sm:pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            {isConnected ? (
              <>
                <span className="absolute w-3.5 h-3.5 bg-emerald-500 rounded-full animate-ping opacity-75" />
                <span className="relative w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              </>
            ) : isConnecting ? (
              <span className="w-3 h-3 bg-amber-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
            ) : (
              <span className="w-3 h-3 bg-rose-500/70 rounded-full" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Status Koneksi Arduino
              </span>
              {isSimulated && isConnected && (
                <span className="text-[11px] font-medium text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                  Simulasi
                </span>
              )}
            </div>

            {/* Core user requirement: Keterangan Terhubung / Terputus */}
            <h2 className="text-lg sm:text-xl font-bold tracking-tight mt-0.5">
              {isConnected ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 inline shrink-0" />
                  TERHUBUNG
                </span>
              ) : isConnecting ? (
                <span className="text-amber-400 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 animate-spin inline shrink-0" />
                  MENGHUBUNGKAN...
                </span>
              ) : (
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Unplug className="w-4 h-4 text-slate-500 inline shrink-0" />
                  TERPUTUS / BELUM TERHUBUNG
                </span>
              )}
            </h2>
          </div>
        </div>

        {/* Hardware TX / RX Activity Micro-LEDs */}
        <div className="flex items-center gap-3 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full transition-colors duration-100 ${
                txActive ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]' : 'bg-slate-700'
              }`}
            />
            <span className={txActive ? 'text-amber-300 font-semibold' : 'text-slate-500'}>TX</span>
          </div>
          <div className="w-[1px] h-3 bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full transition-colors duration-100 ${
                rxActive ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-slate-700'
              }`}
            />
            <span className={rxActive ? 'text-emerald-300 font-semibold' : 'text-slate-500'}>RX</span>
          </div>
        </div>
      </div>

      {/* Middle row: Device metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-4 text-slate-400">
        <div className="flex items-center gap-2 truncate">
          <Cpu className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-slate-500">Perangkat:</span>
          <span className="font-medium text-slate-200 truncate">
            {isConnected ? connectionInfo : 'Tidak ada perangkat terdeteksi'}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          <Activity className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-slate-500">Kecepatan Serial:</span>
          <button
            onClick={onOpenSettings}
            className="font-mono text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors cursor-pointer"
            title="Ubah Baud Rate"
          >
            {baudRate} bps
          </button>
        </div>
      </div>

      {/* Action Buttons: Connect / Disconnect / Simulation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
        {isConnected ? (
          <button
            onClick={onDisconnect}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Unplug className="w-4 h-4" />
            Putuskan Sambungan Arduino
          </button>
        ) : (
          <>
            <button
              onClick={onConnectReal}
              disabled={isConnecting}
              className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <Usb className="w-4 h-4" />
              {isConnecting ? 'Mencari Perangkat...' : 'Hubungkan Perangkat via USB'}
            </button>

            <button
              onClick={onToggleSimulated}
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700/80 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
              title="Gunakan simulasi jika sedang tidak memegang kabel OTG fisik"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              Mode Simulasi
            </button>
          </>
        )}
      </div>

      {/* Helpful hint and SAFETY WARNING for Android USB OTG */}
      {!isConnected && (
        <div className="mt-3.5 space-y-2">
          {/* Prominent Safety Warning as requested by user */}
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300 bg-amber-950/70 border border-amber-600/70 px-3 py-2 rounded-xl">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>PERINGATAN: MATIKAN ADAPTOR/LISTRIK PENGHUBUNG SEBELUM MELANJUTKAN</span>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
            <AlertCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              {isWebSerialSupported ? (
                <>
                  <strong className="text-slate-300">Petunjuk Android:</strong> Hubungkan kabel USB OTG dari HP Android ke port USB Arduino (Uno/Nano/Mega/ESP32). Pastikan fitur OTG aktif di pengaturan HP, lalu klik <strong>"Hubungkan Perangkat via USB"</strong>.
                </>
              ) : (
                <>
                  Web Serial belum aktif di browser ini. Anda dapat menguji semua pergerakan motor, jeda waktu, dan animasi menggunakan tombol <strong>"Mode Simulasi"</strong> di atas, atau buka di browser Chrome Android.
                </>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
