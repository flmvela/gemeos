import { HeroSection } from './components/HeroSection';
import { DemoPreview } from './components/DemoPreview';
import { HowItWorks } from './components/HowItWorks';
import { FutureOfLearning } from './components/FutureOfLearning';
import { PlatformPillars } from './components/PlatformPillars';
import { ClosingCTA } from './components/ClosingCTA';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030213] via-[#1e1b4b] to-[#030213]">
      <HeroSection />
      <DemoPreview />
      <HowItWorks />
      <FutureOfLearning />
      <PlatformPillars />
      <ClosingCTA />
    </div>
  );
}