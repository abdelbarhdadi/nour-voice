import React, { useState, useRef, useEffect } from 'react';
import { DIALECTS, VOICE_TYPES, VOICE_FIELDS, STUDIO_CONTROLS, CATEGORY_STYLES, getBaseVoiceForType, DialectInfo, VoiceProfile, VoiceField } from './constants';
import { GenerationHistory, VoiceControls } from './types';
import { nourService } from './services/geminiService';

// --- Cinematic Intro Component ---
const CinematicIntro: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [stage, setStage] = useState<'titles' | 'reveal' | 'fadeout'>('titles');
  const [particles] = useState(() => 
    [...Array(20)].map(() => ({ // Réduit à 20 pour plus de fluidité mobile
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
        <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 ${stage === 'reveal' ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <div className="relative flex flex-col items-center">
            <div className="h-48 w-48 md:h-80 md:w-80 relative">
               <img src="https://i.postimg.cc/h4YZvfBr/unnamed-8.jpg" alt="NOUR VOICE Logo" className="w-full h-full object-contain drop-shadow-2xl rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Icons (Optimisés) ---
const FloatingMic = () => (
  <div className="absolute -top-10 -left-10 w-32 md:w-48 h-32 md:h-48 opacity-10 pointer-events-none animate-float" style={{willChange: 'transform'}}>
    <svg viewBox="0 0 24 24" fill="currentColor" className="text-[#9333ea]">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
    </svg>
  </div>
);

const FloatingHeadphones = () => (
  <div className="absolute -bottom-10 -right-10 w-36 md:w-56 h-36 md:h-56 opacity-10 pointer-events-none animate-float-slow" style={{willChange: 'transform'}}>
    <svg viewBox="0 0 24 24" fill="currentColor" className="text-[#9333ea]">
      <path d="M12 2C6.48 2 2 6.48 2 12v7c0 1.1.9 2 2 2h3v-8H4v-1c0-4.41 3.59-8 8-8s8 3.59 8 8v1h-3v8h3c1.1 0 2-.9 2-2v-7c0-5.52-4.48-10-10-10z"/>
    </svg>
  </div>
);

const CategoryIcon = ({ type, className }: { type: string, className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const ControlGroup: React.FC<{
  id: string;
  title: string;
  options: { label: string; desc: string }[];
  current: string;
  onChange: (val: string) => void;
}> = ({ id, title, options, current, onChange }) => (
  <div className="space-y-4 text-right group">
    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">{title}</label>
    <div className="grid grid-cols-1 gap-3">
      {options.map(opt => (
        <button
          key={opt.label}
          onClick={() => onChange(opt.label)}
          className={`relative p-4 rounded-2xl border-2 text-right transition-all duration-300 ${
            current === opt.label 
              ? 'border-[#9333ea] bg-[#9333ea]/5 text-gray-900 shadow-md' 
              : 'border-gray-100 bg-gray-50/50 text-gray-500'
          }`}
        >
          <span className={`text-lg font-bold block ${current === opt.label ? 'text-[#9333ea]' : 'text-gray-700'}`}>{opt.label}</span>
          <p className="text-xs text-gray-500 line-clamp-1">{opt.desc}</p>
        </button>
      ))}
    </div>
  </div>
);

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
    <div className="min-h-screen bg-white text-gray-900 selection:bg-[#9333ea]/20 overflow-x-hidden touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
      {showIntro && <CinematicIntro onComplete={() => setShowIntro(false)} />}
      
      <div className="relative flex flex-col items-center py-12 px-4 md:px-10 max-w-7xl mx-auto">
        <FloatingMic />
        <FloatingHeadphones />

        <header className="mb-16 text-center z-10">
          <img src="https://i.postimg.cc/h4YZvfBr/unnamed-8.jpg" alt="Logo" className="h-24 w-24 md:h-32 md:w-32 mx-auto rounded-full mb-6 shadow-xl" />
          <h1 className="text-4xl md:text-7xl font-black purple-text mb-2">NOUR VOICE</h1>
          <p className="text-gray-500 text-xs md:text-sm tracking-[0.3em] font-bold uppercase">Professional Voice Engine</p>
        </header>

        <div className="w-full space-y-10 md:space-y-20 z-10">
          {/* SCRIPT AREA */}
          <section className="glass-3d p-6 md:p-12 rounded-[40px] space-y-6">
            <h3 className="text-center font-black text-gray-800 uppercase tracking-widest">1. Script / النص</h3>
            <textarea 
              className="w-full h-48 md:h-64 bg-gray-50 border-2 border-gray-100 rounded-3xl p-6 text-xl focus:border-[#9333ea]/30 outline-none transition-all resize-none"
              placeholder="Tapez votre texte ici..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </section>

          {/* LANGUAGE AREA */}
          <section className="glass-3d p-6 md:p-12 rounded-[40px]">
             <h3 className="text-center font-black text-gray-800 uppercase tracking-widest mb-8">2. Dialect / اللهجة</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DIALECTS.map(d => (
                  <button key={d.id} onClick={() => setSelectedDialectId(d.id)} className={`p-6 rounded-3xl border-2 transition-all ${selectedDialectId === d.id ? 'border-[#9333ea] bg-[#9333ea]/5 shadow-md' : 'border-gray-100'}`}>
                    <span className="font-black text-xl block">{d.title}</span>
                    <span className="text-xs text-gray-500">{d.description}</span>
                  </button>
                ))}
             </div>
          </section>

          {/* ARCHETYPES */}
          <section className="glass-3d p-6 md:p-12 rounded-[40px]">
             <div className="flex flex-col items-center gap-8">
               <div className="flex gap-2 p-1 bg-gray-100 rounded-full">
                  {['ذكر', 'أنثى'].map(g => (
                    <button key={g} onClick={() => setSelectedGender(g)} className={`px-8 py-3 rounded-full font-bold transition-all ${selectedGender === g ? 'bg-white shadow-sm text-[#9333ea]' : 'text-gray-500'}`}>
                      {g === 'ذكر' ? 'Homme' : 'Femme'}
                    </button>
                  ))}
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  {filteredProfiles.map(p => (
                    <button key={p.name} onClick={() => setSelectedVoiceName(p.name)} className={`p-4 rounded-3xl border-2 transition-all ${selectedVoiceName === p.name ? 'border-[#9333ea] bg-[#9333ea]/5' : 'border-gray-50'}`}>
                      <span className="font-bold text-sm block">{p.name}</span>
                      <span className="text-[10px] uppercase text-gray-400">{p.category}</span>
                    </button>
                  ))}
               </div>
             </div>
          </section>

          {/* GENERATE */}
          <button 
            onClick={handleGenerate} 
            disabled={isGenerating || !inputText}
            className={`w-full py-8 md:py-12 rounded-[40px] font-black text-2xl md:text-4xl shadow-2xl transition-all ${isGenerating ? 'bg-gray-100 text-gray-400' : 'purple-bg text-white hover:scale-[1.02] active:scale-95'}`}
          >
            {isGenerating ? 'GENERATING...' : 'GENERATE VOICE'}
          </button>

          {/* RESULT */}
          {currentResult && (
            <div className="glass-3d p-8 rounded-[40px] border-t-4 border-[#9333ea] animate-in slide-in-from-bottom duration-500">
               <div className="flex items-center justify-between gap-4">
                  <button onClick={() => isPlaying ? audioRef.current?.pause() : audioRef.current?.play()} className="h-16 w-16 md:h-20 md:w-20 rounded-full purple-bg text-white flex items-center justify-center shadow-lg">
                    {isPlaying ? <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
                  </button>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full purple-bg transition-all" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
                  </div>
                  <a href={currentResult.audioBlobUrl} download className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-[#9333ea] border border-gray-100 shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </a>
               </div>
            </div>
          )}
        </div>

        <footer className="mt-20 opacity-30 text-[10px] font-black tracking-widest uppercase">
          &copy; 2026 NOUR VOICE ENGINE
        </footer>
        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
  );
};

export default App;