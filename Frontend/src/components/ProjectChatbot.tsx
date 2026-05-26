import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, FileText, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  isSummary?: boolean;
}

const INITIAL_MESSAGE: Message = {
  id: '1',
  sender: 'bot',
  text: "Hi! I'm your SDLC Assistant. I've analyzed the uploaded project documents. How can I help you today?",
};

const MOCK_SUMMARY = `Based on the latest 'Sprint 4 Planning.docx' and 'Architecture_V2.pdf':

• **Current Status**: On track for Q3 release.
• **Progress**: 75% of Sprint 4 deliverables are completed.
• **Key Risks**: Potential schedule slippage due to blocked API integration dependencies.
• **Budget**: Currently showing a 4% variance in vendor invoice processing.

Would you like me to elaborate on the risks or the budget variance?`;

export default function ProjectChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: any) => {
    const textStr = typeof textToSend === 'string' ? textToSend : inputValue;
    const text = textStr.trim();
    if (!text) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: text }),
      });

      if (!response.ok) {
        throw new Error('Backend query failed');
      }

      const data = await response.json();
      setIsTyping(false);

      const newBotMessage: Message = {
        id: Date.now().toString(),
        sender: 'bot',
        text: data.message,
        isSummary: text.toLowerCase().includes('summar') || text.toLowerCase().includes('document'),
      };

      setMessages((prev) => [...prev, newBotMessage]);
    } catch (error) {
      console.warn('Real-time assistant fallback to mock simulation:', error);
      
      // Graceful simulated intelligence fallback if local Ollama/server is not active
      setTimeout(() => {
        setIsTyping(false);
        const lowerInput = text.toLowerCase();
        let botResponse = "I can help summarize the project documents, identify risks, or provide schedule updates. Just ask!";
        let isSummary = false;

        if (lowerInput.includes('summar') || lowerInput.includes('document') || lowerInput.includes('project')) {
          botResponse = MOCK_SUMMARY;
          isSummary = true;
        } else if (lowerInput.includes('risk')) {
          botResponse = "The main risk right now is the blocked API integration. The backend team is currently waiting on vendor credentials, which might push the schedule back by 3-5 days.";
        }

        const newBotMessage: Message = {
          id: Date.now().toString(),
          sender: 'bot',
          text: botResponse,
          isSummary,
        };

        setMessages((prev) => [...prev, newBotMessage]);
      }, 1200);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-50
          bg-gradient-to-r from-brand-primary to-brand-accent text-brand-dark hover:scale-105 transition-transform duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark
          ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
        aria-label="Open Project Assistant Chat"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div
        className={`
          fixed bottom-6 right-6 w-full max-w-[380px] h-[550px] max-h-[calc(100vh-48px)] z-50
          bg-brand-dark/95 backdrop-blur-xl border border-brand-primary/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden
          transition-all duration-300 origin-bottom-right
          ${isOpen ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'}
        `}
      >
        {/* Header */}
        <div className="bg-brand-primary/20 border-b border-brand-primary/30 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center">
              <Bot className="w-5 h-5 text-brand-dark" />
            </div>
            <div>
              <h3 className="text-brand-light font-bold text-sm">Project Assistant</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-xs text-brand-light/60">Online & Document-Aware</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg text-brand-light/60 hover:text-brand-light hover:bg-brand-primary/30 transition-colors"
            aria-label="Close Chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                ${msg.sender === 'bot' ? 'bg-brand-primary/30' : 'bg-brand-accent/20'}
              `}>
                {msg.sender === 'bot' ? (
                  <Bot className="w-4 h-4 text-brand-accent" />
                ) : (
                  <User className="w-4 h-4 text-brand-light" />
                )}
              </div>

              {/* Message Bubble */}
              <div className={`
                max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed
                ${msg.sender === 'user'
                  ? 'bg-brand-primary/40 text-brand-light rounded-tr-sm border border-brand-primary/30'
                  : 'bg-brand-primary/10 text-brand-light/90 rounded-tl-sm border border-brand-primary/20'
                }
              `}>
                {msg.isSummary && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-brand-primary/20 text-brand-accent font-semibold text-xs">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Document Summary</span>
                  </div>
                )}
                
                <div 
                  className="space-y-2 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: msg.text
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-brand-light font-bold">$1</strong>')
                  }}
                />
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-primary/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-brand-accent" />
              </div>
              <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-2xl rounded-tl-sm p-3 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts (only if no messages beyond initial) */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => handleSend("Summarize the latest documents")}
              className="flex-shrink-0 px-3 py-1.5 bg-brand-primary/20 hover:bg-brand-primary/40 border border-brand-primary/30 rounded-full text-xs text-brand-accent transition-colors"
            >
              Summarize documents
            </button>
            <button
              onClick={() => handleSend("What are the key risks?")}
              className="flex-shrink-0 px-3 py-1.5 bg-brand-primary/20 hover:bg-brand-primary/40 border border-brand-primary/30 rounded-full text-xs text-brand-accent transition-colors"
            >
              Identify risks
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-brand-dark border-t border-brand-primary/30">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isTyping) handleSend();
              }}
              disabled={isTyping}
              placeholder={isTyping ? "Assistant is thinking..." : "Ask the assistant..."}
              className="w-full bg-brand-primary/10 border border-brand-primary/30 rounded-full pl-4 pr-12 py-3 text-sm text-brand-light placeholder-brand-light/40 focus:outline-none focus:border-brand-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <button
              id="chat-send-btn"
              onClick={handleSend}
              disabled={isTyping || !inputValue.trim()}
              className="absolute right-2 p-2 rounded-full bg-brand-accent text-brand-dark disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
              aria-label="Send message"
            >
              {isTyping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
