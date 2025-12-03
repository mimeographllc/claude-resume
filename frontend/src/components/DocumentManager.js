import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import './DocumentManager.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function DocumentManager({ onDocumentsChange }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    content: '',
    category: 'resume',
  });
  const [uploadStatus, setUploadStatus] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/documents`);
      setDocuments(response.data);
      onDocumentsChange(response.data.length > 0);
    } catch (error) {
      console.error('Error loading documents:', error);
      setUploadStatus({ type: 'error', message: 'Failed to load documents' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.title.trim() || !uploadForm.content.trim()) {
      setUploadStatus({ type: 'error', message: 'Please fill in all fields' });
      return;
    }

    try {
      setUploading(true);
      setUploadStatus({ type: 'loading', message: 'Uploading and embedding document...' });

      await axios.post(`${API_BASE_URL}/documents/upload`, uploadForm);

      setUploadStatus({ 
        type: 'success', 
        message: 'Document uploaded and embedded successfully!' 
      });

      // Reset form
      setUploadForm({ title: '', content: '', category: 'resume' });

      // Reload documents
      await loadDocuments();

      // Clear status after 3 seconds
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploadStatus({ 
        type: 'error', 
        message: `Upload failed: ${error.response?.data?.detail || error.message}` 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId, docTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${docTitle}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/documents/${docId}`);
      setUploadStatus({ type: 'success', message: 'Document deleted successfully' });
      await loadDocuments();
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error) {
      console.error('Error deleting document:', error);
      setUploadStatus({ 
        type: 'error', 
        message: `Delete failed: ${error.response?.data?.detail || error.message}` 
      });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setUploadForm({
        ...uploadForm,
        title: uploadForm.title || file.name.replace(/\.[^/.]+$/, ''),
        content: content,
      });
    };
    reader.readAsText(file);
  };

  const loadDefaultResume = async () => {
    try {
      // Load the default resume from the markdown file
      const response = await fetch('/Daniel-Shields-AI-Systems-Architect-Resume.md');
      const content = await response.text();
      
      setUploadForm({
        title: 'Daniel Shields - AI Systems Architect Resume',
        content: content,
        category: 'resume',
      });
      
      setUploadStatus({ 
        type: 'success', 
        message: 'Default resume loaded. Click "Upload Document" to add it to the database.' 
      });
    } catch (error) {
      console.error('Error loading default resume:', error);
      setUploadStatus({ 
        type: 'error', 
        message: 'Could not load default resume. Please paste content manually.' 
      });
    }
  };

  return (
    <div className="document-manager">
      <div className="manager-container">
        {/* Upload Section */}
        <div className="upload-section">
          <h2>📤 Upload Documents</h2>
          <p className="section-description">
            Upload documents to build the knowledge base for the chatbot. Documents will be
            automatically chunked and embedded for semantic search.
          </p>

          {uploadStatus && (
            <div className={`status-message ${uploadStatus.type}`}>
              {uploadStatus.type === 'loading' && <Loader className="spinner" size={16} />}
              {uploadStatus.type === 'success' && <CheckCircle size={16} />}
              {uploadStatus.type === 'error' && <AlertCircle size={16} />}
              <span>{uploadStatus.message}</span>
            </div>
          )}

          <form onSubmit={handleUpload} className="upload-form">
            <div className="form-group">
              <label htmlFor="title">Document Title</label>
              <input
                id="title"
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder="e.g., Daniel Shields Resume"
                disabled={uploading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={uploadForm.category}
                onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                disabled={uploading}
              >
                <option value="resume">Resume</option>
                <option value="project">Project Documentation</option>
                <option value="skill">Skills & Certifications</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="content">Document Content</label>
              <textarea
                id="content"
                value={uploadForm.content}
                onChange={(e) => setUploadForm({ ...uploadForm, content: e.target.value })}
                placeholder="Paste document content here or upload a file..."
                rows={12}
                disabled={uploading}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={loadDefaultResume}
                className="btn-secondary"
                disabled={uploading}
              >
                Load Default Resume
              </button>
              
              <label className="btn-secondary file-upload-btn" disabled={uploading}>
                <Upload size={16} />
                Upload File
                <input
                  type="file"
                  accept=".txt,.md,.json"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
              </label>

              <button
                type="submit"
                className="btn-primary"
                disabled={uploading || !uploadForm.title.trim() || !uploadForm.content.trim()}
              >
                {uploading ? (
                  <>
                    <Loader className="spinner" size={16} />
                    Embedding...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Upload Document
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Documents List */}
        <div className="documents-section">
          <h2>📚 Loaded Documents</h2>
          <p className="section-description">
            These documents are currently available in the knowledge base.
          </p>

          {loading ? (
            <div className="loading-state">
              <Loader className="spinner" size={32} />
              <p>Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <h3>No documents loaded</h3>
              <p>Upload a document above to get started with the chatbot.</p>
            </div>
          ) : (
            <div className="documents-list">
              {documents.map((doc) => (
                <div key={doc.id} className="document-card">
                  <div className="document-icon">
                    <FileText size={24} />
                  </div>
                  <div className="document-info">
                    <h3>{doc.title}</h3>
                    <div className="document-meta">
                      <span className="category-badge">{doc.category}</span>
                      <span className="chunk-count">
                        {doc.chunk_count} chunks
                      </span>
                      <span className="timestamp">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id, doc.title)}
                    className="delete-button"
                    title="Delete document"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentManager;
