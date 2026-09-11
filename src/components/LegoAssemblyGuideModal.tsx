import React, { useState } from "react";
import { X, ArrowRight, ArrowLeft, CheckCircle2, Bluetooth, Smartphone, Cog, Radio, Sparkles } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnectLego?: () => void;
}

export default function LegoAssemblyGuideModal({ isOpen, onClose, onConnectLego }: Props) {
  const [currentStep, setCurrentStep] = useState(1);

  if (!isOpen) return null;

  const totalSteps = 4;

  const steps = [
    {
      step: 1,
      title: "Chassis & Differential Drive Motors",
      subtitle: "Mounting the 2 primary drive motors to the hub frame",
      badge: "Motors (Port A & B)",
      icon: Cog,
      accent: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              1. Left Drive Motor (Port A)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Attach the Medium/Large Angular Motor to the left flank of your LEGO chassis. Plug its connector into <strong>Port A</strong> on the 51515 / SPIKE Hub.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              2. Right Drive Motor (Port B)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Attach the second motor symmetrically to the right flank. Plug into <strong>Port B</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs font-mono text-cyan-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Kinematics Standard Specs:
            </div>
            <p className="text-slate-300 text-[11px]">
              • Wheel Diameter: <strong>56 mm</strong> (Standard LEGO Technic Wheel)
              <br />
              • Track Width: <strong>14.0 cm</strong> between wheel center lines
            </p>
          </div>
        </div>
      ),
    },
    {
      step: 2,
      title: "Smartphone Brain Mount (NPU Head)",
      subtitle: "Securing your phone as the robotic sensory head",
      badge: "AI Head & Camera",
      icon: Smartphone,
      accent: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              1. Technic Beam Phone Cradle
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Build a 4-stud wide clamp cradle using LEGO Technic Liftarms and friction pins directly on top of the 51515 Hub.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              2. Camera Alignment
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ensure the rear camera lens points directly forward with an unobstructed optical field of view. The screen faces forward to display animated emotive eyes.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300">
            <strong>Pro Tip:</strong> Any standard Android smartphone or iPhone running Chrome / Safari can act as the brain. No high-end hardware required.
          </div>
        </div>
      ),
    },
    {
      step: 3,
      title: "Sensors & LED Matrix Wiring",
      subtitle: "Ultrasonic sonar, IMU gyroscope, and 5x5 pixel face",
      badge: "Perception Wiring",
      icon: Radio,
      accent: "text-purple-400 bg-purple-500/10 border-purple-500/30",
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              1. Ultrasonic Sonar (Port C / D)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Mount the LEGO Ultrasonic Distance Sensor at the front bumper (approx. 3-5 cm above the floor). Plug into <strong>Port C</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              2. Integrated 6-Axis IMU & 5x5 LED Face
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              The internal hub gyroscope automatically reports pitch, roll, and heading (yaw). The 5x5 LED matrix lights up with expressive emotions synchronized with the phone screen!
            </p>
          </div>
        </div>
      ),
    },
    {
      step: 4,
      title: "Web Bluetooth LWP3 Pairing",
      subtitle: "Connecting directly via Web Bluetooth without installing apps",
      badge: "Ready to Ship",
      icon: Bluetooth,
      accent: "text-blue-400 bg-blue-500/10 border-blue-500/30",
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              1. Power ON Hub
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Press and hold the center power button on your LEGO 51515 Hub until the white LED ring begins to pulse.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              2. Pair over Web Bluetooth
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Click the button below. Your browser will prompt to pair with <strong>LEGO Technic Large Hub</strong>. Done!
            </p>
          </div>

          {onConnectLego && (
            <button
              onClick={() => {
                onClose();
                onConnectLego();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bluetooth className="w-4 h-4" />
              <span>Connect LEGO 51515 Hub Now</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  const cur = steps[currentStep - 1];
  const StepIcon = cur.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${cur.accent}`}>
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">LEGO 51515 Assembly Guide</h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Step {currentStep} of {totalSteps}
                </span>
              </div>
              <p className="text-xs text-slate-400">{cur.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="grid grid-cols-4 gap-1.5 px-5 pt-3 bg-slate-950/40">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx <= currentStep
                  ? "bg-gradient-to-r from-amber-500 to-cyan-400 shadow-sm"
                  : "bg-slate-800"
              }`}
            />
          ))}
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              {cur.badge}
            </span>
          </div>
          {cur.content}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentStep((p) => Math.max(1, p - 1))}
            disabled={currentStep === 1}
            className="px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={() => setCurrentStep((p) => Math.min(totalSteps, p + 1))}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready to Launch!</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
