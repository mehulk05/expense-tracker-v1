import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Settings, BookOpen, BarChart3, LayoutDashboard, Plus, Save, Calendar, MessageSquare, FileText, Database, TrendingUp, Lightbulb, CheckCircle, AlertCircle, Clock, Zap, ArrowRight, Check, X, Edit2, Upload, HelpCircle, ArrowDown, Globe, Monitor, LayoutGrid, Mail, Smartphone, Eye } from 'lucide-react';
import GiaChatPreview from './Giapreview';

const GiaImprovedUX = () => {
  const [hasConfiguration, setHasConfiguration] = useState(false);
  const [sidenavExpanded, setSidenavExpanded] = useState(true);
  const [activeTopTab, setActiveTopTab] = useState('overview');
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const [activeConfigSection, setActiveConfigSection] = useState(null);
  const [activeKnowledgeTab, setActiveKnowledgeTab] = useState('coverage');
  const [isEditMode, setIsEditMode] = useState(false);
  const [configurationStatus, setConfigurationStatus] = useState({
    communication: true,
    availability: false,
    booking: false,
    training: false,
    faqs: false,
  });
  
  // FAQ Management State
  const [localFaqs, setLocalFaqs] = useState([
    { id: 1, question: 'How do I book an appointment?', answer: 'You can book an appointment by calling us at (555) 123-4567 or using our online booking system.' },
    { id: 2, question: 'What is your cancellation policy?', answer: 'We require 24 hours notice for cancellations to avoid a cancellation fee.' },
    { id: 3, question: 'Do you accept insurance?', answer: 'Yes, we accept most major insurance plans including Blue Cross, Aetna, and United Healthcare.' }
  ]);
  const [isAddingFaq, setIsAddingFaq] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' });

  const handleSaveFaq = () => {
    if (editingFaqId) {
      setLocalFaqs(localFaqs.map(f => f.id === editingFaqId ? { ...f, ...faqForm } : f));
      setEditingFaqId(null);
    } else {
      setLocalFaqs([...localFaqs, { id: Date.now(), ...faqForm }]);
      setIsAddingFaq(false);
    }
    setFaqForm({ question: '', answer: '' });
  };

  const startEditFaq = (faq) => {
    setEditingFaqId(faq.id);
    setFaqForm({ question: faq.question, answer: faq.answer });
    setIsAddingFaq(true); 
  };

  const handleDeleteFaq = (id) => {
    setLocalFaqs(localFaqs.filter(f => f.id !== id));
  };
  
  const [bookingMode, setBookingMode] = useState('direct'); // 'direct' or 'request'

  // Top tabs
  const topTabs = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'configuration', label: 'Configuration', icon: Settings },
    { id: 'knowledge', label: 'What GIA Knows', icon: Database },
    { id: 'preview', label: 'Test Chat', icon: MessageSquare },
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
      id: 'booking',
      step: 3,
      title: 'Booking',
      description: 'Configure how GIA handles appointment scheduling and hands off booking requests',
      icon: Calendar,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-700',
      configured: configurationStatus.booking,
      priority: 'Important'
    },
    {
      id: 'training',
      step: 4,
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
      step: 5,
      title: 'GIA\'s Answers',
      description: 'Teach GIA how to answer common questions about appointments, pricing, and policies',
      icon: HelpCircle,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-700',
      configured: configurationStatus.faqs,
      priority: 'Important'
    }
  ];

  const openConfigDrawer = (sectionId) => {
    // if (sectionId === 'training') {
    //   setActiveTopTab('knowledge');
    //   setActiveKnowledgeTab('sources');
    //   return;
    // }
    // if (sectionId === 'faqs') {
    //   setActiveTopTab('knowledge');
    //   setActiveKnowledgeTab('faq');
    //   return;
    // }
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
          <div className="space-y-8">
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Choose Gia's conversational tone and style.</h3>
              <p className="text-sm text-gray-500">Choose Gia's communication voice, or the personality she tries to embody as she communicates</p>
            </div>

            <div className="space-y-8">
              {/* Employee Name */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">What would you like to call your AI employee?</label>
                <input 
                  type="text" 
                  defaultValue="GIA"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                  placeholder="e.g. Sarah"
                />
              </div>

              {/* Communication Tone Slider */}
              <div>
                 <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-bold text-gray-900">Communication Tone</label>
                 </div>
                 <div className="px-2">
                    <div className="flex justify-between text-xs text-gray-500 font-medium mb-2">
                      <span>Formal</span>
                      <span>Casual</span>
                    </div>
                    <div className="relative h-1.5 bg-blue-100 rounded-full mb-2">
                       <div className="absolute top-1/2 -translate-y-1/2 right-[30%] w-5 h-5 bg-white border-2 border-blue-600 rounded-full shadow cursor-pointer hover:scale-110 transition-transform"></div>
                    </div>
                     <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>Formal, Professional tone</span>
                      <span>Casual, Conversational tone</span>
                    </div>
                 </div>
              </div>

              {/* Communication Voice Cards */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">Communication Voice</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: 'Professional', desc: 'Clear, concise, and business-focused', active: false },
                    { title: 'Neutral', desc: 'Balanced and adaptable to various situations', active: false },
                    { title: 'Friendly', desc: 'Warm and approachable while remaining professional', active: true }
                  ].map((voice) => (
                    <div 
                      key={voice.title} 
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        voice.active 
                          ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' 
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <p className="font-bold text-gray-900 mb-1">{voice.title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{voice.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

               {/* Primary Language */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">Primary Language</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {/* English US */}
                    <div className="p-4 rounded-xl border-2 border-blue-600 bg-blue-50 cursor-pointer relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-1.5 bg-blue-600 rounded-bl-xl">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                         <Globe className="w-4 h-4 text-blue-700" />
                         <span className="font-bold text-gray-900">English (US)</span>
                      </div>
                      <p className="text-xs text-gray-500 ml-6">American English dialect and terminology</p>
                    </div>

                    {/* Spanish */}
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 cursor-not-allowed">
                      <div className="flex items-center gap-2 mb-1">
                         <Globe className="w-4 h-4 text-gray-400" />
                         <span className="font-bold text-gray-400">Spanish</span>
                         <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-[10px] font-bold rounded-full uppercase tracking-wide">Coming Soon</span>
                      </div>
                      <p className="text-xs text-gray-400 ml-6">Other language support</p>
                    </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'availability':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Availability</h3>
              <p className="text-sm text-gray-500">Configure when GIA responds to inbound communications</p>
            </div>

            <div className="space-y-4">
              {/* Response Mode Selection */}
              <div className="space-y-3">
                 {/* Respond Immediately */}
                 <div className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 transition-colors cursor-pointer">
                    <div className="mt-0.5 w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center"></div>
                    <div>
                       <p className="text-sm font-bold text-gray-900">Respond Immediately</p>
                       <p className="text-xs text-gray-500 mt-0.5">Configure how GIA collects and manages appointment requests from patient</p>
                    </div>
                 </div>

                 {/* Respond if No One Replies */}
                 <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center"></div>
                      <div>
                         <p className="text-sm font-bold text-gray-900">Respond if No One Replies Within</p>
                         <p className="text-xs text-gray-500 mt-0.5">GIA only responds after the selected delay if there's no human response.</p>
                      </div>
                    </div>
                    <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none focus:border-blue-500 bg-gray-50">
                       <option>2 Minutes</option>
                       <option>5 Minutes</option>
                       <option>10 Minutes</option>
                    </select>
                 </div>

                 {/* Respond at certain times */}
                 <div className="flex items-start gap-3 p-4 bg-white border-2 border-blue-100 rounded-xl cursor-pointer ring-1 ring-blue-100">
                    <div className="mt-0.5 w-5 h-5 rounded-full border-4 border-blue-600 flex items-center justify-center bg-white"></div>
                    <div>
                       <p className="text-sm font-bold text-gray-900">Respond at certain times</p>
                       <p className="text-xs text-gray-500 mt-0.5">GIA only responds during specific days or time windows you configure.</p>
                    </div>
                 </div>
              </div>

              {/* Day Scheduler */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                 <p className="text-sm font-bold text-gray-900 mb-4">Select the days and times</p>
                 <div className="space-y-3">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                       <div key={day} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 w-32">
                             <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${day === 'Saturday' || day === 'Sunday' ? 'bg-gray-200' : 'bg-gray-200'}`}>
                                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                             </div>
                             <span className="text-sm font-medium text-gray-700">{day}</span>
                          </div>
                          <div className="flex-1 bg-gray-50 rounded-lg px-4 py-2.5 border border-transparent">
                             <span className="text-sm text-gray-400 font-medium">Closed</span>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Missed Call Follow-up */}
              <div className="pt-6 border-t border-gray-100">
                 <h4 className="text-sm font-bold text-gray-900 mb-2">Missed Call Follow-up</h4>
                 <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                   Gia can automatically send an SMS follow-up when a call goes unanswered when using Growth99 call tracking.
                 </p>
                 <div className="flex items-center gap-3">
                    <div className="w-11 h-6 bg-blue-100 rounded-full p-1 cursor-pointer">
                       <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                    </div>
                    <span className="text-sm font-bold text-gray-900">Follow up via SMS</span>
                    <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wide">Coming Soon</span>
                 </div>
              </div>
            </div>
          </div>
        );

      case 'training':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Knowledge Base (Optional)</h3>
              <p className="text-sm text-gray-500">
                Help Gia have more context about your business by uploading some documents. This could include information like: your booking or cancellation policies, service offerings, pricing, current or ongoing promotions, etc.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900">Knowledge Sources</h4>
              
              {/* Drag & Drop Area */}
              <div className="border-2 border-dashed border-blue-200 rounded-xl bg-blue-50 p-8 text-center hover:border-blue-400 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-slate-200">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <h5 className="text-base font-bold text-slate-900 mb-1">Drag files or click to upload</h5>
                  <p className="text-sm text-slate-500 mb-4">Share your files easily. Up to 10 files can be uploaded</p>
                  
                  <div className="flex justify-center gap-2">
                     {['PDF', 'DOCX', 'TXT'].map(type => (
                       <span key={type} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-500 shadow-sm">
                         {type}
                       </span>
                     ))}
                  </div>
              </div>

              {/* List Header */}
              <div className="flex items-center justify-between pt-4">
                 <p className="text-sm font-medium text-gray-500">Upload documents or add URLs</p>
                 <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg">
                    <Plus className="w-4 h-4" />
                    Add Source
                 </button>
              </div>

              {/* File List */}
              <div className="space-y-3">
                 {/* Item 1 - Indexed */}
                 <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                          <FileText className="w-5 h-5 text-blue-600" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-gray-900">Service Menu.pdf</p>
                          <p className="text-xs text-gray-400 font-medium">PDF • 2.3 MB</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Indexed</span>
                       <button className="text-gray-400 hover:text-red-500 transition-colors">
                          <X className="w-5 h-5" />
                       </button>
                    </div>
                 </div>

                 {/* Item 2 - Processing */}
                 <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                          <FileText className="w-5 h-5 text-blue-600" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-gray-900">Treatment Guidelines.docx</p>
                          <p className="text-xs text-gray-400 font-medium">Document • 1.8 MB</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">Processing</span>
                       <button className="text-gray-400 hover:text-red-500 transition-colors">
                          <X className="w-5 h-5" />
                       </button>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        );

      case 'faqs':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1">GIA's Answers</h3>
              <p className="text-sm text-gray-500">Teach GIA how to answer common questions about your practice.</p>
            </div>

            {/* List or Form */}
            {isAddingFaq ? (
               <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 animate-fade-in-up">
                  <h4 className="text-sm font-bold text-gray-900 mb-4">{editingFaqId ? 'Edit Q&A' : 'Add New Q&A'}</h4>
                  
                  <div className="space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Question</label>
                        <input 
                           type="text"
                           value={faqForm.question}
                           onChange={(e) => setFaqForm({...faqForm, question: e.target.value})}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                           placeholder="e.g. Do you have parking?" 
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Answer</label>
                        <textarea 
                           rows={4}
                           value={faqForm.answer}
                           onChange={(e) => setFaqForm({...faqForm, answer: e.target.value})}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                           placeholder="e.g. Yes, we have a free parking lot behind the building." 
                        />
                     </div>
                     
                     <div className="flex items-center gap-3 pt-2">
                        <button 
                           onClick={handleSaveFaq}
                           className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                        >
                           Save Q&A
                        </button>
                        <button 
                           onClick={() => { setIsAddingFaq(false); setEditingFaqId(null); setFaqForm({question:'', answer:''}); }}
                           className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors"
                        >
                           Cancel
                        </button>
                     </div>
                  </div>
               </div>
            ) : (
               <div className="space-y-4">
                  <button 
                    onClick={() => { setIsAddingFaq(true); setFaqForm({question:'', answer:''}); }}
                    className="w-full py-3 border-2 border-dashed border-blue-200 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 hover:border-blue-300 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Q&A
                  </button>

                  <div className="space-y-3">
                     {localFaqs.map((faq) => (
                        <div key={faq.id} className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all">
                           <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                 <div className="flex items-start gap-3 mb-2">
                                    <div className="mt-1 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                       <span className="text-[10px] font-bold text-blue-700">Q</span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 text-sm leading-snug">{faq.question}</h4>
                                 </div>
                                 <div className="flex items-start gap-3">
                                    <div className="mt-1 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                       <span className="text-[10px] font-bold text-gray-600">A</span>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                                 </div>
                              </div>
                              <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button 
                                    onClick={() => startEditFaq(faq)}
                                    className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                                    title="Edit"
                                 >
                                    <Edit2 className="w-4 h-4" />
                                 </button>
                                 <button 
                                    onClick={() => handleDeleteFaq(faq.id)}
                                    className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                    title="Delete"
                                 >
                                    <X className="w-4 h-4" />
                                 </button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}
          </div>
        );

      case 'booking':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Booking</h3>
              <p className="text-sm text-gray-500">
                Gia can present customers with your booking link when contextually relevant, or if you don't have a booking link, she can take down a booking request and notify human staff to follow-up.
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="bg-gray-100 p-1 rounded-full inline-flex relative">
              <button 
                onClick={() => setBookingMode('direct')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all relative z-10 ${
                  bookingMode === 'direct' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Direct Scheduling
              </button>
              <button 
                onClick={() => setBookingMode('request')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all relative z-10 ${
                  bookingMode === 'request' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Booking Request
              </button>
            </div>

            <div className="space-y-6">
              {bookingMode === 'direct' ? (
                // Direct Scheduling Content
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                   <h4 className="text-sm font-bold text-gray-900 mb-2">GIA will provide a booking URL for direct scheduling</h4>
                   <p className="text-sm text-gray-500 mb-6">
                     When contextually relevant, Gia will present your booking link so patients can book an appointment
                   </p>

                   <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Booking URL</label>
                      <input 
                        type="url"
                        defaultValue="https://widget-ui.growthemr.com/assets/widgets/new-form.html?bid=1964&fid=17614" 
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-600 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      />
                   </div>
                </div>
              ) : (
                // Booking Request Content
                <div className="space-y-6">
                   <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-start gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                         <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-5 h-5 text-gray-500" />
                         </div>
                         <div>
                            <h4 className="text-sm font-bold text-gray-900 mb-1">Business Hours</h4>
                            <p className="text-xs text-gray-500">GIA will use location business hours for scheduling</p>
                         </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                         <div className="bg-blue-600 rounded text-white p-0.5 mt-0.5">
                           <AlertCircle className="w-3 h-3" />
                         </div>
                         <p className="text-xs text-yellow-800 leading-relaxed font-medium">
                            GIA will automatically use the business hours configured for each location. To view or modify business hours, go to <span className="font-bold text-yellow-900">Settings → Locations → Business Hours</span>
                         </p>
                      </div>
                   </div>

                   <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Assign booking requests to</label>
                      <div className="relative">
                         <select className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white transition-all cursor-pointer">
                            <option>Sakshi D</option>
                            <option>Dr. Smith</option>
                            <option>Front Desk</option>
                         </select>
                         <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                      </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // DASHBOARD
  // DASHBOARD
  const Dashboard = () => (
    <div className="space-y-6">
        {/* Compact Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-gray-100 pb-6">
           <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">GIA Assistant</h1>
                <div className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                   Active
                </div>
              </div>
              <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
                Automating patient communication, answering questions, and converting leads 24/7.
              </p>
           </div>
           
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveTopTab('preview')}
                className="px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all font-bold shadow-sm flex items-center gap-2 text-sm whitespace-nowrap"
              >
                Preview
                <Eye className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setActiveTopTab('configuration')}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold shadow-sm shadow-blue-200 flex items-center gap-2 text-sm whitespace-nowrap"
              >
                {isEditMode ? 'Manage Configuration' : 'Setup GIA'}
                <Settings className="w-4 h-4" />
              </button>
            </div>
        </div>

        {/* Improvement Suggestions - Only in Edit Mode */}
        {isEditMode && (
           <div className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-base font-bold text-gray-900">Optimization Checklist</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {/* Upload Documents */}
                 <div 
                    onClick={() => openConfigDrawer('training')}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col gap-4"
                 >
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 transition-colors">
                       <Upload className="w-6 h-6 text-blue-600 group-hover:text-white" />
                    </div>
                    <div>
                       <h3 className="font-bold text-gray-900 text-base mb-2">Expand Knowledge Base</h3>
                       <p className="text-sm text-gray-500 mb-4 leading-relaxed group-hover:text-gray-600">
                          Teach Gia about your specific clinic policies, treatment guidelines, and pricing. The more documents you upload, the more accurate and helpful her answers will be for your patients.
                       </p>
                       <span className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1 group-hover:gap-2 transition-all">
                          Upload Documents <ArrowRight className="w-3 h-3" />
                       </span>
                    </div>
                 </div>

                 {/* Refine Answers */}
                 <div 
                    onClick={() => openConfigDrawer('faqs')}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group flex flex-col gap-4"
                 >
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 transition-colors">
                       <MessageSquare className="w-6 h-6 text-indigo-600 group-hover:text-white" />
                    </div>
                    <div>
                       <h3 className="font-bold text-gray-900 text-base mb-2">Refine Answers</h3>
                       <p className="text-sm text-gray-500 mb-4 leading-relaxed group-hover:text-gray-600">
                          Review standard questions and fine-tune Gia's responses. You can add specific Q&A pairs to ensure she answers exactly how you want for common inquiries.
                       </p>
                       <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-1 group-hover:gap-2 transition-all">
                          Manage Q&A <ArrowRight className="w-3 h-3" />
                       </span>
                    </div>
                 </div>

                 {/* Booking Config */}
                 <div 
                    onClick={() => openConfigDrawer('booking')}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group flex flex-col gap-4"
                 >
                     <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-600 transition-colors">
                       <Calendar className="w-6 h-6 text-emerald-600 group-hover:text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-base mb-2">Booking Settings</h3>
                        <p className="text-sm text-gray-500 mb-4 leading-relaxed group-hover:text-gray-600">
                           Configure how Gia handles appointment requests. You can set her to provide direct booking links or to take down details for your staff to follow up.
                        </p>
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1 group-hover:gap-2 transition-all">
                           Configure Booking <ArrowRight className="w-3 h-3" />
                        </span>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* Features Capabilities */}
        <div>
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-base font-bold text-gray-900">Core Capabilities</h2>
            <div className="h-px bg-gray-100 flex-1"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all">
               <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center mb-3">
                  <Clock className="w-4 h-4 text-indigo-600" />
               </div>
               <h3 className="text-sm font-bold text-gray-900 mb-1">Always Available</h3>
               <p className="text-xs text-gray-500 leading-relaxed">
                 Responds 24/7 to all messages instantly.
               </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all">
               <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mb-3">
                  <Lightbulb className="w-4 h-4 text-emerald-600" />
               </div>
               <h3 className="text-sm font-bold text-gray-900 mb-1">Smart Context</h3>
               <p className="text-xs text-gray-500 leading-relaxed">
                 Trained on your specific content.
               </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all">
               <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
               </div>
               <h3 className="text-sm font-bold text-gray-900 mb-1">Seamless Handoff</h3>
               <p className="text-xs text-gray-500 leading-relaxed">
                 Hands off to staff when needed.
               </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all">
               <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center mb-3">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
               </div>
               <h3 className="text-sm font-bold text-gray-900 mb-1">Conversion Focus</h3>
               <p className="text-xs text-gray-500 leading-relaxed">
                 Turns conversations into bookings.
               </p>
            </div>
          </div>
        </div>
      </div>
  );

  // CONFIGURATION
  const Configuration = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Setup Configuration</h1>
          <p className="text-gray-500 text-sm">Follow the steps to get GIA ready for your practice.</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100">
           {Math.round((configurationCards.filter(c => c.configured).length / configurationCards.length) * 100)}% Completed
        </div>
      </div>

      {/* Stepper Flow - Compact */}
      <div className="relative mb-8 px-4 hidden md:block">
        {/* Progress Bar Background */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0 rounded-full"></div>
        {/* Active Progress Bar */}
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-blue-600 -translate-y-1/2 z-0 rounded-full transition-all duration-700"
          style={{ width: `${(configurationCards.filter(c => c.configured).length / (configurationCards.length - 1)) * 100}%` }}
        ></div>

        <div className="relative z-10 flex justify-between">
          {configurationCards.map((card, idx) => {
             const isCompleted = card.configured;
             const isNext = !isCompleted && (idx === 0 || configurationCards[idx - 1].configured);

             return (
               <div key={card.id} className="flex flex-col items-center group cursor-pointer" onClick={() => openConfigDrawer(card.id)}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 ${
                   isCompleted ? 'bg-blue-600 border-blue-50 text-white shadow-md' :
                   isNext ? 'bg-white border-blue-600 text-blue-600 shadow-sm ring-2 ring-blue-50' :
                   'bg-white border-gray-200 text-gray-300'
                 }`}>
                   {isCompleted ? <Check className="w-4 h-4" /> : <span className="font-bold text-xs">{card.step}</span>}
                 </div>
                 <div className="absolute top-10 text-center w-24 transition-all duration-300 opacity-0 group-hover:opacity-100">
                   <p className="text-[10px] font-bold text-gray-700 bg-white px-2 py-1 rounded shadow-sm border border-gray-100">{card.title}</p>
                 </div>
               </div>
             );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {configurationCards.map((card) => (
          <button
            key={card.id}
            onClick={() => openConfigDrawer(card.id)}
            className="group relative flex flex-col items-start p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300 text-left h-full"
          >
            <div className="flex items-start justify-between w-full mb-4">
               <div className={`p-2.5 rounded-lg ${card.configured ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600'} transition-colors`}>
                 <card.icon className="w-6 h-6" />
               </div>
               <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-500 border border-gray-200">
                  {card.step}
               </span>
            </div>
            
            <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors">
              {card.title}
            </h3>
            
            <p className="text-gray-500 text-xs mb-5 line-clamp-2 leading-relaxed">
              {card.description}
            </p>

            <div className="mt-auto flex items-center justify-between w-full">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                card.configured 
                  ? 'bg-green-50 text-green-700 border border-green-100' 
                  : 'bg-gray-50 text-gray-500 border border-gray-100'
              }`}>
                {card.configured ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Configured
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3" />
                    Pending
                  </>
                )}
              </span>
              
              <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                <ChevronRight className="w-3.5 h-3.5" />
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
                   <h2 className="text-xl font-bold text-gray-900">
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
              { id: 'faq', label: 'Q&A Content', icon: BookOpen },
              { id: 'feedback', label: 'Learning & Correction', icon: Lightbulb }

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

    const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('feedback');

    return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Performance insights and metrics</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveAnalyticsTab('feedback')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeAnalyticsTab === 'feedback'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Feedback Analytics
          </button>
          <button
            onClick={() => setActiveAnalyticsTab('source')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeAnalyticsTab === 'source'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Source Analytics
          </button>
        </div>
      </div>

      {activeAnalyticsTab === 'feedback' && (
      <div className="space-y-6">
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

        <div className="space-y-6">
            <div className="mb-2">
              <h3 className="text-lg font-bold text-gray-900">Feedback Breakdown</h3>
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
      </div>
      )}

      {/* Source Analytics (Moved) */}
      {/* Source Analytics - Redesigned */}
      {/* Source Analytics - Redesigned */}
      {activeAnalyticsTab === 'source' && (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
             <h3 className="text-lg font-bold text-gray-900">Source Analytics</h3>
             <p className="text-sm text-gray-500 mt-1 max-w-2xl">
               Monitor the data sources that power GIA's intelligence. These sources are continuously indexed to provide accurate and relevant responses to patient inquiries.
             </p>
          </div>
           <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
             <div className="px-3 py-1 bg-white rounded-md shadow-sm border border-gray-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-gray-700">5 Active</span>
             </div>
             <div className="px-3 py-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                <span className="text-xs font-medium text-gray-500">1 Inactive</span>
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Global FAQ', count: '3 Items', icon: Globe, color: 'blue', status: 'Active', description: 'Universal questions applicable to all accounts' },
            { name: 'FAQ', count: '7 Items', icon: HelpCircle, color: 'purple', status: 'Active', description: 'Custom questions specific to your practice' },
            { name: 'Live Website Data', count: '4 Items', icon: Monitor, color: 'cyan', status: 'Active', description: 'Real-time content indexed from your website' },
            { name: 'User Knowledge Base', count: '0 Items', icon: BookOpen, color: 'gray', status: 'Inactive', description: 'Custom uploaded documents and files' },
            { name: 'Gia Feedback & Input', count: '79 Items', icon: MessageSquare, color: 'emerald', status: 'Active', description: 'Learnings from corrected AI responses' },
            { name: 'Business Config', count: '109 Items', icon: LayoutGrid, color: 'indigo', status: 'Active', description: 'Settings from your business profile' }
          ].map((source, idx) => (
            <div key={idx} className="group flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-${source.color}-50 group-hover:bg-${source.color}-100 transition-colors`}>
                <source.icon className={`w-6 h-6 text-${source.color}-600`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                   <h4 className="font-bold text-gray-900 text-sm truncate pr-2">{source.name}</h4>
                   {source.status === 'Active' ? (
                     <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" title="Active"></div>
                   ) : (
                      <div className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" title="Inactive"></div>
                   )}
                </div>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2 min-h-[2.5em]">{source.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${source.count.startsWith('0') ? 'text-gray-400' : 'text-gray-900'}`}>
                    {source.count}
                  </span>
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    View
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
    );
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
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
              
              {/* Edit Mode Toggle */}
              <div className="flex items-center gap-3">
                 <span className={`text-sm font-medium ${isEditMode ? 'text-gray-900' : 'text-gray-500'}`}>Edit Mode</span>
                 <button 
                   onClick={() => setIsEditMode(!isEditMode)}
                   className={`relative w-11 h-6 rounded-full transition-colors ${isEditMode ? 'bg-blue-600' : 'bg-gray-200'}`}
                 >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform ${isEditMode ? 'translate-x-5' : 'translate-x-0'}`} />
                 </button>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-1 -mb-px">
              {topTabs.map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTopTab(tab.id)}
                  className={`px-5 py-3 border-b-2 text-sm font-medium transition-all flex items-center gap-2 ${
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
          {activeTopTab === 'preview' ? (
            <div className="max-w-7xl mx-auto">
              <GiaChatPreview showShell={false} />
            </div>
          ) : activeTopTab === 'overview' ? (
            <div className="max-w-6xl mx-auto">
              <Dashboard />
            </div>
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