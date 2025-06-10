import React from 'react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6 gradient-text">
              Privacy Policy
            </h1>
            <p className="text-xl text-white/70 leading-relaxed">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
            <p className="text-sm text-white/50 mt-4">
              Last updated: January 2025
            </p>
          </div>

          <div className="space-y-8">
            {/* Information We Collect */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">Information We Collect</h2>
              <div className="space-y-4 text-white/70">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Personal Information</h3>
                  <p>We may collect personal information you provide directly to us, such as:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>Name and email address when you contact us</li>
                    <li>Account information if you create an account</li>
                    <li>Preferences and settings you configure</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Usage Information</h3>
                  <p>We automatically collect information about how you use our service:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>Pages you visit and features you use</li>
                    <li>Search queries and comparison data</li>
                    <li>Device information and browser type</li>
                    <li>IP address and approximate location</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How We Use Information */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">How We Use Your Information</h2>
              <div className="text-white/70 space-y-4">
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide and improve our laptop comparison services</li>
                  <li>Personalize your experience and recommendations</li>
                  <li>Respond to your inquiries and provide customer support</li>
                  <li>Analyze usage patterns to enhance our platform</li>
                  <li>Send you updates about new features (with your consent)</li>
                  <li>Ensure the security and integrity of our service</li>
                </ul>
              </div>
            </div>

            {/* Information Sharing */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">Information Sharing</h2>
              <div className="text-white/70 space-y-4">
                <p>We do not sell, trade, or rent your personal information to third parties. We may share information in the following circumstances:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Service Providers:</strong> With trusted third-party services that help us operate our platform</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                  <li><strong>Consent:</strong> When you explicitly agree to share information</li>
                </ul>
              </div>
            </div>

            {/* Data Security */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">Data Security</h2>
              <div className="text-white/70 space-y-4">
                <p>We implement appropriate security measures to protect your information:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments and updates</li>
                  <li>Access controls and authentication systems</li>
                  <li>Monitoring for suspicious activities</li>
                </ul>
                <p className="mt-4">
                  However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security but strive to use commercially acceptable means to protect your data.
                </p>
              </div>
            </div>

            {/* Your Rights */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">Your Rights</h2>
              <div className="text-white/70 space-y-4">
                <p>You have the following rights regarding your personal information:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Access:</strong> Request access to your personal information</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                  <li><strong>Objection:</strong> Object to processing of your information</li>
                  <li><strong>Restriction:</strong> Request restriction of processing</li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, please contact us at privacy@laptopverse.com
                </p>
              </div>
            </div>

            {/* Cookies */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">Cookies and Tracking</h2>
              <div className="text-white/70 space-y-4">
                <p>We use cookies and similar technologies to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Remember your preferences and settings</li>
                  <li>Analyze how you use our service</li>
                  <li>Provide personalized recommendations</li>
                  <li>Ensure security and prevent fraud</li>
                </ul>
                <p className="mt-4">
                  You can control cookies through your browser settings. However, disabling cookies may affect some functionality of our service.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">Contact Us</h2>
              <div className="text-white/70 space-y-4">
                <p>If you have any questions about this Privacy Policy, please contact us:</p>
                <div className="space-y-2">
                  <p><strong>Email:</strong> privacy@laptopverse.com</p>
                  <p><strong>Address:</strong> 123 Tech Street, Silicon Valley, CA 94000</p>
                  <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                </div>
              </div>
            </div>

            {/* Updates */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">Policy Updates</h2>
              <div className="text-white/70">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically for any changes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
