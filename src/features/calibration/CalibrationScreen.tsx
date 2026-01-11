import { useState, useEffect } from "react";
import { CameraFrame } from "../../components/CameraFrame";
import { useGesture } from "../../hooks/useGesture";
import { CalibrationStore } from "../../engine/CalibrationStore";

export const CalibrationScreen = ({ onBack }: { onBack: () => void }) => {
    const [step, setStep] = useState<"INTRO" | "HAND_CHECK" | "SENSITIVITY" | "DONE">("INTRO");
    const { landmarks } = useGesture();
    const [calibrationData, setCalibrationData] = useState(CalibrationStore.get());

    // Auto-advance hand check
    useEffect(() => {
        if (step === "HAND_CHECK" && landmarks?.hands?.landmarks?.length > 0) {
            const timer = setTimeout(() => {
                setStep("SENSITIVITY");
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [step, landmarks]);

    const saveAndExit = () => {
        CalibrationStore.save(calibrationData);
        onBack();
    };

    return (
        <div className="relative min-h-screen w-full bg-gray-900 text-white overflow-hidden flex flex-col font-sans">
            {/* Dynamic "Juicy" Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-red-900 to-orange-900 opacity-80" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />

            {/* Nav / Back Button */}
            <div className="absolute top-6 left-6 z-50">
                <button
                    onClick={onBack}
                    className="group flex items-center gap-2 bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/10 pl-2 pr-5 py-2 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
                >
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-red-500 transition-colors">
                        <span className="text-white font-bold">&larr;</span>
                    </div>
                    <span className="text-white font-bold tracking-wide text-sm font-mono">EXIT</span>
                </button>
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 w-full max-w-6xl mx-auto">

                {/* Main Glass Card */}
                <div className="w-full bg-black/40 border border-white/10 backdrop-blur-2xl rounded-[3rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden min-h-[600px]">

                    {/* LEFT: CONTENT WIZARD */}
                    <div className="w-full lg:w-1/2 p-10 md:p-14 flex flex-col justify-center relative">
                        {/* Stepper Dots */}
                        <div className="flex items-center gap-2 absolute top-10 left-10 md:left-14">
                            {["INTRO", "HAND_CHECK", "SENSITIVITY", "DONE"].map((s) => (
                                <div key={s} className={`h-2 rounded-full transition-all duration-500 ${step === s ? "w-8 bg-orange-500" : "w-2 bg-white/20"}`} />
                            ))}
                        </div>

                        {step === "INTRO" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
                                <div>
                                    <h2 className="text-5xl font-black text-white mb-2">Setup <span className="text-orange-500">Dojo</span></h2>
                                    <p className="text-xl text-gray-300">Optimize your camera for the best slicing experience.</p>
                                </div>

                                <div className="grid grid-cols-1 gap-3 py-4">
                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <span className="text-2xl">💡</span>
                                        <span className="font-medium text-gray-200">Use decent lighting</span>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <span className="text-2xl">📏</span>
                                        <span className="font-medium text-gray-200">Stand 2-3 feet away</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setStep("HAND_CHECK")}
                                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl font-black text-white text-lg shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    START CONFIG <span>→</span>
                                </button>
                            </div>
                        )}

                        {step === "HAND_CHECK" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 text-center">
                                <span className="text-6xl animate-bounce basis-full">✋</span>
                                <div>
                                    <h2 className="text-4xl font-black text-white mb-2">Raise Hand</h2>
                                    <p className="text-gray-300">Show your open palm to the camera.</p>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className={`h-full bg-green-500 transition-all duration-300 ${landmarks?.hands?.landmarks?.length ? "w-full" : "w-10 animate-pulse"}`} />
                                </div>
                                <p className={`font-mono font-bold uppercase tracking-widest ${landmarks?.hands?.landmarks?.length ? "text-green-400" : "text-orange-400"}`}>
                                    {landmarks?.hands?.landmarks?.length ? "HAND DETECTED" : "SEARCHING..."}
                                </p>
                            </div>
                        )}

                        {step === "SENSITIVITY" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                                <div>
                                    <h2 className="text-4xl font-black text-white mb-2">Speed</h2>
                                    <p className="text-gray-300">Adjust how fast your blade moves.</p>
                                </div>

                                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-6">
                                    <div className="flex justify-between items-center text-sm font-bold uppercase tracking-wider text-gray-400">
                                        <span>Slow</span>
                                        <span className="text-orange-400 text-lg">{calibrationData.sensitivity.toFixed(1)}x</span>
                                        <span>Fast</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.5" max="2.0" step="0.1"
                                        value={calibrationData.sensitivity}
                                        onChange={(e) => setCalibrationData(p => ({ ...p, sensitivity: parseFloat(e.target.value) }))}
                                        className="w-full h-4 bg-black/50 rounded-full appearance-none cursor-pointer accent-orange-500"
                                    />
                                </div>

                                <div className="flex items-center justify-center gap-3 opacity-60">
                                    <span className="text-2xl">✊</span>
                                    <span className="font-mono text-sm">FIST TO GRAB</span>
                                </div>

                                <button
                                    onClick={() => setStep("DONE")}
                                    className="w-full py-5 bg-white text-black rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    LOOKS GOOD
                                </button>
                            </div>
                        )}

                        {step === "DONE" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 text-center">
                                <div className="relative inline-block">
                                    <div className="absolute inset-0 bg-green-500 blur-2xl opacity-40 animate-pulse" />
                                    <span className="text-8xl relative z-10">✅</span>
                                </div>

                                <div>
                                    <h2 className="text-4xl font-black text-white mb-2">Ready!</h2>
                                    <p className="text-gray-300">You are all set to enter the Fruit Dojo.</p>
                                </div>

                                <button
                                    onClick={saveAndExit}
                                    className="w-full py-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-black text-2xl shadow-2xl shadow-green-900/30 hover:scale-[1.03] transition-all hover:shadow-green-500/30"
                                >
                                    ENTER ARENA
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: CAMERA FEED (Half width) */}
                    <div className="w-full lg:w-1/2 bg-black relative flex items-center justify-center p-8 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-100">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none" />

                        <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden border-[4px] border-white/10 shadow-2xl bg-gray-900 group">
                            <CameraFrame />

                            {/* Decorative Overlay */}
                            <div className="absolute inset-0 pointer-events-none border-[12px] border-white/5 rounded-3xl" />

                            {/* Grid Guidelines */}
                            {step !== 'DONE' && (
                                <div className="absolute inset-0 opacity-20 pointer-events-none">
                                    <div className="absolute top-1/2 left-0 w-full h-px bg-white" />
                                    <div className="absolute left-1/2 top-0 h-full w-px bg-white" />
                                    <div className="absolute inset-0 border-2 border-dashed border-white/50 m-12 rounded-2xl" />
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
