import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendFeedback = async (conversationId, feedback) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/feedback`, {
        conversation_id: conversationId,
        feedback: feedback
      });
      
      // Update the message to show feedback has been recorded
      setMessages(prev => prev.map(msg => {
        if (msg.conversationId === conversationId) {
          return { ...msg, feedbackGiven: feedback };
        }
        return msg;
      }));
    } catch (error) {
      console.error('Error sending feedback:', error);
    }
  };

  const sendMessage = async () => {
    if (input.trim() && !isLoading) {
      const userMessage = { role: 'user', content: input };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/ask`, {
          question: input
        });

        const assistantMessage = { 
          role: 'assistant', 
          content: response.data.result,
          conversationId: response.data.conversation_id,
          feedbackGiven: null
        };
        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage = { 
          role: 'system', 
          content: 'Sorry, there was an error processing your request.' 
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCopy = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      // Reset the copied status after 2 seconds
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        {/* <div className="logo">
          <img src="../public/logo.png" alt="Logo" />
        </div> */}
        <h1>Healthcare Facility Assistant</h1>
        {/* <p className="subtitle">Your intelligent companion for research and learning</p> */}
      </header>

      <div className="chat-container">
        <div className="welcome-message">
          <h2>Welcome! 👋</h2>
          <p>I'm your Healthcare assistant. I can help you with:</p>
          <ul>
            <li>Answering healthcare facility questions</li>
            <li>Providing detailed analysis</li>
            <li>Finding relevant information</li>
          </ul>
          <p>How can I assist you today?</p>
        </div>
        <div className="messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-content">
                {msg.role === 'assistant' && <div className="avatar">HFA</div>}
                <div className="text">
                  {msg.content}
                  {msg.role === 'assistant' && (
                    <div className="message-actions">
                      <div className="feedback-buttons">
                        <button 
                          className={`feedback-btn ${msg.feedbackGiven === 1 ? 'active' : ''}`}
                          onClick={() => sendFeedback(msg.conversationId, 1)}
                          disabled={msg.feedbackGiven !== null}
                        >
                          <ThumbUpIcon />
                        </button>
                        <button 
                          className={`feedback-btn ${msg.feedbackGiven === -1 ? 'active' : ''}`}
                          onClick={() => sendFeedback(msg.conversationId, -1)}
                          disabled={msg.feedbackGiven !== null}
                        >
                          <ThumbDownIcon />
                        </button>
                      </div>
                      <button 
                        className={`copy-btn ${copiedMessageId === index ? 'copied' : ''}`}
                        onClick={() => handleCopy(msg.content, index)}
                      >
                        {copiedMessageId === index ? (
                          <>
                            <CheckIcon fontSize="small" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <ContentCopyIcon fontSize="small" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                {msg.role === 'user' && <div className="avatar">You</div>}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="avatar">HFA</div>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask a question..."
            disabled={isLoading}
          />
          <button 
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;