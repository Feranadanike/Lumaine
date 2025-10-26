import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Privacy Policy</h1>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
          Last Updated: October 26, 2025
        </p>

        <div className="space-y-8 text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">1. Introduction</h2>
            <p>
              Welcome to LumiBud. We respect your privacy and are committed to protecting your personal data.
              This privacy policy explains how we collect, use, process, and protect your information in compliance
              with the General Data Protection Regulation (GDPR).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">2. Information We Collect</h2>
            <p>We collect account information, personal content (journal entries, tasks, goals, etc.), and usage data to provide our services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">3. Your Rights</h2>
            <p>You have the right to access, rectify, erase, restrict processing, data portability, object to processing, and withdraw consent. Contact us at privacy@lumibud.app to exercise these rights.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
