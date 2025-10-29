import React, { useState, useRef, useEffect, useCallback } from 'react';
import chatService from '../services/chatService';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const chatBotRef = useRef(null);
  const contentRef = useRef(null);

  const scrollToBottom = () => {
    try {
      if (contentRef.current) {
        contentRef.current.scrollTop = contentRef.current.scrollHeight;
      }
    } catch (e) {
      // ignore
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setIsSending(true);
    setTimeout(scrollToBottom, 50);

    try {
      const data = await chatService.sendMessage(text);
      let reply = '';
      if (!data) reply = 'No response from server';
      else if (typeof data === 'string') reply = data;
      else if (data.reply) reply = data.reply;
      else if (data.message) reply = data.message;
      else reply = JSON.stringify(data);

      setMessages((m) => [...m, { role: 'assistant', text: reply }]);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to get reply';
      setMessages((m) => [...m, { role: 'assistant', text: `Error: ${msg}` }]);
    } finally {
      setIsSending(false);
    }
  };

  // Drag handlers
  const handlePointerDown = (e) => {
    // don't start drag when clicking interactive elements
    if (e.target.closest && e.target.closest('.chat-content')) return;
    setIsDragging(true);
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;
    const rect = chatBotRef.current?.getBoundingClientRect();
    const w = rect?.width || (isOpen ? 350 : 56);
    const h = rect?.height || (isOpen ? 500 : 56);
    const margin = 10;
    const maxX = Math.max(margin, window.innerWidth - w - margin);
    const maxY = Math.max(margin, window.innerHeight - h - margin);
    const minX = margin;
    const minY = margin;

    setPosition({
      x: Math.max(minX, Math.min(newX, maxX)),
      y: Math.max(minY, Math.min(newY, maxY)),
    });
  }, [isDragging, dragStart, isOpen]);

  const handlePointerUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handlePointerMove);
      document.addEventListener('mouseup', handlePointerUp);
      document.addEventListener('touchmove', handlePointerMove, { passive: false });
      document.addEventListener('touchend', handlePointerUp);
    }

    return () => {
      document.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseup', handlePointerUp);
      document.removeEventListener('touchmove', handlePointerMove);
      document.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  const handleChatContentClick = (e) => e.stopPropagation();

  // Copy helper with clipboard fallback
  const copyToClipboard = (text) => {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        // optionally, show a small visual feedback
        // Using alert for now to keep it simple
        // eslint-disable-next-line no-alert
        alert('Copied assistant message to clipboard');
      }).catch(() => {
        // fallback to selection
        const temp = document.createElement('textarea');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        // eslint-disable-next-line no-alert
        alert('Copied assistant message to clipboard');
      });
    } else {
      const temp = document.createElement('textarea');
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
      // eslint-disable-next-line no-alert
      alert('Copied assistant message to clipboard');
    }
  };

  return (
    <div
      ref={chatBotRef}
      className={`fixed z-50 transition-all duration-300 ease-in-out ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: isOpen ? 'scale(1)' : 'scale(0.8)',
        opacity: isOpen ? 1 : 0.95,
        touchAction: 'none',
        userSelect: 'none',
      }}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      onPointerDown={handlePointerDown}
      role="button"
      aria-label="Open chat"
    >
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 h-96 flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-sm">Weather Assistant</h3>
                <p className="text-xs text-blue-100">Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="chat-content flex-1 p-4 overflow-y-auto bg-gray-50" onClick={handleChatContentClick} ref={contentRef} style={{ userSelect: 'text' }}>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs">
                    <p className="text-sm text-gray-800">Hi! I'm your Weather Assistant. I can help you with weather forecasts, analytics, and insights. How can I assist you today?</p>
                  </div>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-center`}>
                    <div className={`rounded-lg p-3 shadow-sm max-w-xs ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'}`}>
                      <p className="text-sm whitespace-pre-wrap" id={`msg-${idx}`}>{m.text}</p>
                    </div>
                    {m.role === 'assistant' && (
                      <button className="ml-2 text-sm text-gray-500 hover:text-gray-700" onClick={() => copyToClipboard(m.text)}>
                        Copy
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Ask about weather..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                disabled={isSending}
              />
              <button
                onClick={() => handleSend()}
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                disabled={!input.trim() || isSending}
              >
                {isSending ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">{messages.length === 0 ? 'Try asking about weather for a city (e.g., "weather in London")' : ''}</p>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center group">
          <div className="relative">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 text-yellow-800" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </button>
      )}
    </div>
  );
};

export default ChatBot;

