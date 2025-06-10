import React from 'react';

const CookiesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6 gradient-text">
              Cookie Policy
            </h1>
            <p className="text-xl text-white/70 leading-relaxed">
              Learn about how we use cookies and similar technologies to enhance your experience on LaptopVerse.
            </p>
            <p className="text-sm text-white/50 mt-4">
              Last updated: January 2025
            </p>
          </div>

          <div className="space-y-8">
            {/* What are Cookies */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">What are Cookies?</h2>
              <div className="text-white/70 space-y-4">
                <p>
                  Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
                </p>
                <p>
                  Cookies allow us to recognize you, remember your preferences, and provide you with a personalized experience on LaptopVerse.
                </p>
              </div>
            </div>

            {/* Types of Cookies */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">Types of Cookies We Use</h2>
              <div className="space-y-6">
                {/* Essential Cookies */}
                <div className="p-6 bg-white/5 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                    Essential Cookies
                  </h3>
                  <div className="text-white/70 space-y-2">
                    <p>These cookies are necessary for the website to function properly. They cannot be switched off.</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>User authentication and security</li>
                      <li>Shopping cart functionality</li>
                      <li>Form submission and error handling</li>
                      <li>Load balancing and performance</li>
                    </ul>
                  </div>
                </div>

                {/* Functional Cookies */}
                <div className="p-6 bg-white/5 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                    Functional Cookies
                  </h3>
                  <div className="text-white/70 space-y-2">
                    <p>These cookies enhance functionality and personalization but are not essential.</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Language and region preferences</li>
                      <li>Theme and display settings</li>
                      <li>Recently viewed products</li>
                      <li>Saved comparisons and favorites</li>
                    </ul>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="p-6 bg-white/5 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
                    Analytics Cookies
                  </h3>
                  <div className="text-white/70 space-y-2">
                    <p>These cookies help us understand how visitors interact with our website.</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Page views and user journey tracking</li>
                      <li>Feature usage and interaction data</li>
                      <li>Performance metrics and error tracking</li>
                      <li>Popular content and search terms</li>
                    </ul>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="p-6 bg-white/5 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
                    Marketing Cookies
                  </h3>
                  <div className="text-white/70 space-y-2">
                    <p>These cookies are used to deliver relevant advertisements and measure their effectiveness.</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Targeted advertisement delivery</li>
                      <li>Ad performance measurement</li>
                      <li>Cross-site tracking prevention</li>
                      <li>Social media integration</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Third-Party Cookies */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">Third-Party Cookies</h2>
              <div className="text-white/70 space-y-4">
                <p>We may use third-party services that set their own cookies. These include:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h4 className="font-semibold text-white mb-2">Google Analytics</h4>
                    <p className="text-sm">Helps us understand user behavior and improve our service.</p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h4 className="font-semibold text-white mb-2">Social Media</h4>
                    <p className="text-sm">Enables social sharing and embedded content.</p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h4 className="font-semibold text-white mb-2">CDN Services</h4>
                    <p className="text-sm">Improves website performance and loading speed.</p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h4 className="font-semibold text-white mb-2">External APIs</h4>
                    <p className="text-sm">Provides real-time pricing and product data.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cookie Management */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">Managing Your Cookie Preferences</h2>
              <div className="text-white/70 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Browser Settings</h3>
                  <p className="mb-3">You can control cookies through your browser settings:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-xl">
                      <h4 className="font-semibold text-white mb-2">Chrome</h4>
                      <p className="text-sm">Settings → Privacy and Security → Cookies</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl">
                      <h4 className="font-semibold text-white mb-2">Firefox</h4>
                      <p className="text-sm">Preferences → Privacy & Security → Cookies</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl">
                      <h4 className="font-semibold text-white mb-2">Safari</h4>
                      <p className="text-sm">Preferences → Privacy → Manage Website Data</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl">
                      <h4 className="font-semibold text-white mb-2">Edge</h4>
                      <p className="text-sm">Settings → Site Permissions → Cookies</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Cookie Consent</h3>
                  <p>
                    When you first visit our website, you'll see a cookie consent banner. You can choose which types of cookies to accept or reject. You can change your preferences at any time by clicking the cookie settings link in our footer.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Opt-Out Tools</h3>
                  <p>You can opt out of certain tracking cookies using these tools:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Google Analytics Opt-out Browser Add-on</li>
                    <li>Your Online Choices (for EU users)</li>
                    <li>Digital Advertising Alliance (for US users)</li>
                    <li>Network Advertising Initiative</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Impact of Disabling Cookies */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">Impact of Disabling Cookies</h2>
              <div className="text-white/70 space-y-4">
                <p>
                  While you can browse our website with cookies disabled, some functionality may be limited:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">🚫 Without Cookies</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>No saved preferences</li>
                      <li>No recently viewed items</li>
                      <li>Limited personalization</li>
                      <li>Repeated login requirements</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">✅ With Cookies</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Personalized experience</li>
                      <li>Saved comparisons</li>
                      <li>Improved recommendations</li>
                      <li>Seamless navigation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Updates */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">Updates to This Policy</h2>
              <div className="text-white/70 space-y-4">
                <p>
                  We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.
                </p>
                <p>
                  We will notify you of any changes by posting the new Cookie Policy on this page and updating the "Last updated" date.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="glass p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 gradient-text">Contact Us</h2>
              <div className="text-white/70 space-y-4">
                <p>If you have any questions about our use of cookies, please contact us:</p>
                <div className="space-y-2">
                  <p><strong>Email:</strong> privacy@laptopverse.com</p>
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

export default CookiesPage;
