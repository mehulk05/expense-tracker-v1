import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Settings, BookOpen, BarChart3, LayoutDashboard, MessageSquare, Mail, Send, Zap, Check, Smartphone, User, Bot, Loader } from 'lucide-react';

const GiaChatPreview = () => {
  const [sidenavExpanded, setSidenavExpanded] = useState(true);
  const [activeTopTab, setActiveTopTab] = useState('preview');
  const [channelType, setChannelType] = useState('sms');
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('customer@example.com');
  const [recipientPhone, setRecipientPhone] = useState('+1 (555) 123-4567');
  
  const [conversation, setConversation] = useState([
    {
      id: 1,
      sender: 'gia',
      message: 'Hi! I\'m GIA, your virtual assistant. How can I help you today?',
      timestamp: '10:30 AM',
      channel: 'sms'
    }
  ]);

  const topTabs = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'configuration', label: 'Configuration', icon: Settings },
    { id: 'preview', label: 'Test Chat', icon: MessageSquare },
    { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const simulateGiaResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hours') || lowerMessage.includes('open')) {
      return 'We\'re open Monday-Friday 9AM-5PM, and Saturday 10AM-2PM. Would you like to schedule an appointment?';
    } else if (lowerMessage.includes('appointment') || lowerMessage.includes('book')) {
      return 'I\'d be happy to help you schedule an appointment! What day works best for you?';
    } else if (lowerMessage.includes('insurance')) {
      return 'Yes, we accept most major insurance plans including Medicare and Medicaid. Would you like me to verify your specific plan?';
    } else if (lowerMessage.includes('location') || lowerMessage.includes('address')) {
      return 'We\'re located at 123 Medical Plaza, Suite 200, Austin, TX 78701. Free parking is available in the lot behind our building.';
    } else if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return 'Our consultation fee is $150. Many insurance plans cover this. Would you like to discuss payment options?';
    }
    return 'Thank you for your message! Let me help you with that. Can you provide more details about what you\'re looking for?';
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const currentMessage = messageInput;
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      message: currentMessage,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      channel: channelType
    };

    setConversation(prev => [...prev, userMessage]);
    setMessageInput('');
    setIsLoading(true);

    setTimeout(() => {
      const giaResponse = {
        id: Date.now() + 1,
        sender: 'gia',
        message: simulateGiaResponse(currentMessage),
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        channel: channelType
      };
      setConversation(prev => [...prev, giaResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = () => {
    setConversation([
      {
        id: Date.now(),
        sender: 'gia',
        message: channelType === 'email' 
          ? 'Hello! Thank you for contacting us. I\'m GIA, your virtual assistant. How can I assist you today?'
          : 'Hi! I\'m GIA, your virtual assistant. How can I help you today?',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        channel: channelType
      }
    ]);
  };

  const handleChannelSwitch = (newChannel) => {
    setChannelType(newChannel);
    setConversation([
      {
        id: Date.now(),
        sender: 'gia',
        message: newChannel === 'email' 
          ? 'Hello! Thank you for contacting us. I\'m GIA, your virtual assistant. How can I assist you today?'
          : 'Hi! I\'m GIA, your virtual assistant. How can I help you today?',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        channel: newChannel
      }
    ]);
  };

  const quickPrompts = [
    'What are your office hours?',
    'I need to book an appointment',
    'Do you accept insurance?',
    'What\'s your location?'
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidenavExpanded ? 'w-64' : 'w-16'}`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidenavExpanded && <h2 className="font-bold text-gray-900">Growth99</h2>}
          <button 
            onClick={() => setSidenavExpanded(!sidenavExpanded)}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          >
            {sidenavExpanded ? 
              <ChevronDown className="w-5 h-5 text-gray-600 rotate-90" /> : 
              <ChevronRight className="w-5 h-5 text-gray-600" />
            }
          </button>
        </div>

        <nav className="p-2">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
            <Zap className="w-5 h-5" />
            {sidenavExpanded && <span className="text-sm font-medium">GIA Assistant</span>}
          </button>
        </nav>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-6">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">GIA Assistant</h1>
                  <p className="text-xs text-gray-500">Growth99 Intelligent Assistant</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-1 -mb-px">
              {topTabs.map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTopTab(tab.id)}
                  className={`px-5 py-3 border-b-2 font-medium transition-all flex items-center gap-2 ${
                    activeTopTab === tab.id 
                      ? 'border-blue-600 text-blue-600 bg-blue-50' 
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeTopTab === 'preview' ? (
            <div className="max-w-7xl mx-auto">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Test GIA Chat</h1>
                <p className="text-gray-600">Preview and test how GIA responds to patient messages</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Channel</h3>
                    
                    <div className="space-y-3">
                      <button
                        onClick={() => handleChannelSwitch('sms')}
                        className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                          channelType === 'sms'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          channelType === 'sms' ? 'bg-blue-500' : 'bg-gray-200'
                        }`}>
                          <Smartphone className={`w-5 h-5 ${channelType === 'sms' ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-900">SMS / Text</p>
                          <p className="text-xs text-gray-500">Test via text message</p>
                        </div>
                        {channelType === 'sms' && <Check className="w-5 h-5 text-blue-600" />}
                      </button>

                      <button
                        onClick={() => handleChannelSwitch('email')}
                        className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                          channelType === 'email'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          channelType === 'email' ? 'bg-blue-500' : 'bg-gray-200'
                        }`}>
                          <Mail className={`w-5 h-5 ${channelType === 'email' ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-900">Email</p>
                          <p className="text-xs text-gray-500">Test via email</p>
                        </div>
                        {channelType === 'email' && <Check className="w-5 h-5 text-blue-600" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Recipient</h3>
                    
                    <div style={{ display: channelType === 'sms' ? 'block' : 'none' }}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+1 (555) 123-4567"
                      />
                      <p className="text-xs text-gray-500 mt-1">Test messages will simulate this number</p>
                    </div>

                    <div style={{ display: channelType === 'email' ? 'block' : 'none' }}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="patient@example.com"
                      />
                      <p className="text-xs text-gray-500 mt-1">Test messages will simulate this email</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Test Prompts</h3>
                    <div className="space-y-2">
                      {quickPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => setMessageInput(prompt)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={clearConversation}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Clear Conversation
                  </button>
                </div>

                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">GIA Assistant</h3>
                          <p className="text-blue-100 text-sm flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            Active • {channelType === 'sms' ? 'SMS' : 'Email'} Mode
                          </p>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-white text-xs font-medium">
                        Test Environment
                      </div>
                    </div>

                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {channelType === 'sms' ? (
                          <>
                            <Smartphone className="w-4 h-4" />
                            <span>Simulating SMS to: <span className="font-medium text-gray-900">{recipientPhone}</span></span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4" />
                            <span>Simulating Email to: <span className="font-medium text-gray-900">{recipientEmail}</span></span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                      {conversation.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            msg.sender === 'gia' ? 'bg-blue-100' : 'bg-gray-200'
                          }`}>
                            {msg.sender === 'gia' ? (
                              <Bot className="w-5 h-5 text-blue-600" />
                            ) : (
                              <User className="w-5 h-5 text-gray-600" />
                            )}
                          </div>

                          <div className={`flex flex-col max-w-[70%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`rounded-2xl px-4 py-3 ${
                              msg.sender === 'gia'
                                ? channelType === 'email'
                                  ? 'bg-white border border-gray-200'
                                  : 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}>
                              {channelType === 'email' && (
                                <div className="mb-2 pb-2 border-b border-gray-200">
                                  <p className="text-xs text-gray-500 font-medium">
                                    {msg.sender === 'gia' ? 'From: noreply@yourpractice.com' : `From: ${recipientEmail}`}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {msg.sender === 'gia' ? `To: ${recipientEmail}` : 'To: noreply@yourpractice.com'}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1 font-medium">
                                    {msg.sender === 'gia' ? 'Subject: Re: Your Inquiry' : 'Subject: Question about services'}
                                  </p>
                                </div>
                              )}
                              <p className={`text-sm leading-relaxed ${
                                msg.sender === 'gia' && channelType === 'sms' ? 'text-white' : 
                                msg.sender === 'gia' && channelType === 'email' ? 'text-gray-900' :
                                'text-gray-900'
                              }`}>
                                {msg.message}
                              </p>
                            </div>
                            <span className="text-xs text-gray-500 mt-1 px-2">{msg.timestamp}</span>
                          </div>
                        </div>
                      ))}

                      {isLoading && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="bg-blue-600 text-white rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Loader className="w-4 h-4 animate-spin" />
                              <span className="text-sm">GIA is typing...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-white border-t border-gray-200">
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <textarea
                            key="message-input"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={channelType === 'email' ? 'Type your email message...' : 'Type your text message...'}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows="2"
                          />
                        </div>
                        <button
                          onClick={handleSendMessage}
                          disabled={!messageInput.trim() || isLoading}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
                        >
                          <Send className="w-4 h-4" />
                          Send
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Press Enter to send • This is a simulation environment
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {activeTopTab === 'overview' ? 'Dashboard' : 
                 activeTopTab === 'configuration' ? 'Configuration' :
                 activeTopTab === 'knowledge' ? 'Knowledge' : 'Analytics'}
              </h1>
              <p className="text-gray-600">Content for {activeTopTab} tab</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GiaChatPreview;