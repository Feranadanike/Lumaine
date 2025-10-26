import React, { useState } from 'react';
import { Shield, Download, FileText, Cookie, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ConsentManager from './gdpr/ConsentManager';
import PrivacyPolicy from './gdpr/PrivacyPolicy';
import TermsOfService from './gdpr/TermsOfService';
import CookiePolicy from './gdpr/CookiePolicy';
import { exportUserData, downloadJSON } from '../lib/dataExport';

export default function Privacy() {
  const { user } = useAuth();
  const [showConsentManager, setShowConsentManager] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [showCookiePolicy, setShowCookiePolicy] = useState(false);
  const [exportingData, setExportingData] = useState(false);

  const exportDataAsJSON = async () => {
    if (!user) return;
    setExportingData(true);
    try {
      const data = await exportUserData(user.id);
      downloadJSON(data, `lumibud-export-${new Date().toISOString().split('T')[0]}.json`);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    } finally {
      setExportingData(false);
    }
  };

  if (showPrivacyPolicy) {
    return <PrivacyPolicy onBack={() => setShowPrivacyPolicy(false)} />;
  }

  if (showTermsOfService) {
    return <TermsOfService onBack={() => setShowTermsOfService(false)} />;
  }

  if (showCookiePolicy) {
    return <CookiePolicy onBack={() => setShowCookiePolicy(false)} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          Privacy & Data
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your privacy preferences and access your data. We are fully GDPR compliant.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <button
          onClick={() => setShowConsentManager(true)}
          className="group bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-2xl shadow-xl p-8 text-left transition-all transform hover:scale-105"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Settings className="h-9 w-9" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Privacy Preferences</h2>
          <p className="text-blue-100">
            Control how your data is used. Manage consent for AI features, analytics, and notifications.
          </p>
        </button>

        <button
          onClick={exportDataAsJSON}
          disabled={exportingData}
          className="group bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl shadow-xl p-8 text-left transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Download className="h-9 w-9" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {exportingData ? 'Exporting Data...' : 'Export My Data'}
          </h2>
          <p className="text-green-100">
            Download all your data in JSON format. Complete data portability as required by GDPR.
          </p>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Rights Under GDPR</h2>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">Right to Access</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              You can request copies of your personal data at any time using the export button above.
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">Right to Rectification</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              You can correct inaccurate or incomplete data directly in the app at any time.
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">Right to Erasure</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              You can permanently delete your account and all data from your Profile page.
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">Right to Restrict Processing</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Control how we process your data through privacy preferences above.
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">Right to Data Portability</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Export your data in machine-readable JSON format and transfer it to another service.
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">Right to Object</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Object to certain types of processing through your privacy preferences.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">Need Help?</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            For any questions about your privacy or to exercise your rights, contact us at:
          </p>
          <div className="space-y-2 text-sm">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Privacy inquiries:</strong> privacy@lumibud.app
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Data Protection Officer:</strong> dpo@lumibud.app
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Legal Documents</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Review our policies and terms to understand how we handle your data and provide our services.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowPrivacyPolicy(true)}
            className="group p-6 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 hover:from-slate-100 hover:to-gray-100 dark:hover:from-slate-700 dark:hover:to-gray-700 rounded-xl border-2 border-slate-200 dark:border-slate-700 transition-all hover:shadow-lg"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Privacy Policy</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                How we collect, use, and protect your data
              </p>
            </div>
          </button>

          <button
            onClick={() => setShowTermsOfService(true)}
            className="group p-6 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 hover:from-slate-100 hover:to-gray-100 dark:hover:from-slate-700 dark:hover:to-gray-700 rounded-xl border-2 border-slate-200 dark:border-slate-700 transition-all hover:shadow-lg"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="h-7 w-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Terms of Service</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Rules and agreements for using LumiBud
              </p>
            </div>
          </button>

          <button
            onClick={() => setShowCookiePolicy(true)}
            className="group p-6 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 hover:from-slate-100 hover:to-gray-100 dark:hover:from-slate-700 dark:hover:to-gray-700 rounded-xl border-2 border-slate-200 dark:border-slate-700 transition-all hover:shadow-lg"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Cookie className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Cookie Policy</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Information about cookies and tracking
              </p>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl shadow-xl p-8 border-2 border-green-200 dark:border-green-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">We Value Your Privacy</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              LumiBud is built with privacy at its core. We are fully GDPR compliant and give you complete
              control over your data. We never sell your data, and we use industry-standard encryption to
              keep your information safe.
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                <span>End-to-end encryption for all data in transit</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                <span>Encryption at rest for all stored data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                <span>Row Level Security ensuring complete data isolation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                <span>No third-party tracking or advertising cookies</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                <span>Regular security audits and monitoring</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {showConsentManager && (
        <ConsentManager
          userId={user!.id}
          onClose={() => setShowConsentManager(false)}
        />
      )}
    </div>
  );
}
