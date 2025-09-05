import React from 'react';
import { DomainCard } from '@/components/admin-dashboard/DomainCard';
import { DomainCardImproved } from '@/components/admin-dashboard/DomainCardImproved';
import { DomainStats } from '@/types/dashboard';

// Sample domain data for demonstration
const sampleDomains: DomainStats[] = [
  {
    id: '1',
    name: 'IELTS',
    description: 'International English Language Testing System preparation materials and practice tests for academic and general training.',
    status: 'active',
    concepts: 45,
    learningGoals: 12,
    exercises: 234,
    lastUpdated: '2024-01-15'
  },
  {
    id: '2',
    name: 'GMAT',
    description: 'Graduate Management Admission Test resources including quantitative reasoning, verbal reasoning, and analytical writing.',
    status: 'draft',
    concepts: 38,
    learningGoals: 8,
    exercises: 156,
    lastUpdated: '2024-01-14'
  },
  {
    id: '3',
    name: 'Jazz Music',
    description: 'Comprehensive jazz theory, history, and performance techniques from beginner to advanced levels.',
    status: 'archived',
    concepts: 52,
    learningGoals: 15,
    exercises: 198,
    lastUpdated: '2024-01-10'
  }
];

const DomainCardComparison: React.FC = () => {
  const handleManage = (domainId: string) => {
    console.log('Managing domain:', domainId);
  };

  const handleViewAnalytics = (domainId: string) => {
    console.log('Viewing analytics for:', domainId);
  };

  return (
    <div className="min-h-screen bg-[#F1F2F4] p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-[#110D59]">
            Domain Card Design Comparison
          </h1>
          <p className="text-lg text-[#7E7BB3] max-w-3xl mx-auto">
            Side-by-side comparison of the current implementation versus the improved design 
            following the Gemeos Design System Style Guide
          </p>
        </div>

        {/* Style Guide Reference */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-[#110D59] mb-4">
            Style Guide Key Specifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-[#28246F] mb-2">Color System</h3>
              <ul className="space-y-1 text-sm text-[#7E7BB3]">
                <li>• Deep Purple: #110D59</li>
                <li>• Medium Purple: #28246F</li>
                <li>• Primary Blue: #0B5FAE</li>
                <li>• Secondary Blue: #0E77D9</li>
                <li>• Accent Blue: #A3D1FC</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-[#28246F] mb-2">Button System</h3>
              <ul className="space-y-1 text-sm text-[#7E7BB3]">
                <li>• Height: 51px</li>
                <li>• Border Radius: 8px</li>
                <li>• Hover: 5% opacity overlay</li>
                <li>• Click: 15% opacity overlay</li>
                <li>• Font Weight: Medium</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-[#28246F] mb-2">Layout</h3>
              <ul className="space-y-1 text-sm text-[#7E7BB3]">
                <li>• Base Unit: 16px</li>
                <li>• Card Radius: 8px</li>
                <li>• Elevation: 3 levels</li>
                <li>• Typography: 14px base</li>
                <li>• Grid System: Consistent</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Comparison Section */}
        <div className="space-y-8">
          {/* Current Implementation */}
          <div>
            <h2 className="text-2xl font-semibold text-[#110D59] mb-6 flex items-center gap-3">
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">Before</span>
              Current Implementation
            </h2>
            <div className="text-sm text-[#7E7BB3] mb-4">
              Issues: Generic colors, inconsistent spacing, improper button styling, weak brand identity
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleDomains.map((domain) => (
                <div key={`current-${domain.id}`} className="opacity-80">
                  {/* This would show the old design - for demo purposes using a simplified version */}
                  <div className="bg-white rounded-md shadow p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{domain.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{domain.description}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {domain.status}
                      </span>
                    </div>
                    <div className="flex gap-4 text-center">
                      <div>
                        <div className="text-xl font-bold">{domain.concepts}</div>
                        <div className="text-xs text-gray-500">Concepts</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold">{domain.learningGoals}</div>
                        <div className="text-xs text-gray-500">Goals</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold">{domain.exercises}</div>
                        <div className="text-xs text-gray-500">Exercises</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Last updated: {new Date(domain.lastUpdated).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-sm">
                        Manage
                      </button>
                      <button className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-sm">
                        Analytics
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Improved Implementation */}
          <div>
            <h2 className="text-2xl font-semibold text-[#110D59] mb-6 flex items-center gap-3">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">After</span>
              Improved Design (Style Guide Compliant)
            </h2>
            <div className="text-sm text-[#7E7BB3] mb-4">
              Improvements: Brand colors, proper button system, consistent spacing, enhanced visual hierarchy
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleDomains.map((domain) => (
                <DomainCard
                  key={`improved-${domain.id}`}
                  domain={domain}
                  onManage={handleManage}
                  onViewAnalytics={handleViewAnalytics}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Implementation Notes */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-[#110D59] mb-4">
            Implementation Benefits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-[#28246F] mb-3">Visual Improvements</h3>
              <ul className="space-y-2 text-sm text-[#7E7BB3]">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Status indicator line for quick visual scanning</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Branded color scheme reinforces identity</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Icons with colored backgrounds improve hierarchy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Proper button styling with clear CTAs</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-[#28246F] mb-3">Technical Improvements</h3>
              <ul className="space-y-2 text-sm text-[#7E7BB3]">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Consistent 16px spacing grid system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>WCAG AA compliant color contrast</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Proper focus states for accessibility</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Responsive design with mobile optimization</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DomainCardComparison;