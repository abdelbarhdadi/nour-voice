import React, { useState, useRef, useEffect } from 'react';
import { DIALECTS, VOICE_TYPES, getBaseVoiceForType } from './constants';
import { GenerationHistory, VoiceControls } from './types';
import { nourService } from './services/geminiService';

// --- Intro Ultra-Légère ---
const CinematicIntro: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [stage, setStage] = useState<'titles' | 'reveal' | 'fadeout'>('titles');

  useEffect(() => {
    const t1 = setTimeout(() => setStage('reveal'), 2000);
    const t2 = setTimeout(() => setStage('fadeout'), 4000);
    const t3 = setTimeout(onComplete, 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] bg-white flex items-center justify-center transition-opacity duration-700 ${stage === 'fadeout' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="text-center px-4">
        <div className={`${stage === 'titles' ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000`}>
          <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-[#9333ea]">NOUR VOICE</h2>
          <div className="h-1 w-12 bg-[#9333ea] mx-auto mt-4"></div>
        </div>
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${stage === 'reveal' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <img src="https://i.postimg.cc/h4YZvfBr/unnamed-8.jpg" alt="Logo" className="h-40 w-40 rounded-full shadow-lg" />
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState<boolean>(() => sessionStorage.getItem('v2_played') !== 'true');
  const [selectedDialectId, setSelectedDialectId] = useState(DIALECTS[0].id);
  const [selectedGender, setSelectedGender] = useState('ذكر');
  const [selectedVoiceName, setSelectedVoiceName] = useState('');
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResult, setCurrentResult] = useState<GenerationHistory | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const selectedDialect = DIALECTS.find(d => d.id === selectedDialectId) || DIALECTS[0];
  const filteredProfiles = selectedDialect.profiles.filter(p => p.gender === (selectedGender === 'ذكر' ? 'male' : 'female'));

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    try {
      const activeVoice = filteredProfiles.find(p => p.name === selectedVoiceName) || filteredProfiles[0];
      const baseVoice = getBaseVoiceForType(VOICE_TYPES[0], activeVoice?.gender || 'male');
      const audioUrl = await nourService.generateVoiceOver(inputText, baseVoice, "Professional");
      
      setCurrentResult({
        id: Math.random().toString(),
        text: inputText,
        selection: { dialect: selectedDialect.title, type: 'Standard', field: 'Production', controls: {} as any },
        timestamp: Date.now(),
        audioBlobUrl: audioUrl
      });
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) { console.error(err); } finally { setIsGenerating(false); }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 overflow-hidden" style={{ transform: 'translate3d(0,0,0)' }}>
      {showIntro && <CinematicIntro onComplete={() => { setShowIntro(false); sessionStorage.setItem('v2_played', 'true'); }} />}
      
      <div className="h-full w-full overflow-y-auto overflow-x-hidden touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="max-w-xl mx-auto px-4 py-8 flex flex-col items-center">
          
          <header className="mb-8 text-center">
            <img src="https://i.postimg.cc/h4YZvfBr/unnamed-8.jpg" alt="Logo" className="h-20 w-20 mx-auto rounded-full mb-4" />
            <h1 className="text-3xl font-black text-gray-900">NOUR VOICE</h1>
          </header>

          <div className="w-full space-y-6 pb-12">
            {/* INPUT SCRIPT */}
            <div className="bg-white border border-gray-200 rounded-3xl p-5">
              <textarea 
                className="w-full h-32 bg-transparent text-lg outline-none resize-none"
                placeholder="Votre texte ici..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>

            {/* DIALECTE */}
            <div className="bg-white border border-gray-200 rounded-3xl p-5">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-4 text-center">Dialecte / اللهجة</p>
              <div className="grid grid-cols-1 gap-2">
                {DIALECTS.map(d => (
                  <button 
                    key={d.id} 
                    onClick={() => setSelectedDialectId(d.id)}
                    className={`p-4 rounded-2xl border transition-all text-right flex justify-between items-center ${selectedDialectId === d.id ? 'border-[#9333ea] bg-[#9333ea]/5' : 'border-gray-100 bg-gray-50'}`}
                  >
                    <div className={`h-3 w-3 rounded-full ${selectedDialectId === d.id ? 'bg-[#9333ea]' : 'bg-gray-200'}`}></div>
                    <span className="font-bold text-sm">{d.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* VOIX */}
            <div className="bg-white border border-gray-200 rounded-3xl p-5">
              <div className="flex justify-center bg-gray-100 rounded-full p-1 mb-6 w-fit mx-auto">
                {['ذكر', 'أنثى'].map(g => (
                  <button key={g} onClick={() => setSelectedGender(g)} className={`px-6 py-2 rounded-full text-xs font-bold ${selectedGender === g ? 'bg-white text-[#9333ea] shadow-sm' : 'text-gray-500'}`}>
                    {g === 'ذكر' ? 'Homme' : 'Femme'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {filteredProfiles.map(p => (
                  <button key={p.name} onClick={() => setSelectedVoiceName(p.name)} className={`p-3 rounded-xl border text-center ${selectedVoiceName === p.name ? 'border-[#9333ea] bg-[#9333ea]/5' : 'border-gray-50 bg-gray-50'}`}>
                    <span className="font-bold text-xs block truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ACTION */}
            <button 
              onClick={handleGenerate} 
              disabled={isGenerating || !inputText}
              className={`w-full py-5 rounded-3xl font-bold text-lg text-white shadow-lg transition-transform active:scale-95 ${isGenerating ? 'bg-gray-300' : 'bg-[#9333ea]'}`}
            >
              {isGenerating ? '...' : 'GÉNÉRER'}
            </button>

            {/* PLAYER SIMPLE */}
            {currentResult && (
              <div className="bg-black text-white p-5 rounded-3xl flex items-center gap-4">
                <button onClick={() => isPlaying ? audioRef.current?.pause() : audioRef.current?.play()} className="h-12 w-12 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                  {isPlaying ? '■' : '▶'}
                </button>
                <div className="flex-1 text-xs font-mono truncate">STUDIO_OUTPUT_FINAL.MP3</div>
                <a href={currentResult.audioBlobUrl} download className="text-[#9333ea] font-bold">SAVE</a>
              </div>
            )}
          </div>
        </div>
        <audio ref={audioRef} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} className="hidden" />
      </div>
    </div>
  );
};

export default App;