/**
 * Welcome Page Component - Gemeos Educational Platform
 * Modern Figma design implementation with animations and improved styling
 * Features "The Future of Learning is Personal" hero with motion animations
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

// Import new components from Figma design
import { HeroSection } from "@/components/welcome/HeroSection";
import { DemoPreview } from "@/components/welcome/DemoPreview";
import { HowItWorks } from "@/components/welcome/HowItWorks";
import { FutureOfLearning } from "@/components/welcome/FutureOfLearning";
import { PlatformPillars } from "@/components/welcome/PlatformPillars";
import { ClosingCTA } from "@/components/welcome/ClosingCTA";

const Welcome = () => {
  const [showRegistration, setShowRegistration] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
            <DialogTitle className="text-2xl text-center text-gray-900">
              Welcome Back
            </DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-4" onSubmit={handleLoginSubmit}>
            <div className="space-y-2">
              <Label htmlFor="loginEmail">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <Input
                  id="loginEmail"
                  name="loginEmail"
                  type="email"
                  placeholder="john@example.com"
                  className="pl-10 h-11 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loginPassword">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <Input
                  id="loginPassword"
                  name="loginPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 h-11 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 hover:opacity-70"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-[51px] font-semibold text-base rounded-lg transition-all duration-200 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] text-white"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>

            <div className="text-center space-y-2">
              <a 
                href="#" 
                className="text-sm hover:underline text-blue-600"
              >
                Forgot password?
              </a>
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setShowLogin(false);
                    setShowRegistration(true);
                  }}
                  className="font-medium hover:underline text-blue-600"
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
            <DialogTitle className="text-2xl text-center text-gray-900">
              Create Your Free Account
            </DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  required
                  className="h-11 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  required
                  className="h-11 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  className="pl-10 h-11 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  className="pl-10 pr-10 h-11 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 hover:opacity-70"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className="pl-10 pr-10 h-11 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 hover:opacity-70"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="terms" name="terms" required />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I accept the{" "}
                <a 
                  href="#" 
                  className="hover:underline text-blue-600"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a 
                  href="#" 
                  className="hover:underline text-blue-600"
                >
                  Privacy Policy
                </a>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-[51px] font-semibold text-base rounded-lg transition-all duration-200 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] text-white"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Free Account"}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setShowRegistration(false);
                  setShowLogin(true);
                }}
                className="font-medium hover:underline text-blue-600"
              >
                Login here
              </button>
            </p>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen">
      <HeroSection 
        onLogin={() => setShowLogin(true)}
        onRegistration={() => setShowRegistration(true)}
      />
      <FutureOfLearning />
      <PlatformPillars />
      <HowItWorks />
      <DemoPreview 
        onRegistration={() => setShowRegistration(true)}
      />
      <ClosingCTA 
        onRegistration={() => setShowRegistration(true)}
        onLogin={() => setShowLogin(true)}
      />
      
      <RegistrationModal />
      <LoginModal />
    </div>
  );
};

export default Welcome;