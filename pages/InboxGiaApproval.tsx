import React, { useState } from 'react';
import { Sparkles, ThumbsUp, X, Edit3, CheckCircle2, Mail, Search, Filter, Plus } from 'lucide-react';

const FullInboxWithGiaInteractive = () => {
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
      sender: 'ndn ndn',
      senderEmail: 'ndn.ndn@example.com',
      avatar: 'NN',
      subject: 'testing',
      messageBody: `Testing logo

Mehul Kothari

Senior Frontend Developer

Growth99.com`,
      status: 'Pending',
      assignee: 'Unassigned',
      time: '18 hours ago',
      timestamp: 'Feb 4, 2026, 9:44:41 AM',
      statusColor: 'orange',
      toEmail: 'contact@glowcarekaesthetics.dev.growth99-mail.com',
      giaResponse: `It looks like your inquiry is related to the Growth99 logo and branding. Our team can assist with any questions about Glow CareKAesthetics' services, treatments, or booking.

If you're looking to schedule an appointment or explore our aesthetic services, you can book online at https://widget-ui.growthemr.com/assets/widgets/new-form.html?bid=1964&fid=17614 or contact us directly at +13853866170 or contact@glowcarekaesthetics.dev.growth99-mail.com.

Please provide your details: First Name, Last Name, and Phone Number.

Best Regards,
GIA from Glow CareK_Aesthetics`
    },
    {
      id: 2,
      sender: 'khfje sfhi',
      senderEmail: 'khfje.sfhi@example.com',
      avatar: 'KS',
      subject: 'Appointment inquiry',
      messageBody: `Hello,

I would like to know more about your aesthetic services and pricing.

Thank you,
Khfje Sfhi`,
      status: 'Booked',
      hasGia: true,
      time: '20 hours ago',
      timestamp: 'Feb 4, 2026, 7:24:15 AM',
      statusColor: 'purple',
      toEmail: 'contact@glowcarekaesthetics.dev.growth99-mail.com',
      giaResponse: `Hello Khfje,

Thank you for your interest in Glow CareK Aesthetics! We offer a comprehensive range of aesthetic services including:

- Botox and dermal fillers
- Chemical peels and microdermabrasion
- Laser hair removal
- Body contouring treatments

Our pricing varies by treatment. I'd be happy to schedule a complimentary consultation where we can discuss your specific needs and provide detailed pricing information.

You can book online at https://widget-ui.growthemr.com/assets/widgets/new-form.html?bid=1964&fid=17614 or call us at +13853866170.

Best Regards,
GIA from Glow CareK_Aesthetics`
    },
    {
      id: 3,
      sender: 'knn knn',
      senderEmail: 'knn.knn@example.com',
      avatar: 'KK',
      subject: 'Reschedule appointment',
      messageBody: `Hi,

I need to reschedule my appointment from tomorrow to next week. Is that possible?

Thanks,
Knn`,
      status: 'Booked',
      hasGia: true,
      time: '21 hours ago',
      timestamp: 'Feb 4, 2026, 6:30:22 AM',
      statusColor: 'purple',
      toEmail: 'contact@glowcarekaesthetics.dev.growth99-mail.com',
      giaResponse: `Hello Knn,

Absolutely! We'd be happy to help you reschedule your appointment. To make the change, you can:

1. Visit our online booking portal: https://widget-ui.growthemr.com/assets/widgets/new-form.html?bid=1964&fid=17614
2. Call our office directly at +13853866170
3. Reply to this email with your preferred date and time

We have availability throughout next week. Please let us know what works best for you.

Best Regards,
GIA from Glow CareK_Aesthetics`
    },
    {
      id: 4,
      sender: 'ABC XYZ',
      senderEmail: 'abc.xyz@example.com',
      avatar: 'AX',
      subject: 'New Lead Welcome',
      messageBody: `I'm interested in learning more about your clinic and services.

ABC XYZ`,
      status: 'New',
      hasGia: true,
      time: '22 hours ago',
      timestamp: 'Feb 4, 2026, 5:15:00 AM',
      statusColor: 'blue',
      toEmail: 'contact@glowcarekaesthetics.dev.growth99-mail.com',
      giaResponse: `Welcome to Glow CareK Aesthetics!

Thank you for your interest in our clinic. We're a premier aesthetic medical practice specializing in non-surgical cosmetic treatments and wellness services.

Our clinic offers:
• Advanced aesthetic procedures
• Personalized treatment plans
• State-of-the-art technology
• Experienced medical professionals

We'd love to schedule a complimentary consultation to discuss your aesthetic goals and recommend the best treatments for you.

Book online: https://widget-ui.growthemr.com/assets/widgets/new-form.html?bid=1964&fid=17614
Call us: +13853866170

Best Regards,
GIA from Glow CareK_Aesthetics`
    },
    {
      id: 5,
      sender: 'Kundan Kumar',
      senderEmail: 'kundan.kumar@example.com',
      avatar: 'KK',
      subject: 'appointment timing',
      messageBody: `What are your operating hours? I work late and need evening appointments.

Kundan Kumar`,
      status: 'Pending',
      hasGia: true,
      time: '22 hours ago',
      timestamp: 'Feb 4, 2026, 5:00:30 AM',
      statusColor: 'orange',
      toEmail: 'contact@glowcarekaesthetics.dev.growth99-mail.com',
      giaResponse: `Hello Kundan,

Great question! We understand the need for flexible scheduling. Our clinic hours are:

Monday - Friday: 9:00 AM - 7:00 PM
Saturday: 10:00 AM - 4:00 PM
Sunday: Closed

We do offer evening appointments until 7:00 PM on weekdays to accommodate working professionals like yourself.

To schedule an evening appointment, please visit:
https://widget-ui.growthemr.com/assets/widgets/new-form.html?bid=1964&fid=17614

Or call us at +13853866170 and our team will find a time that works for you.

Best Regards,
GIA from Glow CareK_Aesthetics`
    }
  ];

  const selectedMessage = messages.find(m => m.id === selectedMessageId);
  const currentState = giaResponseStates[selectedMessageId];

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
      {/* Left Sidebar - Message List */}
      <div className="w-[480px] bg-white border-r border-gray-200 flex flex-col">
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
          <span className="text-sm text-gray-600">Displaying 10 out of 37 results</span>
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
                    <span className="font-medium text-gray-900">{message.sender}</span>
                    <span className="text-xs text-gray-500">{message.time}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
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
                    {message.subject}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Message Detail */}
      <div className="flex-1 flex flex-col bg-gray-50">
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
              <span className="text-sm text-gray-500">Feb 4, 2026</span>
            </div>

            {/* Received Message */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
              {/* Message Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{selectedMessage?.subject}</h2>
                  <span className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded-full flex items-center gap-1.5">
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
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{selectedMessage?.senderEmail}</span>
                      <span className="text-sm text-gray-500">&lt;{selectedMessage?.senderEmail}&gt;</span>
                    </div>
                    <div className="text-sm text-gray-500 mb-3">{selectedMessage?.timestamp}</div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-700">To:</span>
                      <span className="bg-gray-100 px-3 py-1 rounded-md text-gray-700">
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
                        <h3 className="font-semibold text-gray-900">GIA Draft Response</h3>
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
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Re: {selectedMessage?.subject}</h2>
                    <span className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-full flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="7" />
                      </svg>
                      Draft
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-base font-medium text-purple-700">G</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-gray-900">noreply@growth99.plus</span>
                        <span className="text-sm text-gray-500">&lt;noreply@growth99.plus&gt;</span>
                      </div>
                      <div className="text-sm text-gray-500 mb-3">Feb 4, 2026, 9:44:57 AM</div>
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

            {/* Success State (After Accept) */}
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

                {/* Sent Message Preview */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Re: {selectedMessage?.subject}</h2>
                    <span className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-full flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="7" />
                      </svg>
                      Opened
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-base font-medium text-purple-700">G</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-gray-900">noreply@growth99.plus</span>
                        <span className="text-sm text-gray-500">&lt;noreply@growth99.plus&gt;</span>
                      </div>
                      <div className="text-sm text-gray-500 mb-3">Feb 4, 2026, 9:44:57 AM</div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700">To:</span>
                        <span className="text-gray-700">{selectedMessage?.senderEmail}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                    {editedResponses[selectedMessageId]}
                  </div>
                </div>

                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-purple-600 font-medium">Gia</span>
                  </div>
                  <span className="text-xs text-gray-500">Feb 4, 2026, 9:44:57 AM</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullInboxWithGiaInteractive;