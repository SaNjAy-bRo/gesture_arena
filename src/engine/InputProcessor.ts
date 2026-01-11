import type { GestureData } from "./GestureEngine";

export type GestureType = 'NONE' | 'FIST' | 'OPEN_PALM';

export interface ProcessedInput {
    raw: GestureData;
    gesture: GestureType;
    confidence: number;
}

export class InputProcessor {
    // Simple heuristic-based classification
    public process(data: GestureData): ProcessedInput {
        let detectedGesture: GestureType = 'NONE';
        let confidence = 0.0;

        if (data.hands && data.hands.landmarks && data.hands.landmarks.length > 0) {
            // Check the first hand
            const landmarks = data.hands.landmarks[0];
            detectedGesture = this.classifyHand(landmarks);
            confidence = 1.0; // Hardcoded for now until we have smoothing
        }

        return {
            raw: data,
            gesture: detectedGesture,
            confidence
        };
    }

    private classifyHand(landmarks: any[]): GestureType {
        // Landmarks: 0 = wrist, 8 = index tip, 12 = middle tip, 16 = ring tip, 20 = pinky tip
        // We can check if tips are below a certain threshold relative to wrist/palm center.
        // A simple way is to check if tips are closer to wrist than their respective PIP joints (knuckles).

        // Let's use distance from wrist (0)
        const wrist = landmarks[0];

        // Tips
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];

        // MCP joints (knuckles) - better reference than wrist for generic "bent" state
        const indexMcp = landmarks[5];
        const middleMcp = landmarks[9];
        const ringMcp = landmarks[13];
        const pinkyMcp = landmarks[17];

        // Calculate distances
        const dist = (p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

        const isFingerBent = (tip: any, mcp: any) => dist(tip, wrist) < dist(mcp, wrist);

        const bentCount = [
            isFingerBent(indexTip, indexMcp),
            isFingerBent(middleTip, middleMcp),
            isFingerBent(ringTip, ringMcp),
            isFingerBent(pinkyTip, pinkyMcp)
        ].filter(b => b).length;

        // Thumb is special, we'll ignore it for simple fist/palm for now or check if it's close to index MCP

        if (bentCount >= 3) {
            return 'FIST';
        } else if (bentCount <= 1) {
            return 'OPEN_PALM';
        }

        return 'NONE';
    }
}
