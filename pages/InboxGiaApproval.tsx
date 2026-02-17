import React, { useState } from 'react';
import { Sparkles, ThumbsUp, X, Edit3, CheckCircle2, Mail, Search, Filter, Plus, ArrowLeft } from 'lucide-react';

const InboxWithMiddlePanel = () => {
  const [selectedMessageId, setSelectedMessageId] = useState(1);
  const [giaResponseStates, setGiaResponseStates] = useState({
    1: { showPreview: true, isEditing: false },
    2: { showPreview: true, isEditing: false },
    3: { showPreview: true, isEditing: false },
    4: { showPreview: true, isEditing: false },
    5: { showPreview: true, isEditing: false }
  });

  const messages = [
    {
      id: 1,
      sender: 'Sarah Mitchell',
      senderEmail: 'sarah.mitchell@gmail.com',
      avatar: 'SM',
      subject: 'Inquiry about Botox treatments and pricing',
      messageBody: `Hello,

I'm interested in learning more about your Botox treatments. Could you provide information about:
- Pricing for forehead and crow's feet
- How long results typically last
- Your experience and qualifications

I'm looking to schedule an appointment within the next two weeks if possible.

Thank you,
Sarah Mitchell`,
      status: 'Pending',
      assignee: 'Unassigned',
      time: '2 hours ago',
      timestamp: 'Feb 17, 2026, 2:15 PM',
      statusColor: 'orange',
      toEmail: 'contact@glowcarekaesthetics.dev.growth99-mail.com',
      giaResponse: `Hello Sarah,

Thank you for your interest in Botox treatments at Glow CareK Aesthetics!

Here's the information you requested:

**Pricing:**
- Forehead lines: $250-$350 (depending on units needed)
- Crow's feet: $200-$300 per area
- Combination packages available at discounted rates

**Results Duration:**
Botox results typically last 3-4 months. Some patients experience longer-lasting results with regular treatments.

**Our Qualifications:**
All treatments are performed by board-certified practitioners with over 10 years of experience in aesthetic medicine.

We have availability within the next two weeks! You can book your consultation online at https://widget-ui.growthemr.com/assets/widgets/new-form.html?bid=1964&fid=17614 or call us at +1 (385) 386-6170.

Best regards,
GIA from Glow CareK Aesthetics`
    },
    {
      id: 2,
      sender: 'James Patterson',
      senderEmail: 'j.patterson@outlook.com',
      avatar: 'JP',
      subject: 'Question about clinic hours and weekend appointments',
      messageBody: `Hi there,

I work Monday through Friday and can only come in on weekends. Do you have Saturday or Sunday appointments available?

What are your operating hours?

Thanks,
James`,
      status: 'Booked',
      hasGia: true,
      time: '5 hours ago',
      timestamp: 'Feb 17, 2026, 11:30 AM',
      statusColor: 'purple',
      toEmail: 'contact@glowcarekaesthetics.dev.growth99-mail.com',
      giaResponse: `Hello James,

Great question! We understand the need for flexible scheduling for working professionals.

**Our Operating Hours:**
- Monday - Friday: 9:00 AM - 7:00 PM
- Saturday: 9:00 AM - 5:00 PM
- Sunday: 10:00 AM - 3:00 PM

Yes, we do offer weekend appointments! Saturdays are our most popular day, so I recommend booking in advance to secure your preferred time slot.

You can view available weekend times and book online here:
https://widget-ui.growthemr.com/assets/widgets/new-form.html?bid=1964&fid=17614

Or call us at +1 (385) 386-6170 and we'll find a weekend slot that works for you.

Best regards,
GIA from Glow CareK Aesthetics`
    },
    {
      id: 3,
      sender: 'Emily Chen',
      senderEmail: 'emily.chen@yahoo.com',
      avatar: 'EC',
      subject: 'Need to reschedule my appointment for next week',
      messageBody: `Hello,

I have an appointment scheduled for this Thursday at 2 PM, but something came up at work. Could I reschedule to next week, preferably Tuesday or Wednesday afternoon?

My appointment confirmation number is #GC-2847.

Thanks so much,
Emily Chen`,
      status: 'Booked',
      hasGia: true,
      time: '8 hours ago',
      timestamp: 'Feb 17, 2026, 8:45 AM',
      statusColor: 'purple',
      toEmail: 'contact@glowcarekaesthetics.dev.growth99-mail.com',
      giaResponse: `Hello Emily,

No problem at all! We're happy to help you reschedule.

I can see your appointment for Thursday, Feb 20 at 2:00 PM (Confirmation #GC-2847). We have the following availability next week:

**Tuesday, February 25:**
- 1:00 PM
- 3:30 PM
- 4:45 PM

**Wednesday, February 26:**
- 2:00 PM
- 3:00 PM
- 5:15 PM

To reschedule, you can:
1. Reply to this email with your preferred time
2. Call us at +1 (385) 386-6170
3. Reschedule online: https://widget-ui.growthemr.com/assets/widgets/new-form.html?bid=1964&fid=17614

Looking forward to seeing you next week!

Best regards,
GIA from Glow CareK Aesthetics`
    },
    {
      id: 4,
      sender: 'Michael Rodriguez',
      senderEmail: 'mrodriguez@proton.me',
      avatar: 'MR',
      subject: 'First-time patient - questions about consultation',
      messageBody: `Hi,

I'm new to aesthetic treatments and interested in scheduling a consultation. A few questions:

1. Is the initial consultation free?
2. How long does it typically take?
3. What should I expect during the consultation?
4. Do you offer financing options?

Looking forward to hearing from you.

Michael Rodriguez`,
      status: 'New',
      hasGia: true,
      time: '12 hours ago',
      timestamp: 'Feb 17, 2026, 4:20 AM',
      statusColor: 'blue',
      toEmail: 'contact@glowcarekaesthetics.dev.growth99-mail.com',
      giaResponse: `Hello Michael,

Welcome to Glow CareK Aesthetics! We're excited to help you on your aesthetic journey. Let me answer your questions:

**1. Consultation Fee:**
Yes! Your initial consultation is complimentary. We want you to feel comfortable and informed before making any decisions.

**2. Duration:**
Consultations typically take 30-45 minutes. This gives us time to understand your goals, examine your areas of concern, and create a personalized treatment plan.

**3. What to Expect:**
- Discuss your aesthetic goals and concerns
- Skin analysis and assessment
- Review of recommended treatments
- Detailed explanation of procedures, expected results, and costs
- Before/after photos of similar treatments
- No pressure to book - take your time to decide!

**4. Financing:**
Yes, we offer flexible financing options through CareCredit and Alphaeon Credit, with plans starting as low as 0% APR.

Ready to schedule? Book your free consultation here:
https://widget-ui.growthemr.com/assets/widgets/new-form.html?bid=1964&fid=17614

Or call us at +1 (385) 386-6170. We're here to answer any other questions you may have!

Best regards,
GIA from Glow CareK Aesthetics`
    },
    {
      id: 5,
      sender: 'Amanda Foster',
      senderEmail: 'amanda.foster@icloud.com',
      avatar: 'AF',
      subject: 'Chemical peel recommendations for acne scars',
      messageBody: `Hello,

I've been dealing with acne scars for several years and I'm interested in chemical peels. I've heard they can help improve skin texture and reduce scarring.

Could you recommend what type of peel would be best for acne scars? Also, how many sessions would I need?

I have fairly sensitive skin, so I want to make sure I choose the right treatment.

Thank you,
Amanda Foster`,
      status: 'Pending',
      hasGia: true,
      time: '1 day ago',
      timestamp: 'Feb 16, 2026, 3:50 PM',
      statusColor: 'orange',
      toEmail: 'contact@glowcarekaesthetics.dev.growth99-mail.com',
      giaResponse: `Hello Amanda,

Thank you for reaching out! Chemical peels can be very effective for treating acne scars and improving overall skin texture.

**Recommended Treatments for Acne Scars:**

For sensitive skin with acne scarring, I'd recommend starting with:
- **Medium-depth TCA Peels**: Excellent for reducing acne scars
- **Glycolic Acid Peels**: Gentler option for sensitive skin
- **Combination approach**: Sometimes combining peels with microneedling provides optimal results

**Number of Sessions:**
Typically, patients see significant improvement after 3-6 sessions spaced 4-6 weeks apart. However, this varies based on scar severity and skin type.

**Given Your Sensitive Skin:**
We'd start with a gentler peel and gradually increase strength as your skin adapts. Our practitioners will create a customized treatment plan during your consultation.

I'd love to schedule a complimentary skin assessment where we can:
- Examine your scarring in person
- Perform a skin sensitivity test
- Recommend the best treatment protocol for your specific needs
- Discuss expected results and timeline

Book your consultation:
https://widget-ui.growthemr.com/assets/widgets/new-form.html?bid=1964&fid=17614

Or call us: +1 (385) 386-6170

Best regards,
GIA from Glow CareK Aesthetics`
    }
  ];

  const selectedMessage = messages.find(m => m.id === selectedMessageId);
  const currentState = selectedMessageId ? giaResponseStates[selectedMessageId] : null;

  const [editedResponses, setEditedResponses] = useState(
    messages.reduce((acc, msg) => ({ ...acc, [msg.id]: msg.giaResponse }), {})
  );

  const handleAccept = (messageId) => {
    setGiaResponseStates(prev => ({
      ...prev,
      [messageId]: { ...prev[messageId], showPreview: false }
    }));
    alert('Message sent successfully!');
  };

  const handleReject = (messageId) => {
    setGiaResponseStates(prev => ({
      ...prev,
      [messageId]: { ...prev[messageId], showPreview: false }
    }));
  };

  const handleEdit = (messageId) => {
    setGiaResponseStates(prev => ({
      ...prev,
      [messageId]: { ...prev[messageId], isEditing: true }
    }));
  };

  const handleSaveEdit = (messageId) => {
    setGiaResponseStates(prev => ({
      ...prev,
      [messageId]: { ...prev[messageId], isEditing: false }
    }));
  };

  const handleCancelEdit = (messageId) => {
    setEditedResponses(prev => ({
      ...prev,
      [messageId]: messages.find(m => m.id === messageId).giaResponse
    }));
    setGiaResponseStates(prev => ({
      ...prev,
      [messageId]: { ...prev[messageId], isEditing: false }
    }));
  };

  const handleResponseChange = (messageId, value) => {
    setEditedResponses(prev => ({
      ...prev,
      [messageId]: value
    }));
  };

  const handleMessageSelect = (messageId) => {
    setSelectedMessageId(messageId);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Message List (ALWAYS VISIBLE) */}
      <div className="w-[480px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Growth99 Inbox</h1>
          
          {/* Search and Actions */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium">
              My Inbox
            </button>
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-full text-sm font-medium">
              All Open
            </button>
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-full text-sm font-medium">
              All Completed
            </button>
          </div>
        </div>

        {/* Message Count and Select All */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <span className="text-sm text-gray-600">Displaying 5 out of 37 results</span>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Select All
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              onClick={() => handleMessageSelect(message.id)}
              className={`p-4 border-b border-gray-200 cursor-pointer transition-colors ${
                message.id === selectedMessageId ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-gray-700">{message.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 truncate">{message.sender}</span>
                    <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">{message.time}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        message.statusColor === 'orange'
                          ? 'bg-orange-100 text-orange-700'
                          : message.statusColor === 'purple'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {message.status}
                    </span>
                    {message.hasGia && (
                      <span className="flex items-center gap-1 text-xs text-purple-600">
                        <Sparkles className="w-3 h-3" />
                        Gia
                      </span>
                    )}
                    {message.assignee && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                        {message.assignee}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate flex items-center gap-1">
                    <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="truncate">{message.subject}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Middle Panel - Message Detail (ALWAYS VISIBLE) */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {selectedMessage ? (
          <>
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-700">
                    {selectedMessage?.avatar.charAt(0)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{selectedMessage?.senderEmail}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Complete
                </button>
                <button className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Reply
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-4">
                {/* Email Type Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-900">EMAIL</span>
                </div>

                {/* Date Separator */}
                <div className="text-center py-3 mb-4">
                  <span className="text-sm text-gray-500">Feb 17, 2026</span>
                </div>

                {/* Received Message */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                  {/* Message Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 pr-2">{selectedMessage?.subject}</h2>
                      <span className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded-full flex items-center gap-1.5 whitespace-nowrap">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Received
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-base font-medium text-gray-700">{selectedMessage?.avatar}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-semibold text-gray-900 break-all">{selectedMessage?.senderEmail}</span>
                          <span className="text-sm text-gray-500 break-all">&lt;{selectedMessage?.senderEmail}&gt;</span>
                        </div>
                        <div className="text-sm text-gray-500 mb-3">{selectedMessage?.timestamp}</div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-700">To:</span>
                          <span className="bg-gray-100 px-3 py-1 rounded-md text-gray-700 break-all">
                            {selectedMessage?.toEmail}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message Body */}
                  <div className="p-6">
                    <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                      {selectedMessage?.messageBody}
                    </div>
                  </div>

                  {/* Message Footer */}
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                    {selectedMessage?.timestamp} · Sent by {selectedMessage?.senderEmail}
                  </div>
                </div>

                {/* GIA Response Preview */}
                {currentState?.showPreview && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {/* GIA Banner */}
                    <div className="bg-purple-50 border-b border-purple-200 p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">GIA Response</h3>
                            <span className="px-2 py-0.5 text-xs bg-purple-600 text-white rounded-full">
                              AI Generated
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">Review this response before sending</p>
                        </div>
                        {!currentState?.isEditing && (
                          <button
                            onClick={() => handleEdit(selectedMessageId)}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-purple-700 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Draft Message Header */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Re: {selectedMessage?.subject}</h2>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-base font-medium text-purple-700">G</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-gray-900">noreply@growth99.plus</span>
                            <span className="text-sm text-gray-500">&lt;noreply@growth99.plus&gt;</span>
                          </div>
                          <div className="text-sm text-gray-500 mb-3">Feb 17, 2026, 2:30 PM</div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-gray-700">To:</span>
                            <span className="text-gray-700">{selectedMessage?.senderEmail}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Draft Message Body */}
                    <div className="p-6">
                      {currentState?.isEditing ? (
                        <div>
                          <textarea
                            value={editedResponses[selectedMessageId]}
                            onChange={(e) => handleResponseChange(selectedMessageId, e.target.value)}
                            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[300px] text-gray-800 leading-relaxed"
                            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                          />
                          <div className="flex justify-end gap-2 mt-4">
                            <button
                              onClick={() => handleCancelEdit(selectedMessageId)}
                              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(selectedMessageId)}
                              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                          {editedResponses[selectedMessageId]}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {!currentState?.isEditing && (
                      <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Sparkles className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 mb-1">Ready to send?</p>
                              <p className="text-sm text-gray-600">
                                Accept this response or make edits before sending to the customer
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleReject(selectedMessageId)}
                              className="flex items-center gap-2 px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                            <button
                              onClick={() => handleAccept(selectedMessageId)}
                              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Accept & Send
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Success State */}
                {!currentState?.showPreview && (
                  <div className="bg-white rounded-lg shadow-sm border border-green-200">
                    <div className="p-6 bg-green-50 border-b border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-green-900">Message Sent Successfully</h3>
                          <p className="text-sm text-green-700">Your response has been delivered to the customer</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Select a message to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxWithMiddlePanel;