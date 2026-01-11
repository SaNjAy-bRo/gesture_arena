import { FilesetResolver, HandLandmarker, FaceLandmarker } from "@mediapipe/tasks-vision";
import { InputProcessor, type ProcessedInput } from "./InputProcessor";

export interface GestureData {
    hands: any; // Type properly later
    face: any;
    timestamp: number;
}

type GestureCallback = (data: ProcessedInput) => void;

class GestureEngine {
    private static instance: GestureEngine;
    private handLandmarker: HandLandmarker | null = null;
    private faceLandmarker: FaceLandmarker | null = null;
    private subscribers: Set<GestureCallback> = new Set();
    private videoElement: HTMLVideoElement | null = null;
    private lastVideoTime = -1;
    private requestAnimationFrameId: number | null = null;
    public isInitialized = false;
    private inputProcessor: InputProcessor;

    private constructor() {
        this.inputProcessor = new InputProcessor();
    }

    public static getInstance(): GestureEngine {
        if (!GestureEngine.instance) {
            GestureEngine.instance = new GestureEngine();
        }
        return GestureEngine.instance;
    }

    public async initialize() {
        if (this.isInitialized) return;

        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );

        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 2
        });

        // Face mesh is optional for now, but good to have setup
        this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                delegate: "GPU"
            },
            outputFaceBlendshapes: true,
            runningMode: "VIDEO",
            numFaces: 1
        });

        this.isInitialized = true;
        console.log("Gesture Engine Initialized");
    }

    private isCameraStarting = false;

    public async startCamera(videoElement: HTMLVideoElement) {
        if (this.isCameraStarting) {
            console.log("Camera start already in progress, skipping precise duplicate call...");
            return;
        }

        if (this.videoElement === videoElement && this.videoElement.srcObject && (this.videoElement.srcObject as MediaStream).active) {
            console.log("Camera already running on this element (start skipped)");
            this.predictWebcam();
            return;
        }

        this.isCameraStarting = true;
        this.videoElement = videoElement;

        console.log("Starting new camera stream...");
        try {
            // 1. Stop any existing stream globally first
            this.stopCameraStreams();

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user"
                }
            });

            // Check if we were stopped while waiting
            if (!this.videoElement) {
                console.warn("GestureEngine stopped while camera was starting. Stopping new stream.");
                stream.getTracks().forEach(t => t.stop());
                this.isCameraStarting = false;
                return;
            }

            this.videoElement.srcObject = stream;

            await new Promise((resolve) => {
                if (this.videoElement) {
                    this.videoElement.onloadeddata = () => {
                        resolve(true);
                    };
                } else {
                    resolve(true); // resolved anyway
                }
            });

            if (this.videoElement) {
                await this.videoElement.play();
                console.log("Camera stream playing, starting loop.");
                this.predictWebcam();
            }
        } catch (e) {
            console.error("Camera failed to start:", e);
        } finally {
            this.isCameraStarting = false;
        }
    }

    private stopCameraStreams() {
        if (this.videoElement && this.videoElement.srcObject) {
            const tracks = (this.videoElement.srcObject as MediaStream).getTracks();
            tracks.forEach(t => t.stop());
            this.videoElement.srcObject = null;
        }
    }

    private async predictWebcam() {
        if (!this.handLandmarker || !this.faceLandmarker || !this.videoElement) return;

        let startTimeMs = performance.now();

        if (this.lastVideoTime !== this.videoElement.currentTime) {
            this.lastVideoTime = this.videoElement.currentTime;

            const handResults = this.handLandmarker.detectForVideo(this.videoElement, startTimeMs);

            if (handResults.landmarks.length > 0) {
                // Hand detected
            }
            const faceResults = this.faceLandmarker.detectForVideo(this.videoElement, startTimeMs);

            const gestureData: GestureData = {
                hands: handResults,
                face: faceResults,
                timestamp: startTimeMs
            };

            const processed = this.inputProcessor.process(gestureData);
            this.notifySubscribers(processed);
        }

        this.requestAnimationFrameId = requestAnimationFrame(() => this.predictWebcam());
    }

    public subscribe(callback: GestureCallback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    private notifySubscribers(data: ProcessedInput) {
        this.subscribers.forEach(cb => cb(data));
    }

    public stop() {
        if (this.requestAnimationFrameId) {
            cancelAnimationFrame(this.requestAnimationFrameId);
            this.requestAnimationFrameId = null;
        }
        // We SHOULD stop the camera when the engine stops, to prevent "green light" persisting
        // when user navigates away or unmounts the game.
        this.stopCameraStreams();
        this.videoElement = null;
    }

}

export default GestureEngine;
