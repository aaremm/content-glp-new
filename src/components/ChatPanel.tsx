import { useState, useRef, useEffect } from 'react';
import './ChatPanel.css';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  lastUpdated: Date;
}

interface ChatPanelProps {
  onGenerateContent: (prompt: string, country: string, contentType: string) => void;
  selectedCountries: string[];
  selectedAssets: string[];
  onResetContent: () => void;
  resetTrigger: number;
}

const initialMessage: Message = {
  id: '1',
  type: 'ai',
  content: 'Hello! I\'m here to help you create content. What would you like to work on today?',
  timestamp: new Date(),
};

export default function ChatPanel({ onGenerateContent, selectedCountries, selectedAssets, onResetContent, resetTrigger }: ChatPanelProps) {
  const [panelWidth, setPanelWidth] = useState(360);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      name: 'Pinecore health blog',
      messages: [initialMessage],
      lastUpdated: new Date(),
    },
    {
      id: '2',
      name: 'Summer campaign 2024',
      messages: [initialMessage],
      lastUpdated: new Date(Date.now() - 86400000), // 1 day ago
    },
    {
      id: '3',
      name: 'Product launch',
      messages: [initialMessage],
      lastUpdated: new Date(Date.now() - 172800000), // 2 days ago
    }
  ]);
  const [currentConversationId, setCurrentConversationId] = useState('1');
  const [isConversationDropdownOpen, setIsConversationDropdownOpen] = useState(false);
  
  const currentConversation = conversations.find(c => c.id === currentConversationId) || conversations[0];
  const messages = currentConversation.messages;
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const conversationRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      if (panelRef.current) {
        const containerRect = panelRef.current.parentElement?.getBoundingClientRect();
        if (containerRect) {
          const newWidth = e.clientX - containerRect.left;
          // Constrain width between 280px and 600px
          const constrainedWidth = Math.min(Math.max(newWidth, 280), 600);
          setPanelWidth(constrainedWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset all conversations when resetTrigger changes
  useEffect(() => {
    if (resetTrigger > 0) {
      // Reset to a single initial conversation
      const newConversation: Conversation = {
        id: Date.now().toString(),
        name: 'New conversation',
        messages: [initialMessage],
        lastUpdated: new Date(),
      };
      
      setConversations([newConversation]);
      setCurrentConversationId(newConversation.id);
      setInputValue('');
      setAttachedFile(null);
      setIsLoading(false);
      setIsConversationDropdownOpen(false);
    }
  }, [resetTrigger]);

  // Click outside to close conversation dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (conversationDropdownRef.current && !conversationDropdownRef.current.contains(event.target as Node)) {
        setIsConversationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a PDF or DOC/DOCX file');
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      
      setAttachedFile(file);
    }
    
    // Reset the input so the same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    // In production, this would use a proper PDF/DOC parsing library
    // For now, we'll simulate extraction and show the file name
    setUploadingFile(true);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        setUploadingFile(false);
        // Simulate extracted text
        resolve(`[Attached file: ${file.name}]\n\nFile content would be extracted here using a PDF/DOC parser library.`);
      }, 1500);
    });
  };

  // Helper function to detect if prompt is a question vs instruction
  const detectPromptIntent = (prompt: string): 'question' | 'instruction' => {
    const lowerPrompt = prompt.toLowerCase().trim();
    
    // Strong content generation indicators (must be clear intent to generate content)
    const contentGenerationWords = ['create', 'generate', 'write', 'compose', 'draft', 'make a', 'make an', 'create a', 'create an', 'write a', 'write an', 'generate a', 'generate an'];
    const contentModificationWords = ['change', 'update', 'modify', 'add', 'remove', 'replace', 'rewrite', 'shorten', 'lengthen', 'improve', 'enhance', 'focus on', 'emphasize', 'make it', 'make this', 'more', 'less', 'include', 'exclude'];
    
    // Question indicators (conversational, analytical, help requests)
    const questionWords = ['what', 'which', 'who', 'where', 'when', 'why', 'how', 'can you explain', 'tell me', 'is this', 'does this', 'would this', 'should i', 'could you', 'do you think', 'help', 'hi', 'hello', 'hey', 'thanks', 'thank you'];
    const questionMarks = lowerPrompt.includes('?');
    
    // Check for questions first
    if (questionMarks) return 'question';
    if (questionWords.some(word => lowerPrompt.startsWith(word))) return 'question';
    
    // Only treat as instruction if there's clear intent
    if (contentGenerationWords.some(word => lowerPrompt.includes(word))) return 'instruction';
    if (contentModificationWords.some(word => lowerPrompt.includes(word))) {
      // Only treat as instruction if it's modifying existing content (not first message)
      const isFirstMessage = messages.filter(m => m.type === 'user').length === 0;
      return isFirstMessage ? 'question' : 'instruction';
    }
    
    // Default to question (safer default - won't accidentally generate content)
    return 'question';
  };

  // Function to call ChatGPT for analytical questions
  const callChatGPT = async (question: string, context: string): Promise<string> => {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
      
      if (!apiKey) {
        console.warn('OpenAI API key not found. Using mock response.');
        return generateMockAnalyticalResponse(question, context);
      }
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful marketing content analyst. Answer questions about content marketing, audience analysis, and content strategy based on the provided content.'
            },
            {
              role: 'user',
              content: `Content: ${context}\n\nQuestion: ${question}`
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error('ChatGPT API call failed');
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response.';
    } catch (error) {
      console.error('ChatGPT API error:', error);
      return generateMockAnalyticalResponse(question, context);
    }
  };

  // Generate mock analytical response when API is not available
  const generateMockAnalyticalResponse = (question: string, context: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('audience') || lowerQuestion.includes('who would')) {
      return 'Based on the content, this would resonate well with:\n\n• Young professionals (25-40) interested in health and wellness\n• Health-conscious consumers looking for natural alternatives\n• People seeking evidence-based health information\n• Audiences in the target market who value quality and authenticity\n\nThe tone and messaging align well with educated consumers who appreciate detailed information and cultural relevance.';
    }
    
    if (lowerQuestion.includes('tone') || lowerQuestion.includes('how does it sound')) {
      return 'The content has a professional yet approachable tone that:\n\n• Balances expertise with accessibility\n• Uses conversational language while maintaining credibility\n• Incorporates cultural nuances appropriate for the target market\n• Engages readers with a mix of information and storytelling\n\nThis tone works well for building trust while keeping readers engaged.';
    }
    
    if (lowerQuestion.includes('improve') || lowerQuestion.includes('better')) {
      return 'To enhance this content further, consider:\n\n• Adding more specific examples or case studies\n• Including data or statistics to support key claims\n• Strengthening the call-to-action\n• Adding subheadings for better scannability\n• Incorporating more sensory language to increase engagement\n\nThe content is already strong, these would make it even more impactful.';
    }
    
    if (lowerQuestion.includes('compare') || lowerQuestion.includes('different')) {
      return 'This content differs from standard approaches by:\n\n• Emphasizing cultural adaptation for the specific market\n• Balancing global best practices with local insights\n• Using region-specific examples and references\n• Adjusting tone and style for the target audience\n\nThese adaptations make it more relevant and effective for the intended market.';
    }
    
    // Generic analytical response
    return `Based on the content analysis:\n\nThe content effectively addresses your question by combining professional insights with market-specific adaptations. It maintains a balance between informative and engaging, with culturally relevant examples that resonate with the target audience.\n\nKey strengths include clear structure, appropriate tone for the market, and actionable information that provides value to readers.`;
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && !attachedFile) || isLoading) return;

    let messageContent = inputValue.trim();
    
    // If there's an attached file, extract its content
    if (attachedFile) {
      const fileContent = await extractTextFromFile(attachedFile);
      messageContent = messageContent 
        ? `${messageContent}\n\n${fileContent}` 
        : fileContent;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    // Update messages in the current conversation
    setConversations(prev => prev.map(conv => 
      conv.id === currentConversationId
        ? { ...conv, messages: [...conv.messages, userMessage], lastUpdated: new Date() }
        : conv
    ));
    
    setInputValue('');
    setAttachedFile(null);
    setIsLoading(true);

    // Get the currently selected country and content type
    const country = selectedCountries[0] || 'US';
    const contentType = selectedAssets[0] || 'blog-post';

    // Detect intent: question or instruction
    const intent = detectPromptIntent(messageContent);
    console.log('Detected intent:', intent, 'for prompt:', messageContent);

    // Build accumulated prompt from all user messages in this conversation
    const allUserMessages = [...messages.filter(m => m.type === 'user'), userMessage];
    
    if (intent === 'question') {
      // Handle as analytical question - respond in chat without modifying content
      console.log('Handling as analytical question');
      
      // Get the current generated content for context
      const generatedContentContext = allUserMessages.length > 1 && allUserMessages[0] 
        ? `Previous prompt: ${allUserMessages[0].content}` 
        : 'No content generated yet';
      
      // Call ChatGPT or generate mock response
      const analyticalResponse = await callChatGPT(messageContent, generatedContentContext);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: analyticalResponse,
        timestamp: new Date(),
      };
      
      // Update messages in the current conversation
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversationId
          ? { ...conv, messages: [...conv.messages, aiMessage], lastUpdated: new Date() }
          : conv
      ));
      setIsLoading(false);
      
      // Don't trigger content generation for questions
      
    } else {
      // Handle as content modification instruction
      console.log('Handling as content modification instruction');
      
      const accumulatedPrompt = allUserMessages
        .map((msg, index) => {
          if (index === 0) {
            return msg.content; // First prompt is the base
          } else {
            return msg.content; // Subsequent prompts add context
          }
        })
        .join('. '); // Join with period and space
      
      console.log('Accumulated prompt:', accumulatedPrompt);
      
      // Simulate AI response
      setTimeout(() => {
        const countryNames: { [key: string]: string } = {
          'US': 'United States',
          'GB': 'United Kingdom',
          'CA': 'Canada',
          'AU': 'Australia',
          'DE': 'Germany',
          'FR': 'France',
          'ES': 'Spain',
          'IT': 'Italy',
          'JP': 'Japan',
          'CN': 'China',
          'IN': 'India',
          'BR': 'Brazil',
          'MX': 'Mexico',
        };

        const contentTypeNames: { [key: string]: string } = {
          'blog-post': 'blog post',
          'instagram': 'Instagram post',
          'instagram-reel': 'Instagram reel',
          'instagram-story': 'Instagram story',
          'instagram-post': 'Instagram post',
          'email': 'email',
          'website': 'website content',
          'website-banner': 'website banner',
          'website-offer': 'website offer',
          'website-microsite': 'microsite',
          'sms': 'SMS message',
        };

        const countryName = countryNames[country] || country;
        const contentTypeName = contentTypeNames[contentType] || contentType;

        // Check if this is a follow-up
        const isFollowUp = allUserMessages.length > 1;

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: isFollowUp 
            ? `I've regenerated the ${contentTypeName} content incorporating your request: "${messageContent}". The updated content is now displayed!`
            : `Great! I'll create ${contentTypeName} content about "${messageContent}" for the ${countryName} market. Check the content area on the right to see the generated content!`,
          timestamp: new Date(),
        };
        
        // Update messages in the current conversation
        setConversations(prev => prev.map(conv => 
          conv.id === currentConversationId
            ? { ...conv, messages: [...conv.messages, aiMessage], lastUpdated: new Date() }
            : conv
        ));
        setIsLoading(false);

        // Trigger content generation with accumulated prompt
        onGenerateContent(accumulatedPrompt, country, contentType);
      }, 1000);
    }
  };

  const handleConversationSwitch = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setIsConversationDropdownOpen(false);
  };

  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      name: `New conversation ${conversations.length + 1}`,
      messages: [initialMessage],
      lastUpdated: new Date(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    setIsConversationDropdownOpen(false);
    
    // Reset content area to empty state
    onResetContent();
  };

  const handleGoldenPrompt = () => {
    setIsConversationDropdownOpen(false);
    // Set the input value with the golden prompt
    setInputValue("Pinecore drink's health benefits and how its the new health revolution");
  };

  const handleDeleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent button click
    
    // Don't allow deleting the last conversation
    if (conversations.length <= 1) {
      return;
    }

    // If deleting the current conversation, switch to another one
    if (conversationId === currentConversationId) {
      const remainingConversations = conversations.filter(c => c.id !== conversationId);
      setCurrentConversationId(remainingConversations[0].id);
    }

    // Remove the conversation
    setConversations(prev => prev.filter(c => c.id !== conversationId));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div 
      ref={panelRef}
      className="chat-panel"
      style={{ width: `${panelWidth}px` }}
    >
      <div className="chat-panel-content">
        <div className="chat-header">
          <div className="picker" ref={conversationDropdownRef}>
              <button 
                className="picker-button"
                onClick={() => setIsConversationDropdownOpen(!isConversationDropdownOpen)}
                aria-expanded={isConversationDropdownOpen}
              >
              <div className="picker-field">
                <div className="picker-text">
                  <p>{currentConversation.name}</p>
                </div>
                <div className="picker-chevron">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </button>
            {isConversationDropdownOpen && (
              <div className="conversation-dropdown-menu">
                <button 
                  className="new-conversation-button"
                  onClick={handleNewConversation}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>New conversation</span>
                </button>
                <button 
                  className="golden-prompt-button"
                  onClick={handleGoldenPrompt}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1L10.163 5.38197L15 6.12257L11.5 9.53647L12.326 14.3607L8 12.118L3.674 14.3607L4.5 9.53647L1 6.12257L5.837 5.38197L8 1Z" fill="#FFB800" stroke="#FFB800" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Golden Prompt</span>
                </button>
                <div className="conversation-divider"></div>
                {conversations.map((conversation) => (
                  <div key={conversation.id} className="conversation-item-wrapper">
                    <button
                      className={`conversation-item ${conversation.id === currentConversationId ? 'active' : ''}`}
                      onClick={() => handleConversationSwitch(conversation.id)}
                    >
                      <div className="conversation-item-content">
                        <span className="conversation-name">{conversation.name}</span>
                        <span className="conversation-date">
                          {formatDate(conversation.lastUpdated)}
                        </span>
                      </div>
                    </button>
                    {conversations.length > 1 && (
                      <button
                        className="delete-conversation-button"
                        onClick={(e) => handleDeleteConversation(conversation.id, e)}
                        aria-label="Delete conversation"
                        title="Delete conversation"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 4H13M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4M6 7V11M10 7V11M4 4H12V13C12 13.5523 11.5523 14 11 14H5C4.44772 14 4 13.5523 4 13V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="conversation-frame" ref={conversationRef}>
          {messages.map((message) => (
            <div key={message.id} className={`chat-bubble ${message.type}`}>
              <p>{message.content}</p>
            </div>
          ))}
          {isLoading && (
            <div className="chat-bubble ai">
              <p className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </p>
            </div>
          )}
        </div>
        
          <div className="prompt-bar">
            <div className="input-container">
              {attachedFile && (
                <div className="attached-file">
                  <div className="file-info">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="file-icon">
                      <path d="M9 1H4C3.46957 1 2.96086 1.21071 2.58579 1.58579C2.21071 1.96086 2 2.46957 2 3V13C2 13.5304 2.21071 14.0391 2.58579 14.4142C2.96086 14.7893 3.46957 15 4 15H12C12.5304 15 13.0391 14.7893 13.4142 14.4142C13.7893 14.0391 14 13.5304 14 13V6L9 1Z" stroke="#6E6E6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 1V6H14" stroke="#6E6E6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="file-name">{attachedFile.name}</span>
                    <span className="file-size">({(attachedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button 
                    className="remove-file-button"
                    onClick={handleRemoveFile}
                    aria-label="Remove file"
                    disabled={uploadingFile}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                  {uploadingFile && (
                    <div className="file-uploading">
                      <div className="file-upload-spinner"></div>
                      <span>Processing...</span>
                    </div>
                  )}
                </div>
              )}
              <div className="input-frame">
                <div className="text-input">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={attachedFile ? "Add a message (optional)..." : "Ask anything"}
                    rows={1}
                    disabled={isLoading || uploadingFile}
                  />
                </div>
              <div className="action-bar">
                <div className="left-actions">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <button 
                    className={`action-button ${attachedFile ? 'active' : ''}`}
                    onClick={handleAttachClick}
                    aria-label="Attach file"
                    disabled={isLoading || uploadingFile}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M17 9.5L10.5 16C9.11929 17.3807 6.88071 17.3807 5.5 16C4.11929 14.6193 4.11929 12.3807 5.5 11L12 4.5C12.8284 3.67157 14.1716 3.67157 15 4.5C15.8284 5.32843 15.8284 6.67157 15 7.5L9 13.5C8.58579 13.9142 7.91421 13.9142 7.5 13.5C7.08579 13.0858 7.08579 12.4142 7.5 12L13 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                <div className="right-actions">
                  <button 
                    className="send-button"
                    onClick={handleSend}
                    disabled={(!inputValue.trim() && !attachedFile) || isLoading || uploadingFile}
                    aria-label="Send message"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M3 10L17 3L10 17L8.5 11.5L3 10Z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="footer-info">
            <div className="footer-content">
              <p>
                Verify responses. <span className="link">Generative AI Terms</span>
              </p>
              <button className="info-button">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 11V8M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to format dates
function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}
