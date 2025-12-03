import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, User, Bot, Loader } from 'lucide-react';
import './ChatInterface.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function ChatInterface({ documentsLoaded }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [avatarEnabled, setAvatarEnabled] = useState(false);
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);
  
  const messagesEndRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize D-ID avatar
  const initializeAvatar = async () => {
    try {
      // Check if D-ID API key is configured
      const DID_API_KEY = process.env.REACT_APP_DID_API_KEY;
      
      if (!DID_API_KEY) {
        console.info('D-ID API key not configured. Avatar features disabled.');
        setAvatarEnabled(false);
        return;
      }

      // Simple avatar initialization with D-ID
      // Note: Full WebRTC streaming requires additional setup
      // For now, we'll show a placeholder that can be enhanced
      console.log('D-ID avatar initialization would happen here');
      console.log('For full implementation, see D-ID documentation: https://docs.d-id.com/');
      
      // Placeholder: In production, you'd implement the full D-ID WebRTC flow
      setAvatarEnabled(false); // Keep disabled until fully implemented
      
    } catch (error) {
      console.error('Error initializing avatar:', error);
      setAvatarEnabled(false);
    }
  };

  // Speak with avatar (placeholder for D-ID integration)
  const speakWithAvatar = async (text) => {
    if (!streamRef.current || !avatarEnabled) return;

    try {
      setAvatarSpeaking(true);
      
      // In production, this would send text to D-ID API for avatar speech
      // For now, just simulate speaking duration
      const estimatedDuration = (text.length / 15) * 1000; // ~15 chars per second
      
      setTimeout(() => {
        setAvatarSpeaking(false);
      }, estimatedDuration);
    } catch (error) {
      console.error('Error speaking with avatar:', error);
      setAvatarSpeaking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message to chat
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    try {
      console.log('Sending request to:', `${API_BASE_URL}/chat`);
      console.log('API_BASE_URL:', API_BASE_URL);
      
      // Send to backend
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: userMessage,
        conversation_id: conversationId,
      });

      console.log('Response received:', response.status);

      const { response: aiResponse, conversation_id, sources } = response.data;

      // Add AI response to chat
      setMessages([
        ...newMessages,
        { 
          role: 'assistant', 
          content: aiResponse,
          sources: sources 
        },
      ]);

      setConversationId(conversation_id);

      // Speak with avatar if enabled
      if (avatarEnabled) {
        await speakWithAvatar(aiResponse);
      }
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      if (error.code === 'ERR_NETWORK') {
        errorMessage = '🔌 Network Error: Cannot connect to backend. Please ensure:\n\n' +
          '1. Backend is running (cd backend && python main.py)\n' +
          '2. Backend is on http://localhost:8000\n' +
          '3. Check browser console (F12) for details';
      } else if (error.response?.status === 404) {
        errorMessage = '❌ API endpoint not found. Backend may not be running correctly.';
      } else if (error.response?.status === 500) {
        errorMessage = '⚠️ Backend server error: ' + (error.response?.data?.detail || 'Unknown error');
      }
      
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: errorMessage,
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "What are Daniel's main technical skills?",
    "Tell me about the Graffiti AI platform",
    "What kind of roles is Daniel looking for?",
    "What's Daniel's experience with healthcare AI?",
    "Does Daniel have any patents?",
  ];

  return (
    <div className="chat-interface">
      <div className="chat-container">
        {/* Avatar Section */}
        <div className="avatar-section">
          <div className="avatar-container">
            {avatarEnabled ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`avatar-video ${avatarSpeaking ? 'speaking' : ''}`}
              />
            ) : (
              <div className="avatar-placeholder">
                <Bot size={64} />
                <p>Avatar (Optional)</p>
                <button 
                  onClick={initializeAvatar}
                  className="btn-secondary"
                  disabled={!process.env.REACT_APP_DID_API_KEY}
                >
                  {process.env.REACT_APP_DID_API_KEY ? 'Enable Avatar' : 'D-ID API Key Required'}
                </button>
              </div>
            )}
          </div>
          <div className="avatar-info">
            <h3>Daniel Shields</h3>
            <p className="role">AI Systems Architect</p>
            <p className="status">
              {avatarSpeaking ? '🎤 Speaking...' : '💭 Ready to answer'}
            </p>
          </div>
        </div>

        {/* Messages Section */}
        <div className="messages-section">
          <div className="messages-container">
            {messages.length === 0 && (
              <div className="welcome-message">
                <h2>👋 Hi! I'm here to help you learn about Daniel Shields</h2>
                <p>I can answer questions about his:</p>
                <ul>
                  <li>Technical skills and AI/ML expertise</li>
                  <li>Professional experience and projects</li>
                  <li>Career goals and ideal roles</li>
                  <li>Working style and accommodations</li>
                </ul>
                <div className="suggested-questions">
                  <p><strong>Try asking:</strong></p>
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(q)}
                      className="suggestion-chip"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="message-icon">
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className="message-content">
                  <div className="message-text">{msg.content}</div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="message-sources">
                      <details>
                        <summary>📚 Sources ({msg.sources.length})</summary>
                        <ul>
                          {msg.sources.map((source, i) => (
                            <li key={i}>
                              <strong>{source.title}</strong> (
                              {(source.similarity * 100).toFixed(1)}% relevant)
                              <p className="source-excerpt">
                                {source.text.substring(0, 150)}...
                              </p>
                            </li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="message assistant">
                <div className="message-icon">
                  <Loader className="spinner" size={20} />
                </div>
                <div className="message-content">
                  <div className="message-text">Thinking...</div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <form onSubmit={handleSubmit} className="input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about Daniel's experience..."
              disabled={loading}
              className="message-input"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="send-button"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;