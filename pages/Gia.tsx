import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Settings, BookOpen, BarChart3, LayoutDashboard, Plus, Save, Calendar, MessageSquare, FileText, Database, TrendingUp, Lightbulb, CheckCircle, AlertCircle, Clock, Zap, ArrowRight, Check, X, Edit2, Upload, HelpCircle, ArrowDown, Globe, Monitor, LayoutGrid, Mail, Smartphone } from 'lucide-react';

const GiaImprovedUX = () => {
  const [hasConfiguration, setHasConfiguration] = useState(false);
  const [sidenavExpanded, setSidenavExpanded] = useState(true);
  const [activeTopTab, setActiveTopTab] = useState('overview');
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const [activeConfigSection, setActiveConfigSection] = useState(null);
  const [activeKnowledgeTab, setActiveKnowledgeTab] = useState('coverage');
  const [configurationStatus, setConfigurationStatus] = useState({
    communication: true,
    availability: false,
    training: false,
    faqs: false,
    connections: true
  });

  // Top tabs
  const topTabs = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'configuration', label: 'Configuration', icon: Settings },
    { id: 'knowledge', label: 'What GIA Knows', icon: Database },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  // Configuration cards with step numbers
  const configurationCards = [
    {
      id: 'communication',
      step: 1,
      title: 'How GIA Speaks',
      description: 'Set GIA\'s personality, tone, and communication style to match your practice\'s voice',
      icon: MessageSquare,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-700',
      configured: configurationStatus.communication,
      priority: 'Start Here'
    },
    {
      id: 'availability',
      step: 2,
      title: 'When GIA Works',
      description: 'Define active hours and set when GIA should automatically respond to clients',
      icon: Clock,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-700',
      configured: configurationStatus.availability,
      priority: 'Required'
    },
    {
      id: 'training',
      step: 3,
      title: 'GIA Knowledge Sources',
      description: 'Upload practice documents, website links, and other content for GIA to learn from',
      icon: FileText,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-700',
      configured: configurationStatus.training,
      priority: 'Important'
    },
    {
      id: 'faqs',
      step: 4,
      title: 'GIA\'s Answers',
      description: 'Teach GIA how to answer common questions about appointments, pricing, and policies',
      icon: HelpCircle,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-700',
      configured: configurationStatus.faqs,
      priority: 'Important'
    },
    {
      id: 'connections',
      step: 5,
      title: 'Connections',
      description: 'Connect booking systems, calendar, and manage team handoff settings',
      icon: Settings,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-700',
      configured: configurationStatus.connections,
      priority: 'Optional'
    }
  ];

  const openConfigDrawer = (sectionId) => {
    if (sectionId === 'training') {
      setActiveTopTab('knowledge');
      setActiveKnowledgeTab('sources');
      return;
    }
    if (sectionId === 'faqs') {
      setActiveTopTab('knowledge');
      setActiveKnowledgeTab('faq');
      return;
    }
    setActiveConfigSection(sectionId);
    setConfigDrawerOpen(true);
  };

  const closeConfigDrawer = () => {
    setConfigDrawerOpen(false);
    setTimeout(() => setActiveConfigSection(null), 300);
  };

  // Configuration form content
  const renderConfigurationForm = () => {
    const section = configurationCards.find(c => c.id === activeConfigSection);
    if (!section) return null;

    switch(activeConfigSection) {
      case 'communication':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Communication Settings</h3>
              <p className="text-sm text-gray-600">Customize how GIA communicates with patients</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Communication Tone</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Professional & Warm</option>
                  <option>Friendly & Casual</option>
                  <option>Formal & Clinical</option>
                  <option>Empathetic & Supportive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Response Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Concise', 'Balanced', 'Detailed'].map(opt => (
                    <button key={opt} className={`px-3 py-2 border-2 rounded-lg text-sm font-medium transition-all ${
                      opt === 'Balanced' 
                        ? 'border-blue-600 bg-blue-50 text-blue-700' 
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Welcome Message</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  rows="3"
                  placeholder="Hi! I'm GIA, your virtual assistant. How can I help you today?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>Multilingual (Auto-detect)</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'availability':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Availability Settings</h3>
              <p className="text-sm text-gray-600">Define when GIA actively responds to patients</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">24/7 Availability</p>
                  <p className="text-sm text-gray-600">GIA responds anytime</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Hours</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Opens</label>
                    <input type="time" className="w-full px-3 py-2 border border-gray-300 rounded-lg" defaultValue="09:00" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Closes</label>
                    <input type="time" className="w-full px-3 py-2 border border-gray-300 rounded-lg" defaultValue="17:00" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Active Days</label>
                <div className="grid grid-cols-7 gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <button key={day} className="px-2 py-2 border-2 border-blue-600 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-xs font-medium">
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'training':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Training</h3>
              <p className="text-sm text-gray-600">Upload documents to train GIA about your practice</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Documents</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1 font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PDF, DOCX, TXT, CSV (Max 10MB per file)</p>
                  <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                    Browse Files
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Or Import from Website</label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://yourpractice.com"
                  />
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                    Import
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">Uploaded Documents</p>
                  <span className="text-xs text-gray-500">3 files</span>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Service Menu.pdf', size: '2.3 MB', type: 'PDF' },
                    { name: 'Treatment Guide.docx', size: '1.8 MB', type: 'DOCX' },
                    { name: 'Practice Policies.pdf', size: '1.2 MB', type: 'PDF' }
                  ].map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.type} • {file.size}</p>
                        </div>
                      </div>
                      <button className="text-red-600 hover:text-red-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'faqs':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">FAQ Management</h3>
              <p className="text-sm text-gray-600">Add frequently asked questions about appointments, pricing, and policies</p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">FAQ Tips</p>
                    <p className="text-sm text-blue-800">
                      Focus on appointment booking, pricing, insurance, policies, and common patient concerns
                    </p>
                  </div>
                </div>
              </div>

              <button className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-gray-600 hover:text-blue-600 flex items-center justify-center gap-2 font-medium">
                <Plus className="w-5 h-5" />
                Add New FAQ
              </button>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">Existing FAQs</p>
                <div className="space-y-3">
                  {[
                    { 
                      q: 'How do I book an appointment?', 
                      a: 'You can book an appointment by calling us at (555) 123-4567 or using our online booking system.',
                      category: 'Appointments'
                    },
                    { 
                      q: 'What insurance plans do you accept?', 
                      a: 'We accept most major insurance plans including Blue Cross, Aetna, and United Healthcare.',
                      category: 'Insurance'
                    },
                    { 
                      q: 'What is your cancellation policy?', 
                      a: 'We require 24 hours notice for cancellations to avoid a cancellation fee.',
                      category: 'Policies'
                    }
                  ].map((faq, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {faq.category}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-2">{faq.q}</h4>
                          <p className="text-sm text-gray-600">{faq.a}</p>
                        </div>
                        <div className="flex gap-1">
                          <button className="p-1.5 hover:bg-gray-100 rounded">
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button className="p-1.5 hover:bg-red-50 rounded">
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'connections':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Integrations</h3>
              <p className="text-sm text-gray-600">Connect booking systems and calendar</p>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Google Calendar</p>
                      <p className="text-sm text-green-700">Connected</p>
                    </div>
                  </div>
                  <button className="text-sm text-red-600 hover:text-red-700 font-medium">Disconnect</button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Enable Booking</p>
                  <p className="text-sm text-gray-600">Allow appointment scheduling</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // DASHBOARD
  const Dashboard = () => (
    <div className="space-y-6">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white mb-8 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Zap className="w-9 h-9 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">GIA Assistant</h1>
                  <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium">Active</span>
                </div>
                <p className="text-blue-100 text-lg">Handling conversations 24/7</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTopTab('configuration')}
              className="px-5 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              Configure
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Conversations', value: '1,234', icon: MessageSquare },
            { label: 'Bookings', value: '89', icon: Calendar },
            { label: 'FAQ Hits', value: '456', icon: BookOpen },
            { label: 'Response Time', value: '2.3s', icon: Zap }
          ].map((metric, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <metric.icon className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // CONFIGURATION
  const Configuration = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Configuration</h1>
        <p className="text-gray-600 text-lg">Manage GIA's settings and behavior for your practice.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {configurationCards.map((card) => (
          <button
            key={card.id}
            onClick={() => openConfigDrawer(card.id)}
            className="group relative flex flex-col items-start p-6 bg-white rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 text-left h-full"
          >
            <div className={`p-3 rounded-xl ${card.configured ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600'} transition-colors mb-4`}>
              <card.icon className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
              {card.title}
            </h3>
            
            <p className="text-gray-500 text-sm mb-6 line-clamp-2">
              {card.description}
            </p>

            <div className="mt-auto flex items-center justify-between w-full">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                card.configured 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {card.configured ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Configured
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    Not Configured
                  </>
                )}
              </span>
              
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Side drawer overlay */}
      {configDrawerOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={closeConfigDrawer}
          ></div>
          <div className={`fixed right-0 top-0 h-full w-full md:w-[600px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
            configDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="flex flex-col h-full">
              {/* Drawer header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                   <h2 className="text-2xl font-bold text-gray-900">
                    {configurationCards.find(c => c.id === activeConfigSection)?.title}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {configurationCards.find(c => c.id === activeConfigSection)?.description}
                  </p>
                </div>
                <button 
                  onClick={closeConfigDrawer}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Drawer content */}
              <div className="flex-1 overflow-y-auto p-8">
                {renderConfigurationForm()}
              </div>

              {/* Drawer footer */}
              <div className="border-t border-gray-100 p-6 bg-gray-50/50">
                <div className="flex gap-4">
                  <button 
                    onClick={closeConfigDrawer}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-white hover:border-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      setConfigurationStatus(prev => ({...prev, [activeConfigSection]: true}));
                      closeConfigDrawer();
                    }}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // KNOWLEDGE (What GIA Knows)
  const Knowledge = () => {
    // FAQ Data
    const faqData = [
      { q: 'How do I book an appointment?', a: 'You can book an appointment by calling us or using our online booking system...', category: 'Appointments', helpful: 45, priority: 'High' },
      { q: 'What are your office hours?', a: 'We are open Monday-Friday 9AM-5PM, Saturday 10AM-2PM...', category: 'Clinic Info', helpful: 38, priority: 'Medium' },
      { q: 'Do you accept insurance?', a: 'Yes, we accept most major insurance plans including Blue Cross, Aetna...', category: 'Insurance', helpful: 52, priority: 'High' },
      { q: 'What is your cancellation policy?', a: 'We require 24 hours notice for cancellations to avoid a fee...', category: 'Policies', helpful: 31, priority: 'High' },
      { q: 'Is parking available?', a: 'Yes, we have a free parking lot behind the building.', category: 'Clinic Info', helpful: 12, priority: 'Low' },
      { q: 'Do you offer financing?', a: 'We work with CareCredit for financing options.', category: 'Billing', helpful: 28, priority: 'Medium' }
    ];

    // Stats calculation
    const totalFaqs = faqData.length;
    const highPriority = faqData.filter(f => f.priority === 'High').length;
    const mediumPriority = faqData.filter(f => f.priority === 'Medium').length;
    const lowPriority = faqData.filter(f => f.priority === 'Low').length;

    // Knowledge category cards
    const knowledgeCategoryCards = [
      {
        id: 'clinic-info',
        title: 'Clinic Information',
        description: 'Add your office hours, location, contact details, and general practice information',
        icon: '🏥',
        iconBg: 'from-blue-500 to-blue-600',
        examples: ['Office hours', 'Location & directions', 'Contact information', 'Parking details']
      },
      {
        id: 'services-pricing',
        title: 'Services & Pricing',
        description: 'Upload treatment descriptions, procedure details, and pricing information',
        icon: '💰',
        iconBg: 'from-green-500 to-green-600',
        examples: ['Service menu', 'Treatment costs', 'Package pricing', 'Special offers']
      },
      {
        id: 'appointments',
        title: 'Appointments & Booking',
        description: 'Define booking process, cancellation policies, and scheduling guidelines',
        icon: '📅',
        iconBg: 'from-purple-500 to-purple-600',
        examples: ['Booking process', 'Cancellation policy', 'Rescheduling rules', 'Wait times']
      },
      {
        id: 'insurance-billing',
        title: 'Insurance & Billing',
        description: 'Add accepted insurance plans, payment options, and billing procedures',
        icon: '🏦',
        iconBg: 'from-orange-500 to-orange-600',
        examples: ['Accepted insurance', 'Payment methods', 'Billing policies', 'Financial assistance']
      },
      {
        id: 'policies',
        title: 'Policies & Procedures',
        description: 'Upload patient policies, HIPAA compliance, and clinic procedures',
        icon: '📋',
        iconBg: 'from-red-500 to-red-600',
        examples: ['Patient rights', 'Privacy policy', 'Consent forms', 'Clinic rules']
      },
      {
        id: 'treatments',
        title: 'Treatment Information',
        description: 'Add pre-care instructions, post-care guidelines, and treatment expectations',
        icon: '💊',
        iconBg: 'from-teal-500 to-teal-600',
        examples: ['Pre-care steps', 'Post-care guide', 'Recovery tips', 'Side effects']
      }
    ];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">What GIA Knows</h1>
          <p className="text-gray-500 text-sm mt-1">Manage GIA's knowledge base and training data</p>
        </div>
        


        <div className="border-b border-gray-200">
          <div className="flex gap-6">
            {[
              { id: 'coverage', label: 'Knowledge Coverage', icon: Database },
              { id: 'sources', label: 'Knowledge Sources', icon: Upload },
              { id: 'graph', label: 'Knowledge Graph', icon: TrendingUp },
              { id: 'faq', label: 'FAQs List', icon: MessageSquare },
              { id: 'feedback', label: 'Feedback', icon: Lightbulb }

            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveKnowledgeTab(tab.id)}
                className={`pb-3 font-medium transition-all flex items-center gap-2 text-sm border-b-2 ${
                  activeKnowledgeTab === tab.id 
                    ? 'border-slate-900 text-slate-900' 
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeKnowledgeTab === tab.id ? 'stroke-[2px]' : ''}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeKnowledgeTab === 'coverage' && (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
              <div className="flex items-start gap-4">
                <div className="p-1.5 bg-white border border-slate-200 rounded-md">
                  <Lightbulb className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900 mb-0.5">Build GIA's Knowledge Base</p>
                  <p className="text-sm text-slate-600">
                    Add information in these categories to help GIA answer patient questions accurately
                  </p>
                </div>
              </div>
            </div>

            {/* Knowledge category cards without coverage metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {knowledgeCategoryCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all group"
                >
                  <div className="flex items-start gap-4 mb-5">
                    <div className={`w-12 h-12 bg-gradient-to-br ${card.iconBg} rounded-xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-105 transition-transform`}>
                      {card.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-base text-gray-900 mb-1 leading-tight">{card.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{card.description}</p>
                    </div>
                  </div>

                  {/* Example items */}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Examples</p>
                    <ul className="space-y-1.5">
                      {card.examples.slice(0, 3).map((example, idx) => (
                        <li key={idx} className="text-xs font-medium text-gray-600 flex items-center gap-2">
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    onClick={() => setActiveKnowledgeTab('sources')}
                    className="w-full mt-5 px-3 py-2 bg-gray-50 text-gray-900 rounded-lg hover:bg-slate-900 hover:text-white text-xs font-bold transition-all border border-gray-200 hover:border-slate-900"
                  >
                    Add Content
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other tabs remain similar but with bolder styling if needed, can expand here or keep basic implementation for now 
            Since I need to clean up duplicated code, I will include other tabs here to ensure consistent styling
        */}
        
        {activeKnowledgeTab === 'sources' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Knowledge Sources</h2>
                <p className="text-sm text-gray-500 mt-1">Upload and manage documents that train GIA</p>
              </div>
              <button 
                onClick={() => {
                  setActiveConfigSection('training');
                  setConfigDrawerOpen(true);
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2 text-sm font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Upload Document
              </button>
            </div>

            {/* Document stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Documents', value: '24', icon: FileText },
                { label: 'Total Size', value: '48.6 MB', icon: Database },
                { label: 'Last Updated', value: '2h ago', icon: Clock },
                { label: 'Categories', value: '6', icon: BookOpen }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                      <stat.icon className="w-4 h-4 text-gray-700" />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Document list */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">Uploaded Documents</h3>
              <div className="space-y-2">
                {[
                  { name: 'Service Menu.pdf', category: 'Services & Pricing', size: '2.3 MB', date: '2 hours ago' },
                  { name: 'Treatment Guide.docx', category: 'Treatment Information', size: '1.8 MB', date: '5 hours ago' },
                  { name: 'Office Hours & Contact.pdf', category: 'Clinic Information', size: '0.8 MB', date: '1 day ago' },
                  { name: 'Insurance Plans Accepted.xlsx', category: 'Insurance & Billing', size: '1.2 MB', date: '2 days ago' },
                  { name: 'Patient Policies.pdf', category: 'Policies & Procedures', size: '2.1 MB', date: '3 days ago' }
                ].map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group border border-transparent hover:border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
                        <FileText className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{doc.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-2 py-0.5 bg-white border border-gray-200 text-gray-600 rounded font-medium">{doc.category}</span>
                          <span className="text-[10px] font-medium text-gray-400">{doc.size}</span>
                          <span className="text-[10px] font-medium text-gray-400">• {doc.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-white rounded-md transition-colors border border-transparent hover:border-gray-200">
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100">
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Graph tab - kept simple but styled */}
        {activeKnowledgeTab === 'graph' && (
           <div className="space-y-6">
             <div>
               <h2 className="text-lg font-bold text-gray-900">Knowledge Graph</h2>
               <p className="text-sm text-gray-500 mt-1">Visualize how GIA's knowledge is connected</p>
             </div>
             <div className="bg-white border border-gray-200 rounded-xl p-10 flex items-center justify-center h-80">
                <div className="text-center">
                   <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-gray-100">
                     <TrendingUp className="w-10 h-10 text-gray-400" />
                   </div>
                   <h3 className="text-lg font-bold text-gray-900 mb-1">Graph Visualization</h3>
                   <p className="text-sm text-gray-500">Interactive knowledge graph component would render here</p>
                </div>
             </div>
           </div>
        )}

        {activeKnowledgeTab === 'faq' && (
          <div className="space-y-6">
            {/* FAQ Statistics Card - Minimal Version */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                    <MessageSquare className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">FAQ Knowledge Base</h2>
                    <p className="text-gray-500 text-sm">Overview of frequently asked questions</p>
                  </div>
                </div>
                <button 
                   onClick={() => {
                     setActiveConfigSection('faqs');
                     setConfigDrawerOpen(true);
                   }}
                   className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New FAQ
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wide">Total FAQs</p>
                  <p className="text-2xl font-bold text-gray-900">{totalFaqs}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                    <p className="text-slate-500 text-xs font-medium">High Priority</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{highPriority}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <p className="text-slate-500 text-xs font-medium">Medium Priority</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{mediumPriority}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <p className="text-slate-500 text-xs font-medium">Low Priority</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{lowPriority}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {faqData.map((faq, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm hover:border-gray-300 transition-all group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase tracking-wide">
                          {faq.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          faq.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                          faq.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {faq.priority}
                        </span>
                        <span className="text-[10px] font-medium text-gray-400">
                          {faq.helpful} helpful
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-gray-900 mb-1">{faq.q}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:bg-red-50 rounded-md text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback and Analytics tabs can be similarly styled or kept basic, implementing Feedback for completeness */}
        {activeKnowledgeTab === 'feedback' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Total Feedback', value: '234', icon: MessageSquare, color: 'blue' },
                { label: 'Positive', value: '198', icon: CheckCircle, color: 'emerald' },
                { label: 'Needs Improvement', value: '36', icon: AlertCircle, color: 'amber' }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 bg-${stat.color}-50 rounded-lg flex items-center justify-center border border-${stat.color}-100`}>
                      <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>
             <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">Recent Feedback</h3>
              <div className="space-y-3">
                {[
                  { type: 'positive', text: 'GIA provided accurate appointment booking information', time: '2 hours ago', topic: 'Appointments' },
                  { type: 'negative', text: 'Could not answer question about specific treatment cost', time: '5 hours ago', topic: 'Pricing' },
                  { type: 'positive', text: 'Helpful response about insurance coverage', time: '1 day ago', topic: 'Insurance' }
                ].map((feedback, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      feedback.type === 'positive' ? 'bg-emerald-100' : 'bg-amber-100'
                    }`}>
                      {feedback.type === 'positive' ? 
                        <CheckCircle className="w-4 h-4 text-emerald-600" /> : 
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                      }
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-600">
                          {feedback.topic}
                        </span>
                        <span className="text-[10px] font-medium text-gray-400">{feedback.time}</span>
                      </div>
                      <p className="text-sm text-gray-700 font-medium">{feedback.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics tab */}


      </div>
    );
  };


    
        
    

  // Helper Component for Analytics Cards
  const AnalyticsCard = ({ title, icon: Icon, iconColor, iconBg, data }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-end border-b border-gray-100 pb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Responses</p>
            <p className="text-3xl font-bold text-gray-900">{data.totalResponses}</p>
          </div>
          <div className="text-right">
             <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Quality Score</p>
             <p className={`text-xl font-bold ${Number(data.qualityScore) >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
               {Number(data.qualityScore).toFixed(1)}%
             </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">AI Response Rate</p>
            <p className="text-sm font-bold text-gray-900">{data.aiResponseRate}%</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Feedback Rate</p>
            <p className="text-sm font-bold text-gray-900">{data.feedbackRate}%</p>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
           <p className="text-[10px] text-gray-500 font-bold uppercase mb-3">User Feedback</p>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-gray-700">{data.thumbsUp}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-gray-700">{data.thumbsDown}</span>
              </div>
               <div className="ml-auto flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-medium text-gray-500">{data.awaitedFeedback} awaited</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  // ANALYTICS
  const Analytics = () => {
    // SMS and Email Data
    const smsData = {
      totalResponses: 0,
      aiResponseRate: 0.0,
      feedbackRate: 0.0,
      qualityScore: 66.67,
      awaitedFeedback: 212,
      thumbsUp: 2,
      thumbsDown: 1
    };
    
    const emailData = {
      totalResponses: 86,
      aiResponseRate: 108.14,
      feedbackRate: 79.07,
      qualityScore: 52.94,
      awaitedFeedback: 25,
      thumbsUp: 36,
      thumbsDown: 32
    };

    // Aggregated Stats
    const totalResponses = smsData.totalResponses + emailData.totalResponses;
    const totalThumbsUp = smsData.thumbsUp + emailData.thumbsUp;
    const totalThumbsDown = smsData.thumbsDown + emailData.thumbsDown;
    const totalFeedback = totalThumbsUp + totalThumbsDown;
    
    const positivePercentage = totalFeedback > 0 ? Math.round((totalThumbsUp / totalFeedback) * 100) : 0;
    const negativePercentage = totalFeedback > 0 ? Math.round((totalThumbsDown / totalFeedback) * 100) : 0;
    
    // Average quality score (weighted by responses or simple average? Using simple average of non-zero scores for now or weighted if implied. 
    // Since SMS has 0 responses but a score, it's tricky. Let's assume the score is valid if present. 
    // Actually, weighted by total interactions might be better, but we don't have total interactions count, just responses.
    // Let's perform a simple average of the scores for the aggregated "Quality" metric if meaningful, or just display "Avg Quality".
    // Or better, let's just stick to the specific email/sms breakdown and the total counts.
    const avgQualityScore = ((smsData.qualityScore + emailData.qualityScore) / 2).toFixed(1);

    return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Performance insights and metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Responses', value: totalResponses.toString(), icon: MessageSquare },
          { label: 'Avg Quality Score', value: `${avgQualityScore}%`, icon: TrendingUp },
          { label: 'Positive Feedback', value: `${totalThumbsUp}`, icon: CheckCircle },
          { label: 'Negative Feedback', value: `${totalThumbsDown}`, icon: AlertCircle }
        ].map((metric, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <metric.icon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Feedback Analytics with Separate Cards */}
      <div className="space-y-6">
          <div className="mb-2">
            <h3 className="text-lg font-bold text-gray-900">Feedback Analytics</h3>
            <p className="text-sm text-gray-500">Detailed breakdown of interactions by channel</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <AnalyticsCard 
              title="Aggregated Analytics" 
              icon={BarChart3} 
              iconColor="text-emerald-600" 
              iconBg="bg-emerald-50"
              data={{
                totalResponses,
                aiResponseRate: ((smsData.aiResponseRate + emailData.aiResponseRate) / 2).toFixed(2), // Simple average for now
                feedbackRate: ((smsData.feedbackRate + emailData.feedbackRate) / 2).toFixed(2),
                qualityScore: avgQualityScore,
                awaitedFeedback: smsData.awaitedFeedback + emailData.awaitedFeedback,
                thumbsUp: totalThumbsUp,
                thumbsDown: totalThumbsDown
              }}
            />
             <AnalyticsCard 
              title="Email Analytics" 
              icon={Mail} 
              iconColor="text-blue-600" 
              iconBg="bg-blue-50"
              data={emailData}
            />
             <AnalyticsCard 
              title="SMS Analytics" 
              icon={Smartphone} 
              iconColor="text-purple-600" 
              iconBg="bg-purple-50"
              data={smsData}
            />
          </div>
      </div>

      {/* Source Analytics (Moved) */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Source Analytics</h3>
            <p className="text-sm text-gray-500">6 total sources powering Gia's responses</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-gray-700">5 Active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-gray-700">1 Inactive</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-gray-700">109 Largest</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { name: 'Global FAQ', count: '3 Items Added', icon: Globe, color: 'blue' },
            { name: 'FAQ', count: '7 Items Added', icon: HelpCircle, color: 'purple' },
            { name: 'Live Website Data', count: '4 Items Added', icon: Monitor, color: 'cyan' },
            { name: 'User Knowledge Base', count: 'No Items Added', icon: BookOpen, color: 'gray' },
            { name: 'Gia Feedback / Input', count: '79 Items Added', icon: MessageSquare, color: 'emerald' },
            { name: 'Business Config / Contact Conversion', count: '109 Items Added', icon: LayoutGrid, color: 'lime' }
          ].map((source, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${source.color}-50 text-${source.color}-600`}>
                  <source.icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm text-gray-900">{source.name}</span>
              </div>
              <span className={`text-xs font-bold ${source.count.includes('No') ? 'text-gray-400' : 'text-gray-900'}`}>
                {source.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidenav */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidenavExpanded ? 'w-64' : 'w-16'}`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidenavExpanded && <h2 className="font-bold text-gray-900">Growth99</h2>}
          <button 
            onClick={() => setSidenavExpanded(!sidenavExpanded)}
            className="p-1.5 hover:bg-gray-100 rounded"
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

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-6">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">GIA Assistant</h1>
                  <p className="text-xs text-gray-500">Growth99 Intelligent Assistant</p>
                </div>
              </div>
            </div>
            
            {/* Tabs */}
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

        {/* Content */}
        <div className="p-6">
          {activeTopTab === 'overview' ? (
            <Dashboard />
          ) : activeTopTab === 'configuration' ? (
            <Configuration />
          ) : activeTopTab === 'knowledge' ? (
            <Knowledge />
          ) : activeTopTab === 'analytics' ? (
            <Analytics />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default GiaImprovedUX;