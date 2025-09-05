/**
 * Welcome Page Component - Gemeos Educational Platform
 * Exact replica of reference content with Gemeos design system styling
 * Features "The Future of Learning is Personal" hero and platform pillars
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Brain,
  Users,
  Globe,
  CheckCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  Award,
  BarChart3,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Star,
  ChevronRight,
  Shield,
  Zap,
  Target,
  Play,
  Upload,
  Cpu,
  Settings,
  TrendingUp,
  Gamepad2,
  Lightbulb,
  Music,
  Volume2
} from "lucide-react";

// Design System Colors
const colors = {
  primaryDeepPurple: "#110D59",
  secondaryBlue: "#0E77D9",
  primaryBlue: "#0B5FAE",
  darkGray: "#030213",
  mediumGray: "#717182",
  lightGray: "#F7F8FA",
  white: "#FFFFFF",
  success: "#10B981",
  warning: "#F59E0B"
};

const Welcome = () => {
  const [showRegistration, setShowRegistration] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Header Component - Fixed navigation with branding
  const Header = () => (
    <header 
      role="banner"
      className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 z-50 shadow-sm"
    >
      <nav role="navigation" className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div 
              data-testid="brand-color-logo"
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ 
                background: `linear-gradient(135deg, ${colors.primaryDeepPurple} 0%, ${colors.secondaryBlue} 100%)` 
              }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold" style={{ color: colors.darkGray }}>
              Gemeos
            </span>
          </div>

          {/* Login Button */}
          <Button
            onClick={() => setShowLogin(true)}
            className="h-[51px] px-8 rounded-lg font-semibold text-base transition-all duration-200 hover:shadow-lg"
            style={{
              backgroundColor: "transparent",
              color: colors.primaryDeepPurple,
              border: `2px solid ${colors.primaryDeepPurple}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.primaryDeepPurple;
              e.currentTarget.style.color = colors.white;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = colors.primaryDeepPurple;
            }}
          >
            Login
          </Button>
        </div>
      </nav>
    </header>
  );

  // Hero Section - "The Future of Learning is Personal"
  const HeroSection = () => (
    <section 
      data-testid="hero-section"
      className="relative min-h-[800px] flex items-center justify-center overflow-hidden pt-16"
      style={{
        background: `linear-gradient(135deg, ${colors.primaryDeepPurple} 0%, ${colors.secondaryBlue} 100%)`
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight">
            The Future of Learning
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-100">
              is Personal
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-4xl mx-auto" data-testid="body-text">
            Transform your content into personalized, adaptive learning experiences with AI that understands each student's unique journey.
          </p>

          {/* CTA Section */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button
              onClick={() => setShowRegistration(true)}
              className="h-[60px] px-12 text-xl font-semibold rounded-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
              style={{
                backgroundColor: colors.white,
                color: colors.primaryDeepPurple,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.lightGray;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.white;
              }}
            >
              Book an Appointment
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
            <Button
              className="h-[60px] px-12 text-xl font-semibold rounded-xl border-2 transition-all duration-300"
              style={{
                backgroundColor: "transparent",
                color: colors.white,
                borderColor: colors.white,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.white;
                e.currentTarget.style.color = colors.primaryDeepPurple;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = colors.white;
              }}
            >
              <Play className="mr-3 h-6 w-6" />
              Watch Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );

  // How It Works Section - 3 steps exactly as in reference
  const HowItWorksSection = () => (
    <section data-testid="section-how-it-works" className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: colors.darkGray }}>
            How It Works
          </h2>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: colors.mediumGray }} data-testid="body-text">
            Transform your content into personalized learning experiences in three simple steps
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connection Lines for Desktop */}
            <div className="hidden md:block absolute top-24 left-1/3 right-1/3 h-0.5" style={{ backgroundColor: colors.mediumGray + '40' }} />
            
            {/* Step 1: Upload Content */}
            <div data-testid="process-step" className="relative text-center space-y-6">
              <div 
                className="w-32 h-32 mx-auto rounded-2xl flex items-center justify-center text-white shadow-2xl relative z-10"
                style={{
                  background: `linear-gradient(135deg, ${colors.primaryDeepPurple} 0%, ${colors.secondaryBlue} 100%)`
                }}
              >
                <Upload className="w-16 h-16" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold" style={{ color: colors.darkGray }}>
                  Upload Content
                </h3>
                <p className="text-lg leading-relaxed" style={{ color: colors.mediumGray }} data-testid="body-text">
                  Simply upload your existing educational materials, videos, documents, or create new content directly in our platform.
                </p>
              </div>
            </div>

            {/* Step 2: AI Generates Curriculum */}
            <div data-testid="process-step" className="relative text-center space-y-6">
              <div 
                className="w-32 h-32 mx-auto rounded-2xl flex items-center justify-center text-white shadow-2xl relative z-10"
                style={{
                  background: `linear-gradient(135deg, ${colors.secondaryBlue} 0%, ${colors.primaryBlue} 100%)`
                }}
              >
                <Cpu className="w-16 h-16" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold" style={{ color: colors.darkGray }}>
                  AI Generates Curriculum
                </h3>
                <p className="text-lg leading-relaxed" style={{ color: colors.mediumGray }} data-testid="body-text">
                  Our AI analyzes your content and automatically creates personalized learning paths, assessments, and interactive elements.
                </p>
              </div>
            </div>

            {/* Step 3: Manage and Personalize */}
            <div data-testid="process-step" className="relative text-center space-y-6">
              <div 
                className="w-32 h-32 mx-auto rounded-2xl flex items-center justify-center text-white shadow-2xl relative z-10"
                style={{
                  background: `linear-gradient(135deg, ${colors.primaryBlue} 0%, ${colors.primaryDeepPurple} 100%)`
                }}
              >
                <Settings className="w-16 h-16" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold" style={{ color: colors.darkGray }}>
                  Manage and Personalize
                </h3>
                <p className="text-lg leading-relaxed" style={{ color: colors.mediumGray }} data-testid="body-text">
                  Review, customize, and deploy your personalized learning experience. Monitor student progress and let AI adapt in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // Student Experience Section - Interactive music theory lesson example
  const StudentExperienceSection = () => (
    <section data-testid="section-student-experience" className="py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold leading-tight" style={{ color: colors.darkGray }}>
                  Experience Learning
                  <br />
                  <span style={{ color: colors.secondaryBlue }}>Through Play</span>
                </h2>
                <p className="text-xl leading-relaxed" style={{ color: colors.mediumGray }} data-testid="body-text">
                  See how our AI transforms complex concepts into engaging, interactive experiences that adapt to each student's learning style and pace.
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.success }}
                  />
                  <span className="text-lg" style={{ color: colors.darkGray }}>
                    Real-time feedback and adaptation
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.success }}
                  />
                  <span className="text-lg" style={{ color: colors.darkGray }}>
                    Interactive exercises and challenges
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.success }}
                  />
                  <span className="text-lg" style={{ color: colors.darkGray }}>
                    Progress tracking and achievements
                  </span>
                </div>
              </div>
            </div>

            {/* Right Interactive Demo */}
            <div className="relative">
              <Card className="bg-white shadow-2xl border-0 overflow-hidden">
                <CardContent className="p-0">
                  {/* Demo Header */}
                  <div className="p-6 border-b" style={{ backgroundColor: colors.lightGray }}>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: colors.secondaryBlue }}
                      >
                        <Music className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{ color: colors.darkGray }}>
                          Music Theory: Chord Progressions
                        </h3>
                        <p className="text-sm" style={{ color: colors.mediumGray }}>
                          Interactive lesson
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Demo Content */}
                  <div className="p-8 space-y-6">
                    <div className="text-center space-y-4">
                      <h4 className="text-xl font-semibold" style={{ color: colors.darkGray }}>
                        Listen and Identify the Chord
                      </h4>
                      <p className="text-sm" style={{ color: colors.mediumGray }}>
                        Click play to hear the chord, then select the correct answer
                      </p>
                    </div>

                    {/* Play Button */}
                    <div className="flex justify-center">
                      <button 
                        className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        style={{ backgroundColor: colors.secondaryBlue }}
                      >
                        <Volume2 className="w-10 h-10 text-white ml-1" />
                      </button>
                    </div>

                    {/* Answer Options */}
                    <div className="grid grid-cols-2 gap-4">
                      {['C Major', 'A Minor', 'F Major', 'G Major'].map((chord, index) => (
                        <button
                          key={chord}
                          className={`p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-md ${
                            index === 1 ? 'border-green-500 bg-green-50' : 'border-gray-200'
                          }`}
                          style={{ 
                            borderColor: index === 1 ? colors.success : colors.mediumGray + '40',
                            backgroundColor: index === 1 ? colors.success + '10' : 'white'
                          }}
                        >
                          <span 
                            className="font-medium"
                            style={{ 
                              color: index === 1 ? colors.success : colors.darkGray 
                            }}
                          >
                            {chord}
                          </span>
                          {index === 1 && (
                            <CheckCircle className="w-5 h-5 ml-2 inline" style={{ color: colors.success }} />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm" style={{ color: colors.mediumGray }}>
                        <span>Progress</span>
                        <span>7/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            backgroundColor: colors.secondaryBlue,
                            width: '70%'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // Platform Pillars Section - Four key strengths from reference
  const PlatformPillarsSection = () => (
    <section data-testid="section-platform-pillars" className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: colors.darkGray }}>
            Platform Pillars
          </h2>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: colors.mediumGray }} data-testid="body-text">
            Four foundational elements that make personalized learning possible at scale
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Pillar 1: Adaptive Learning Paths */}
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 h-full bg-white group">
              <CardContent className="p-8 text-center space-y-6 h-full flex flex-col">
                <div 
                  className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primaryDeepPurple} 0%, ${colors.secondaryBlue} 100%)`
                  }}
                >
                  <Target className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <h3 className="text-xl font-bold" style={{ color: colors.darkGray }}>
                    Adaptive Learning Paths
                  </h3>
                  <p className="leading-relaxed" style={{ color: colors.mediumGray }} data-testid="body-text">
                    Dynamic curriculum that adjusts to each student's pace, learning style, and progress in real-time.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Pillar 2: Intelligent Content Creation */}
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 h-full bg-white group">
              <CardContent className="p-8 text-center space-y-6 h-full flex flex-col">
                <div 
                  className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${colors.secondaryBlue} 0%, ${colors.primaryBlue} 100%)`
                  }}
                >
                  <Lightbulb className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <h3 className="text-xl font-bold" style={{ color: colors.darkGray }}>
                    Intelligent Content Creation
                  </h3>
                  <p className="leading-relaxed" style={{ color: colors.mediumGray }} data-testid="body-text">
                    AI-powered tools that transform your materials into engaging, interactive learning experiences.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Pillar 3: Engaging Gamification */}
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 h-full bg-white group">
              <CardContent className="p-8 text-center space-y-6 h-full flex flex-col">
                <div 
                  className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primaryBlue} 0%, ${colors.primaryDeepPurple} 100%)`
                  }}
                >
                  <Gamepad2 className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <h3 className="text-xl font-bold" style={{ color: colors.darkGray }}>
                    Engaging Gamification
                  </h3>
                  <p className="leading-relaxed" style={{ color: colors.mediumGray }} data-testid="body-text">
                    Achievement systems, progress tracking, and interactive challenges that keep students motivated.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Pillar 4: Advanced Analytics */}
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 h-full bg-white group">
              <CardContent className="p-8 text-center space-y-6 h-full flex flex-col">
                <div 
                  className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primaryDeepPurple} 0%, ${colors.secondaryBlue} 100%)`
                  }}
                >
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <h3 className="text-xl font-bold" style={{ color: colors.darkGray }}>
                    Advanced Analytics
                  </h3>
                  <p className="leading-relaxed" style={{ color: colors.mediumGray }} data-testid="body-text">
                    Deep insights into learning patterns, progress metrics, and performance optimization.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );

  // Final CTA Section - "Ready to Build the Future of Learning?"
  const CTASection = () => (
    <section 
      data-testid="section-cta" 
      className="py-24 text-white relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${colors.primaryDeepPurple} 0%, ${colors.secondaryBlue} 100%)`
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
              Ready to Build the
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-100">
                Future of Learning?
              </span>
            </h2>
            <p className="text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto text-white/90" data-testid="body-text">
              Transform your educational content into personalized, AI-powered learning experiences that adapt to every student.
            </p>
          </div>
          
          <div 
            data-testid="cta-container"
            className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8"
          >
            <Button
              onClick={() => setShowRegistration(true)}
              className="h-[60px] px-12 text-xl font-semibold rounded-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
              style={{
                backgroundColor: colors.white,
                color: colors.primaryDeepPurple,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.lightGray;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.white;
              }}
            >
              Book an Appointment
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
            <Button
              className="h-[60px] px-12 text-xl font-semibold rounded-xl border-2 transition-all duration-300"
              style={{
                backgroundColor: "transparent",
                color: colors.white,
                borderColor: colors.white,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.white;
                e.currentTarget.style.color = colors.primaryDeepPurple;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = colors.white;
              }}
            >
              <Play className="mr-3 h-6 w-6" />
              Watch Demo
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 pt-12 text-white/80">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6" />
              <span className="text-lg font-medium">Enterprise Security</span>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6" />
              <span className="text-lg font-medium">Global Scale</span>
            </div>
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6" />
              <span className="text-lg font-medium">AI-Certified</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // Footer Component - Professional footer with links
  const Footer = () => (
    <footer 
      role="contentinfo"
      className="py-12 text-white bg-footer-dark"
      style={{ backgroundColor: colors.darkGray }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${colors.white} 0%, ${colors.lightGray} 100%)` 
                }}
              >
                <Sparkles className="w-5 h-5" style={{ color: colors.primaryDeepPurple }} />
              </div>
              <span className="text-xl font-bold">Gemeos</span>
            </div>
            <p className="text-white/70 text-sm">
              Empowering music educators with AI-powered teaching solutions.
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <div className="space-y-2">
              <a href="#" className="block text-white/70 hover:text-white text-sm transition-colors">
                Features
              </a>
              <a href="#" className="block text-white/70 hover:text-white text-sm transition-colors">
                Pricing
              </a>
              <a href="#" className="block text-white/70 hover:text-white text-sm transition-colors">
                Resources
              </a>
            </div>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <div className="space-y-2">
              <a href="#" className="block text-white/70 hover:text-white text-sm transition-colors">
                Documentation
              </a>
              <a href="#" className="block text-white/70 hover:text-white text-sm transition-colors">
                Contact Us
              </a>
              <a href="#" className="block text-white/70 hover:text-white text-sm transition-colors">
                FAQ
              </a>
            </div>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <div className="space-y-2">
              <a href="#" className="block text-white/70 hover:text-white text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="block text-white/70 hover:text-white text-sm transition-colors">
                Terms of Service
              </a>
              <a href="#" className="block text-white/70 hover:text-white text-sm transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/50 text-sm">
          © 2024 Gemeos. All rights reserved.
        </div>
      </div>
    </footer>
  );

  // Registration Modal Component
  const RegistrationModal = () => {
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);

      const formData = new FormData(e.currentTarget);
      const firstName = formData.get("firstName") as string;
      const lastName = formData.get("lastName") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const confirmPassword = formData.get("confirmPassword") as string;
      const termsAccepted = formData.get("terms") === "on";

      // Validation
      if (!firstName || !lastName || !email || !password || !confirmPassword) {
        toast({
          title: "Error",
          description: "Please fill in all fields.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      if (password.length < 8) {
        toast({
          title: "Error",
          description: "Password must be at least 8 characters long.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      if (!termsAccepted) {
        toast({
          title: "Error",
          description: "Please accept the Terms of Service and Privacy Policy.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: firstName,
              last_name: lastName,
              user_type: 'teacher'
            }
          }
        });

        if (error) {
          toast({
            title: "Registration Failed",
            description: error.message,
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: "Registration successful!",
          description: "Welcome to Gemeos!"
        });

        setShowRegistration(false);
        navigate("/admin/dashboard");
      } catch (error) {
        toast({
          title: "Registration Failed",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <Dialog open={showRegistration} onOpenChange={setShowRegistration}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center" style={{ color: colors.darkGray }}>
              Create Your Free Account
            </DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-4" onSubmit={handleSubmit} role="alert">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  required
                  className="h-11 focus:ring-2 focus:ring-offset-2"
                  style={{ borderColor: colors.primaryBlue }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  required
                  className="h-11 focus:ring-2 focus:ring-offset-2"
                  style={{ borderColor: colors.primaryBlue }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4" style={{ color: colors.mediumGray }} />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  className="pl-10 h-11 focus:ring-2 focus:ring-offset-2"
                  style={{ borderColor: colors.primaryBlue }}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4" style={{ color: colors.mediumGray }} />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  className="pl-10 pr-10 h-11 focus:ring-2 focus:ring-offset-2"
                  style={{ borderColor: colors.primaryBlue }}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 hover:opacity-70"
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" style={{ color: colors.mediumGray }} />
                  ) : (
                    <Eye className="h-4 w-4" style={{ color: colors.mediumGray }} />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4" style={{ color: colors.mediumGray }} />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className="pl-10 pr-10 h-11 focus:ring-2 focus:ring-offset-2"
                  style={{ borderColor: colors.primaryBlue }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 hover:opacity-70"
                  data-testid="toggle-password-visibility"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" style={{ color: colors.mediumGray }} />
                  ) : (
                    <Eye className="h-4 w-4" style={{ color: colors.mediumGray }} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="terms" name="terms" required />
              <label htmlFor="terms" className="text-sm" style={{ color: colors.mediumGray }}>
                I accept the{" "}
                <a 
                  href="#" 
                  className="hover:underline text-link" 
                  style={{ color: colors.primaryBlue }}
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a 
                  href="#" 
                  className="hover:underline text-link" 
                  style={{ color: colors.primaryBlue }}
                >
                  Privacy Policy
                </a>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-[51px] font-semibold text-base rounded-lg transition-all duration-200"
              style={{
                backgroundColor: colors.primaryBlue,
                color: colors.white,
              }}
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Free Account"}
            </Button>

            <p className="text-center text-sm" style={{ color: colors.mediumGray }}>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setShowRegistration(false);
                  setShowLogin(true);
                }}
                className="font-medium hover:underline"
                style={{ color: colors.primaryBlue }}
              >
                Login here
              </button>
            </p>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Login Modal Component
  const LoginModal = () => {
    const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);

      const formData = new FormData(e.currentTarget);
      const email = formData.get("loginEmail") as string;
      const password = formData.get("loginPassword") as string;

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: "Login successful!",
          description: "Welcome back to Gemeos!"
        });

        setShowLogin(false);
        navigate("/admin/dashboard");
      } catch (error) {
        toast({
          title: "Login Failed",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center" style={{ color: colors.darkGray }}>
              Welcome Back
            </DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-4" onSubmit={handleLoginSubmit}>
            <div className="space-y-2">
              <Label htmlFor="loginEmail">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4" style={{ color: colors.mediumGray }} />
                <Input
                  id="loginEmail"
                  name="loginEmail"
                  type="email"
                  placeholder="john@example.com"
                  className="pl-10 h-11 focus:ring-2 focus:ring-offset-2"
                  style={{ borderColor: colors.primaryBlue }}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loginPassword">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4" style={{ color: colors.mediumGray }} />
                <Input
                  id="loginPassword"
                  name="loginPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 h-11 focus:ring-2 focus:ring-offset-2"
                  style={{ borderColor: colors.primaryBlue }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 hover:opacity-70"
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" style={{ color: colors.mediumGray }} />
                  ) : (
                    <Eye className="h-4 w-4" style={{ color: colors.mediumGray }} />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-[51px] font-semibold text-base rounded-lg transition-all duration-200"
              style={{
                backgroundColor: colors.primaryBlue,
                color: colors.white,
              }}
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>

            <div className="text-center space-y-2">
              <a 
                href="#" 
                className="text-sm hover:underline"
                style={{ color: colors.primaryBlue }}
              >
                Forgot password?
              </a>
              <p className="text-sm" style={{ color: colors.mediumGray }}>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setShowLogin(false);
                    setShowRegistration(true);
                  }}
                  className="font-medium hover:underline"
                  style={{ color: colors.primaryBlue }}
                >
                  Sign up here
                </button>
              </p>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main role="main">
        <HeroSection />
        <HowItWorksSection />
        <StudentExperienceSection />
        <PlatformPillarsSection />
        <CTASection />
      </main>
      <Footer />
      
      <RegistrationModal />
      <LoginModal />
    </div>
  );
};

export default Welcome;