import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  X,
  Send,
  Mic,
  MicOff,
  MessageSquarePlus,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Package,
  User,
  ChevronRight,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import logoImg from '../../assets/logo.png';
import api from '../../services/api';
import './CopilotDrawer.css';

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
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Hey ${user?.firstName || user?.name || 'there'}! How can I assist you with your StockPilot inventory or sales today?`
    }
  ]);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

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

  const handleSendMessage = async (textToSend) => {
    const message = (textToSend || inputMessage).trim();
    if (!message || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: message
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    try {
      const response = await api.post('/ai/copilot', { message });
      const botReply =
        response?.data?.reply ||
        response?.data?.data?.reply ||
        response?.data?.message ||
        "I've received your request. Let me know if you need any other operational metrics.";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: botReply
        }
      ]);
    } catch (err) {
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Unable to process assistant request at this moment. Please check network connection.';

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `⚠️ ${errorMessage}`
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
        id: 'welcome-reset',
        sender: 'bot',
        text: `New session started. Ask me anything about your products, warehouses, or revenue.`
      }
    ]);
  };

  // Web Speech API Voice Dictation
  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Voice input initialization error:', err);
      setIsListening(false);
    }
  };

  const getChipIcon = (iconName) => {
    switch (iconName) {
      case 'TrendingUp':
        return <TrendingUp size={13} />;
      case 'AlertTriangle':
        return <AlertTriangle size={13} />;
      case 'DollarSign':
        return <DollarSign size={13} />;
      default:
        return <MessageSquare size={13} />;
    }
  };

  return (
    <>
      {/* Floating Action Launcher Button (Clean & Professional) */}
      {!isOpen && (
        <div className="copilot-floating-wrapper">
          <button
            onClick={() => setIsOpen(true)}
            className="copilot-floating-launcher"
            aria-label="Open StockPilot Assistant"
            title="StockPilot Assistant"
          >
            <img src={logoImg} alt="StockPilot" className="copilot-fab-logo" />
          </button>
          <div className="copilot-launcher-tooltip">StockPilot Assistant</div>
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
              <h3 className="copilot-header-title">StockPilot Assistant</h3>
              <div className="copilot-header-subtitle">
                <span className="copilot-status-dot" /> Live Inventory & POS Support
              </div>
            </div>
          </div>
          <div className="copilot-header-actions">
            {/* New Chat Button */}
            <div className="copilot-action-wrapper">
              <button
                onClick={handleNewChat}
                className="copilot-icon-btn"
                aria-label="New Session"
                title="Start New Session"
              >
                <MessageSquarePlus size={17} />
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="copilot-icon-btn"
              title="Close"
              aria-label="Close"
            >
              <X size={17} />
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
                {msg.sender === 'user' ? (
                  <User size={15} />
                ) : (
                  <img src={logoImg} alt="StockPilot" className="copilot-msg-logo" />
                )}
              </div>
              <div className="copilot-msg-bubble">
                {renderFormattedMessage(msg.text)}
              </div>
            </div>
          ))}

          {loading && (
            <div className="copilot-message-row bot">
              <div className="copilot-msg-avatar">
                <img src={logoImg} alt="StockPilot" className="copilot-msg-logo" />
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
              title={isListening ? 'Stop listening' : 'Voice Input (English/Tamil)'}
            >
              {isListening ? <MicOff size={17} /> : <Mic size={17} />}
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question or query inventory..."
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
              <Send size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
