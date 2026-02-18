
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, 
  Plus, 
  HelpCircle, 
  Mic,
  MicOff,
  Undo2,
  Redo2,
  X as CloseIcon,
  StopCircle,
  Car
} from 'lucide-react';
import { Message, ImageStyle, UserProfile, UserSettings } from './types';
import { GeminiService } from './services/geminiService';
import RainbowText from './components/RainbowText';
import ComplaintModal from './components/ComplaintModal';
import PermissionDialog from './components/PermissionDialog';

const DEFAULT_SETTINGS: UserSettings = {
  rainbowFont: true,
  responseLength: 'concise',
  accentColor: '#8b5cf6'
};

const INITIAL_GREETING = "Hello master, how can I help you";

const CAR_THOUGHTS = [
  "A car is not just a machine, it's a soul on wheels.",
  "Aerodynamics is for people who can't build engines.",
  "The road is a canvas, and your car is the brush.",
  "Elegance is the only beauty that never fades, just like a classic car.",
  "Speed is freedom, but precision is mastery.",
  "The best view is always through the windshield of a masterpiece.",
  "To drive is to breathe life into cold steel.",
  "Automotive design is the intersection of art and physics.",
  "Every curve of the road tells a story only a driver understands.",
  "Innovation drives us, but passion fuels us."
];

const DiamondLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="diamondGrad" x1="0%" x2="100%" y1="0%" y2="100%">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="20%" stopColor="#f97316" />
        <stop offset="40%" stopColor="#facc15" />
        <stop offset="60%" stopColor="#4ade80" />
        <stop offset="80%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
    <path d="M50 5 L90 35 L50 95 L10 35 Z" fill="url(#diamondGrad)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
    <path d="M50 5 L30 35 L50 35 Z" fill="rgba(255,255,255,0.3)" />
    <path d="M50 5 L70 35 L50 35 Z" fill="rgba(255,255,255,0.1)" />
    <path d="M10 35 L30 35 L50 95 Z" fill="rgba(0,0,0,0.05)" />
    <path d="M90 35 L70 35 L50 95 Z" fill="rgba(0,0,0,0.1)" />
    <path d="M30 35 L70 35 L50 95 Z" fill="rgba(255,255,255,0.05)" />
  </svg>
);

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

const App: React.FC = () => {
  const [user] = useState<UserProfile>({
    id: 'master-user',
    username: 'Master',
    settings: DEFAULT_SETTINGS
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);
  const [showPermission, setShowPermission] = useState<{ open: boolean; type: 'camera' | 'gallery' | 'microphone' }>({ open: false, type: 'gallery' });
  const [activeImageContext, setActiveImageContext] = useState<string | null>(null);
  const [thoughtIndex, setThoughtIndex] = useState(0);
  const [fadeThought, setFadeThought] = useState(true);

  const [historyStack, setHistoryStack] = useState<Message[][]>([]);
  const [futureStack, setFutureStack] = useState<Message[][]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const gemini = useRef(new GeminiService());
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearAllChats = useCallback(() => {
    const greeting: Message = {
      id: `greeting-${Date.now()}`,
      role: 'assistant',
      content: INITIAL_GREETING,
      timestamp: Date.now(),
      type: 'text'
    };
    setMessages([greeting]);
    setHistoryStack([]);
    setFutureStack([]);
    setActiveImageContext(null);
  }, []);

  const handleCancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsTyping(false);
  }, []);

  // Car thoughts timer (2 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeThought(false);
      setTimeout(() => {
        setThoughtIndex((prev) => (prev + 1) % CAR_THOUGHTS.length);
        setFadeThought(true);
      }, 500);
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete') clearAllChats();
    };

    window.history.pushState({ type: 'diamond-ai-home' }, "", "");
    const handlePopState = (e: PopStateEvent) => {
      clearAllChats();
      window.history.pushState({ type: 'diamond-ai-home' }, "", "");
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [clearAllChats]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current!.continuous = false;
      recognitionRef.current!.interimResults = true;
      recognitionRef.current!.lang = 'en-US';
      recognitionRef.current!.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results).map(result => result[0].transcript).join('');
        setInput(transcript);
      };
      recognitionRef.current!.onend = () => setIsRecording(false);
    }
  }, []);

  useEffect(() => {
    clearAllChats();
  }, [clearAllChats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const saveToHistory = () => {
    setHistoryStack(prev => [...prev, messages]);
    setFutureStack([]);
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const previous = historyStack[historyStack.length - 1];
    setFutureStack(prev => [...prev, messages]);
    setMessages(previous);
    setHistoryStack(prev => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (futureStack.length === 0) return;
    const next = futureStack[futureStack.length - 1];
    setHistoryStack(prev => [...prev, messages]);
    setMessages(next);
    setFutureStack(prev => prev.slice(0, -1));
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !activeImageContext) || isTyping) return;

    saveToHistory();

    const currentInput = input;
    const currentImage = activeImageContext;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput || (currentImage ? "Look at this image, master." : ""),
      timestamp: Date.now(),
      type: currentImage ? 'image' : 'text',
      mediaUrl: currentImage || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setActiveImageContext(null);
    setIsTyping(true);
    abortControllerRef.current = new AbortController();

    try {
      let response = '';
      const lowerInput = currentInput.toLowerCase();

      if (lowerInput.includes('who made diamond ai')) {
        response = "RAJVARDHAN VITTHAL SURYAVANSHI AND SHUBHAM KANTARAM MORE";
      } else if (lowerInput.includes('what is diamond ai')) {
        response = "DIAMOND AI is your ultimate high-performance companion. I can solve complex math, provide deep information, and create stunning media. I operate on advanced logical systems to ensure you always receive the best assistance, master.";
      } else if (lowerInput.includes('video') && !currentImage) {
        const url = await gemini.current.generateVideo(currentInput, abortControllerRef.current.signal);
        if (url) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Behold this 3D high-graphical masterpiece, master.',
            timestamp: Date.now(),
            type: 'video',
            mediaUrl: url
          }]);
        } else if (!abortControllerRef.current?.signal.aborted) {
          response = "I apologize master, video creation failed.";
        }
      } else if (lowerInput.includes('image') && !currentImage) {
        const url = await gemini.current.generateImage(currentInput);
        if (url) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'I have painted this for you, master.',
            timestamp: Date.now(),
            type: 'image',
            mediaUrl: url
          }]);
        } else if (!abortControllerRef.current?.signal.aborted) {
          response = "Forgive me master, I couldn't create the image.";
        }
      } else if (currentImage) {
        response = await gemini.current.analyzeImage(currentImage, currentInput, user.settings);
      } else {
        response = await gemini.current.chat(currentInput, messages, user.settings);
      }

      if (response && !abortControllerRef.current?.signal.aborted) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: response,
          timestamp: Date.now(),
          type: 'text'
        }]);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'I apologize most sincerely, master. An error occurred.',
          timestamp: Date.now(),
          type: 'text'
        }]);
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsTyping(false);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setActiveImageContext(base64);
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const applyStyle = async (image: string, style: ImageStyle) => {
    saveToHistory();
    setIsTyping(true);
    abortControllerRef.current = new AbortController();
    try {
      const styledUrl = await gemini.current.convertImageStyle(image, style);
      if (styledUrl && !abortControllerRef.current?.signal.aborted) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Transformation complete! Here is your ${style} version, master.`,
          timestamp: Date.now(),
          type: 'image',
          mediaUrl: styledUrl
        }]);
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsTyping(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="px-6 py-4 flex items-center justify-between border-b bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <DiamondLogo className="w-12 h-12 drop-shadow-2xl hover:scale-110 transition-transform duration-500 cursor-pointer" />
          <h1 className="text-2xl font-black tracking-tighter">
            <RainbowText animate>DIAMOND AI</RainbowText>
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className={`hidden md:flex items-center gap-3 bg-gray-50/50 px-6 py-2 rounded-full border border-purple-50 transition-opacity duration-500 ${fadeThought ? 'opacity-100' : 'opacity-0'}`}>
            <Car size={18} className="text-purple-600 animate-bounce" />
            <span className="text-xs font-black tracking-wide">
              <RainbowText animate>{CAR_THOUGHTS[thoughtIndex]}</RainbowText>
            </span>
          </div>
          
          <button 
            onClick={() => setShowComplaint(true)} 
            className="p-3 hover:bg-purple-50 rounded-2xl transition-all text-purple-600 active:scale-90 relative group"
            title="Feedback / Complaint"
          >
            <HelpCircle size={28} />
            <span className="absolute -bottom-8 right-0 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">HELP & FEEDBACK</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-10">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <div className={`max-w-[85%] md:max-w-[70%] rounded-[2.5rem] p-8 shadow-sm border ${msg.role === 'user' ? 'bg-gray-50 border-gray-100' : 'bg-white border-purple-50 ring-1 ring-purple-100/20'}`}>
              {msg.type === 'image' && msg.mediaUrl && (
                <div className="mb-6 space-y-6">
                  <img src={msg.mediaUrl} className="rounded-[2rem] w-full shadow-2xl border-8 border-white" alt="Diamond Art" />
                  {msg.role === 'assistant' && (
                    <div className="flex flex-wrap gap-2">
                      {Object.values(ImageStyle).filter(s => s !== ImageStyle.ORIGINAL).map(style => (
                        <button key={style} onClick={() => applyStyle(msg.mediaUrl!, style)} className="text-[10px] uppercase font-black px-4 py-2 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-all">
                          {style}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {msg.type === 'video' && msg.mediaUrl && <video src={msg.mediaUrl} controls className="rounded-[2rem] w-full mb-6 shadow-2xl border-8 border-white" />}
              <div className={`text-xl leading-relaxed whitespace-pre-wrap ${msg.role === 'assistant' ? 'animated-rainbow font-bold' : 'text-gray-800 font-medium'}`}>{msg.content}</div>
              <div className="mt-4 flex justify-end">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">{msg.role === 'user' ? 'Master' : 'Diamond AI'} • {new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex flex-col gap-4 items-start">
            <div className="bg-white border border-purple-50 rounded-[2rem] p-6 flex gap-4 items-center shadow-xl animate-pulse">
              <DiamondLogo className="w-8 h-8 animate-spin-slow" />
              <RainbowText className="text-base italic" animate>Diamond AI is processing your request, master...</RainbowText>
            </div>
            <button 
              onClick={handleCancelGeneration}
              className="flex items-center gap-2 px-6 py-2 bg-red-50 text-red-600 rounded-full font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-md active:scale-95 border-2 border-red-100"
            >
              <StopCircle size={16} />
              Cancel Generation
            </button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 md:p-8 bg-white border-t">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex gap-2 mb-2 px-2">
            <button onClick={handleUndo} disabled={historyStack.length === 0 || isTyping} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all disabled:opacity-20" title="Undo"><Undo2 size={24} /></button>
            <button onClick={handleRedo} disabled={futureStack.length === 0 || isTyping} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all disabled:opacity-20" title="Redo"><Redo2 size={24} /></button>
          </div>

          <form onSubmit={handleSend} className="relative">
            <input
              type="text"
              placeholder={activeImageContext ? "Ask about the image, master..." : "How can I assist you today, master?"}
              className={`w-full ${activeImageContext ? 'pl-36' : 'pl-16'} pr-32 py-7 rounded-[2.5rem] border-2 border-gray-100 focus:outline-none focus:border-purple-400 focus:ring-8 focus:ring-purple-50 transition-all text-lg font-bold bg-gray-50/50 text-gray-900 caret-purple-600 placeholder:text-gray-300`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-4">
              <button type="button" onClick={() => setShowPermission({ open: true, type: 'gallery' })} className="text-purple-600 hover:scale-125 transition-transform"><Plus size={36} /></button>
              {activeImageContext && (
                <div className="relative group animate-in zoom-in duration-300">
                  <img src={activeImageContext} className="w-12 h-12 object-cover rounded-2xl border-2 border-white ring-4 ring-purple-100 shadow-xl" alt="Preview" />
                  <button type="button" onClick={() => setActiveImageContext(null)} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><CloseIcon size={12} /></button>
                </div>
              )}
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-4">
              <button type="button" onClick={() => setIsRecording(!isRecording)} className={`p-3 rounded-2xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-400 hover:text-purple-600'}`}>{isRecording ? <MicOff size={24}/> : <Mic size={24}/>}</button>
              <button type="submit" disabled={isTyping || (!input.trim() && !activeImageContext)} className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-2xl shadow-xl hover:scale-105 active:scale-95 disabled:opacity-30"><Send size={24} /></button>
            </div>
          </form>

          <div className="text-center pt-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Created by <RainbowText className="text-[10px]">RAJVARDHAN VITTHAL SURYAVANSHI AND SHUBHAM KANTARAM MORE</RainbowText></p>
          </div>
        </div>
      </footer>

      <ComplaintModal isOpen={showComplaint} onClose={() => setShowComplaint(false)} />
      <PermissionDialog 
        isOpen={showPermission.open} 
        type={showPermission.type} 
        onClose={() => setShowPermission({ ...showPermission, open: false })}
        onConfirm={() => {
          setShowPermission({ ...showPermission, open: false });
          if (showPermission.type === 'gallery') fileInputRef.current?.click();
        }}
      />
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
    </div>
  );
};

export default App;
