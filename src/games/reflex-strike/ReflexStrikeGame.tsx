import { useEffect, useRef, useState } from 'react';
import { CameraFrame } from '../../components/CameraFrame';
import { useGesture } from '../../hooks/useGesture';

type GameState = 'IDLE' | 'PLAYING' | 'GAME_OVER';

type TargetType = 'FRUIT' | 'BOMB';

// Physics Entity
type Target = {
    id: number;
    x: number;      // 0-1
    y: number;      // 0-1
    vx: number;     // velocity x
    vy: number;     // velocity y
    rotation: number;
    rotationSpeed: number;
    color: string;
    emoji: string;
    type: TargetType;
};

const GRAVITY = 0.0005; // Gravity per frame
const SPAWN_RATE = 1000; // ms

export const ReflexStrikeGame = ({ onBack }: { onBack: () => void }) => {
    const { gesture, landmarks } = useGesture();
    const [gameState, setGameState] = useState<GameState>('IDLE');
    const [showInstructions, setShowInstructions] = useState(true); // New: Separate Instruction Phase
    const [score, setScore] = useState(0);
    const [gameOverReason, setGameOverReason] = useState<'TIME' | 'BOMB' | null>(null);
    const [hitFeedback, setHitFeedback] = useState<{ x: number, y: number, id: number, val: string }[]>([]);
    const [timeLeft, setTimeLeft] = useState(60);
    const [targets, setTargets] = useState<Target[]>([]);

    // Game Loop Refs
    const targetsRef = useRef<Target[]>([]);
    const reqRef = useRef<number>(0);
    const lastSpawnRef = useRef<number>(0);
    const timeRef = useRef<number>(Date.now());
    const gameActiveRef = useRef<boolean>(false);
    const cursorRef = useRef<HTMLDivElement>(null);
    const cursorPositionRef = useRef<{ x: number, y: number } | null>(null);

    // Update cursor directly for performance
    useEffect(() => {
        if (landmarks?.hands?.landmarks?.length && landmarks.hands.landmarks.length > 0) {
            const point = landmarks.hands.landmarks[0][8]; // Index Finger Tip
            if (point) {
                // Mirror X axis to match the mirrored camera view
                const x = 1 - point.x;
                const y = point.y;

                cursorPositionRef.current = { x, y };

                if (cursorRef.current) {
                    cursorRef.current.style.display = 'flex';
                    cursorRef.current.style.transform = `translate3d(calc(${x * 100}vw - 50%), calc(${y * 100}vh - 50%), 0)`;
                }
            }
        } else {
            cursorPositionRef.current = null;
            if (cursorRef.current) {
                cursorRef.current.style.display = 'none';
            }
        }
    }, [landmarks]);

    // Start Game Trigger
    useEffect(() => {
        // Condition: Not Active, In Idle Mode, Instructions Dismissed, Fist Detected
        if (!gameActiveRef.current && gameState === 'IDLE' && !showInstructions && gesture === 'FIST') {
            startGame();
        }
    }, [gesture, gameState, showInstructions]);

    const timerRef = useRef<number>(0);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (reqRef.current) cancelAnimationFrame(reqRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startGame = () => {
        setGameState('PLAYING');
        gameActiveRef.current = true;
        setScore(0);
        setGameOverReason(null);
        setTimeLeft(60);
        targetsRef.current = [];
        setTargets([]);
        setHitFeedback([]);
        lastSpawnRef.current = Date.now();
        timeRef.current = Date.now();

        if (reqRef.current) cancelAnimationFrame(reqRef.current);
        if (timerRef.current) clearInterval(timerRef.current);

        gameLoop();

        // Timer
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    endGame('TIME');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const endGame = (reason: 'TIME' | 'BOMB') => {
        setGameState('GAME_OVER');
        setGameOverReason(reason);
        gameActiveRef.current = false;
        if (reqRef.current) cancelAnimationFrame(reqRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    // Main Physics Loop
    const gameLoop = () => {
        if (!gameActiveRef.current) return;
        const now = Date.now();

        // 1. Spawning
        if (now - lastSpawnRef.current > SPAWN_RATE) {
            spawnTarget();
            lastSpawnRef.current = now;
        }

        // 2. Physics Update
        let activeTargets = targetsRef.current.map(t => ({
            ...t,
            x: t.x + t.vx,
            y: t.y + t.vy,
            vy: t.vy + GRAVITY, // Apply gravity
            rotation: t.rotation + t.rotationSpeed
        }));

        // Keep only visible objects
        targetsRef.current = activeTargets.filter(t => t.y < 1.3);

        setTargets([...targetsRef.current]);

        if (gameActiveRef.current) {
            reqRef.current = requestAnimationFrame(gameLoop);
        }
    };

    const spawnTarget = () => {
        const id = Date.now();
        const startX = 0.2 + Math.random() * 0.6; // Spawn in middle 60% (Prevents edge clipping)

        // Logic: 15% chance of Bomb
        const isBomb = Math.random() < 0.15;

        // Launch Physics
        const vy = -0.025 - (Math.random() * 0.01); // Stronger Upward force
        const vx = (Math.random() - 0.5) * 0.01; // Drift

        let targetProps;
        if (isBomb) {
            targetProps = {
                type: 'BOMB' as TargetType,
                color: 'bg-black',
                emoji: '💣'
            };
        } else {
            const fruits = [
                { color: 'bg-red-500', emoji: '🍎' },
                { color: 'bg-yellow-400', emoji: '🍌' },
                { color: 'bg-orange-500', emoji: '🍊' },
                { color: 'bg-green-500', emoji: '🥝' },
                { color: 'bg-purple-500', emoji: '🍇' },
            ];
            targetProps = {
                type: 'FRUIT' as TargetType,
                ...fruits[Math.floor(Math.random() * fruits.length)]
            };
        }

        targetsRef.current.push({
            id,
            x: startX,
            y: 1.1, // Start below screen
            vx,
            vy,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 5,
            ...targetProps
        });
    };

    // Collision / Hit Logic
    useEffect(() => {
        if (!cursorPositionRef.current || gameState !== 'PLAYING') return;

        const cursor = cursorPositionRef.current;
        const HIT_RADIUS = 0.15;
        const hitIds: number[] = [];
        let bombHit = false;

        targetsRef.current.forEach(t => {
            const dist = Math.hypot(cursor.x - t.x, cursor.y - t.y);

            if (dist < HIT_RADIUS) {
                hitIds.push(t.id);

                if (t.type === 'BOMB') {
                    bombHit = true;
                } else {
                    // Fruit Hit
                    setScore(s => s + 10);
                    setTimeLeft(t => Math.min(t + 1, 60)); // +1 Second Bonus, max 60
                    setHitFeedback(prev => [...prev, { x: t.x, y: t.y, id: Date.now(), val: '+10' }]);
                    setTimeout(() => setHitFeedback(p => p.slice(1)), 800);
                }
            }
        });

        if (bombHit) {
            endGame('BOMB');
            return;
        }

        if (hitIds.length > 0) {
            targetsRef.current = targetsRef.current.filter(t => !hitIds.includes(t.id));
            setTargets([...targetsRef.current]);
        }

    }, [landmarks]); // Run collision check whenever landmarks update

    return (
        <div className="fixed inset-0 w-full h-full bg-[#1a1110] overflow-hidden font-sans select-none z-[9999]">
            {/* HIDDEN CAMERA (Required for Tracking) */}
            <div className="absolute inset-0 z-[-1] opacity-0 pointer-events-none">
                <CameraFrame />
            </div>

            {/* BACKGROUND: DOJO CUTTING BOARD */}
            <div className="absolute inset-0 z-0 opacity-100 pointer-events-none">
                {/* Wood Texture Base */}
                <div className="absolute inset-0 bg-[#2d1b14] bg-[radial-gradient(circle_at_center,_#4a2c20_0%,_#2d1b14_100%)] shadow-inner" />

                {/* Wood Grain Lines */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />

                {/* Slash Marks (Decorative) */}
                <div className="absolute top-1/3 left-1/4 w-96 h-1 bg-white/5 rotate-45 blur-sm" />
                <div className="absolute bottom-1/3 right-1/4 w-64 h-1 bg-white/5 -rotate-12 blur-sm" />

                {/* Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,black_100%)] opacity-60" />
            </div>

            {/* --- TOP HUD (Professional, Split) --- */}
            {/* Only visible during PLAYING or IDLE (Game Over has its own full UI) */}
            {gameState !== 'GAME_OVER' && (
                <div className="absolute top-0 left-0 w-full p-6 z-50 flex justify-between items-start pointer-events-none">

                    {/* LEFT: EXIT BUTTON */}
                    <div className="pointer-events-auto">
                        <button
                            onClick={onBack}
                            className="group flex items-center gap-3 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
                        >
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-red-500 transition-colors">
                                <span className="text-white font-bold text-lg">&larr;</span>
                            </div>
                            <span className="text-white font-bold tracking-wider text-sm hidden md:block">EXIT ARENA</span>
                        </button>
                    </div>

                    {/* RIGHT: STATS (Score & Time) */}
                    <div className="flex items-center gap-4 md:gap-6">
                        {/* SCORE CARD */}
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1 shadow-black drop-shadow-md">Score</span>
                            <div className="bg-black/40 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl min-w-[140px] text-center shadow-xl">
                                <span className="text-4xl md:text-5xl font-black text-white slashed-zero tabular-nums tracking-tight text-shadow-sm">
                                    {score}
                                </span>
                            </div>
                        </div>

                        {/* TIME CARD */}
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1 shadow-black drop-shadow-md">Time</span>
                            <div className={`bg-black/40 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl min-w-[140px] text-center shadow-xl ${timeLeft < 10 ? "animate-pulse border-red-500/50" : ""}`}>
                                <span className={`text-4xl md:text-5xl font-black slashed-zero tabular-nums tracking-tight ${timeLeft < 10 ? "text-red-500" : "text-white"}`}>
                                    {timeLeft}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* OPTIMIZED BLADE CURSOR (DOM Ref) */}
            <div
                ref={cursorRef}
                className="fixed z-[9999] pointer-events-none items-center justify-center hidden will-change-transform"
                style={{ left: 0, top: 0 }}
            >
                {/* Blade Glow */}
                <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full scale-125 md:scale-150" />

                {/* Main Blade Visual */}
                <div className="relative" style={{ width: 'clamp(32px, 8vmin, 96px)', height: 'clamp(32px, 8vmin, 96px)' }}>
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(0,190,255,0.8)] filter">
                        <path d="M20,85 L80,20" stroke="white" strokeWidth="4" strokeLinecap="round" className="animate-pulse" />
                        <path d="M25,80 L10,95" stroke="#888" strokeWidth="8" strokeLinecap="round" /> {/* Handle */}
                        <circle cx="25" cy="80" r="2" fill="cyan" />
                        <path d="M25,80 Q50,50 80,20" fill="none" stroke="cyan" strokeWidth="2" strokeOpacity="0.5" />
                    </svg>
                </div>
            </div>

            {/* --- GAME OVER SCREEN (Pro) --- */}
            {gameState === 'GAME_OVER' && (
                <div className="fixed inset-0 w-screen h-screen z-[10000] flex flex-col items-center justify-between bg-black/95 backdrop-blur-2xl animate-in zoom-in-95 pointer-events-auto p-6 md:p-12 overflow-y-auto min-h-[500px]">

                    {/* Header Group */}
                    <div className="text-center mt-4">
                        <h2 className="text-4xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500 tracking-tighter drop-shadow-2xl mb-2">
                            GAME OVER
                        </h2>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30 backdrop-blur-sm">
                            <span className="text-xl md:text-2xl">
                                {gameOverReason === 'BOMB' ? "💥" : "⌛"}
                            </span>
                            <span className="text-red-400 font-bold uppercase tracking-widest text-xs md:text-lg">
                                {gameOverReason === 'BOMB' ? "Boom! Bomb Hit" : "Time Limit Reached"}
                            </span>
                        </div>
                    </div>

                    {/* MASSIVE SCORE DISPLAY */}
                    <div className="relative group my-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" />
                        <div className="relative bg-black/40 border border-white/10 rounded-3xl p-6 md:p-16 min-w-[280px] md:min-w-[600px] text-center backdrop-blur-xl shadow-2xl">
                            <span className="block text-blue-400 font-bold tracking-[0.3em] text-xs md:text-xl mb-4 md:mb-6 uppercase">Final Score</span>
                            <span className="block text-[4rem] md:text-[10rem] leading-none font-black text-white tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                                {score}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col md:flex-row gap-4 md:gap-8 w-full max-w-sm md:max-w-3xl mb-4">
                        <button
                            onClick={() => startGame()}
                            className="flex-1 bg-white text-black text-lg md:text-3xl font-black py-4 md:py-8 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(255,255,255,0.4)] flex items-center justify-center gap-2"
                        >
                            <span className="text-2xl">↻</span> REPLAY
                        </button>
                        <button
                            onClick={onBack}
                            className="flex-1 bg-gray-900 border border-white/20 text-white text-lg md:text-3xl font-bold py-4 md:py-8 rounded-2xl hover:bg-gray-800 active:scale-[0.98] transition-all"
                        >
                            EXIT
                        </button>
                    </div>
                </div>
            )}

            {/* --- GAME ENTITIES LAYER --- */}
            <div className="absolute inset-0 z-[100] pointer-events-none">

                {/* 1. INSTRUCTIONS OVERLAY (First Load) - FIXED POS + SAFE COLORS */}
                {gameState === 'IDLE' && showInstructions && (
                    <div className="fixed inset-0 flex items-center justify-center z-[2000] bg-black/80 backdrop-blur-lg p-6 animate-in fade-in zoom-in-95 pointer-events-auto">
                        <div className="max-w-5xl w-full bg-gray-900 border border-white/20 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-none overflow-y-auto">

                            {/* Visual Side */}
                            <div className="w-full md:w-2/5 bg-gradient-to-br from-orange-600 via-red-600 to-red-800 p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                                <div className="hidden md:block text-[8rem] lg:text-[12rem] mb-6 relative z-10 animate-bounce">🥷</div>
                                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter relative z-10 drop-shadow-md">Sensei Says</h2>
                                <p className="text-white/90 mt-2 font-medium relative z-10 text-lg">"Become the blade."</p>
                            </div>

                            {/* Info Side */}
                            <div className="w-full md:w-3/5 p-8 md:p-12 flex flex-col bg-gray-900 text-white">
                                <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                                    <h3 className="text-3xl font-bold flex items-center gap-3">
                                        <span className="w-2 h-8 bg-blue-500 rounded-full" /> How to Play
                                    </h3>
                                    <div className="bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30">
                                        <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Gesture Controls</span>
                                    </div>
                                </div>

                                <div className="space-y-6 flex-1">
                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="text-3xl">👆</div>
                                        <div>
                                            <h4 className="font-bold text-lg text-blue-300">Point to Aim</h4>
                                            <p className="text-gray-400">Move your index finger to control the cursor.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="text-3xl">🍎</div>
                                        <div>
                                            <h4 className="font-bold text-lg text-green-400">Slice Fruits</h4>
                                            <p className="text-gray-400">Hover over fruits to slice them. <span className="text-green-400 font-bold">+10 Pts</span></p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="text-3xl">💣</div>
                                        <div>
                                            <h4 className="font-bold text-lg text-red-500">Avoid Bombs</h4>
                                            <p className="text-gray-400">Touching a bomb ends the game instantly.</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowInstructions(false)}
                                    className="mt-8 w-full bg-white text-black font-black text-2xl py-5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
                                >
                                    <span>🗡️</span> ENTER ARENA
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. LOBBY / IDLE (Ready to Start) */}
                {gameState === 'IDLE' && !showInstructions && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 p-4">
                        <div className="mb-12 text-center pointer-events-auto">
                            <h1 className="text-6xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 drop-shadow-2xl italic tracking-tighter mb-4">
                                FRUIT ARENA
                            </h1>
                        </div>

                        {/* Start Trigger */}
                        <div className="flex items-center gap-6 bg-black/60 backdrop-blur-md border border-white/20 pl-6 pr-10 py-6 rounded-full animate-pulse shadow-2xl">
                            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-4xl shadow-lg border border-white/20">
                                ✊
                            </div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-black text-white uppercase tracking-wider">Raise Fist</span>
                                <span className="text-base text-gray-300 font-bold uppercase tracking-widest">To Start Game</span>
                            </div>
                        </div>

                        {/* Hint for instructions */}
                        <button
                            onClick={() => setShowInstructions(true)}
                            className="mt-8 text-neutral-400 hover:text-white text-sm font-bold transition-colors pointer-events-auto underline decoration-neutral-600 underline-offset-4 tracking-wide uppercase"
                        >
                            Show Instructions
                        </button>
                    </div>
                )}

                {/* MOVING TARGETS */}
                {targets.map(t => (
                    <div
                        key={t.id}
                        className="fixed flex items-center justify-center pointer-events-none"
                        style={{
                            left: 0,
                            top: 0,
                            width: 'clamp(130px, 30vmin, 300px)',
                            height: 'clamp(130px, 30vmin, 300px)',
                            transform: `translate(calc(${t.x * 100}vw - 50%), calc(${t.y * 100}vh - 50%)) rotate(${t.rotation}deg)`,
                            zIndex: 100
                        }}
                    >
                        <span
                            className="flex items-center justify-center w-full h-full select-none"
                            style={{
                                fontSize: 'clamp(110px, 25vmin, 280px)',
                                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'
                            }}
                        >
                            {t.emoji}
                        </span>
                    </div>
                ))}

                {/* HIT FEEDBACK */}
                {hitFeedback.map(hit => (
                    <div
                        key={hit.id}
                        className="fixed font-black text-yellow-300 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] animate-out fade-out slide-out-to-top-12 duration-500 z-[200] pointer-events-none"
                        style={{
                            left: 0,
                            top: 0,
                            fontSize: 'clamp(40px, 10vmin, 100px)',
                            transform: `translate(calc(${hit.x * 100}vw - 50%), calc(${hit.y * 100}vh - 50%))`
                        }}
                    >
                        {hit.val}
                    </div>
                ))}
            </div>
        </div>
    );
};

