# 🎮 Gesture Arena

**Gesture Arena** is a futuristic, browser-based motion-controlled gaming platform. It transforms your webcam into a game controller using advanced computer vision (MediaPipe), allowing you to play arcade-style games with simple hand gestures.

## 🕹️ Currently Playable: **Fruit Arena**

A high-tech twist on the classic fruit-slicing genre.
*   **Theme**: Ninja Dojo (Dark Wood Aesthetic)
*   **Controls**:
    *   **Raise Fist**: Start Game
    *   **Index Finger**: Control the **Cyan Energy Blade** cursor
*   **Gameplay**: Slice fruits for points, avoid bombs!

## 🚀 Key Features

*   **Hand Tracking Engine**: Powered by Google MediaPipe for real-time, low-latency gesture detection.
*   **Responsive UI**: Optimized for both Desktop (large responsive cursor) and Mobile (touch/gesture friendly layouts).
*   **High Performance**: Built with React + Vite + Tailwind CSS for smooth 60fps gameplay.
*   **Privacy First**: All video processing happens locally on your device. No video is sent to the cloud.

## 🛠️ Tech Stack

*   **Frontend**: React (TypeScript), Vite
*   **Styling**: Tailwind CSS
*   **Vision AI**: MediaPipe Hand Landmarker
*   **State Management**: React Context API

## 🏁 Getting Started

1.  **Clone the repository**
    ```bash
    git clone https://github.com/SaNjAy-bRo/gesture_arena.git
    cd gesture_arena
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

4.  **Play!**
    Open your browser to the local URL (usually `http://localhost:5173`) and grant camera permissions.

## 📱 Mobile Support

The game is optimized for mobile browsers.
*   **Portrait Mode**: Best for one-handed play.
*   **Performance**: may vary based on device processing power (GPU acceleration recommended).

## 📄 License

MIT License. Created by [SaNjAy-bRo](https://github.com/SaNjAy-bRo).
