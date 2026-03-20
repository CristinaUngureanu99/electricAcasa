import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: [DATE]</p>

        <div className="space-y-6 text-gray-600 leading-relaxed">
          <p className="text-lg font-medium text-gray-900">
            [YOUR COMPANY NAME] terms of service template.
          </p>
          <p>
            Replace this content with your actual terms of service. Cover topics such as:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Platform usage rules and eligibility</li>
            <li>Account responsibilities</li>
            <li>Payment terms and refund policy</li>
            <li>Intellectual property</li>
            <li>Limitation of liability</li>
            <li>Terms modification procedures</li>
            <li>Governing law and jurisdiction</li>
            <li>Contact information</li>
          </ul>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link href="/register" className="text-gray-900 font-semibold hover:underline">
            &larr; Back to registration
          </Link>
        </div>
      </div>
    </div>
  );
}
