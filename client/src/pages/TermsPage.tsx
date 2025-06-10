import React from 'react';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6 gradient-text">
              Terms of Service
            </h1>
            <p className="text-xl text-white/70 leading-relaxed">
              Please read these terms carefully before using our laptop comparison platform.
            </p>
            <p className="text-sm text-white/50 mt-4">
              Last updated: January 2025
            </p>
          </div>

          <div className="space-y-8">
            {/* Acceptance */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">1. Acceptance of Terms</h2>
              <div className="text-white/70 space-y-4">
                <p>
                  By accessing and using LaptopVerse ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
                <p>
                  These Terms of Service ("Terms") govern your use of our website and services. By using our platform, you agree to comply with these Terms.
                </p>
              </div>
            </div>

            {/* Service Description */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">2. Service Description</h2>
              <div className="text-white/70 space-y-4">
                <p>LaptopVerse provides:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Laptop comparison tools and information</li>
                  <li>Product reviews and ratings</li>
                  <li>Pricing information and deals</li>
                  <li>Technical specifications database</li>
                  <li>User recommendations and insights</li>
                </ul>
                <p className="mt-4">
                  We strive to provide accurate and up-to-date information, but we cannot guarantee the accuracy of all product information or pricing.
                </p>
              </div>
            </div>

            {/* User Responsibilities */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">3. User Responsibilities</h2>
              <div className="text-white/70 space-y-4">
                <p>You agree to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Use the service in compliance with all applicable laws</li>
                  <li>Provide accurate information when creating an account</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Not use the service for any unlawful purposes</li>
                  <li>Not attempt to interfere with the service's operation</li>
                  <li>Respect intellectual property rights</li>
                </ul>
              </div>
            </div>

            {/* Prohibited Activities */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">4. Prohibited Activities</h2>
              <div className="text-white/70 space-y-4">
                <p>You may not:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Copy, modify, or distribute our content without permission</li>
                  <li>Use automated systems to access or scrape our data</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Upload malicious code or viruses</li>
                  <li>Impersonate others or provide false information</li>
                  <li>Spam or send unsolicited communications</li>
                  <li>Violate any applicable laws or regulations</li>
                </ul>
              </div>
            </div>

            {/* Intellectual Property */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">5. Intellectual Property</h2>
              <div className="text-white/70 space-y-4">
                <p>
                  The content, features, and functionality of LaptopVerse are owned by us and are protected by international copyright, trademark, and other intellectual property laws.
                </p>
                <p>
                  You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of our content without our prior written consent.
                </p>
                <p>
                  Product names, logos, and brands are property of their respective owners. All company, product and service names used in this website are for identification purposes only.
                </p>
              </div>
            </div>

            {/* Data Accuracy */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">6. Data Accuracy and Disclaimers</h2>
              <div className="text-white/70 space-y-4">
                <p>
                  While we strive to provide accurate and up-to-date information, we cannot guarantee the accuracy, completeness, or reliability of any information on our platform.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Product specifications may change without notice</li>
                  <li>Prices are subject to change and may vary by retailer</li>
                  <li>Availability information may not be real-time</li>
                  <li>Reviews and ratings reflect user opinions</li>
                </ul>
                <p className="mt-4">
                  Always verify information with manufacturers and retailers before making purchase decisions.
                </p>
              </div>
            </div>

            {/* Limitation of Liability */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">7. Limitation of Liability</h2>
              <div className="text-white/70 space-y-4">
                <p>
                  To the fullest extent permitted by law, LaptopVerse shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues.
                </p>
                <p>
                  Our total liability for any claims arising from your use of the service shall not exceed the amount paid by you, if any, for accessing the service.
                </p>
                <p>
                  We are not responsible for decisions made based on information provided on our platform.
                </p>
              </div>
            </div>

            {/* Service Availability */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">8. Service Availability</h2>
              <div className="text-white/70 space-y-4">
                <p>
                  We reserve the right to modify, suspend, or discontinue the service at any time without notice. We do not guarantee that the service will be available at all times.
                </p>
                <p>
                  We may perform maintenance that temporarily interrupts service availability.
                </p>
              </div>
            </div>

            {/* Privacy */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">9. Privacy</h2>
              <div className="text-white/70 space-y-4">
                <p>
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices.
                </p>
              </div>
            </div>

            {/* Termination */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">10. Termination</h2>
              <div className="text-white/70 space-y-4">
                <p>
                  We may terminate or suspend your access to the service immediately, without prior notice, for any reason whatsoever, including breach of these Terms.
                </p>
                <p>
                  You may also terminate your use of the service at any time.
                </p>
              </div>
            </div>

            {/* Changes to Terms */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">11. Changes to Terms</h2>
              <div className="text-white/70 space-y-4">
                <p>
                  We reserve the right to modify these Terms at any time. We will notify users of any changes by posting the new Terms on this page and updating the "Last updated" date.
                </p>
                <p>
                  Your continued use of the service after any changes constitutes acceptance of the new Terms.
                </p>
              </div>
            </div>

            {/* Governing Law */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">12. Governing Law</h2>
              <div className="text-white/70 space-y-4">
                <p>
                  These Terms shall be interpreted and governed by the laws of the State of California, without regard to its conflict of law provisions.
                </p>
                <p>
                  Any disputes arising from these Terms or your use of the service shall be resolved in the courts of California.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">13. Contact Information</h2>
              <div className="text-white/70 space-y-4">
                <p>If you have any questions about these Terms, please contact us:</p>
                <div className="space-y-2">
                  <p><strong>Email:</strong> legal@laptopverse.com</p>
                  <p><strong>Address:</strong> 123 Tech Street, Silicon Valley, CA 94000</p>
                  <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
