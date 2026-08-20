import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Bot, Send, Sparkles, TrendingUp, AlertTriangle, Clock, 
  Lightbulb, RefreshCw, Cpu, CheckCircle2, Copy, ArrowRight
} from 'lucide-react';

export default function AIBusinessAdvisorPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'नमस्ते! मैं आपका **AI मुनीम जी (Smart Business Advisor)** हूँ।\n\nआप मुझसे अपनी दुकान की बिक्री, उधारी, स्टॉक री-ऑर्डर या मुनाफा बढ़ाने के तरीके हिंदी या हिंग्लिश में पूछ सकते हैं।',
      growthTip: '💡 नीचे दिए गए किसी भी बटन पर क्लिक करके तुरंत रिपोर्ट और सुझाव प्राप्त करें।',
      tokenMetrics: null,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [usageStats, setUsageStats] = useState({
    totalTokens: 0,
    monthlyQuota: 50000
  });

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/ai-advisor/usage-stats');
      if (res.data.success) {
        setUsageStats({
          totalTokens: res.data.data.totalTokens || 0,
          monthlyQuota: res.data.data.monthlyQuota || 50000
        });
      }
    } catch (err) {
      console.error("Failed to fetch AI usage stats:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSend = async (customQuery) => {
    const textToSend = customQuery || query;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.post('/api/ai-advisor/ask', { query: textToSend });
      if (res.data.success) {
        const aiMsg = {
          id: Date.now() + 1,
          sender: 'ai',
          text: res.data.data.answer,
          growthTip: res.data.data.growthTip,
          tokenMetrics: res.data.data.tokenMetrics,
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
        fetchStats();
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: 'माफ़ कीजिये, डेटा प्रोसेस करने में कुछ समस्या आई। कृपया पुनः प्रयास करें।',
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: '📊 आज व चालू माह की बिक्री व मुनाफा', query: 'इस महीने की कुल बिक्री और अनुमानित मुनाफा कितना है?' },
    { label: '⚠️ खत्म होने वाले स्टॉक्स (Reorder Alert)', query: 'कम स्टॉक वाले कौन से आइटम्स तुरंत ऑर्डर करने हैं?' },
    { label: '⏳ पुरानी उधारी व तगादा लिस्ट', query: 'किस ग्राहक का उधारी खाता सबसे पुराना है?' },
    { label: '💡 बिक्री बढ़ाने के 3 बेहतरीन सुझाव', query: 'दुकान की बिक्री और प्रति बिल वैल्यू कैसे बढ़ाएं?' }
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 rounded-full text-[10px] font-black uppercase tracking-wider">
              AI Powered
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-xs text-gray-500 font-bold">24/7 Smart Vyapar Copilot</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-1 flex items-center gap-2">
            <Bot className="text-purple-600" size={26} />
            AI Business Advisor (AI मुनीम जी)
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">
            अपनी दुकान के रिकॉर्ड्स खोजें, उधारी अलर्ट पाएं और व्यापार बढ़ाने के स्मार्ट सुझाव लें
          </p>
        </div>

        {/* Token Meter Badge */}
        <div className="bg-purple-50 border border-purple-200 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-xs">
          <Cpu className="text-purple-600" size={20} />
          <div>
            <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">AI Token Meter</div>
            <div className="text-xs font-black text-purple-950">
              {usageStats.totalTokens.toLocaleString('en-IN')} / {usageStats.monthlyQuota.toLocaleString('en-IN')} <span className="text-[10px] text-purple-700 font-normal">Tokens/mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p.query)}
            disabled={loading}
            className="p-3 bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-2xl text-left text-xs font-bold text-gray-800 hover:text-purple-900 transition shadow-xs flex items-center justify-between group disabled:opacity-50"
          >
            <span>{p.label}</span>
            <ArrowRight size={14} className="text-gray-400 group-hover:text-purple-600 transition" />
          </button>
        ))}
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[520px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={'flex ' + (msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={'max-w-[85%] rounded-2xl p-4 space-y-2 ' + (
                msg.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-xs' 
                  : 'bg-gray-50 border border-gray-200 text-gray-800 rounded-tl-xs'
              )}>
                <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 mb-1 font-bold">
                  <span>{msg.sender === 'user' ? '👤 You' : '🤖 AI मुनीम जी'}</span>
                  <span>{msg.time}</span>
                </div>

                <div className="text-xs leading-relaxed whitespace-pre-line font-medium">
                  {msg.text}
                </div>

                {msg.growthTip && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium mt-2">
                    {msg.growthTip}
                  </div>
                )}

                {msg.tokenMetrics && (
                  <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-200/60 flex items-center justify-between">
                    <span>⚡ {msg.tokenMetrics.totalTokens} Tokens Metered</span>
                    <span>Cost: ₹{msg.tokenMetrics.costInr}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl p-4 flex items-center gap-2 text-xs text-gray-600">
                <RefreshCw size={14} className="animate-spin text-purple-600" />
                <span>AI मुनीम जी आपके बिजनेस रिकॉर्ड्स का विश्लेषण कर रहे हैं...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-gray-200 bg-gray-50/50 rounded-b-2xl">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="अपनी दुकान के बारे में कुछ भी पूछें (उदा. कौन सा पेंट सबसे ज्यादा बिका?)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none transition"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send size={15} />
              <span>पूछें</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
