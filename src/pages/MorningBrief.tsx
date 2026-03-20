import React, { useState, useEffect, useRef } from 'react';

export default function MorningBrief() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // AI Chat States
  const [query, setQuery] = useState("");
  const [chat, setChat] = useState([{ role: "ai", text: "I've analyzed the last 48 hours of Indian market data. Which sector or event should we drill into?" }]);
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetch("https://marketpulse-ai-xkpg.onrender.com/api/dashboard")
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, aiLoading]);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = query;
    setChat(prev => [...prev, { role: "user", text: userMsg }]);
    setQuery("");
    setAiLoading(true);

    try {
      const res = await fetch("https://marketpulse-ai-xkpg.onrender.com/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: chat.map(c => ({ role: c.role === 'ai' ? 'assistant' : 'user', content: c.text })),
          context_headlines: data?.headlines || [],
          context_sectors: data?.benchmark || []
        })
      });
      const responseData = await res.json();
      setChat(prev => [...prev, { role: "ai", text: responseData.answer }]);
    } catch (error) {
      setChat(prev => [...prev, { role: "ai", text: "Connection error. The market is moving fast, and my servers are catching up." }]);
    }
    setAiLoading(false);
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center font-mono">Loading Market Data...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="border-b border-gray-800 pb-6">
          <h1 className="text-4xl font-bold text-white tracking-tight">Morning Brief</h1>
          <p className="text-gray-400 mt-2">Strict 48-Hour Horizon • Indian Standard Time</p>
        </div>

        {/* Top Data Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Regime Forecast</h3>
            <p className="text-3xl font-bold text-blue-400 mt-2">{data?.market_regime?.regime || "Neutral"}</p>
            <p className="text-sm text-gray-400 mt-1">{data?.market_regime?.description}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Market Stress Index</h3>
            <p className={`text-3xl font-bold mt-2 ${data?.market_stress_index?.level === 'Critical' ? 'text-red-500' : 'text-yellow-400'}`}>
              {data?.market_stress_index?.msi || 0}
            </p>
            <p className="text-sm text-gray-400 mt-1">Status: {data?.market_stress_index?.level || "Unknown"}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Data Volume</h3>
            <p className="text-3xl font-bold text-white mt-2">{data?.summary_stats?.total_headlines || 0}</p>
            <p className="text-sm text-gray-400 mt-1">Catalysts Analyzed</p>
          </div>
        </div>

        {/* 🤖 THE INTEGRATED GLASSMORPHISM COPILOT */}
        <div className="mt-12 mb-8 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          
          <div className="relative bg-[#111111]/90 backdrop-blur-2xl border border-gray-800 rounded-3xl shadow-2xl flex flex-col h-[500px] overflow-hidden">
            {/* Copilot Header */}
            <div className="bg-gray-900/50 px-6 py-4 flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                <h3 className="text-white font-medium tracking-wide">MarketPulse Copilot</h3>
              </div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono border border-gray-800 px-2 py-1 rounded-full">Live Context Active</span>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {chat.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-5 py-4 text-[15px] leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-md' 
                      : 'bg-[#1a1a1a] text-gray-300 rounded-2xl rounded-tl-sm border border-gray-800 shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl rounded-tl-sm px-6 py-5 flex space-x-2 shadow-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} className="h-4" />
            </div>

            {/* Input Form */}
            <div className="p-4 bg-gray-900/80 border-t border-gray-800">
              <form onSubmit={handleAsk} className="relative flex items-center max-w-4xl mx-auto">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask the AI about specific sectors or headlines above..."
                  className="w-full bg-[#161616] border border-gray-800 text-gray-200 text-sm rounded-full pl-6 pr-14 py-4 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-gray-600"
                  disabled={aiLoading}
                />
                <button 
                  type="submit" 
                  disabled={aiLoading || !query.trim()}
                  className="absolute right-2 p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white rounded-full transition-all disabled:opacity-50"
                >
                  <svg className="w-4 h-4 transform -rotate-45 ml-0.5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                </button>
              </form>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
