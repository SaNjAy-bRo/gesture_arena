import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import GestureEngine, { type GestureData } from '../engine/GestureEngine';
import type { ProcessedInput } from '../engine/InputProcessor';

interface GestureContextType {
    isReady: boolean;
    gesture: string;
    landmarks: GestureData | null;
    confidence: number;
}

const GestureContext = createContext<GestureContextType | null>(null);

export const GestureProvider = ({ children }: { children: ReactNode }) => {
    const [gestureState, setGestureState] = useState<GestureContextType>({
        isReady: false,
        gesture: 'NONE',
        landmarks: null,
        confidence: 0
    });

    useEffect(() => {
        const engine = GestureEngine.getInstance();

        const unsubscribe = engine.subscribe((data: ProcessedInput) => {
            // Batch updates to prevent multiple re-renders
            setGestureState({
                isReady: true, // If we are getting data, we are ready
                gesture: data.gesture,
                landmarks: data.raw,
                confidence: data.confidence
            });
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return (
        <GestureContext.Provider value={gestureState}>
            {children}
        </GestureContext.Provider>
    );
};

export const useGestureContext = () => {
    const context = useContext(GestureContext);
    if (!context) {
        throw new Error('useGestureContext must be used within a GestureProvider');
    }
    return context;
};
