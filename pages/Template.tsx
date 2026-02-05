
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
// --- Constants & Mock Data ---
const ALL_VARIABLES = {
  'Lead Info': [
    { name: 'LEAD_NAME', desc: 'Full Name' }, 
    { name: 'LEAD_PHONE', desc: 'Phone Number with Country Code' },
    { name: 'LEAD_SOURCE', desc: 'e.g. Facebook, Google' },
    { name: 'LEAD_SERVICE', desc: 'Interest/Service' }
  ],
  'Clinic Info': [
    { name: 'CLINIC_NAME', desc: 'Clinic Brand Name' }, 
    { name: 'CLINIC_PHONE', desc: 'Front Desk Number' },
    { name: 'CLINIC_ADDRESS', desc: 'Full Address' },
    { name: 'CLINIC_LOGO', desc: 'Logo URL' }
  ],
  'Appointment': [
    { name: 'APPT_DATE', desc: 'Schedule Date' }, 
    { name: 'APPT_TIME', desc: 'Schedule Time' },
    { name: 'PROVIDER_NAME', desc: 'Dr/Specialist' }
  ]
};
const EVENT_VARIABLE_MAPPING: Record<string, string[]> = {
  'Appointment Booked': ['LEAD_NAME', 'APPT_DATE', 'APPT_TIME', 'PROVIDER_NAME', 'CLINIC_ADDRESS'],
  'Lead Follow-up': ['LEAD_NAME', 'LEAD_SERVICE', 'CLINIC_NAME', 'CLINIC_PHONE'],
  'Re-engagement': ['LEAD_NAME', 'CLINIC_NAME', 'CLINIC_PHONE'],
  'Urgent Alert': ['LEAD_NAME', 'CLINIC_NAME'],
  'Generic Welcome': ['LEAD_NAME', 'CLINIC_NAME', 'CLINIC_LOGO']
};
const TONES = [
    { label: 'Friendly', icon: '😄' }, 
    { label: 'Professional', icon: '💼' }, 
    { label: 'Urgent', icon: '⚡' }, 
    { label: 'Calm', icon: '🧘' }
];
const EVENT_TYPES = Object.keys(EVENT_VARIABLE_MAPPING);
const TEMPLATE_STATS = [
    { label: 'Total Templates', value: '24', icon: <ICONS.Document className="w-5 h-5" />, color: 'indigo' },
    { label: 'Active Automations', value: '18', icon: <ICONS.Sparkles className="w-5 h-5" />, color: 'emerald' },
    { label: 'Drafts', value: '6', icon: <ICONS.Edit className="w-5 h-5" />, color: 'amber' },
    { label: 'Avg. Conversion', value: '3.2x', icon: <ICONS.Chart className="w-5 h-5" />, color: 'sky' }
];
const RECENT_TEMPLATES = [
    { id: 1, name: 'New Patient Welcome', channel: 'Email', status: 'Active', date: '2h ago', event: 'Generic Welcome' },
    { id: 2, name: 'Appt Reminder (24h)', channel: 'SMS', status: 'Active', date: '1d ago', event: 'Appointment Booked' },
    { id: 3, name: 'Re-engagement Offer', channel: 'Email', status: 'Draft', date: '3d ago', event: 'Re-engagement' },
    { id: 4, name: 'Urgent Closure', channel: 'SMS', status: 'Draft', date: '1w ago', event: 'Urgent Alert' }
];
const TemplatePage: React.FC = () => {
  console.log('TemplatePage rendering...');
  const navigate = useNavigate();
  // --- View State ---
  const [view, setView] = useState<'listing' | 'editor'>('listing');
  console.log('Current view:', view);
  // --- Editor Core State ---
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    channel: 'Email' as 'Email' | 'SMS',
    template: 'Welcome Series',
    target: 'Lead' as 'Lead' | 'Customer',
    body: ''
  });
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  
  // Quality & AI State
  const [qualityMetrics, setQualityMetrics] = useState({
    subjectScore: 0,
    spamRisk: 'Low',
    ctaClarity: 'Medium',
    warnings: [] as string[]
  });
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiPanelData, setAiPanelData] = useState({
    channel: 'Email' as 'Email' | 'SMS',
    target: 'Lead' as 'Lead' | 'Customer',
    event: 'Appointment Booked',
    tone: 'Friendly',
    length: 'Medium' as 'Short' | 'Medium' | 'Long',
    prompt: '',
    results: [] as { subject: string; body: string }[],
    selectedIndex: 0,
    isGenerating: false
  });
  //Initialize Editor
  const initEditor = (template?: any) => {
      if (template) {
          setFormData({
              name: template.name,
              subject: template.channel === 'Email' ? `Info regarding ${template.event}` : '',
              channel: template.channel,
              template: 'Custom',
              target: 'Lead',
              body: `Hello \${LEAD_NAME}, this is a placeholder for ${template.name}.`
          });
      } else {
          setFormData({
            name: '',
            subject: 'Welcome to ${CLINIC_NAME}!',
            channel: 'Email',
            template: 'New',
            target: 'Lead',
            body: ''
          });
      }
      setView('editor');
  };
  // --- Watchers & Logic ---
  useEffect(() => {
    // Quality scoring simulation logic
    const score = Math.max(0, 100 - (formData.body.length / 100)); // Just a mock
    const warnings = [];
    if (formData.subject.length < 10 && formData.channel === 'Email') warnings.push('Subject line is too short.');
    if (formData.body.includes('$$$') || formData.body.includes('FREE')) warnings.push('Potential spam trigger detected.');
    
    setQualityMetrics({
        subjectScore: Math.min(95, Math.floor(score + (formData.subject.length * 1.5))),
        spamRisk: warnings.length > 0 ? 'Medium' : 'Low',
        ctaClarity: formData.body.includes('http') ? 'Strong' : 'Weak',
        warnings
    });
  }, [formData]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const generateWithAi = async () => {
    setAiPanelData(prev => ({ ...prev, isGenerating: true, results: [] }));
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock Generation
    const mockResults = [
        { 
            subject: `Welcome to \${CLINIC_NAME} - We're glad you're here!`, 
            body: `Hi \${LEAD_NAME},\n\nThank you for choosing \${CLINIC_NAME}. We are thrilled to help you with your \${LEAD_SERVICE} needs.\n\nTo get started, please book your initial consultation here: [Link]\n\nBest,\nThe Team at \${CLINIC_NAME}` 
        },
        { 
            subject: `Your Next Step with \${CLINIC_NAME}`, 
            body: `Hello \${LEAD_NAME},\n\nReady to transform your health? \${CLINIC_NAME} is here to support you.\n\nSchedule your \${LEAD_SERVICE} appointment now.\n\nUse code WELCOME20 for 20% off.\n\nCheers,\n\${CLINIC_NAME}` 
        }
    ];
    setAiPanelData(prev => ({ 
        ...prev, 
        isGenerating: false, 
        results: mockResults 
    }));
  };
  const applyAiResult = () => {
    const res = aiPanelData.results[aiPanelData.selectedIndex];
    if (!res) return;
    setFormData(prev => ({
      ...prev,
      subject: res.subject || '',
      body: res.body,
      channel: aiPanelData.channel,
      target: aiPanelData.target
    }));
    // If the AI result is for Email, ensure the form channel switches to Email so the user sees the context logically (though input is now always visible)
    if (aiPanelData.channel) {
        setFormData(prev => ({ ...prev, channel: aiPanelData.channel }));
    }
    // setIsAiPanelOpen(false); // Keep open for tweaks if needed
  };
  const runInlineAction = async (action: string) => {
    // Mock inline action
    if (action === 'Shorten') {
        setFormData(prev => ({ ...prev, body: prev.body.split('\n').slice(0, 2).join('\n') + '...' }));
    }
  };
  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('body-editor') as HTMLTextAreaElement;
    if (!textarea) {
        setFormData(prev => ({ ...prev, body: prev.body + ` \${${variable}}` }));
        return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.body;
    const newBody = text.substring(0, start) + `\${${variable}}` + text.substring(end);
    setFormData(prev => ({ ...prev, body: newBody }));
    setTimeout(() => { textarea.focus(); const newPos = start + variable.length + 3; textarea.setSelectionRange(newPos, newPos); }, 0);
  };
  const renderPreview = () => {
    let content = formData.body;
    // Simple mock replacement for preview
    Object.values(ALL_VARIABLES).flat().forEach(v => {
        content = content.replaceAll(`\${${v.name}}`, `<span class="text-indigo-600 font-bold bg-indigo-50 px-1 rounded">${v.name}</span>`);
    });
    content = content.replace(/\n/g, '<br/>');
    return (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm max-w-md mx-auto mt-8">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Preview: {formData.channel}</span>
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
            </div>
            <div className="p-6">
                {formData.channel === 'Email' && (
                    <div className="mb-4 pb-4 border-b border-slate-100">
                        <div className="text-xs text-slate-400 font-bold uppercase mb-1">Subject</div>
                        <div className="text-sm font-bold text-slate-800">{formData.subject}</div>
                    </div>
                )}
                <div className="text-sm text-slate-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: content }} />
            </div>
        </div>
    );
  };
  const renderListing = () => (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
              <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Template Library</h1>
                  <p className="text-slate-500 text-sm mt-1">Manage and automate your client communications.</p>
              </div>
              <button onClick={() => initEditor()} className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2">
                  <ICONS.Plus className="w-4 h-4" />
                  New Template
              </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {TEMPLATE_STATS.map((stat, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                      <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}>
                              {stat.icon}
                          </div>
                          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">{stat.label}</h3>
                      </div>
                      <div className="flex items-end gap-2">
                          <span className="text-2xl font-bold text-slate-800">{stat.value}</span>
                      </div>
                  </div>
              ))}
          </div>
          <div className="space-y-4">
               <h3 className="text-lg font-bold text-slate-800">Recent Templates</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {RECENT_TEMPLATES.map(t => (
                       <div key={t.id} onClick={() => initEditor(t)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-violet-500 hover:shadow-lg transition-all cursor-pointer group">
                           <div className="flex items-center justify-between mb-4">
                               <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${t.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{t.status}</span>
                               <span className="text-xs text-slate-400">{t.date}</span>
                           </div>
                           <h4 className="text-base font-bold text-slate-900 group-hover:text-violet-600 transition-colors mb-1">{t.name}</h4>
                           <div className="flex items-center gap-2 text-slate-500 text-xs mb-6">
                               {t.channel === 'Email' ? <ICONS.Mail className="w-3.5 h-3.5" /> : <ICONS.Moon className="w-3.5 h-3.5" />}
                               <span>{t.channel}</span>
                               <span>•</span>
                               <span>{t.event}</span>
                           </div>
                           <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                               <div className="flex -space-x-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"></div>
                                  <div className="w-6 h-6 rounded-full bg-slate-300 border-2 border-white"></div>
                               </div>
                               <span className="text-xs font-bold text-slate-900 group-hover:underline">Edit Canvas →</span>
                           </div>
                       </div>
                   ))}
               </div>
          </div>
      </div>
  );
  const renderEditor = () => (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
      {/* Editor Header */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-4">
            <button onClick={() => setView('listing')} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2 pr-4 border border-transparent hover:border-slate-200 group">
                <ICONS.ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                <span className="text-xs font-bold uppercase tracking-wide">Back</span>
            </button>
            <div className="h-6 w-px bg-slate-100"></div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Editing Template</span>
                <span className="text-sm font-bold text-slate-900">{formData.name || 'Untitled Template'}</span>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wider ml-2">Draft Mode</span>
        </div>
        <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsAiPanelOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold border bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent hover:shadow-lg hover:shadow-indigo-100 flex items-center gap-2 transition-all active:scale-95"
             >
                <ICONS.Sparkles className="w-3.5 h-3.5 text-indigo-100" />
                AI Assistant
             </button>
             <div className="h-6 w-px bg-slate-200 mx-1"></div>
             <button className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 shadow-sm transition-all active:scale-95">Save Changes</button>
        </div>
      </div>
      {/* --- Main Editor Area --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 pb-24">
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left: Configuration Card */}
                  <div className="lg:col-span-4 space-y-6">
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                          <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
                                  <ICONS.Edit className="w-4 h-4" />
                              </div>
                              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Configuration</h3>
                          </div>
                          
                          <div className="space-y-5">
                              <div>
                                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Template Name</label>
                                  <input name="name" value={formData.name} onChange={handleInputChange} className="block w-full rounded-xl border-transparent bg-slate-50 py-2.5 px-4 text-slate-900 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium placeholder:text-slate-400" placeholder="e.g. Welcome Series" />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Channel</label>
                                      <div className="relative">
                                          <select name="channel" value={formData.channel} onChange={handleInputChange} className="block w-full appearance-none rounded-xl border-transparent bg-slate-50 py-2.5 px-4 text-slate-900 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium cursor-pointer">
                                              <option>Email</option><option>SMS</option>
                                          </select>
                                          <div className="absolute right-3 top-3 text-slate-400 pointer-events-none"><ICONS.ChevronRight className="w-3 h-3 rotate-90" /></div>
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Target Audience</label>
                                      <div className="relative">
                                          <select name="target" value={formData.target} onChange={handleInputChange} className="block w-full appearance-none rounded-xl border-transparent bg-slate-50 py-2.5 px-4 text-slate-900 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium cursor-pointer">
                                              <option>Lead</option><option>Customer</option>
                                          </select>
                                          <div className="absolute right-3 top-3 text-slate-400 pointer-events-none"><ICONS.ChevronRight className="w-3 h-3 rotate-90" /></div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                           <div className="flex items-center gap-3 mb-5">
                              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                  <ICONS.Lightbulb className="w-4 h-4" />
                              </div>
                              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Dynamic Variables</h3>
                          </div>
                           <div className="flex flex-wrap gap-2">
                               {Object.values(ALL_VARIABLES).flat().map(v => (
                                   <button key={v.name} onClick={() => insertVariable(v.name)} className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all uppercase tracking-wide">{v.name}</button>
                               ))}
                           </div>
                      </div>
                  </div>
                  {/* Right: Editor Column */}
                  <div className="lg:col-span-8 flex flex-col gap-6 min-h-[800px]">
                      
                      {/* 1. Quality Card (Separate) */}
                      {activeTab === 'editor' && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 shrink-0 animate-in slide-in-from-top-2">
                              <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                      <ICONS.Chart className="w-4 h-4 text-violet-500" />
                                      Quality Analysis
                                  </h3>
                                  <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${qualityMetrics.subjectScore >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                      {qualityMetrics.subjectScore >= 80 ? 'Excellent' : 'Needs Improvement'}
                                  </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-3">
                                  {/* Blue Card: Score */}
                                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-between h-20">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Score</span>
                                      <div className="text-2xl font-black text-slate-900">{qualityMetrics.subjectScore}</div>
                                  </div>
                                  {/* Purple Card: Spam Risk */}
                                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-between h-20">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Spam Risk</span>
                                        <div className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-bold text-xs w-fit">{qualityMetrics.spamRisk}</div>
                                  </div>
                                  {/* Green Card: CTA */}
                                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-between h-20">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Engagement</span>
                                        <div className="text-xs font-bold text-emerald-600">Strong</div>
                                  </div>
                              </div>
                              {/* Smart Suggestions / Warnings */}
                              <div className="space-y-2 mt-4">
                                  {qualityMetrics.warnings.length > 0 && (
                                      <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
                                          <ICONS.Alert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                          <p className="text-[11px] text-amber-800 font-medium leading-tight">{qualityMetrics.warnings[0]}</p>
                                      </div> 
                                  )}
                                  {/* Brand Check */}
                                  {!formData.body.includes('${CLINIC_LOGO}') && !formData.body.includes('${BUSINESS_NAME}') && (
                                      <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start gap-2">
                                          <ICONS.Lightbulb className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-[11px] text-indigo-800 font-medium leading-tight">Missing branding elements</p>
                                                <button onClick={() => insertVariable('CLINIC_LOGO')} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline mt-1">Insert Logo</button>
                                            </div>
                                      </div>
                                  )}
                              </div>
                        </div>
                      )}

                      {/* 2. Main Editor Card */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden relative group">
                          
                          {/* Editor Header / Tabs */}
                          <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-white shrink-0 z-20 relative">
                              <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-100">
                                  <button onClick={() => setActiveTab('editor')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'editor' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>Write</button>
                                  <button onClick={() => setActiveTab('preview')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'preview' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>Preview</button>
                              </div>
                          </div>

                          {/* Smart Toolbar (Top of Editor) */}
                          {activeTab === 'editor' && (
                              <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 z-10">
                                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-linear-fade">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">AI Actions:</span>
                                      <button onClick={() => runInlineAction('Refine')} className="px-3 py-1.5 bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 rounded-lg text-[10px] font-bold text-slate-600 shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap">
                                          <span className="text-lg leading-none">☺</span> Friendly Tone
                                      </button>
                                      <button onClick={() => runInlineAction('Shorten')} className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-[10px] font-bold text-slate-600 shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap">
                                          <span className="text-lg leading-none">✂</span> Shorten
                                      </button>
                                      <button onClick={() => runInlineAction('Grammar')} className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-[10px] font-bold text-slate-600 shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap">
                                          <span className="text-lg leading-none">✎</span> Fix Grammar
                                      </button>
                                  </div>
                              </div>
                          )}

                          <div className="flex-1 relative overflow-hidden flex flex-col bg-white">
                              {activeTab === 'editor' ? (
                                  <div className="relative flex-1 flex flex-col">
                                      {/* Subject Line (Distinct & Separated) - Email Only */}
                                      {formData.channel === 'Email' && (
                                          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
                                              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Subject Line</label>
                                              <div className="bg-white border border-slate-300 rounded-xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all shadow-sm">
                                                  <input 
                                                      name="subject" 
                                                      value={formData.subject} 
                                                      onChange={handleInputChange} 
                                                      className="w-full px-4 py-2.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
                                                      placeholder="Type a catchy subject line..."
                                                  />
                                              </div>
                                          </div>
                                      )}
                                      
                                      <div className="px-6 py-2 bg-white border-b border-slate-100 flex items-center gap-1 z-10 shrink-0">
                                           <button className="p-1.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 text-xs font-bold w-8 text-center transition-colors">B</button>
                                           <button className="p-1.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 text-xs italic w-8 text-center transition-colors">I</button>
                                           <div className="h-4 w-px bg-slate-200 mx-1"></div>
                                           <span className="text-[10px] text-slate-400 px-2">Type <span className="font-mono bg-slate-200 rounded px-1">{`\${`}</span> to insert variables</span>
                                      </div>

                                      {/* Highlighted Editor Container */}
                                      <div className="relative flex-1 w-full overflow-hidden bg-white">
                                          {/* Backdrop Layer for Highlights */}
                                          <div 
                                              className="absolute inset-0 p-8 font-sans text-sm leading-7 pointer-events-none whitespace-pre-wrap break-words text-transparent z-0 overflow-y-auto no-scrollbar"
                                              aria-hidden="true"
                                          >
                                              {/* Logic to highlight variables */}
                                              {formData.body.split(/(\$\{[a-zA-Z_]+\})/).map((part, i) => 
                                                  part.match(/^\$\{[a-zA-Z_]+\}$/) ? 
                                                  <span key={i} className="bg-indigo-100 text-transparent rounded px-0.5 box-decoration-clone border border-indigo-200">{part}</span> : 
                                                  <span key={i}>{part}</span>
                                              )}
                                              {/* Add extra space at bottom to match textarea scrolling */}
                                              <br /><br />
                                          </div>

                                          {/* Foreground Input Layer */}
                                          <textarea 
                                              id="body-editor" 
                                              name="body" 
                                              value={formData.body} 
                                              onChange={handleInputChange} 
                                              className="absolute inset-0 w-full h-full p-8 outline-none text-sm text-slate-800 leading-7 resize-none font-sans bg-transparent z-10 placeholder:text-slate-300 no-scrollbar" 
                                              placeholder="Start typing your message content here..." 
                                              spellCheck={false}
                                              onScroll={(e) => {
                                                  const target = e.target as HTMLTextAreaElement;
                                                  const backdrop = target.previousElementSibling as HTMLDivElement;
                                                  if (backdrop) backdrop.scrollTop = target.scrollTop;
                                              }}
                                          />
                                      </div>
                                      
                                      <div className="absolute bottom-4 right-6 bg-slate-100/80 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 border border-slate-200 z-20 pointer-events-none">{formData.body.length} chars</div>
                                  </div>
                              ) : (
                                  <div className="h-full overflow-y-auto bg-slate-50 p-8 flex flex-col items-center">
                                     <div className="w-full max-w-2xl">
                                       {renderPreview()}
                                     </div>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    {/* --- GUIDED AI OVERLAY (Wide, Violet Theme, Inline Results) --- */}
      {isAiPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] transition-opacity" onClick={() => setIsAiPanelOpen(false)}></div>
            <div className="w-full max-w-xl bg-white shadow-2xl relative flex flex-col h-full animate-in slide-in-from-right duration-300 border-l border-slate-200">
                
                {/* Header */}
                <div className="bg-white border-b border-slate-100 p-5 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                             <ICONS.Sparkles className="w-5 h-5 text-violet-600" />
                             Generate Content
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">AI-powered template synthesis</p>
                    </div>
                    <button onClick={() => setIsAiPanelOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg transition-colors hover:bg-slate-50">
                        <ICONS.Plus className="w-6 h-6 rotate-45" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* Feature: Available Variables Cheat Sheet */}
                    <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Available Variables</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Object.values(ALL_VARIABLES).flat().map(v => (
                                <button 
                                    key={v.name}
                                    onClick={() => setAiPanelData(prev => ({ ...prev, prompt: prev.prompt + ` (Use ${v.name})` }))}
                                    className="px-2 py-1 bg-white border border-indigo-100 shadow-sm rounded-md text-[10px] font-mono text-indigo-600 font-bold hover:border-indigo-300 transition-colors"
                                >
                                    {v.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Field: Channel (Segmented Control) */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Channel</label>
                        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
                            {['Email', 'SMS'].map(c => (
                                <button 
                                    key={c}
                                    onClick={() => setAiPanelData(prev => ({ ...prev, channel: c as any }))}
                                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${aiPanelData.channel === c ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {c === 'Email' ? <span className="text-sm">✉️</span> : <span className="text-sm">💬</span>}
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Group: Target & Event */}
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Target Audience</label>
                                <div className="relative">
                                    <select 
                                        value={aiPanelData.target} 
                                        onChange={(e) => setAiPanelData(prev => ({ ...prev, target: e.target.value as any }))}
                                        className="w-full appearance-none rounded-xl border-slate-200 py-2.5 pl-3 pr-8 text-sm text-slate-700 focus:border-violet-600 focus:ring-violet-600 bg-white font-medium shadow-sm transition-colors cursor-pointer hover:border-slate-300"
                                    >
                                        <option>Lead</option>
                                        <option>Customer</option>
                                        <option>Patient (Active)</option>
                                    </select>
                                    <ICONS.ChevronLeft className="w-4 h-4 text-slate-400 absolute right-3 top-3 -rotate-90 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Event Type</label>
                                <div className="relative">
                                    <select 
                                        value={aiPanelData.event} 
                                        onChange={(e) => setAiPanelData(prev => ({ ...prev, event: e.target.value }))}
                                        className="w-full appearance-none rounded-xl border-slate-200 py-2.5 pl-3 pr-8 text-sm text-slate-700 focus:border-violet-600 focus:ring-violet-600 bg-white font-medium shadow-sm transition-colors cursor-pointer hover:border-slate-300"
                                    >
                                        {EVENT_TYPES.map(e => <option key={e}>{e}</option>)}
                                    </select>
                                    <ICONS.ChevronLeft className="w-4 h-4 text-slate-400 absolute right-3 top-3 -rotate-90 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Field: Tone (Grid of Chips) */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tone</label>
                        <div className="grid grid-cols-3 gap-2">
                            {TONES.map(t => (
                                <button 
                                    key={t.label} 
                                    onClick={() => setAiPanelData(prev => ({ ...prev, tone: t.label }))}
                                    className={`px-3 py-2 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-1 ${aiPanelData.tone === t.label ? 'bg-violet-50 border-violet-200 text-violet-700 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                                >
                                    <span className="text-sm">{t.icon}</span>
                                    <span className="text-[10px]">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Field: Length (Segmented) */}
                    <div>
                         <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Length</label>
                         <div className="flex bg-slate-100 p-1 rounded-xl">
                            {['Short', 'Medium', 'Long'].map(l => (
                                <button 
                                    key={l}
                                    onClick={() => setAiPanelData(prev => ({ ...prev, length: l as any }))}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${aiPanelData.length === l ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Field: Custom Prompt */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Instructions</label>
                        <textarea 
                            value={aiPanelData.prompt}
                            onChange={(e) => setAiPanelData(prev => ({ ...prev, prompt: e.target.value }))}
                            className="w-full rounded-xl border-slate-200 py-3 px-4 text-xs font-medium focus:border-violet-600 focus:ring-violet-600 bg-slate-50 focus:bg-white shadow-inner h-20 resize-none placeholder:text-slate-400 transition-all"
                            placeholder="Add specific details or constraints..."
                        />
                    </div>
                     <div className="pt-2">
                        <button 
                            onClick={generateWithAi}
                            disabled={aiPanelData.isGenerating}
                            className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-violet-200 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {aiPanelData.isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <ICONS.Sparkles className="w-4 h-4 text-indigo-100" />
                                    Generate
                                </>
                            )}
                        </button>
                    </div>
                    {/* Inline Results (No Overlay) */}
                    {aiPanelData.results.length > 0 && (
                        <div className="pt-6 border-t border-slate-100 animate-in slide-in-from-bottom-4 fade-in duration-500">
                             <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-900 text-sm">Generated Options ({aiPanelData.results.length})</h3>
                                <button onClick={() => setAiPanelData(prev => ({ ...prev, results: [] }))} className="text-xs text-slate-400 hover:text-slate-600">Clear</button>
                             </div>
                            
                            <div className="space-y-4">
                                {aiPanelData.results.map((res, i) => {
                                    // Extract variables used in the result
                                    const usedVars = res.body.match(/\$\{[a-zA-Z_]+\}/g) || [];
                                    const uniqueVars = Array.from(new Set(usedVars));
                                    return (
                                        <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-violet-300 hover:shadow-md transition-all group relative cursor-pointer" onClick={() => { setAiPanelData(prev => ({ ...prev, selectedIndex: i })); applyAiResult(); }}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase tracking-wide">Option {i+1}</span>
                                                <div className="text-xs font-bold text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                    Insert <ICONS.Plus className="w-3 h-3" />
                                                </div>
                                            </div>
                                            
                                            {/* Used Variables Chips */}
                                            {uniqueVars.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {uniqueVars.map(v => (
                                                        <span key={v} className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[9px] font-mono font-bold border border-indigo-100">{v}</span>
                                                    ))}
                                                </div>
                                            )}
                                            {res.subject && <div className="font-bold text-slate-800 text-xs mb-2">{res.subject}</div>}
                                            <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">{res.body}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
  return (
    <>
    {
        view === 'listing' ? renderListing() : renderEditor()
    }
    </>

   
  )
};
export default TemplatePage;