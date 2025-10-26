import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

export default function TermsOfService({ onBack }: TermsOfServiceProps) {
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
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Terms of Service</h1>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
          Last Updated: October 26, 2025
        </p>

        <div className="space-y-8 text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">1. Agreement to Terms</h2>
            <p>
              By accessing or using LumiBud, you agree to be bound by these Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">2. User Accounts</h2>
            <p>You must be at least 16 years old to use LumiBud. You are responsible for maintaining account security.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">3. Contact</h2>
            <p>For questions, contact us at legal@lumibud.app</p>
          </section>
        </div>
      </div>
    </div>
  );
}
