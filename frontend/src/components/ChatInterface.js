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
      // Note: In production, you'd get this from your backend
      const DID_API_KEY = process.env.REACT_APP_DID_API_KEY;
      
      if (!DID_API_KEY) {
        console.warn('D-ID API key not configured. Avatar features disabled.');
        return;
      }

      // Create D-ID stream
      const response = await fetch('https://api.d-id.com/talks/streams', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${DID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_url: 'https://d-id-public-bucket.s3.amazonaws.com/alice.jpg', // Default avatar
        }),
      });

      const data = await response.json();
      streamRef.current = data;
      
      // Initialize video element with stream
      if (videoRef.current && data.session_id) {
        const { RTCPeerConnection, RTCSessionDescription } = window;
        const peerConnection = new RTCPeerConnection();
        
        peerConnection.ontrack = (event) => {
          if (videoRef.current) {
            videoRef.current.srcObject = event.streams[0];
          }
        };

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        // Send offer to D-ID
        const sdpResponse = await fetch(`https://api.d-id.com/talks/streams/${data.id}/sdp`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${DID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            answer: offer,
            session_id: data.session_id,
          }),
        });

        const sdpData = await sdpResponse.json();
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(sdpData)
        );

        setAvatarEnabled(true);
      }
    } catch (error) {
      console.error('Error initializing avatar:', error);
    }
  };

  // Speak with avatar
  const speakWithAvatar = async (text) => {
    if (!streamRef.current || !avatarEnabled) return;

    try {
      setAvatarSpeaking(true);
      
      const DID_API_KEY = process.env.REACT_APP_DID_API_KEY;
      
      await fetch(`https://api.d-id.com/talks/streams/${streamRef.current.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${DID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: {
            type: 'text',
            input: text,
          },
        }),
      });

      // Wait for speech to complete (estimate based on text length)
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
      // Send to backend
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: userMessage,
        conversation_id: conversationId,
      });

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
      console.error('Error sending message:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
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
