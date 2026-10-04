import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Trash2, Send, ArrowDownCircle } from 'lucide-react';
import { SerialLogEntry } from '../types/serial';

interface SerialMonitorProps {
  logs: SerialLogEntry[];
  onSendCustom: (msg: string) => void;
  onClear: () => void;
  isConnected: boolean;
}

export const SerialMonitor: React.FC<SerialMonitorProps> = ({
  logs,
  onSendCustom,
  onClear,
  isConnected,
}) => {
  const [customInput, setCustomInput] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    onSendCustom(customInput.trim());
    setCustomInput('');
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Serial Monitor / Log Data
          </h4>
          <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
            {logs.length} baris
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`text-xs px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer ${
              autoScroll ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/60' : 'bg-slate-800 text-slate-400'
            }`}
            title="Auto-scroll ke bawah saat ada pesan baru"
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Auto-scroll</span>
          </button>

          <button
            type="button"
            onClick={onClear}
            className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
            title="Hapus riwayat log"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bersihkan</span>
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div
        ref={logContainerRef}
        className="h-44 sm:h-52 overflow-y-auto bg-slate-950 rounded-xl p-3 font-mono text-xs space-y-1.5 border border-slate-800/80 shadow-inner"
      >
        {logs.length === 0 ? (
          <div className="text-slate-600 text-center py-12 italic">
            Belum ada log transmisi serial. Sambungkan Arduino atau tekan tombol untuk memulai.
          </div>
        ) : (
          logs.map((log) => {
            let badgeClass = 'text-slate-400';
            let badgeLabel = 'SYS';
            let textClass = 'text-slate-300';

            if (log.type === 'tx') {
              badgeClass = 'text-amber-400 font-bold';
              badgeLabel = 'TX >>';
              textClass = 'text-amber-200';
            } else if (log.type === 'rx') {
              badgeClass = 'text-emerald-400 font-bold';
              badgeLabel = '<< RX';
              textClass = 'text-emerald-200';
            } else if (log.type === 'error') {
              badgeClass = 'text-rose-400 font-bold';
              badgeLabel = 'ERR';
              textClass = 'text-rose-300';
            }

            return (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed break-all">
                <span className="text-slate-500 text-[10px] shrink-0 select-none">
                  [{log.timestamp}]
                </span>
                <span className={`text-[10px] shrink-0 ${badgeClass} select-none`}>
                  {badgeLabel}
                </span>
                <span className={textClass}>{log.message}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Custom Command Input */}
      <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder={isConnected ? 'Ketik perintah custom (cth: LED_ON, RESET)...' : 'Hubungkan Arduino untuk kirim perintah'}
          disabled={!isConnected}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!isConnected || !customInput.trim()}
          className="min-h-[38px] px-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Kirim</span>
        </button>
      </form>
    </div>
  );
};
