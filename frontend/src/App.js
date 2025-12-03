import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import DocumentManager from './components/DocumentManager';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [documentsLoaded, setDocumentsLoaded] = useState(false);

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>💼 Daniel Shields - AI Resume Assistant</h1>
          <p className="subtitle">Ask me anything about Daniel's experience, skills, and projects</p>
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
            📄 Documents
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
          Powered by OpenAI GPT-4 + PGVector RAG | Built by Daniel Shields |{' '}
          <a 
            href="https://github.com/mimeographllc/claude-resume" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
