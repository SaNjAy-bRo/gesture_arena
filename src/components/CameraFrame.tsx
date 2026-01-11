import { useEffect, useRef, useState } from "react";
import GestureEngine from "../engine/GestureEngine";
import type { ProcessedInput } from "../engine/InputProcessor";

export const CameraFrame = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const engine = GestureEngine.getInstance();
        let unsubscribe: (() => void) | null = null;
        let isMounted = true;

        const init = async () => {
            try {
                await engine.initialize();
                if (!isMounted) return;

                if (videoRef.current) {
                    await engine.startCamera(videoRef.current);
                    if (videoRef.current.srcObject) {
                        setIsLoaded(true);
                    } else {
                        setError("Camera failed to start. Please allow camera access.");
                    }
                }
            } catch (err) {
                console.error("Initialization error:", err);
                if (isMounted) setError("Failed to initialize vision system.");
            }

            unsubscribe = engine.subscribe((data: ProcessedInput) => {
                drawResults(data);
            });
        };

        const timeout = setTimeout(init, 100); // Small delay to ensure DOM is ready and reduce race conditions

        return () => {
            isMounted = false;
            clearTimeout(timeout);
            if (unsubscribe) unsubscribe();
            engine.stop();
        };
    }, []);

    const drawResults = (data: ProcessedInput) => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // IMMEDIATE DEBUG DRAW (To prove canvas visibility)
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.fillStyle = "red";
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText("CANVAS TEST", 10, 50);

        // Match canvas size to video size
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw gesture text
        ctx.save();

        // STANDARD MIRROR TRANSFORM
        // 1. Move origin to right edge
        ctx.translate(canvas.width, 0);
        // 2. Flip x-axis
        ctx.scale(-1, 1);

        // TEST CIRCLE (Center) - Prove Transform Works
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 20, 0, 2 * Math.PI);
        ctx.fillStyle = "cyan";
        ctx.fill();

        // Landmark Connections (Skeleton)
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],   // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8],   // Index
            [0, 9], [9, 10], [10, 11], [11, 12], // Middle
            [0, 13], [13, 14], [14, 15], [15, 16], // Ring
            [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
            [5, 9], [9, 13], [13, 17] // Palm Base (Knuckles)
        ];

        const handsDetected = data.raw.hands?.landmarks?.length || 0;
        let firstPoint = null;

        if (handsDetected > 0) {
            for (const landmarks of data.raw.hands.landmarks) {
                if (!firstPoint) firstPoint = landmarks[0];
                // Draw Connections
                ctx.lineWidth = 4;
                ctx.lineCap = "round";
                ctx.strokeStyle = "#00FF00"; // Bright Green
                ctx.beginPath();
                for (const [start, end] of connections) {
                    const p1 = landmarks[start];
                    const p2 = landmarks[end];
                    ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
                    ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
                }
                ctx.stroke();

                // Draw Key Points
                for (const point of landmarks) {
                    ctx.beginPath();
                    ctx.arc(point.x * canvas.width, point.y * canvas.height, 6, 0, 2 * Math.PI);
                    ctx.fillStyle = "#FFFFFF"; // White joints
                    ctx.fill();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "#000000";
                    ctx.stroke();
                }
            }
        }

        ctx.restore();

        // Draw Debug Text (Unmirrored)
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(10, 10, 250, 100);
        ctx.font = "bold 14px monospace";
        ctx.fillStyle = "#00FF00";
        ctx.fillText(`Hands: ${handsDetected}`, 20, 30);

        if (firstPoint) {
            ctx.fillStyle = "yellow";
            ctx.fillText(`P0.x: ${firstPoint.x.toFixed(3)}`, 20, 50);
            ctx.fillText(`P0.y: ${firstPoint.y.toFixed(3)}`, 20, 70);
            ctx.fillText(`Canvas: ${canvas.width}x${canvas.height}`, 20, 90);
        } else {
            ctx.fillStyle = "gray";
            ctx.fillText("No Points", 20, 50);
            ctx.fillText(`Canvas: ${canvas.width}x${canvas.height}`, 20, 70);
        }

        if (data.gesture) {
            ctx.fillStyle = "cyan";
            ctx.fillText(`Gesture: ${data.gesture}`, 20, 105); // Fixed Y pos
        }
        ctx.restore();
    };

    return (
        <div className="relative w-full h-full bg-black overflow-hidden">
            {/* LAYER 1: VIDEO (Background) */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 z-0"
                autoPlay
                playsInline
                muted
            />

            {/* LAYER 2: CANVAS (Overlay) */}
            {/* Note: No CSS transform on canvas, we handle mirroring in the 2D context drawing */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
            />

            {/* LAYER 3: LOADING STATE */}
            {!isLoaded && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white font-bold z-20">
                    Initializing Vision System...
                </div>
            )}

            {/* LAYER 4: ERROR STATE */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-red-500 font-bold p-4 text-center z-50">
                    <p className="text-xl mb-2">⚠️ Error</p>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            )}
        </div>
    );
};
