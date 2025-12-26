import React, { useState, useRef, useEffect, memo } from 'react';
import { DIALECTS, VOICE_TYPES, VOICE_FIELDS, STUDIO_CONTROLS, CATEGORY_STYLES, getBaseVoiceForType, DialectInfo, VoiceProfile, VoiceField } from './constants';
import { GenerationHistory, VoiceControls } from './types';
import { nourService } from './services/geminiService';

// --- Cinematic Intro Component ---
const CinematicIntro: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [stage, setStage] = useState<'titles' | 'reveal' | 'fadeout'>('titles');
  
  useEffect(() => {
    const timer1 = setTimeout(() => setStage('reveal'), 1800);
    const timer2 = setTimeout(() => setStage('fadeout'), 4200);
    const timer3 = setTimeout(onComplete, 4800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] bg-white flex items-center justify-center transition-all duration-500 ${stage === 'fadeout' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="relative z-10 text-center px-4">
        <div className={`${stage === 'titles' ? 'opacity-100' : 'opacity-0 hidden'} transition-opacity duration-500`}>
          <h2 className="tech-logo text-5xl md:text-9xl leading-tight">NOUR VOICE</h2>
          <div className="tech-subtitle text-lg md:text-3xl font-extrabold mt-4">PROFESSIONAL VOICE ENGINE</div>
        </div>
        <div className={`flex flex-col items-center justify-center transition-all duration-700 ${stage === 'reveal' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="relative flex flex-col items-center">
            <div className="h-40 w-40 md:h-64 md:w-64">
               <img src="https://i.postimg.cc/h4YZvfBr/unnamed-8.jpg" alt="NOUR VOICE Logo" className="w-full h-full object-contain rounded-full shadow-lg" />
            </div>
            <div className="mt-8 flex gap-1 h-8 justify-center">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="w-1 bg-[#9333ea]/20 rounded-full h-full"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Icons Statiques ---
const DecorationLayer = memo(() => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.02]">
    <div className="absolute -top-10 -left-10 w-48 h-48 rotate-12">
      <svg viewBox="0 0 24 24" fill="currentColor" className="text-[#9333ea]"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
    </div>
    <div className="absolute -bottom-10 -right-10 w-56 h-56 -rotate-12">
      <svg viewBox="0 0 24 24" fill="currentColor" className="text-[#9333ea]"><path d="M12 2C6.48 2 2 6.48 2 12v7c0 1.1.9 2 2 2h3v-8H4v-1c0-4.41 3.59-8 8-8s8 3.59 8 8v1h-3v8h3c1.1 0 2-.9 2-2v-7c0-5.52-4.48-10-10-10z"/></svg>
    </div>
  </div>
));

const ControlGroup = memo(({ title, options, current, onChange }: any) => (
  <div className="space-y-3 text-right">
    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</label>
    <div className="grid grid-cols-1 gap-2">
      {options.map((opt: any) => (
        <button
          key={opt.label}
          onClick={() => onChange(opt.label)}
          className={`relative p-4 rounded-xl border transition-all duration-200 text-right ${
            current === opt.label 
              ? 'border-[#9333ea]/40 bg-[#9333ea]/5 text-gray-900' 
              : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
          }`}
        >
          <span className={`text-base md:text-xl font-bold block ${current === opt.label ? 'text-[#9333ea]' : 'text-gray-700'}`}>{opt.label}</span>
          <p className="text-[10px] md:text-xs text-gray-400 mt-1 line-clamp-1">{opt.desc}</p>
        </button>
      ))}
    </div>
  </div>
));

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState<boolean>(() => sessionStorage.getItem('nour_voice_intro_played') !== 'true');
  const [selectedDialectId, setSelectedDialectId] = useState<string>(DIALECTS[0].id);
  const [selectedGender, setSelectedGender] = useState<string>('ذكر');
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [voiceControls, setVoiceControls] = useState<VoiceControls>({
    temp: 'Chaleureux', emotion: 'Calme', speed: 'Normale', depth: 'متوسطة', pitch: 'متوسطة', drama: 'Légère', narration: 'Narrative'
  });

  const [inputText, setInputText] = useState<string>('');
  const [processedText, setProcessedText] = useState<string>('');
  const [isPreprocessing, setIsPreprocessing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<GenerationHistory | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const selectedDialect = DIALECTS.find(d => d.id === selectedDialectId) || DIALECTS[0];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => setCurrentTime(audio.currentTime);
    const meta = () => setDuration(audio.duration);
    const ended = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('loadedmetadata', meta);
    audio.addEventListener('ended', ended);
    return () => {
      audio.removeEventListener('timeupdate', update);
      audio.removeEventListener('loadedmetadata', meta);
      audio.removeEventListener('ended', ended);
    };
  }, []);

  const filteredProfiles = selectedDialect.profiles.filter(p => p.gender === (selectedGender === 'ذكر' ? 'male' : 'female'));

  const handlePreprocess = async () => {
    if (!inputText.trim()) return;
    setIsPreprocessing(true);
    try {
      const refined = await nourService.preprocessText(inputText, {
        dialect: selectedDialect.title, field: 'Production', personality: selectedVoiceName, controls: voiceControls
      });
      setProcessedText(refined);
    } catch (e) { console.error(e); } finally { setIsPreprocessing(false); }
  };

  const handleGenerate = async () => {
    const text = processedText || inputText;
    if (!text.trim()) return;
    setIsGenerating(true);
    try {
      const activeVoice = filteredProfiles.find(p => p.name === selectedVoiceName) || filteredProfiles[0];
      const audioUrl = await nourService.generateVoiceOver(text, getBaseVoiceForType('بالغ', activeVoice?.gender || 'male'), "Directives production NOUR VOICE");
      setCurrentResult({
        id: Math.random().toString(36).substr(2, 9), text, 
        selection: { dialect: selectedDialect.title, type: activeVoice?.category || 'Standard', field: 'Production', controls: { ...voiceControls } },
        timestamp: Date.now(), audioBlobUrl: audioUrl
      });
      if (audioRef.current) { audioRef.current.src = audioUrl; audioRef.current.play(); setIsPlaying(true); }
    } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  if (showIntro) return <CinematicIntro onComplete={() => { sessionStorage.setItem('nour_voice_intro_played', 'true'); setShowIntro(false); }} />;

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center py-8 md:py-20 px-4 md:px-8 font-arabic overflow-x-hidden relative" dir="ltr">
      
      <div className="bg-light-blob top-[10%] left-[10%]"></div>
      <div className="bg-light-blob bottom-[10%] right-[10%] opacity-40"></div>
      <DecorationLayer />

      <header className="mb-10 md:mb-16 text-center relative z-10">
        <div className="flex flex-col items-center gap-4">
          <img src="https://i.postimg.cc/h4YZvfBr/unnamed-8.jpg" alt="Logo" className="h-20 w-20 md:h-32 md:w-32 rounded-full shadow-md" />
          <h1 className="text-4xl md:text-7xl font-black purple-text tracking-tight">NOUR VOICE</h1>
          <p className="text-gray-400 text-[10px] md:text-sm uppercase font-black tracking-widest">PROFESSIONAL VOICE ENGINE</p>
        </div>
      </header>

      <div className="w-full max-w-6xl space-y-10 md:space-y-16 relative z-10">
        
        {/* Step 1: Script */}
        <section className="glass-3d p-5 md:p-12 rounded-2xl md:rounded-[40px] space-y-6">
          <h3 className="text-base md:text-2xl font-black text-center uppercase">1. Script / سكريبت</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-400 px-1">Input Draft / مسودة النص</label>
              <textarea
                className="w-full h-[150px] md:h-[300px] bg-gray-50 border border-gray-100 rounded-xl p-4 md:p-8 text-base md:text-2xl text-gray-900 focus:outline-none focus:border-[#9333ea]/20 resize-none transition-colors"
                placeholder="Tapez..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button
                onClick={handlePreprocess}
                disabled={isPreprocessing || !inputText.trim()}
                className="w-full py-4 rounded-xl border bg-[#9333ea]/5 text-[#9333ea] text-sm md:text-base font-black hover:bg-[#9333ea] hover:text-white transition-all disabled:opacity-30"
              >
                {isPreprocessing ? "..." : "AI REFINEMENT / تحسين ذكي"}
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-[#9333ea] px-1">Master Script / السكريبت الذكي</label>
              <textarea
                className="w-full h-[150px] md:h-[300px] bg-purple-50/5 border border-purple-50 rounded-xl p-4 md:p-8 text-base md:text-2xl text-gray-900 focus:outline-none resize-none transition-colors"
                placeholder="..."
                value={processedText}
                onChange={(e) => setProcessedText(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Step 2: Language */}
        <section className="glass-3d p-5 md:p-12 rounded-2xl md:rounded-[40px]">
          <h3 className="text-base md:text-2xl font-black text-center mb-8 uppercase">2. Language & Accents / اللغة واللهجات</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            {DIALECTS.map((dialect) => (
              <button
                key={dialect.id}
                onClick={() => setSelectedDialectId(dialect.id)}
                className={`p-4 md:p-8 rounded-xl border text-center transition-all ${
                  selectedDialectId === dialect.id ? 'border-[#9333ea]/30 bg-[#9333ea]/5' : 'border-gray-50 bg-white hover:border-gray-200'
                }`}
              >
                <h4 className={`text-sm md:text-2xl font-black ${selectedDialectId === dialect.id ? 'text-[#9333ea]' : 'text-gray-700'}`}>{dialect.title}</h4>
                <p className="text-[9px] md:text-xs text-gray-400 mt-2 line-clamp-2">{dialect.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Step 3: Voices */}
        <section className="glass-3d p-5 md:p-12 rounded-2xl md:rounded-[40px] space-y-8">
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-base md:text-2xl font-black uppercase">Voice Archetypes / البصمة الصوتية</h3>
            <div className="flex gap-2">
              {['ذكر', 'أنثى'].map(gender => (
                <button
                  key={gender}
                  onClick={() => setSelectedGender(gender)}
                  className={`px-6 md:px-12 py-2 md:py-4 rounded-full border transition-all text-sm md:text-xl font-black ${
                    selectedGender === gender ? 'border-[#9333ea] bg-[#9333ea]/5 text-[#9333ea]' : 'border-gray-100 bg-white text-gray-400'
                  }`}
                >
                  {gender === 'ذكر' ? 'Homme' : 'Femme'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {filteredProfiles.map((profile, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedVoiceName(profile.name)}
                className={`p-4 md:p-8 rounded-xl border text-center transition-all ${
                  selectedVoiceName === profile.name ? 'border-[#9333ea]/30 bg-white ring-2 ring-[#9333ea]/5 shadow-sm' : 'border-gray-50 bg-white hover:border-gray-200'
                }`}
              >
                <h5 className="text-sm md:text-xl font-black text-gray-800">{profile.name}</h5>
                <span className="text-[9px] uppercase font-bold text-[#9333ea] block mt-1">{profile.category}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Step 4: Controls */}
        <section className="glass-3d p-5 md:p-12 rounded-2xl md:rounded-[40px]">
          <h3 className="text-base md:text-2xl font-black text-center mb-8 uppercase">3. Studio Controls / غرفة التحكم</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(STUDIO_CONTROLS).map(([key, control]) => (
              <ControlGroup 
                key={key} 
                title={control.title} 
                options={control.options} 
                current={(voiceControls as any)[key]} 
                onChange={(val: string) => setVoiceControls(v => ({ ...v, [key]: val }))} 
              />
            ))}
          </div>
        </section>

        {/* Action Section épurée avec seulement le bouton de don */}
        <section className="flex flex-col items-center py-4 space-y-6">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || (!processedText.trim() && !inputText.trim())}
            className={`w-full max-w-xl py-6 md:py-10 rounded-full font-black text-xl md:text-3xl shadow-lg active:scale-95 transition-all ${
              isGenerating || (!processedText.trim() && !inputText.trim()) ? 'bg-gray-100 text-gray-300' : 'purple-bg text-white shadow-purple-100'
            }`}
          >
            {isGenerating ? "... جاري الإنتاج" : "GENERATE VOICE"}
          </button>

          <div className="flex flex-col items-center">
            {/* BOUTON SOUTENIR NOUR VOICE PURPLE */}
            <a 
              href="https://ko-fi.com/L3L01QYMQE" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-3 px-8 py-4 bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded-full font-black tracking-wide shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <img 
                src="https://ko-fi.com/img/cup-border.png" 
                alt="Ko-fi" 
                className="h-6 animate-bounce" 
              />
              <span className="text-sm md:text-base uppercase">SOUTENIR NOUR VOICE</span>
            </a>
          </div>
        </section>

        {/* Result */}
        {currentResult && (
          <section className="glass-3d p-5 md:p-10 rounded-2xl md:rounded-[40px] border-[#9333ea]/10 animate-in fade-in duration-300">
            <div className="max-w-3xl mx-auto p-4 md:p-8 rounded-xl bg-gray-50 border border-gray-100 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                <div className="text-left">
                  <h4 className="font-black text-xl md:text-4xl text-gray-900">{currentResult.selection.dialect}</h4>
                  <p className="text-[10px] text-[#9333ea] font-black uppercase mt-1">{currentResult.selection.type}</p>
                </div>
                <div className="flex gap-2">
                  <button className="h-12 w-12 md:h-16 md:w-16 rounded-full purple-bg text-white flex items-center justify-center" onClick={togglePlay}>
                    {isPlaying ? <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="h-6 w-6 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
                  </button>
                  <a href={currentResult.audioBlobUrl} download="nour-voice.wav" className="h-12 w-12 md:h-16 md:w-16 rounded-full bg-white text-[#9333ea] border border-gray-100 flex items-center justify-center">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-gray-400">{Math.floor(currentTime)}s</span>
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full purple-bg transition-all" style={{ width: `${(currentTime / duration) * 100 || 0}%` }}></div>
                </div>
                <span className="text-[10px] font-mono text-gray-400">{Math.floor(duration)}s</span>
              </div>
            </div>
          </section>
        )}
      </div>

      <footer className="mt-16 text-center opacity-30">
        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">&copy; 2026 NOUR VOICE ENGINE</p>
      </footer>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default App;
