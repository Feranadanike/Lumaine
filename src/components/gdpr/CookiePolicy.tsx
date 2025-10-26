import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface CookiePolicyProps {
  onBack: () => void;
}

export default function CookiePolicy({ onBack }: CookiePolicyProps) {
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
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Cookie Policy</h1>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
          Last Updated: October 26, 2025
        </p>

        <div className="space-y-8 text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">1. What Are Cookies</h2>
            <p>
              Cookies are small text files stored on your device. LumiBud uses only essential cookies for authentication and functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">2. Types of Cookies</h2>
            <p>We use essential cookies for authentication and functional cookies for user preferences. We do not use tracking or advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">3. Managing Cookies</h2>
            <p>You can manage cookies through your browser settings. Note that blocking essential cookies will prevent you from using LumiBud.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
