import React, { useState, useRef, useEffect } from 'react';
import { DIALECTS, VOICE_TYPES, VOICE_FIELDS, STUDIO_CONTROLS, CATEGORY_STYLES, getBaseVoiceForType, DialectInfo, VoiceProfile, VoiceField } from './constants';
import { GenerationHistory, VoiceControls } from './types';
import { nourService } from './services/geminiService';

// --- Cinematic Intro Component ---
const CinematicIntro: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [stage, setStage] = useState<'titles' | 'reveal' | 'fadeout'>('titles');
  const [particles] = useState(() => 
    [...Array(20)].map(() => ({ 
      id: Math.random(),
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 5 + 2,
      duration: Math.random() * 5 + 5,
      delay: Math.random() * 5
    }))
  );

  useEffect(() => {
    const timer1 = setTimeout(() => setStage('reveal'), 2500);
    const timer2 = setTimeout(() => setStage('fadeout'), 5000);
    const timer3 = setTimeout(onComplete, 6000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] bg-white flex items-center justify-center transition-opacity duration-1000 ${stage === 'fadeout' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <div 
            key={p.id}
            className="particle animate-float-slow absolute"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              willChange: 'transform'
            }}
          />
        ))}
      </div>
      <div className="relative z-10 text-center scale-up px-4 pointer-events-none">
        <div className={`${stage === 'titles' ? 'animate-cinematic' : 'opacity-0 transition-opacity duration-1000'}`}>
          <h2 className="tech-logo text-5xl md:text-9xl leading-tight">NOUR VOICE</h2>
          <div className="tech-subtitle text-lg md:text-3xl font-extrabold mt-4">PROFESSIONAL VOICE ENGINE</div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    return sessionStorage.getItem('nour_voice_intro_played') !== 'true';
  });

  const [selectedDialectId, setSelectedDialectId] = useState<string>(DIALECTS[0].id);
  const [selectedType, setSelectedType] = useState<string>(VOICE_TYPES[0]);
  const [selectedGender, setSelectedGender] = useState<string>('ذكر');
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [voiceControls, setVoiceControls] = useState<VoiceControls>({
    temp: 'Chaleureux', emotion: 'Calme', speed: 'Normale', depth: 'متوسطة', pitch: 'متوسطة', drama: 'Légère', narration: 'Narrative'
  });

  const [inputText, setInputText] = useState('');
  const [processedText, setProcessedText] = useState('');
  const [isPreprocessing, setIsPreprocessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResult, setCurrentResult] = useState<GenerationHistory | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const selectedDialect = DIALECTS.find(d => d.id === selectedDialectId) || DIALECTS[0];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnd = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnd);
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnd);
    };
  }, []);

  const filteredProfiles = selectedDialect.profiles.filter(p => p.gender === (selectedGender === 'ذكر' ? 'male' : 'female'));

  const handleGenerate = async () => {
    const textToUse = processedText || inputText;
    if (!textToUse.trim()) return;
    setIsGenerating(true);
    try {
      const activeVoice = filteredProfiles.find(p => p.name === selectedVoiceName) || filteredProfiles[0];
      const baseVoice = getBaseVoiceForType(selectedType, activeVoice?.gender || 'male');
      const audioUrl = await nourService.generateVoiceOver(textToUse, baseVoice, "Professional Voiceover");
      
      setCurrentResult({
        id: Math.random().toString(36).substr(2, 9),
        text: textToUse,
        selection: { dialect: selectedDialect.title, type: activeVoice?.category || 'Standard', field: 'Production', controls: { ...voiceControls } },
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
    <div className="fixed inset-0 bg-white overflow-hidden">
      {showIntro && <CinematicIntro onComplete={() => setShowIntro(false)} />}
      
      <div className="h-full w-full overflow-y-auto overflow-x-hidden touch-pan-y flex flex-col items-center py-12 px-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
          
          <header className="mb-12 text-center">
            <img src="https://i.postimg.cc/h4YZvfBr/unnamed-8.jpg" alt="Logo" className="h-24 w-24 mx-auto rounded-full mb-6 shadow-lg" />
            <h1 className="text-4xl md:text-6xl font-black purple-text mb-2">NOUR VOICE</h1>
            <p className="text-gray-500 text-[10px] tracking-[0.3em] font-bold uppercase">Professional Voice Engine</p>
          </header>

          <div className="w-full space-y-8 pb-20">
            {/* 1. TEXTE */}
            <section className="glass-3d p-6 rounded-[30px] space-y-4">
              <label className="block text-center text-xs font-black text-gray-400 uppercase tracking-widest">1. Script / النص</label>
              <textarea 
                className="w-full h-40 bg-gray-50/50 border-2 border-gray-100 rounded-2xl p-4 text-lg outline-none focus:border-[#9333ea]/30 transition-all resize-none"
                placeholder="Tapez votre texte..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </section>

            {/* 2. DIALECTES */}
            <section className="glass-3d p-6 rounded-[30px] space-y-4">
              <label className="block text-center text-xs font-black text-gray-400 uppercase tracking-widest">2. Dialect / اللهجة</label>
              <div className="grid grid-cols-1 gap-3">
                {DIALECTS.map(d => (
                  <button key={d.id} onClick={() => setSelectedDialectId(d.id)} className={`p-4 rounded-2xl border-2 transition-all text-right flex justify-between items-center ${selectedDialectId === d.id ? 'border-[#9333ea] bg-[#9333ea]/5' : 'border-gray-50'}`}>
                    <span className={`h-4 w-4 rounded-full border-2 ${selectedDialectId === d.id ? 'bg-[#9333ea] border-[#9333ea]' : 'border-gray-200'}`}></span>
                    <span className="font-bold">{d.title}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* 3. GENRE & VOIX */}
            <section className="glass-3d p-6 rounded-[30px] space-y-6">
              <div className="flex justify-center p-1 bg-gray-100 rounded-full w-fit mx-auto">
                {['ذكر', 'أنثى'].map(g => (
                  <button key={g} onClick={() => setSelectedGender(g)} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${selectedGender === g ? 'bg-white shadow-sm text-[#9333ea]' : 'text-gray-500'}`}>
                    {g === 'ذكر' ? 'Homme' : 'Femme'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {filteredProfiles.map(p => (
                  <button key={p.name} onClick={() => setSelectedVoiceName(p.name)} className={`p-4 rounded-2xl border-2 transition-all ${selectedVoiceName === p.name ? 'border-[#9333ea] bg-[#9333ea]/5' : 'border-gray-50'}`}>
                    <span className="font-bold text-sm block">{p.name}</span>
                    <span className="text-[9px] uppercase text-gray-400">{p.category}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* BOUTON GENERER */}
            <button 
              onClick={handleGenerate} 
              disabled={isGenerating || !inputText}
              className={`w-full py-6 rounded-[30px] font-black text-xl shadow-xl transition-all ${isGenerating ? 'bg-gray-100 text-gray-400' : 'purple-bg text-white active:scale-95'}`}
            >
              {isGenerating ? 'GENERATING...' : 'GENERATE VOICE'}
            </button>

            {/* RESULTAT */}
            {currentResult && (
              <div className="glass-3d p-6 rounded-[30px] border-t-4 border-[#9333ea] animate-in slide-in-from-bottom duration-500">
                <div className="flex items-center gap-4">
                  <button onClick={() => isPlaying ? audioRef.current?.pause() : audioRef.current?.play()} className="h-14 w-14 rounded-full purple-bg text-white flex items-center justify-center shadow-lg shrink-0">
                    {isPlaying ? <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
                  </button>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full purple-bg" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
                  </div>
                  <a href={currentResult.audioBlobUrl} download className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-[#9333ea] border border-gray-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </a>
                </div>
              </div>
            )}
          </div>

          <footer className="pb-10 opacity-20 text-[9px] font-black tracking-widest uppercase">
            &copy; 2026 NOUR VOICE ENGINE
          </footer>
        </div>
        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
  );
};

export default App;