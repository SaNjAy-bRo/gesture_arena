
import { useState } from 'react';
import { CameraFrame } from './components/CameraFrame';
import { Layout } from './components/layout/Layout';
import { CalibrationScreen } from './features/calibration/CalibrationScreen';
import { ReflexStrikeGame } from './games/reflex-strike/ReflexStrikeGame';

type Screen = 'HOME' | 'CALIBRATION' | 'GAME_REFLEX' | 'GAME_MEMORY';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('HOME');

  // Game Screens (Full Screen, No Layout)
  if (currentScreen === 'GAME_REFLEX') {
    return <ReflexStrikeGame onBack={() => setCurrentScreen('HOME')} />;
  }

  // Standard App Screens (Wrapped in Layout)
  return (
    <Layout>
      {currentScreen === 'HOME' && (
        <div className="relative flex items-center justify-center min-h-screen w-full overflow-hidden bg-gray-900 selection:bg-yellow-500/50">

          {/* Dynamic "Juicy" Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-red-900 to-orange-900 opacity-80" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />

          {/* Floating Background Fruits (Decorative) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-10 left-[10%] text-9xl blur-sm opacity-20 animate-bounce delay-1000 rotate-12">🍉</div>
            <div className="absolute bottom-20 right-[10%] text-9xl blur-sm opacity-20 animate-bounce delay-700 -rotate-12">🍍</div>
            <div className="absolute top-1/2 right-[5%] text-8xl blur-md opacity-10 animate-pulse delay-500">🍇</div>
            <div className="absolute bottom-[10%] left-[20%] text-8xl blur-md opacity-20 animate-pulse delay-200">🍊</div>
          </div>

          {/* Main Content Container */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">

            {/* Left Col: Hero Text & Actions */}
            <div className="flex flex-col gap-8 text-center lg:text-left animate-in slide-in-from-bottom-8 duration-700">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 w-fit mx-auto lg:mx-0 backdrop-blur-md shadow-lg transform hover:scale-105 transition-transform">
                  <span className="text-xl">🥋</span>
                  <span className="text-sm font-bold text-white tracking-wider uppercase">Master Your Reflexes</span>
                </div>

                <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter leading-[0.85] drop-shadow-2xl">
                  FRUIT <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 relative">
                    DOJO
                    <span className="absolute -top-4 -right-8 text-6xl animate-pulse">⚔️</span>
                  </span>
                </h1>

                <p className="text-xl text-orange-100/80 max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed drop-shadow-md">
                  Enter the ultimate gesture arena. Slice fruits with your bare hands. <br />
                  <span className="text-yellow-400 font-bold">No controller needed.</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-5 w-full max-w-lg mx-auto lg:mx-0 mt-4">
                <button
                  onClick={() => setCurrentScreen('GAME_REFLEX')}
                  className="group relative flex-1 px-8 py-6 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-3xl font-black text-white text-2xl shadow-[0_10px_40px_-10px_rgba(234,88,12,0.6)] hover:scale-[1.03] active:scale-[0.98] transition-all overflow-hidden border-2 border-orange-400/50"
                >
                  <div className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform duration-300 transform skew-y-12" />
                  <span className="relative flex items-center justify-center gap-3 drop-shadow-md">
                    PLAY NOW <span className="group-hover:rotate-12 transition-transform">🗡️</span>
                  </span>
                </button>

                <button
                  onClick={() => setCurrentScreen('CALIBRATION')}
                  className="flex-1 px-8 py-6 bg-white/10 border-2 border-white/20 rounded-3xl font-bold text-white hover:bg-white/20 transition-all backdrop-blur-md flex items-center justify-center gap-3 shadow-xl"
                >
                  <span>⚙️</span> SETUP
                </button>
              </div>

              {/* Badges */}
              <div className="flex items-center justify-center lg:justify-start gap-4 pt-4">
                <div className="bg-black/30 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 flex items-center gap-2">
                  <span className="text-lg">📷</span>
                  <span className="text-xs font-bold text-gray-300">CAMERA REQUIRED</span>
                </div>
                <div className="bg-black/30 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <span className="text-xs font-bold text-gray-300">AI POWERED</span>
                </div>
              </div>
            </div>

            {/* Right Col: Camera "Mirror" - Styled like a floating card */}
            <div className="relative group perspective-1000 hidden lg:block">
              <div className="relative transform group-hover:rotate-1 transition-transform duration-700 ease-out-expo">
                {/* Splash Effect behind */}
                <div className="absolute -inset-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-[2.5rem] blur-xl opacity-30 group-hover:opacity-50 transition-opacity animate-pulse" />

                <div className="relative rounded-[2rem] overflow-hidden border-[3px] border-white/20 bg-gray-900 shadow-2xl">
                  {/* Decorative Header */}
                  <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-black/60 to-transparent z-10 flex items-center justify-between px-6 pointer-events-none">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-[10px] font-bold text-white/50 tracking-widest uppercase">Mirror Feed</span>
                  </div>

                  {/* Wrapper for aspect ratio */}
                  <div className="aspect-[4/3] bg-gray-800 w-full">
                    <CameraFrame />
                  </div>

                  {/* Overlay Interaction Hint */}
                  <div className="absolute bottom-0 left-0 w-full p-6 text-center bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white/90 text-sm font-medium">✨ Check your lighting here</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {currentScreen === 'CALIBRATION' && (
        <CalibrationScreen onBack={() => setCurrentScreen('HOME')} />
      )}
    </Layout>
  );
}

export default App
