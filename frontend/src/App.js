import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import DocumentManager from './components/DocumentManager';
import NetworkStatus from './components/NetworkStatus';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [documentsLoaded, setDocumentsLoaded] = useState(false);

  return (
    <div className="App">
      <NetworkStatus />
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <div className="avatar-badge">DS</div>
            <div className="header-info">
              <h1>Daniel Shields - AI Systems Architect</h1>
              <p className="subtitle">Interactive Resume Assistant • RAG-Powered Conversations</p>
            </div>
          </div>
          <div className="header-badge">
            <span className="status-dot"></span>
            AI Online
          </div>
        </div>
        <nav className="tabs">
          <button
            className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            💬 Chat
          </button>
          <button
            className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            📄 Knowledge Base
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'chat' ? (
          <ChatInterface documentsLoaded={documentsLoaded} />
        ) : (
          <DocumentManager onDocumentsChange={setDocumentsLoaded} />
        )}
      </main>

      <footer className="app-footer">
        <p>
          Powered by OpenAI GPT-4 + PGVector RAG | Designed & Built by Daniel Shields |{' '}
          <a 
            href="https://github.com/mimeographllc/claude-resume" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            View on GitHub →
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;