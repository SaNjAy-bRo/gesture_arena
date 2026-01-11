export interface CalibrationData {
    handSizeScale: number; // 1.0 is default
    sensitivity: number;   // 0.0 to 1.0
}

const STORAGE_KEY = "gesture_arena_calibration";

const DEFAULT_CALIBRATION: CalibrationData = {
    handSizeScale: 1.0,
    sensitivity: 0.5
};

export const CalibrationStore = {
    get: (): CalibrationData => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                return { ...DEFAULT_CALIBRATION, ...JSON.parse(raw) };
            }
        } catch (e) {
            console.error("Failed to load calibration", e);
        }
        return DEFAULT_CALIBRATION;
    },

    save: (data: CalibrationData) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("Failed to save calibration", e);
        }
    }
};
