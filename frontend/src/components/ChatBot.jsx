import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, Send, X, Sun, Moon } from "lucide-react";
import chatService from "../services/chatService";

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isDaytime, setIsDaytime] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setIsDaytime(hour >= 6 && hour < 18);
    };
    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when new message appears
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await chatService.sendMessage(input);
      const botMsg = {
        role: "assistant",
        text: res.reply || res.response || "No reply found.",
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Error fetching response." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("✅ Copied to clipboard!");
  };

  const handleTranslate = async (originalText, langCode, langLabel) => {
    try {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `⏳ Translating to ${langLabel}...` },
      ]);

      const data = await chatService.translateText(originalText, langCode);
      const translated = data.translated || "Translation failed.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `[${langLabel}] ${translated}` },
      ]);
      setTimeout(scrollToBottom, 100);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `⚠️ Error translating to ${langLabel}` },
      ]);
    }
  };

  return (
    <>
      {/* 🌥️ Sky Animation and Chat Button */}
      <div className="fixed bottom-0 right-0 mb-20 mr-6">
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-0 right-0"
        >
          {isDaytime ? (
            <Sun size={24} className="text-yellow-500 mb-2" />
          ) : (
            <Moon size={24} className="text-blue-300 mb-2" />
          )}
        </motion.div>
        <motion.div
          animate={{
            x: [-20, 20, -20],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-8 right-4"
        >
          <Cloud size={20} className="text-blue-300 opacity-60" />
        </motion.div>
      </div>
      
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.1 }}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white p-4 rounded-full shadow-lg focus:outline-none transition-all"
      >
        {open ? <X size={24} /> : <Cloud size={28} />}
      </motion.button>

      {/* 💬 Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-20 right-6 w-96 max-h-[75vh] bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200/50"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 text-white p-4 flex justify-between items-center">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Cloud size={18} className="animate-pulse" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                  SkyNow Assistant
                </span>
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="hover:text-gray-200 transition hover:rotate-90 duration-300"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
              {messages.map((m, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl shadow-sm max-w-[75%] text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none"
                        : "bg-white/90 backdrop-blur-sm text-gray-800 rounded-bl-none border border-gray-100"
                    }`}
                  >
                    {m.text}

                    {/* Actions for assistant messages */}
                    {m.role === "assistant" && (
                      <div className="mt-2 flex items-center space-x-3 text-xs text-gray-500">
                        <button
                          onClick={() => copyToClipboard(m.text)}
                          className="hover:text-blue-600 transition"
                        >
                          📋 Copy
                        </button>

                        {/* 🌐 Translate dropdown */}
                        <div className="relative group">
                          <button className="hover:text-blue-600 transition">
                            🌐 Translate
                          </button>
                          <div className="absolute hidden group-hover:flex flex-col bg-white border rounded-md shadow-lg text-gray-700 right-0 mt-1 z-50">
                            {[
                              { code: "en", label: "English" },
                              { code: "ta", label: "Tamil" },
                              { code: "te", label: "Telugu" },
                              { code: "kn", label: "Kannada" },
                              { code: "hi", label: "Hindi" },
                              { code: "ml", label: "Malayalam" },
                            ].map((lang) => (
                              <button
                                key={lang.code}
                                onClick={() =>
                                  handleTranslate(
                                    m.text,
                                    lang.label, // send language name, not code
                                    lang.label
                                  )
                                }
                                className="px-3 py-1 text-left hover:bg-blue-50"
                              >
                                {lang.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t bg-gradient-to-r from-white to-blue-50 flex space-x-3 items-center">
              <input
                type="text"
                placeholder="Ask about the weather..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm shadow-inner transition-all duration-200 hover:bg-white"
              />
              <motion.button
                onClick={handleSend}
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white p-2.5 rounded-xl shadow-md disabled:opacity-50 transition-all duration-200"
              >
                {loading ? (
                  <div className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4 mx-2"></div>
                ) : (
                  <Send size={18} />
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
