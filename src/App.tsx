import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Cpu,
  FileCode,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Info,
  SlidersHorizontal,
  Gauge,
  Terminal,
  BookOpen,
  Smartphone,
  Monitor,
  RotateCcw,
} from 'lucide-react';
import {
  ConnectionState,
  SerialLogEntry,
  MotorScheduleConfig,
  MotorDeviceState,
  ArduinoConfig,
  AngleOption,
} from './types/serial';
import {
  serialManager,
  playTactileTone,
  triggerHaptic,
} from './services/serialService';
import { ConnectionCard } from './components/ConnectionCard';
import { ThreeButtonControl } from './components/ThreeButtonControl';
import { ArduinoVisualizer } from './components/ArduinoVisualizer';
import { SerialMonitor } from './components/SerialMonitor';
import { ArduinoCodeModal } from './components/ArduinoCodeModal';
import { SettingsModal } from './components/SettingsModal';

type MobileActiveTab = 'control' | 'visualizer' | 'terminal' | 'guide';

const DEFAULT_CONFIG: ArduinoConfig = {
  baudRate: 9600,
  commandMotor1: 'M1',
  commandJeda: 'JEDA',
  commandMotor2: 'M2',
  lineEnding: '\n',
  hapticFeedback: true,
  soundFeedback: true,
};

const DEFAULT_SCHEDULE: MotorScheduleConfig = {
  motor1Seconds: 4,
  jedaSeconds: 8, // Asumsi default 8 detik jeda (minimal 2 detik)
  motor2Seconds: 4,
  motor1Angle: 90,
  motor2Angle: 90,
  operationMode: 'continuous',
  timedMinutes: 15,
};

export default function App() {
  // Navigation tabs for mobile screen view
  const [activeTab, setActiveTab] = useState<MobileActiveTab>('control');

  // Desktop simulator frame toggle
  const [isMobileFrameMode, setIsMobileFrameMode] = useState<boolean>(false);

  // Connection state
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [connectionInfo, setConnectionInfo] = useState<string>('Belum Terhubung');
  const [isSimulated, setIsSimulated] = useState<boolean>(false);

  // Serial hardware activity indicators
  const [rxActive, setRxActive] = useState<boolean>(false);
  const [txActive, setTxActive] = useState<boolean>(false);
  const rxTimerRef = useRef<NodeJS.Timeout | null>(null);
  const txTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Configuration for Motor Schedule and Serial
  const [scheduleConfig, setScheduleConfig] = useState<MotorScheduleConfig>(DEFAULT_SCHEDULE);
  const [config, setConfig] = useState<ArduinoConfig>(DEFAULT_CONFIG);

  // Device state for live simulation & runner
  const [deviceState, setDeviceState] = useState<MotorDeviceState>({
    isRunning: false,
    currentPhase: 'idle',
    phaseSecondsLeft: 0,
    totalSecondsLeft: DEFAULT_SCHEDULE.timedMinutes * 60,
    motor1Angle: 0,
    motor2Angle: 0,
    motor1Direction: 'diam',
    motor2Direction: 'diam',
    motor1TargetAngle: DEFAULT_SCHEDULE.motor1Angle,
    motor2TargetAngle: DEFAULT_SCHEDULE.motor2Angle,
    cycleCount: 0,
    pinStates: {
      pinServo1: false,
      pinServo2: false,
      pinStatusLed: false,
    },
  });

  // Runner interval reference
  const runnerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentPhaseRef = useRef<MotorDeviceState['currentPhase']>('idle');
  const phaseSecondsLeftRef = useRef<number>(0);
  const totalSecondsLeftRef = useRef<number>(0);
  const cycleCountRef = useRef<number>(0);

  // Logs & Modals
  const [logs, setLogs] = useState<SerialLogEntry[]>([]);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warn' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'warn' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3200);
  }, []);

  const triggerRxActivity = useCallback(() => {
    setRxActive(true);
    if (rxTimerRef.current) clearTimeout(rxTimerRef.current);
    rxTimerRef.current = setTimeout(() => setRxActive(false), 200);
  }, []);

  const triggerTxActivity = useCallback(() => {
    setTxActive(true);
    if (txTimerRef.current) clearTimeout(txTimerRef.current);
    txTimerRef.current = setTimeout(() => setTxActive(false), 200);
  }, []);

  // Update schedule configuration
  const handleUpdateScheduleConfig = (updated: Partial<MotorScheduleConfig>) => {
    setScheduleConfig((prev) => {
      const next = { ...prev, ...updated };
      if (next.jedaSeconds < 2) next.jedaSeconds = 2;
      return next;
    });

    if (updated.motor1Angle) {
      setDeviceState((prev) => ({ ...prev, motor1TargetAngle: updated.motor1Angle! }));
    }
    if (updated.motor2Angle) {
      setDeviceState((prev) => ({ ...prev, motor2TargetAngle: updated.motor2Angle! }));
    }
  };

  // Initialize Serial Service callbacks
  useEffect(() => {
    serialManager.setCallbacks({
      onStateChange: (state, info) => {
        setConnectionState(state);
        if (info) setConnectionInfo(info);
        setIsSimulated(serialManager.getIsSimulated());

        if (state === 'connected') {
          showToast('Perangkat Berhasil Terhubung!', 'success');
          if (config.hapticFeedback) triggerHaptic(80);
          if (config.soundFeedback) playTactileTone(1200, 70);
        } else if (state === 'disconnected') {
          showToast('Koneksi Perangkat Terputus.', 'warn');
          handleStop();
        }
      },
      onLog: (entry) => {
        setLogs((prev) => [...prev.slice(-150), entry]);
        if (entry.type === 'rx') triggerRxActivity();
        else if (entry.type === 'tx') triggerTxActivity();
      },
      onRxActivity: triggerRxActivity,
      onTxActivity: triggerTxActivity,
    });

    // Initial welcome logs
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    setLogs([
      {
        id: 'init-1',
        timestamp: timeStr,
        type: 'sys',
        message: 'Aplikasi Siap. Servo Motor 1 (Pin D9) & Servo Motor 2 (Pin D10).',
      },
      {
        id: 'init-2',
        timestamp: timeStr,
        type: 'sys',
        message: 'Perhatian: Matikan adaptor/listrik sebelum menghubungkan kabel USB.',
      },
    ]);
  }, [showToast, config.hapticFeedback, config.soundFeedback, triggerRxActivity, triggerTxActivity]);

  // Connect via USB OTG
  const handleConnectReal = async () => {
    if (config.soundFeedback) playTactileTone(700, 30);
    const success = await serialManager.connectReal(config.baudRate);
    if (!success && !serialManager.isWebSerialSupported()) {
      showToast('Browser belum mendukung Web Serial langsung. Aktifkan Mode Simulasi.', 'warn');
    }
  };

  // Toggle simulation mode
  const handleToggleSimulated = () => {
    if (config.soundFeedback) playTactileTone(800, 30);
    if (connectionState === 'connected' && isSimulated) {
      serialManager.disconnect();
    } else {
      serialManager.connectSimulated(config.baudRate);
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    if (config.soundFeedback) playTactileTone(400, 30);
    handleStop();
    await serialManager.disconnect();
  };

  // Stop running sequence
  const handleStop = useCallback(() => {
    if (runnerTimerRef.current) {
      clearInterval(runnerTimerRef.current);
      runnerTimerRef.current = null;
    }

    currentPhaseRef.current = 'idle';
    setDeviceState((prev) => ({
      ...prev,
      isRunning: false,
      currentPhase: 'idle',
      phaseSecondsLeft: 0,
      motor1Angle: 0,
      motor2Angle: 0,
      motor1Direction: 'diam',
      motor2Direction: 'diam',
      pinStates: { pinServo1: false, pinServo2: false, pinStatusLed: false },
    }));

    if (connectionState === 'connected') {
      serialManager.sendCommand('STOP', config.lineEnding);
    }

    if (config.soundFeedback) playTactileTone(350, 60);
    if (config.hapticFeedback) triggerHaptic(40);
  }, [connectionState, config.lineEnding, config.soundFeedback, config.hapticFeedback]);

  // Apply and Start the Cycle Sequence
  const handleApply = async () => {
    if (connectionState !== 'connected') {
      showToast('Perangkat belum terhubung! Silakan hubungkan USB atau aktifkan Mode Simulasi.', 'warn');
      if (config.soundFeedback) playTactileTone(250, 90);
      return;
    }

    const safeJeda = Math.max(2, scheduleConfig.jedaSeconds);

    if (config.soundFeedback) playTactileTone(1000, 50);
    if (config.hapticFeedback) triggerHaptic(60);

    const serialPayload = `START:M1=${scheduleConfig.motor1Seconds}s_${scheduleConfig.motor1Angle}deg,JEDA=${safeJeda}s,M2=${scheduleConfig.motor2Seconds}s_${scheduleConfig.motor2Angle}deg,MODE=${scheduleConfig.operationMode},TIME=${scheduleConfig.timedMinutes}m`;
    await serialManager.sendCommand(serialPayload, config.lineEnding);

    showToast('✓ Pengaturan DITERAPKAN! Siklus Motor Dimulai.', 'success');

    if (runnerTimerRef.current) clearInterval(runnerTimerRef.current);

    currentPhaseRef.current = 'motor1';
    phaseSecondsLeftRef.current = scheduleConfig.motor1Seconds;
    totalSecondsLeftRef.current = scheduleConfig.timedMinutes * 60;
    cycleCountRef.current = 0;

    setDeviceState({
      isRunning: true,
      currentPhase: 'motor1',
      phaseSecondsLeft: scheduleConfig.motor1Seconds,
      totalSecondsLeft: scheduleConfig.timedMinutes * 60,
      motor1Angle: scheduleConfig.motor1Angle,
      motor2Angle: 0,
      motor1Direction: 'maju',
      motor2Direction: 'diam',
      motor1TargetAngle: scheduleConfig.motor1Angle,
      motor2TargetAngle: scheduleConfig.motor2Angle,
      cycleCount: 0,
      pinStates: { pinServo1: true, pinServo2: false, pinStatusLed: true },
    });

    runnerTimerRef.current = setInterval(() => {
      if (scheduleConfig.operationMode === 'timed') {
        totalSecondsLeftRef.current -= 1;
        if (totalSecondsLeftRef.current <= 0) {
          handleStop();
          showToast('Operasi Selesai: Batas Waktu Menit Telah Tercapai!', 'success');
          return;
        }
      }

      phaseSecondsLeftRef.current -= 1;

      if (phaseSecondsLeftRef.current <= 0) {
        if (currentPhaseRef.current === 'motor1') {
          currentPhaseRef.current = 'jeda';
          phaseSecondsLeftRef.current = safeJeda;
          serialManager.sendCommand('PHASE:JEDA', config.lineEnding);

          setDeviceState((prev) => ({
            ...prev,
            currentPhase: 'jeda',
            phaseSecondsLeft: safeJeda,
            totalSecondsLeft: totalSecondsLeftRef.current,
            motor1Angle: 0,
            motor2Angle: 0,
            motor1Direction: 'diam',
            motor2Direction: 'diam',
            pinStates: { pinServo1: false, pinServo2: false, pinStatusLed: false },
          }));
        } else if (currentPhaseRef.current === 'jeda') {
          currentPhaseRef.current = 'motor2';
          phaseSecondsLeftRef.current = scheduleConfig.motor2Seconds;
          serialManager.sendCommand('PHASE:MOTOR2', config.lineEnding);

          setDeviceState((prev) => ({
            ...prev,
            currentPhase: 'motor2',
            phaseSecondsLeft: scheduleConfig.motor2Seconds,
            totalSecondsLeft: totalSecondsLeftRef.current,
            motor1Angle: 0,
            motor2Angle: scheduleConfig.motor2Angle,
            motor1Direction: 'diam',
            motor2Direction: 'maju',
            pinStates: { pinServo1: false, pinServo2: true, pinStatusLed: true },
          }));
        } else if (currentPhaseRef.current === 'motor2') {
          cycleCountRef.current += 1;
          const nextCycle = cycleCountRef.current;

          currentPhaseRef.current = 'motor1';
          phaseSecondsLeftRef.current = scheduleConfig.motor1Seconds;
          serialManager.sendCommand(`CYCLE:#${nextCycle + 1}_MOTOR1`, config.lineEnding);

          setDeviceState((prev) => ({
            ...prev,
            currentPhase: 'motor1',
            cycleCount: nextCycle,
            phaseSecondsLeft: scheduleConfig.motor1Seconds,
            totalSecondsLeft: totalSecondsLeftRef.current,
            motor1Angle: scheduleConfig.motor1Angle,
            motor2Angle: 0,
            motor1Direction: 'maju',
            motor2Direction: 'diam',
            pinStates: { pinServo1: true, pinServo2: false, pinStatusLed: true },
          }));
        }
      } else {
        if (currentPhaseRef.current === 'motor1') {
          const isForward = phaseSecondsLeftRef.current > scheduleConfig.motor1Seconds / 2;
          setDeviceState((prev) => ({
            ...prev,
            phaseSecondsLeft: phaseSecondsLeftRef.current,
            totalSecondsLeft: totalSecondsLeftRef.current,
            motor1Angle: isForward ? scheduleConfig.motor1Angle : 0,
            motor1Direction: isForward ? 'maju' : 'kembali',
            motor2Angle: 0,
            motor2Direction: 'diam',
          }));
        } else if (currentPhaseRef.current === 'motor2') {
          const isForward = phaseSecondsLeftRef.current > scheduleConfig.motor2Seconds / 2;
          setDeviceState((prev) => ({
            ...prev,
            phaseSecondsLeft: phaseSecondsLeftRef.current,
            totalSecondsLeft: totalSecondsLeftRef.current,
            motor2Angle: isForward ? scheduleConfig.motor2Angle : 0,
            motor2Direction: isForward ? 'maju' : 'kembali',
            motor1Angle: 0,
            motor1Direction: 'diam',
          }));
        } else {
          setDeviceState((prev) => ({
            ...prev,
            phaseSecondsLeft: phaseSecondsLeftRef.current,
            totalSecondsLeft: totalSecondsLeftRef.current,
            motor1Angle: 0,
            motor2Angle: 0,
            motor1Direction: 'diam',
            motor2Direction: 'diam',
          }));
        }
      }
    }, 1000);
  };

  // Test single motor
  const handleTestSingle = async (target: 'motor1' | 'jeda' | 'motor2') => {
    if (connectionState !== 'connected') {
      showToast('Hubungkan USB atau aktifkan simulasi terlebih dahulu.', 'warn');
      return;
    }

    if (config.soundFeedback) playTactileTone(800, 40);
    if (config.hapticFeedback) triggerHaptic(30);

    if (target === 'motor1') {
      await serialManager.sendCommand(`TEST:MOTOR1_0_TO_${scheduleConfig.motor1Angle}_TO_0`, config.lineEnding);
      setDeviceState((prev) => ({
        ...prev,
        motor1Angle: scheduleConfig.motor1Angle,
        motor1Direction: 'maju',
        motor2Angle: 0,
        motor2Direction: 'diam',
      }));
      setTimeout(() => {
        setDeviceState((prev) => ({
          ...prev,
          motor1Angle: 0,
          motor1Direction: 'kembali',
        }));
        setTimeout(() => {
          setDeviceState((prev) => ({ ...prev, motor1Direction: 'diam' }));
        }, 800);
      }, 900);
      showToast(`Uji Motor 1: 0° ➔ ${scheduleConfig.motor1Angle}° ➔ 0°`, 'success');
    } else if (target === 'motor2') {
      await serialManager.sendCommand(`TEST:MOTOR2_0_TO_${scheduleConfig.motor2Angle}_TO_0`, config.lineEnding);
      setDeviceState((prev) => ({
        ...prev,
        motor2Angle: scheduleConfig.motor2Angle,
        motor2Direction: 'maju',
        motor1Angle: 0,
        motor1Direction: 'diam',
      }));
      setTimeout(() => {
        setDeviceState((prev) => ({
          ...prev,
          motor2Angle: 0,
          motor2Direction: 'kembali',
        }));
        setTimeout(() => {
          setDeviceState((prev) => ({ ...prev, motor2Direction: 'diam' }));
        }, 800);
      }, 900);
      showToast(`Uji Motor 2: 0° ➔ ${scheduleConfig.motor2Angle}° ➔ 0°`, 'success');
    } else {
      await serialManager.sendCommand(`TEST:JEDA_${Math.max(2, scheduleConfig.jedaSeconds)}SEC`, config.lineEnding);
      setDeviceState((prev) => ({
        ...prev,
        motor1Angle: 0,
        motor2Angle: 0,
        motor1Direction: 'diam',
        motor2Direction: 'diam',
      }));
      showToast(`Uji Jeda Diam: ${Math.max(2, scheduleConfig.jedaSeconds)} detik`, 'success');
    }
  };

  // Test manual angle from visualizer
  const handleApplyManualAngle = async (motor: 'motor1' | 'motor2', angle: AngleOption) => {
    if (motor === 'motor1') {
      handleUpdateScheduleConfig({ motor1Angle: angle });
      setDeviceState((prev) => ({ ...prev, motor1Angle: angle, motor1TargetAngle: angle }));
      if (connectionState === 'connected') {
        await serialManager.sendCommand(`SET:M1_ANGLE=${angle}`, config.lineEnding);
      }
      setTimeout(() => {
        if (!deviceState.isRunning) {
          setDeviceState((prev) => ({ ...prev, motor1Angle: 0 }));
        }
      }, 1200);
      showToast(`Sudut Motor 1 diubah & diuji: ${angle}°`, 'success');
    } else {
      handleUpdateScheduleConfig({ motor2Angle: angle });
      setDeviceState((prev) => ({ ...prev, motor2Angle: angle, motor2TargetAngle: angle }));
      if (connectionState === 'connected') {
        await serialManager.sendCommand(`SET:M2_ANGLE=${angle}`, config.lineEnding);
      }
      setTimeout(() => {
        if (!deviceState.isRunning) {
          setDeviceState((prev) => ({ ...prev, motor2Angle: 0 }));
        }
      }, 1200);
      showToast(`Sudut Motor 2 diubah & diuji: ${angle}°`, 'success');
    }
  };

  // Custom command from Serial Monitor
  const handleSendCustom = async (msg: string) => {
    if (connectionState !== 'connected') {
      showToast('Hubungkan perangkat terlebih dahulu.', 'warn');
      return;
    }
    await serialManager.sendCommand(msg, config.lineEnding);
  };

  useEffect(() => {
    return () => {
      if (runnerTimerRef.current) clearInterval(runnerTimerRef.current);
    };
  }, []);

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-all duration-300 ${
      isMobileFrameMode ? 'items-center justify-center p-0 md:p-6 bg-slate-900' : ''
    }`}>
      {/* 
        Container Frame: 
        If isMobileFrameMode on desktop: Rendered inside a sleek 390px x 844px mobile screen mock
        Otherwise: Fits 100% of current screen size on any device!
      */}
      <div className={`w-full flex flex-col bg-slate-950 transition-all ${
        isMobileFrameMode
          ? 'max-w-[412px] h-[890px] rounded-3xl border-4 border-slate-700 shadow-2xl overflow-hidden relative'
          : 'flex-1 max-w-4xl mx-auto'
      }`}>
        {/* Top App Bar Contract */}
        <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-3.5 sm:px-5 py-2.5 sm:py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-md shadow-cyan-950/50">
              <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-bold tracking-tight text-white block leading-tight">
                Arduino Motor Controller
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Servo Pin D9 & D10 · Jeda
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Desktop toggle for Mobile Screen Size Preview */}
            <button
              onClick={() => setIsMobileFrameMode(!isMobileFrameMode)}
              className="hidden md:flex h-8 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 items-center gap-1.5 transition-colors cursor-pointer"
              title="Ubah antara Tampilan Layar HP dan Layar Lebar"
            >
              {isMobileFrameMode ? <Monitor className="w-3.5 h-3.5 text-cyan-400" /> : <Smartphone className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{isMobileFrameMode ? 'Layar Penuh' : 'Ukuran Layar HP'}</span>
            </button>

            <button
              onClick={() => setIsCodeModalOpen(true)}
              className="h-8 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
              title="Lihat Kode Arduino (.ino)"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Kode .ino</span>
            </button>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="h-8 w-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Pengaturan Serial & Perintah"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 px-3.5 py-2 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 border transition-all animate-in fade-in slide-in-from-top-2 duration-200 max-w-[90vw] ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/95 text-emerald-200 border-emerald-500/50 shadow-emerald-950/50'
                : 'bg-amber-950/95 text-amber-200 border-amber-500/50 shadow-amber-950/50'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
            <span className="truncate">{toastMessage.text}</span>
          </div>
        )}

        {/* 
          Main Scrollable Content Area:
          Adapted to fit current mobile screen size ergonomically.
        */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 space-y-3.5 pb-20 sm:pb-6">
          {/* 
            Desktop View: Shows all modules cleanly stacked or side-by-side
            Mobile View: Tabbed navigation lets user switch between Kontrol, Visualizer, Terminal, and Panduan!
          */}

          {/* TAB 1: KONTROL */}
          {(activeTab === 'control' || (!isMobileFrameMode && window.innerWidth >= 1024)) && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <ConnectionCard
                connectionState={connectionState}
                connectionInfo={connectionInfo}
                isSimulated={isSimulated}
                baudRate={config.baudRate}
                isWebSerialSupported={serialManager.isWebSerialSupported()}
                rxActive={rxActive}
                txActive={txActive}
                onConnectReal={handleConnectReal}
                onToggleSimulated={handleToggleSimulated}
                onDisconnect={handleDisconnect}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
              />

              <ThreeButtonControl
                scheduleConfig={scheduleConfig}
                onUpdateScheduleConfig={handleUpdateScheduleConfig}
                currentPhase={deviceState.currentPhase}
                isRunning={deviceState.isRunning}
                phaseSecondsLeft={deviceState.phaseSecondsLeft}
                totalSecondsLeft={deviceState.totalSecondsLeft}
                connectionState={connectionState}
                onApply={handleApply}
                onStop={handleStop}
                onTestSingle={handleTestSingle}
              />
            </div>
          )}

          {/* TAB 2: VISUALIZER (Simulasi Respon Perangkat Motor) */}
          {(activeTab === 'visualizer' || (!isMobileFrameMode && window.innerWidth >= 1024)) && (
            <div className="animate-in fade-in duration-150">
              <ArduinoVisualizer
                deviceState={deviceState}
                txActive={txActive}
                rxActive={rxActive}
                isConnected={connectionState === 'connected'}
                onApplyManualAngle={handleApplyManualAngle}
              />
            </div>
          )}

          {/* TAB 3: SERIAL MONITOR & TERMINAL */}
          {(activeTab === 'terminal' || (!isMobileFrameMode && window.innerWidth >= 1024)) && (
            <div className="animate-in fade-in duration-150">
              <SerialMonitor
                logs={logs}
                onSendCustom={handleSendCustom}
                onClear={() => setLogs([])}
                isConnected={connectionState === 'connected'}
              />
            </div>
          )}

          {/* TAB 4: PANDUAN & PINOUT ARDUINO */}
          {(activeTab === 'guide' || (!isMobileFrameMode && window.innerWidth >= 1024)) && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Panduan Sambungan & Pinout Motor</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-cyan-400 font-bold block mb-1">SERVO MOTOR 1</span>
                  <span className="text-slate-400">Pin Sinyal PWM: </span>
                  <strong className="text-white">Pin D9</strong>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-amber-400 font-bold block mb-1">SERVO MOTOR 2</span>
                  <span className="text-slate-400">Pin Sinyal PWM: </span>
                  <strong className="text-white">Pin D10</strong>
                </div>
              </div>

              <div className="bg-amber-950/60 p-3 rounded-xl border border-amber-600/60 text-amber-200 text-[11px] font-medium leading-relaxed">
                <strong>PENTING:</strong> Matikan adaptor/listrik sebelum menghubungkan kabel USB OTG ke Arduino untuk mencegah lonjakan arus ke HP Android.
              </div>

              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed pl-1">
                <li>Motor 1 bergerak dari 0° ➔ 90° lalu kembali lagi ke 0°.</li>
                <li>Jeda diam sesuai input (default 8 detik, minimal 2 detik).</li>
                <li>Motor 2 bergerak dari 0° ➔ 90° lalu kembali lagi ke 0°.</li>
                <li>Siklus berulang terus atau berhenti sesuai timer menit.</li>
              </ol>
            </div>
          )}
        </main>

        {/* 
          Mobile Bottom Tab Bar (Fixed to current mobile screen bottom zone):
          Allows 1-thumb fast switching between Kontrol, Visualizer, Terminal, and Panduan!
        */}
        <nav className="fixed md:hidden bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 px-2 py-1.5 pb-safe flex items-center justify-around">
          <button
            type="button"
            onClick={() => setActiveTab('control')}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'control'
                ? 'text-cyan-400 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] tracking-tight">Kontrol</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visualizer')}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'visualizer'
                ? 'text-cyan-400 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {deviceState.isRunning && (
              <span className="absolute top-0.5 right-6 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
            <Gauge className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] tracking-tight">Visualizer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terminal')}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'terminal'
                ? 'text-cyan-400 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Terminal className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] tracking-tight">Terminal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'text-cyan-400 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] tracking-tight">Panduan</span>
          </button>
        </nav>
      </div>

      {/* Arduino Sketch (.ino) Modal */}
      <ArduinoCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        config={config}
        scheduleConfig={scheduleConfig}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={config}
        onUpdateConfig={(updated) => setConfig((prev) => ({ ...prev, ...updated }))}
        onResetDefaults={() => setConfig(DEFAULT_CONFIG)}
      />
    </div>
  );
}
