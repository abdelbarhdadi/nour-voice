import React, { useState, useRef, useEffect } from 'react';
import { DIALECTS, VOICE_TYPES, getBaseVoiceForType } from './constants';
import { GenerationHistory } from './types';
import { nourService } from './services/geminiService';

const App: React.FC = () => {
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

  // Empêche le rebond élastique qui bloque le scroll sur iPhone/Android
  useEffect(() => {
    document.documentElement.style.position = 'fixed';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.overflow = 'hidden';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
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
      if (audioRef.current) { audioRef.current.src = audioUrl; audioRef.current.play(); }
    } catch (err) { console.error(err); } finally { setIsGenerating(false); }
  };

  return (
    // "fixed inset-0" crée un écran qui ne bouge jamais
    <div className="fixed inset-0 bg-white touch-none flex flex-col overflow-hidden">
      
      {/* Zone de défilement isolée et ultra-fluide */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden touch-pan-y pt-10 pb-20 px-5" style={{ WebkitOverflowScrolling: 'touch' }}>
        
        <div className="max-w-md mx-auto space-y-8">
          <header className="text-center">
            <img src="https://i.postimg.cc/h4YZvfBr/unnamed-8.jpg" alt="Logo" className="h-24 w-24 mx-auto rounded-full shadow-md mb-4" />
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">NOUR VOICE</h1>
          </header>

          <main className="space-y-6">
            <div className="bg-gray-50 rounded-[30px] p-5 border border-gray-100">
              <textarea 
                className="w-full h-32 bg-transparent text-xl outline-none resize-none text-gray-800"
                placeholder="Écrivez ici..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase text-center tracking-widest">Dialecte</p>
              {DIALECTS.map(d => (
                <button 
                  key={d.id} 
                  onClick={() => setSelectedDialectId(d.id)}
                  className={`w-full p-4 rounded-2xl border-2 flex justify-between items-center ${selectedDialectId === d.id ? 'border-[#9333ea] bg-[#9333ea]/5' : 'border-gray-50 bg-white'}`}
                >
                  <div className={`h-4 w-4 rounded-full ${selectedDialectId === d.id ? 'bg-[#9333ea]' : 'bg-gray-100'}`}></div>
                  <span className="font-bold text-gray-900">{d.title}</span>
                </button>
              ))}
            </div>

            <div className="bg-gray-50 rounded-[30px] p-6 space-y-4">
              <div className="flex bg-white rounded-full p-1 border border-gray-200">
                {['ذكر', 'أنثى'].map(g => (
                  <button key={g} onClick={() => setSelectedGender(g)} className={`flex-1 py-3 rounded-full text-xs font-black uppercase ${selectedGender === g ? 'bg-[#9333ea] text-white' : 'text-gray-400'}`}>
                    {g === 'ذكر' ? 'Homme' : 'Femme'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {filteredProfiles.map(p => (
                  <button 
                    key={p.name} 
                    onClick={() => setSelectedVoiceName(p.name)}
                    className={`p-4 rounded-xl border-2 font-bold text-[10px] truncate ${selectedVoiceName === p.name ? 'border-[#9333ea] bg-white text-[#9333ea]' : 'border-transparent bg-white text-gray-400'}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleGenerate} 
              disabled={isGenerating || !inputText}
              className={`w-full py-6 rounded-[25px] font-black text-xl text-white shadow-xl transform active:scale-95 transition-all ${isGenerating ? 'bg-gray-300' : 'purple-bg shadow-purple-200'}`}
            >
              {isGenerating ? '...' : 'GÉNÉRER'}
            </button>

            {currentResult && (
              <div className="bg-gray-900 rounded-[25px] p-6 flex items-center gap-4 text-white animate-bounce-in">
                <button onClick={() => isPlaying ? audioRef.current?.pause() : audioRef.current?.play()} className="h-12 w-12 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                  {isPlaying ? '||' : '▶'}
                </button>
                <div className="flex-1">
                  <div className="h-1 bg-gray-700 rounded-full w-full">
                    <div className={`h-full bg-[#9333ea] transition-all ${isPlaying ? 'w-full' : 'w-0'}`}></div>
                  </div>
                </div>
                <a href={currentResult.audioBlobUrl} download className="text-xs font-bold text-[#9333ea]">SAVE</a>
              </div>
            )}
          </main>
          
          <footer className="text-center opacity-20 text-[10px] font-black pb-10 tracking-[0.5em]">
            NOUR VOICE LABS
          </footer>
        </div>
      </div>
      <audio ref={audioRef} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} className="hidden" />
    </div>
  );
};

export default App;