import React, { useState, useRef, useEffect } from 'react';
import { DIALECTS, VOICE_TYPES, getBaseVoiceForType } from './constants';
import { GenerationHistory } from './types';
import { nourService } from './services/geminiService';

// --- Intro Ultra-Performance (Zéro Saccade) ---
const CinematicIntro: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [stage, setStage] = useState<'titles' | 'reveal' | 'fadeout'>('titles');

  useEffect(() => {
    const t1 = setTimeout(() => setStage('reveal'), 1800);
    const t2 = setTimeout(() => setStage('fadeout'), 3500);
    const t3 = setTimeout(onComplete, 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] bg-white flex items-center justify-center transition-opacity duration-500 ${stage === 'fadeout' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="text-center">
        <div className={`transition-all duration-700 transform ${stage === 'titles' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <h2 className="text-5xl font-black tracking-tighter text-[#9333ea]">NOUR</h2>
          <div className="h-1.5 w-8 bg-[#9333ea] mx-auto mt-2 rounded-full"></div>
        </div>
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${stage === 'reveal' ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <img src="https://i.postimg.cc/h4YZvfBr/unnamed-8.jpg" alt="Logo" className="h-32 w-32 rounded-full border-4 border-gray-50 shadow-sm" />
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState<boolean>(() => sessionStorage.getItem('v3_fast') !== 'true');
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

  // Empêcher le scroll horizontal au niveau JS par sécurité
  useEffect(() => {
    document.body.style.overflowX = 'hidden';
  }, []);

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
      }
    } catch (err) { console.error(err); } finally { setIsGenerating(false); }
  };

  return (
    <div className="fixed inset-0 bg-[#fdfdff] overflow-hidden">
      {showIntro && <CinematicIntro onComplete={() => { setShowIntro(false); sessionStorage.setItem('v3_fast', 'true'); }} />}
      
      {/* Container principal avec défilement fluide uniquement vertical */}
      <div className="h-full w-full overflow-y-auto overflow-x-hidden touch-pan-y flex flex-col items-center" style={{ WebkitOverflowScrolling: 'touch' }}>
        
        <div className="w-full max-w-lg px-5 py-10 space-y-8">
          
          <header className="text-center space-y-4">
            <div className="inline-block p-1 bg-white rounded-full border border-gray-100 shadow-sm">
              <img src="https://i.postimg.cc/h4YZvfBr/unnamed-8.jpg" alt="Logo" className="h-20 w-20 rounded-full" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">NOUR VOICE</h1>
              <p className="text-[10px] font-bold text-[#9333ea] tracking-[0.4em] uppercase opacity-60">Engine v3.0</p>
            </div>
          </header>

          <main className="space-y-6">
            {/* ZONE TEXTE */}
            <div className="bg-white border border-gray-200 rounded-[24px] p-4 focus-within:border-[#9333ea] transition-colors">
              <textarea 
                className="w-full h-36 bg-transparent text-gray-800 text-lg outline-none resize-none leading-relaxed"
                placeholder="Écrivez votre texte ici..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>

            {/* CHOIX DIALECTE */}
            <div className="space-y-3">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Choix du dialecte</p>
              <div className="grid grid-cols-1 gap-2">
                {DIALECTS.map(d => (
                  <button 
                    key={d.id} 
                    onClick={() => setSelectedDialectId(d.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedDialectId === d.id ? 'border-[#9333ea] bg-[#9333ea]/5' : 'border-gray-100 bg-white text-gray-400'}`}
                  >
                    <div className={`h-4 w-4 rounded-full border-2 ${selectedDialectId === d.id ? 'bg-[#9333ea] border-[#9333ea]' : 'border-gray-200'}`}></div>
                    <span className={`font-bold ${selectedDialectId === d.id ? 'text-gray-900' : ''}`}>{d.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* GENRE ET VOIX */}
            <div className="bg-gray-50/50 rounded-[32px] p-5 space-y-6 border border-gray-100">
              <div className="flex justify-center bg-gray-200/50 rounded-full p-1 w-full max-w-[240px] mx-auto">
                {['ذكر', 'أنثى'].map(g => (
                  <button key={g} onClick={() => setSelectedGender(g)} className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${selectedGender === g ? 'bg-white text-[#9333ea] shadow-sm' : 'text-gray-400'}`}>
                    {g === 'ذكر' ? 'Homme' : 'Femme'}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {filteredProfiles.map(p => (
                  <button 
                    key={p.name} 
                    onClick={() => setSelectedVoiceName(p.name)}
                    className={`p-3 rounded-xl border-2 font-bold text-xs truncate transition-all ${selectedVoiceName === p.name ? 'border-[#9333ea] bg-white text-[#9333ea]' : 'border-transparent bg-white/50 text-gray-400'}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* BOUTON GÉNÉRER - Simplifié pour mobile */}
            <button 
              onClick={handleGenerate} 
              disabled={isGenerating || !inputText}
              className={`w-full py-5 rounded-2xl font-black text-lg text-white transition-all transform active:scale-95 ${isGenerating ? 'bg-gray-200 text-gray-400' : 'bg-[#9333ea] shadow-lg shadow-purple-200'}`}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  GÉNÉRATION...
                </span>
              ) : 'GÉNÉRER LA VOIX'}
            </button>

            {/* PLAYER RÉSULTAT */}
            {currentResult && (
              <div className="bg-gray-900 rounded-[24px] p-4 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300">
                <button 
                  onClick={() => isPlaying ? audioRef.current?.pause() : audioRef.current?.play()} 
                  className="h-12 w-12 rounded-full bg-[#9333ea] text-white flex items-center justify-center shrink-0"
                >
                  {isPlaying ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[10px] text-gray-500 font-mono truncate uppercase">Resultat_Audio.mp3</p>
                  <div className="h-1 w-full bg-gray-800 rounded-full mt-2 overflow-hidden">
                    <div className={`h-full bg-[#9333ea] ${isPlaying ? 'w-1/2' : 'w-0'}`}></div>
                  </div>
                </div>
                <a href={currentResult.audioBlobUrl} download className="p-2 text-white/50 hover:text-[#9333ea]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </a>
              </div>
            )}
          </main>

          <footer className="pt-10 pb-6 text-center">
            <p className="text-[9px] font-black text-gray-300 tracking-[0.5em] uppercase">© 2026 NOUR VOICE LABS</p>
          </footer>
        </div>

        {/* Audio invisible */}
        <audio 
          ref={audioRef} 
          onPlay={() => setIsPlaying(true)} 
          onPause={() => setIsPlaying(false)} 
          onEnded={() => setIsPlaying(false)} 
          className="hidden" 
        />
      </div>
    </div>
  );
};

export default App;