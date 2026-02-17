import React, { useState } from 'react';
import { Sparkles, ThumbsUp, X, Edit3, Send, CheckCircle2, Mail } from 'lucide-react';

const InboxGiaApproval = () => {
  const [showGiaPreview, setShowGiaPreview] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [giaResponse, setGiaResponse] = useState(
    `It looks like your inquiry is related to the Growth99 logo and branding. Our team can assist with any questions about Glow CareKAesthetics' services, treatments, or booking.

If you're looking to schedule an appointment or explore our aesthetic services, you can book online at https://widget-ui.growthemr.com/assets/widgets/new-form.html?bid=1964&fid=17614 or contact us directly at +13853866170 or contact@glowcarekaesthetics.dev.growth99-mail.com.

Please provide your details: First Name, Last Name, and Phone Number.

Best Regards,
GIA from Glow CareK_Aesthetics`
  );

  const handleAccept = () => {
    setShowGiaPreview(false);
    alert('Message sent successfully!');
  };

  const handleReject = () => {
    setShowGiaPreview(false);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-gray-600" />
          <span className="font-semibold text-gray-900">EMAIL</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Reply
          </button>
        </div>
      </div>

      {/* Date Separator */}
      <div className="text-center py-3">
        <span className="text-sm text-gray-500">Feb 4, 2026</span>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 pb-6">
        {/* Received Message */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          {/* Message Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">testing</h2>
              <span className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded-full flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Received
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-11 h-11 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-base font-medium text-gray-700">M</span>
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-gray-900">mehul.kothari@growth99.com</span>
                  <span className="text-sm text-gray-500">&lt;mehul.kothari@growth99.com&gt;</span>
                </div>
                <div className="text-sm text-gray-500 mb-3">Feb 4, 2026, 9:44:41 AM</div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">To:</span>
                  <span className="bg-gray-100 px-3 py-1 rounded-md text-gray-700">
                    contact@glowcarekaesthetics.dev.growth99-mail.com
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Message Body */}
          <div className="p-6">
            <div className="text-gray-800 leading-relaxed">
              <p>Testing logo</p>
              <p className="mt-4">Mehul Kothari</p>
              <p className="mt-2">Senior Frontend Developer</p>
              <p className="mt-2">Growth99.com</p>
            </div>
          </div>

          {/* Message Footer */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            Feb 4, 2026, 9:44:41 AM · Sent by mehul.kothari@growth99.com
          </div>
        </div>

        {/* GIA Response Preview */}
        {showGiaPreview && (
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
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
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
                <h2 className="text-xl font-semibold text-gray-900">Re: testing</h2>
                <span className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-full flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="7" />
                  </svg>
                  Draft
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-11 h-11 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-base font-medium text-purple-700">N</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-gray-900">mehul.kothari@growth99.com</span>
                    <span className="text-sm text-gray-500">&lt;noreply@growth99.plus&gt;</span>
                  </div>
                  <div className="text-sm text-gray-500 mb-3">Feb 4, 2026, 9:44:57 AM</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">To:</span>
                    <span className="text-gray-700">mehul.kothari@growth99.com</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Draft Message Body */}
            <div className="p-6">
              {isEditing ? (
                <div>
                  <textarea
                    value={giaResponse}
                    onChange={(e) => setGiaResponse(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[300px] text-gray-800 leading-relaxed"
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                  {giaResponse}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!isEditing && (
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
                      onClick={handleReject}
                      className="flex items-center gap-2 px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={handleAccept}
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
        {!showGiaPreview && (
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
                <h2 className="text-xl font-semibold text-gray-900">Re: testing</h2>
                <span className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-full flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="7" />
                  </svg>
                  Opened
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-11 h-11 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-base font-medium text-purple-700">N</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-gray-900">mehul.kothari@growth99.com</span>
                    <span className="text-sm text-gray-500">&lt;noreply@growth99.plus&gt;</span>
                  </div>
                  <div className="text-sm text-gray-500 mb-3">Feb 4, 2026, 9:44:57 AM</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">To:</span>
                    <span className="text-gray-700">mehul.kothari@growth99.com</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                {giaResponse}
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
  );
};

export default InboxGiaApproval;