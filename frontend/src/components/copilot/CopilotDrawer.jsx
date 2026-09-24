import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  Sparkles,
  X,
  Send,
  Mic,
  MicOff,
  MessageSquarePlus,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Package,
  Bot,
  User,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import logoImg from '../../assets/logo.png';
import api from '../../services/api';
import './CopilotDrawer.css';

// Trendy Cartoon Robot Face Icon with Glowing Cyan Eyes
function TrendyCartoonRobotIcon({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`trendy-robot-svg ${className}`}
    >
      <defs>
        <linearGradient id="botHeadGrad" x1="4" y1="6" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id="botScreenGrad" x1="7" y1="10" x2="25" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0f172a" />
          <stop offset="1" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="botEyeCyan" x1="9" y1="13" x2="13" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="botAntennaGlow" x1="14" y1="1" x2="18" y2="5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f472b6" />
          <stop offset="1" stopColor="#982A86" />
        </linearGradient>
      </defs>

      {/* Glowing Top Antenna */}
      <line x1="16" y1="2" x2="16" y2="6" stroke="#982A86" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="16" cy="2.5" r="2.5" fill="url(#botAntennaGlow)" />

      {/* Cute Side Ear Nodes */}
      <rect x="2" y="11" width="3" height="8" rx="1.5" fill="#cbd5e1" />
      <rect x="27" y="11" width="3" height="8" rx="1.5" fill="#cbd5e1" />

      {/* Main Rounded Robot Head Body */}
      <rect x="4.5" y="6" width="23" height="19" rx="6" fill="url(#botHeadGrad)" stroke="#cbd5e1" strokeWidth="1.5" />

      {/* Dark Visor / Screen Face */}
      <rect x="7" y="9.5" width="18" height="12" rx="4" fill="url(#botScreenGrad)" />

      {/* Big Cute Glowing Cyan Eyes */}
      <ellipse cx="11.5" cy="15" rx="2.5" ry="3" fill="url(#botEyeCyan)" />
      <circle cx="10.8" cy="14" r="1" fill="#ffffff" />

      <ellipse cx="20.5" cy="15" rx="2.5" ry="3" fill="url(#botEyeCyan)" />
      <circle cx="19.8" cy="14" r="1" fill="#ffffff" />

      {/* Cute Smile */}
      <path d="M14 18.5 C15 19.8 17 19.8 18 18.5" stroke="#38bdf8" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      
      {/* Cheek Glows */}
      <circle cx="9" cy="18.5" r="1" fill="#f472b6" fillOpacity="0.6" />
      <circle cx="23" cy="18.5" r="1" fill="#f472b6" fillOpacity="0.6" />
    </svg>
  );
}

// Lightweight Markdown Formatter for Assistant Responses
function renderFormattedMessage(text) {
  if (!text) return null;

  // Split into lines to render paragraphs, lists, and tables
  const lines = text.split('\n');
  const elements = [];
  let tableRows = [];
  let inTable = false;

  const parseInline = (str) => {
    // Bold: **text**
    let parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      // Inline code: `code`
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i}>{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Table line: starts and ends with |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      const cols = trimmed
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      // Check if it's separator line |---|---|
      if (cols.every((c) => /^-+$/.test(c.replace(/\s/g, '')))) {
        return;
      }
      tableRows.push(cols);
      return;
    } else if (inTable && tableRows.length > 0) {
      // Flush table
      elements.push(
        <div key={`table-${index}`} style={{ overflowX: 'auto', margin: '8px 0' }}>
          <table>
            <thead>
              <tr>
                {tableRows[0].map((th, i) => (
                  <th key={i}>{th}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(1).map((row, ri) => (
                <tr key={ri}>
                  {row.map((td, ci) => (
                    <td key={ci}>{parseInline(td)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }

    // Headings (#, ##, ###)
    if (trimmed.startsWith('#')) {
      const headingClean = trimmed.replace(/^#+\s*/, '');
      elements.push(
        <div
          key={index}
          style={{
            fontWeight: 700,
            fontSize: '0.92rem',
            color: '#0f172a',
            margin: '8px 0 4px 0',
            lineHeight: 1.3
          }}
        >
          {parseInline(headingClean)}
        </div>
      );
      return;
    }

    // Bullet points
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      elements.push(
        <li key={index} style={{ marginLeft: '16px', marginBottom: '4px' }}>
          {parseInline(trimmed.substring(2))}
        </li>
      );
      return;
    }

    // Numbered points
    if (/^\d+\.\s/.test(trimmed)) {
      elements.push(
        <li key={index} style={{ marginLeft: '16px', marginBottom: '4px' }}>
          {parseInline(trimmed.replace(/^\d+\.\s/, ''))}
        </li>
      );
      return;
    }

    // Normal text or empty line
    if (trimmed === '') {
      elements.push(<div key={index} style={{ height: '6px' }} />);
    } else {
      elements.push(
        <p key={index} style={{ margin: '4px 0' }}>
          {parseInline(trimmed)}
        </p>
      );
    }
  });

  // If table was at the very end
  if (inTable && tableRows.length > 0) {
    elements.push(
      <div key="table-end" style={{ overflowX: 'auto', margin: '8px 0' }}>
        <table>
          <thead>
            <tr>
              {tableRows[0].map((th, i) => (
                <th key={i}>{th}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.slice(1).map((row, ri) => (
              <tr key={ri}>
                {row.map((td, ci) => (
                  <td key={ci}>{parseInline(td)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <div>{elements}</div>;
}

export default function CopilotDrawer() {
  const { user } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [avatarView, setAvatarView] = useState('ROBOT'); // 'ROBOT' or 'LOGO'
  const [isSparking, setIsSparking] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Hey ${user?.firstName || user?.name || 'there'}! How can I assist you with StockPilot today?`
    }
  ]);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Cinematic alternating avatar switch every 3.6s with spark effect
  useEffect(() => {
    if (isOpen) return;

    const interval = setInterval(() => {
      setIsSparking(true);
      setTimeout(() => {
        setAvatarView((prev) => (prev === 'ROBOT' ? 'LOGO' : 'ROBOT'));
      }, 250);

      setTimeout(() => {
        setIsSparking(false);
      }, 950);
    }, 3600);

    return () => clearInterval(interval);
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      textareaRef.current?.focus();
    }
  }, [isOpen, messages]);

  // Load suggested prompts
  useEffect(() => {
    api
      .get('/ai/suggested-prompts')
      .then((res) => {
        const list = res?.data || res?.data?.data || res;
        if (Array.isArray(list) && list.length > 0) {
          setSuggestedPrompts(list);
        }
      })
      .catch(() => {
        setSuggestedPrompts([
          { id: '1', label: "Today's Sales", prompt: "Show me today's sales summary and total revenue.", icon: 'TrendingUp' },
          { id: '2', label: 'Low Stock Alert', prompt: 'Which products are low on stock right now?', icon: 'AlertTriangle' },
          { id: '3', label: 'Store Health Check', prompt: 'Give me a quick financial health check for this month.', icon: 'DollarSign' }
        ]);
      });
  }, []);

  // Listen for global custom event to open copilot
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('stockpilot_open_copilot', handleOpen);
    return () => window.removeEventListener('stockpilot_open_copilot', handleOpen);
  }, []);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now().toString(), sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const payload = {
        message: text,
        history: messages.map((m) => ({ sender: m.sender, text: m.text }))
      };

      const res = await api.post('/ai/chat', payload);
      const reply =
        res?.data?.reply ||
        res?.reply ||
        res?.data?.data?.reply ||
        res?.message ||
        'How can I assist your business today?';
      const actions =
        res?.data?.actions ||
        res?.actions ||
        res?.data?.data?.actions ||
        [];

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: reply,
          actions: actions
        }
      ]);
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to connect to AI Copilot right now. Please check if the AI Service is running.';
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `**Notice**: ${errorMsg}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'bot',
        text: `New conversation started! How can I assist you with **${user?.companyName || 'StockPilot'}**?`
      }
    ]);
  };

  // Speech to Text (Web Speech API)
  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your current browser. Please use Google Chrome or Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN'; // Indian English / Tanglish friendly
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  const getChipIcon = (iconName) => {
    switch (iconName) {
      case 'TrendingUp':
        return <TrendingUp size={14} />;
      case 'AlertTriangle':
        return <AlertTriangle size={14} />;
      case 'DollarSign':
        return <DollarSign size={14} />;
      default:
        return <Sparkles size={14} />;
    }
  };

  return (
    <>
      {/* Floating Action Launcher Circular Button (Always Accessible) */}
      {!isOpen && (
        <div className="copilot-floating-wrapper">
          <button
            onClick={() => setIsOpen(true)}
            className="copilot-floating-launcher"
            aria-label="Open StockPilot Chatbot"
          >
            <div className="copilot-avatar-morph-box">
              {/* Cartoon Robot Face */}
              <div className={`copilot-avatar-face ${avatarView === 'ROBOT' ? 'active' : 'inactive'}`}>
                <TrendyCartoonRobotIcon size={30} />
              </div>

              {/* StockPilot Brand Logo Face */}
              <div className={`copilot-avatar-face ${avatarView === 'LOGO' ? 'active' : 'inactive'}`}>
                <img src={logoImg} alt="StockPilot" className="copilot-fab-logo" />
              </div>

              {/* Cinematic Spark Burst Particles */}
              <div className={`copilot-spark-burst ${isSparking ? 'active' : ''}`}>
                <div className="copilot-spark-dot" />
                <div className="copilot-spark-dot" />
                <div className="copilot-spark-dot" />
                <div className="copilot-spark-dot" />
              </div>
            </div>
          </button>
          <div className="copilot-launcher-tooltip">StockPilot Chatbot</div>
        </div>
      )}

      {/* Backdrop for easy outside click */}
      {isOpen && <div className="copilot-backdrop" onClick={() => setIsOpen(false)} />}

      {/* Slide-out Drawer */}
      <aside className={`copilot-drawer ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
        {/* Header */}
        <div className="copilot-header">
          <div className="copilot-header-info">
            <div className="copilot-header-avatar">
              <img src={logoImg} alt="StockPilot" className="copilot-header-logo-img" />
            </div>
            <div>
              <h3 className="copilot-header-title">StockPilot Copilot</h3>
            </div>
          </div>
          <div className="copilot-header-actions">
            {/* New Chat Button with Tooltip */}
            <div className="copilot-action-wrapper">
              <button
                onClick={handleNewChat}
                className="copilot-icon-btn"
                aria-label="New Chat"
              >
                <MessageSquarePlus size={18} />
              </button>
              <div className="copilot-action-tooltip">New Chat</div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="copilot-icon-btn"
              title="Close Copilot"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        {suggestedPrompts.length > 0 && (
          <div className="copilot-suggestions-bar">
            {suggestedPrompts.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSendMessage(item.prompt)}
                className="copilot-chip"
              >
                {getChipIcon(item.icon)}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Messages Feed */}
        <div className="copilot-messages-container">
          {messages.map((msg) => (
            <div key={msg.id} className={`copilot-message-row ${msg.sender}`}>
              <div className="copilot-msg-avatar">
                {msg.sender === 'user' ? <User size={16} /> : <TrendyCartoonRobotIcon size={20} />}
              </div>
              <div className="copilot-msg-bubble">
                {renderFormattedMessage(msg.text)}
              </div>
            </div>
          ))}

          {loading && (
            <div className="copilot-message-row bot">
              <div className="copilot-msg-avatar">
                <TrendyCartoonRobotIcon size={20} />
              </div>
              <div className="copilot-typing-indicator">
                <div className="copilot-dot" />
                <div className="copilot-dot" />
                <div className="copilot-dot" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Footer / Input Bar */}
        <div className="copilot-footer">
          <div className="copilot-input-box">
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`copilot-mic-btn ${isListening ? 'listening' : ''}`}
              title={isListening ? 'Stop listening' : 'Voice Input (Tamil/English)'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Copilot..."
              className="copilot-textarea"
              disabled={loading}
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || loading}
              className="copilot-send-btn"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
