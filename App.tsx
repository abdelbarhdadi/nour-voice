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

  // Cette fonction assure que le navigateur mobile ne bloque pas le défilement naturel
  useEffect(() => {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    // Supprime les contraintes de positionnement qui bloquent le scroll
    document.documentElement.style.position = 'static';
    document.body.style.position = 'static';
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
    /* Utilisation de min-h-screen pour permettre un scroll naturel et fluide */
    <div className="min-h-screen bg-[#f9fafb] text-gray-900 pb-20 overflow-x-hidden">
      
      {/* Background Decor original */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-100 rounded-full blur-[100px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-50 rounded-full blur-[100px] opacity-60" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 pt-12 space-y-12">
        
        {/* Header Original */}
        <header className="text-center space-y-6">
          <div className="inline-block relative">
            <div className="absolute inset-0 bg-purple-400 blur-2xl opacity-20 rounded-full"></div>
            <img 
              src="https://i.postimg.cc/h4YZvfBr/unnamed-8.jpg" 
              alt="NOUR VOICE" 
              className="relative h-28 w-28 md:h-36 md:w-36 mx-auto rounded-full border-4 border-white shadow-2xl transition-transform hover:scale-105 duration-500" 
            />
          </div>
          <div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter purple-text">NOUR VOICE</h1>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 tracking-[0.5em] uppercase mt-2">Professional Voice Engine</p>
          </div>
        </header>

        <main className="space-y-10">
          {/* Bloc Script - Structure Originale */}
          <div className="bg-white/70 backdrop-blur-md p-6 md:p-8 rounded-[40px] shadow-xl border border-white/80">
            <label className="block text-center text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4">1. Script / النص</label>
            <textarea 
              className="w-full h-44 bg-gray-50/50 rounded-[30px] p-6 text-xl outline-none focus:ring-2 ring-purple-100 transition-all resize-none border-none shadow-inner"
              placeholder="Écrivez votre texte ici..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>

          {/* Bloc Dialecte - Structure Originale */}
          <div className="bg-white/70 backdrop-blur-md p-6 md:p-8 rounded-[40px] shadow-xl border border-white/80">
            <label className="block text-center text-[10px] font-black text-purple-400 uppercase tracking-widest mb-6">2. Dialect / اللهجة</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DIALECTS.map(d => (
                <button 
                  key={d.id} 
                  onClick={() => setSelectedDialectId(d.id)}
                  className={`p-5 rounded-[25px] border-2 transition-all flex justify-between items-center ${selectedDialectId === d.id ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-gray-50 bg-white/50 text-gray-400'}`}
                >
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${selectedDialectId === d.id ? 'border-purple-500' : 'border-gray-200'}`}>
                    {selectedDialectId === d.id && <div className="h-2.5 w-2.5 bg-purple-500 rounded-full" />}
                  </div>
                  <span className="font-bold text-lg text-gray-800">{d.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bloc Genre & Voix - Structure Originale */}
          <div className="bg-white/70 backdrop-blur-md p-6 md:p-8 rounded-[40px] shadow-xl border border-white/80 space-y-8">
            <div className="flex bg-gray-100/50 rounded-full p-1.5 w-fit mx-auto border border-gray-100">
              {['ذكر', 'أنثى'].map(g => (
                <button key={g} onClick={() => setSelectedGender(g)} className={`px-12 py-3 rounded-full text-sm font-black transition-all ${selectedGender === g ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>
                  {g === 'ذكر' ? 'Homme' : 'Femme'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredProfiles.map(p => (
                <button 
                  key={p.name} 
                  onClick={() => setSelectedVoiceName(p.name)}
                  className={`p-4 rounded-2xl border-2 text-center transition-all ${selectedVoiceName === p.name ? 'border-purple-500 bg-purple-50 font-bold text-purple-700' : 'border-transparent bg-gray-50/50 text-gray-500'}`}
                >
                  <span className="text-sm block truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bouton de génération Original */}
          <button 
            onClick={handleGenerate} 
            disabled={isGenerating || !inputText}
            className={`w-full py-8 rounded-[35px] font-black text-2xl text-white shadow-2xl transition-all transform active:scale-95 ${isGenerating ? 'bg-gray-300' : 'purple-bg hover:shadow-purple-300/50'}`}
          >
            {isGenerating ? 'GENERATING...' : 'GENERATE VOICE'}
          </button>

          {/* Player Audio Original */}
          {currentResult && (
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[40px] border-t-4 border-purple-500 shadow-2xl animate-in slide-in-from-bottom-10 duration-700">
              <div className="flex items-center gap-6">
                <button onClick={() => isPlaying ? audioRef.current?.pause() : audioRef.current?.play()} className="h-16 w-16 rounded-full purple-bg text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
                  {isPlaying ? (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
                <div className="flex-1">
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div className={`h-full purple-bg transition-all duration-300 ${isPlaying ? 'w-full' : 'w-0'}`} />
                  </div>
                </div>
                <a href={currentResult.audioBlobUrl} download className="h-12 w-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center border border-purple-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </a>
              </div>
            </div>
          )}
        </main>

        <footer className="text-center py-10 opacity-30 text-[10px] font-black tracking-[0.5em] uppercase">
          &copy; 2026 NOUR VOICE LABS
        </footer>
      </div>
      <audio ref={audioRef} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} className="hidden" />
    </div>
  );
};

export default App;