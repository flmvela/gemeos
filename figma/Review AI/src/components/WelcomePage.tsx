import React from 'react';
import { HeroSectionSelfContained } from './HeroSectionSelfContained';
import { HowItWorksSelfContained } from './HowItWorksSelfContained';
import { PlatformPillarsSelfContained } from './PlatformPillarsSelfContained';
import { StudentExperienceSelfContained } from './StudentExperienceSelfContained';
import { FutureOfLearningSelfContained } from './FutureOfLearningSelfContained';
import { DemoPreviewSelfContained } from './DemoPreviewSelfContained';
import { ClosingCTASelfContained } from './ClosingCTASelfContained';

interface WelcomePageProps {
  onNavigateToDashboard: () => void;
}

export function WelcomePage({ onNavigateToDashboard }: WelcomePageProps) {
  return (
    <div className="min-h-screen">
      <HeroSectionSelfContained />
      <HowItWorksSelfContained />
      <PlatformPillarsSelfContained />
      <StudentExperienceSelfContained />
      <FutureOfLearningSelfContained />
      <DemoPreviewSelfContained />
      <ClosingCTASelfContained />
      
      {/* Navigation to Dashboard */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={onNavigateToDashboard}
          className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm"
        >
          Access Dashboard
        </button>
      </div>
    </div>
  );
}