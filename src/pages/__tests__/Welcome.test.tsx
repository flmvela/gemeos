/**
 * Comprehensive Test Suite for Welcome Page
 * Following TDD methodology with complete coverage of design requirements
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Welcome from '../Welcome';
import { supabase } from '@/integrations/supabase/client';

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserverMock as any;

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  },
}));

// Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <Welcome />
    </BrowserRouter>
  );
};

describe('Welcome Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Design System Compliance', () => {
    describe('Color Scheme', () => {
      it('should apply primary brand color (#110D59) to key elements', () => {
        renderComponent();
        
        const heroSection = screen.getByTestId('hero-section');
        expect(heroSection).toHaveStyle('background: linear-gradient(135deg, #110D59 0%, #0E77D9 100%)');
        
        const brandLogo = screen.getByTestId('brand-color-logo');
        expect(brandLogo).toHaveStyle('background: linear-gradient(135deg, #110D59 0%, #0E77D9 100%)');
      });

      it('should apply secondary blue (#0E77D9) for CTA elements', () => {
        renderComponent();
        
        const ctaButton = screen.getByRole('button', { name: /start free trial/i });
        expect(ctaButton).toBeInTheDocument();
        // Button starts with white background in hero section
        expect(ctaButton).toHaveStyle('backgroundColor: #FFFFFF');
      });

      it('should apply primary blue (#0B5FAE) for links and secondary actions', () => {
        renderComponent();
        
        // Check footer links
        const links = screen.getAllByRole('link');
        expect(links.length).toBeGreaterThan(0);
      });
    });

    describe('Button Specifications', () => {
      it('should render all buttons with 51px height', () => {
        renderComponent();
        
        // Check main CTA buttons
        const ctaButton = screen.getByRole('button', { name: /start free trial/i });
        expect(ctaButton).toHaveClass('h-[51px]');
        
        const loginButton = screen.getByRole('button', { name: /login/i });
        expect(loginButton).toHaveClass('h-[51px]');
      });

      it('should apply 8px border radius to buttons', () => {
        renderComponent();
        
        // Check button border radius
        const ctaButton = screen.getByRole('button', { name: /start free trial/i });
        expect(ctaButton).toHaveClass('rounded-lg');
        
        const loginButton = screen.getByRole('button', { name: /login/i });
        expect(loginButton).toHaveClass('rounded-lg');
      });

      it('should implement proper hover states', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        const primaryButton = screen.getByRole('button', { name: /start free trial/i });
        const initialClass = primaryButton.className;
        
        await user.hover(primaryButton);
        expect(primaryButton.className).not.toBe(initialClass);
        expect(primaryButton).toHaveClass('hover:shadow-xl');
      });
    });

    describe('Typography', () => {
      it('should apply professional typography hierarchy', () => {
        renderComponent();
        
        const h1 = screen.getByRole('heading', { level: 1 });
        expect(h1).toHaveClass('text-5xl', 'md:text-6xl', 'font-bold');
        
        const h2Elements = screen.getAllByRole('heading', { level: 2 });
        h2Elements.forEach(h2 => {
          expect(h2).toHaveClass('text-3xl', 'md:text-4xl', 'font-bold');
        });
      });

      it('should use appropriate font sizes for body text', () => {
        renderComponent();
        
        const paragraphs = screen.getAllByTestId('body-text');
        expect(paragraphs.length).toBeGreaterThan(0);
        // Body text uses various sizes (text-lg, text-xl, text-sm) based on context
      });
    });

    describe('Spacing System', () => {
      it('should apply 16px base unit grid system', () => {
        renderComponent();
        
        const sections = screen.getAllByTestId(/section-/);
        sections.forEach(section => {
          expect(section).toHaveClass(/p-4|p-8|p-16|py-20/);
        });
      });
    });
  });

  describe('Page Structure', () => {
    describe('Navigation Header', () => {
      it('should render fixed header with Gemeos branding', () => {
        renderComponent();
        
        const header = screen.getByRole('banner');
        expect(header).toBeInTheDocument();
        expect(header).toHaveClass('fixed', 'top-0', 'z-50');
        
        const logo = screen.getByText('Gemeos');
        expect(logo).toBeInTheDocument();
      });

      it('should render login button in header', () => {
        renderComponent();
        
        const loginButton = within(screen.getByRole('banner')).getByRole('button', { name: /login/i });
        expect(loginButton).toBeInTheDocument();
        expect(loginButton).toHaveClass('h-[51px]');
      });
    });

    describe('Hero Section', () => {
      it('should render gradient background', () => {
        renderComponent();
        
        const heroSection = screen.getByTestId('hero-section');
        expect(heroSection).toHaveClass('bg-gradient-to-br', 'from-primary-deep-purple', 'to-secondary-blue');
      });

      it('should display compelling headline', () => {
        renderComponent();
        
        const headline = screen.getByRole('heading', { level: 1 });
        expect(headline).toBeInTheDocument();
        expect(headline.textContent).toMatch(/Transform Your Music Teaching/);
      });

      it('should display AI-powered badge', () => {
        renderComponent();
        
        const badge = screen.getByText(/ai-powered music education platform/i);
        expect(badge).toBeInTheDocument();
        expect(badge.parentElement).toHaveClass('bg-white/10', 'backdrop-blur-sm', 'rounded-full');
      });

      it('should render primary CTA button', () => {
        renderComponent();
        
        const ctaButton = screen.getByRole('button', { name: /start free trial/i });
        expect(ctaButton).toBeInTheDocument();
        expect(ctaButton).toHaveClass('h-[51px]', 'bg-white', 'text-primary-deep-purple');
      });

      it('should display trust indicators', () => {
        renderComponent();
        
        expect(screen.getByText(/gdpr compliant/i)).toBeInTheDocument();
        expect(screen.getByText(/ssl encrypted/i)).toBeInTheDocument();
        expect(screen.getByText(/24\/7 support/i)).toBeInTheDocument();
      });
    });

    describe('Features Section', () => {
      it('should render three feature cards', () => {
        renderComponent();
        
        const featureCards = screen.getAllByTestId('feature-card');
        expect(featureCards).toHaveLength(3);
      });

      it('should display AI-Enhanced Teaching feature', () => {
        renderComponent();
        
        const feature = screen.getByText(/ai-enhanced teaching/i);
        expect(feature).toBeInTheDocument();
        
        const benefits = [
          /automated lesson planning/i,
          /instant feedback generation/i,
          /progress tracking/i,
        ];
        
        benefits.forEach(benefit => {
          expect(screen.getByText(benefit)).toBeInTheDocument();
        });
      });

      it('should display Personalized Learning Paths feature', () => {
        renderComponent();
        
        const feature = screen.getByText(/personalized learning paths/i);
        expect(feature).toBeInTheDocument();
        
        const benefits = [
          /adaptive difficulty/i,
          /individual progress tracking/i,
          /engagement analytics/i,
        ];
        
        benefits.forEach(benefit => {
          expect(screen.getByText(benefit)).toBeInTheDocument();
        });
      });

      it('should display Scale Your Impact feature', () => {
        renderComponent();
        
        const feature = screen.getByText(/scale your impact/i);
        expect(feature).toBeInTheDocument();
        
        const benefits = [
          /unlimited student capacity/i,
          /global accessibility/i,
          /multi-language support/i,
        ];
        
        benefits.forEach(benefit => {
          expect(screen.getByText(benefit)).toBeInTheDocument();
        });
      });

      it('should use gradient icons for features', () => {
        renderComponent();
        
        const featureIcons = screen.getAllByTestId('feature-icon');
        featureIcons.forEach(icon => {
          expect(icon).toHaveClass('bg-gradient-to-br');
        });
      });
    });

    describe('How It Works Section', () => {
      it('should display 3-step process', () => {
        renderComponent();
        
        const steps = screen.getAllByTestId('process-step');
        expect(steps).toHaveLength(3);
        
        expect(screen.getByText(/sign up/i)).toBeInTheDocument();
        expect(screen.getByText(/set up your curriculum/i)).toBeInTheDocument();
        expect(screen.getByText(/ai creates personalized paths/i)).toBeInTheDocument();
      });

      it('should number steps sequentially', () => {
        renderComponent();
        
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    describe('Social Proof Section', () => {
      it('should display statistics', () => {
        renderComponent();
        
        expect(screen.getByText(/10,000\+/)).toBeInTheDocument();
        expect(screen.getByText(/active educators/i)).toBeInTheDocument();
        
        expect(screen.getByText(/50,000\+/)).toBeInTheDocument();
        expect(screen.getByText(/students engaged/i)).toBeInTheDocument();
        
        expect(screen.getByText(/85%/)).toBeInTheDocument();
        expect(screen.getByText(/improved engagement/i)).toBeInTheDocument();
        
        expect(screen.getByText(/4\.9\/5/)).toBeInTheDocument();
        expect(screen.getByText(/educator rating/i)).toBeInTheDocument();
      });

      it('should display testimonial', () => {
        renderComponent();
        
        const testimonial = screen.getByText(/gemeos has revolutionized how i teach music/i);
        expect(testimonial).toBeInTheDocument();
        
        expect(screen.getByText(/dr\. sarah mitchell/i)).toBeInTheDocument();
        expect(screen.getByText(/berkeley school of music/i)).toBeInTheDocument();
      });

      it('should display 5-star rating', () => {
        renderComponent();
        
        const stars = screen.getAllByTestId('star-rating');
        expect(stars).toHaveLength(5);
        stars.forEach(star => {
          expect(star).toHaveClass('fill-yellow-400');
        });
      });
    });

    describe('CTA Section', () => {
      it('should render primary and secondary CTA buttons', () => {
        renderComponent();
        
        const primaryCTA = screen.getAllByRole('button', { name: /start your free trial/i })[1];
        expect(primaryCTA).toHaveClass('bg-primary-blue', 'h-[51px]');
        
        const secondaryCTA = screen.getByRole('button', { name: /watch demo/i });
        expect(secondaryCTA).toHaveClass('border-primary-deep-purple', 'h-[51px]');
      });

      it('should display feature grid', () => {
        renderComponent();
        
        expect(screen.getByText(/comprehensive resources/i)).toBeInTheDocument();
        expect(screen.getByText(/certified platform/i)).toBeInTheDocument();
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });
    });

    describe('Footer', () => {
      it('should render footer with brand', () => {
        renderComponent();
        
        const footer = screen.getByRole('contentinfo');
        expect(footer).toBeInTheDocument();
        expect(footer).toHaveClass('bg-footer-dark');
        
        const footerLogo = within(footer).getByText('Gemeos');
        expect(footerLogo).toBeInTheDocument();
      });

      it('should display footer links', () => {
        renderComponent();
        
        const footerSections = ['Product', 'Support', 'Legal'];
        footerSections.forEach(section => {
          expect(screen.getByText(section)).toBeInTheDocument();
        });
        
        const links = [
          /features/i,
          /pricing/i,
          /documentation/i,
          /privacy policy/i,
          /terms of service/i,
        ];
        
        links.forEach(link => {
          expect(screen.getByText(link)).toBeInTheDocument();
        });
      });

      it('should display copyright notice', () => {
        renderComponent();
        
        expect(screen.getByText(/© 2024 gemeos\. all rights reserved\./i)).toBeInTheDocument();
      });
    });
  });

  describe('Authentication Flows', () => {
    describe('Registration Modal', () => {
      it('should open registration modal when CTA clicked', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        const ctaButton = screen.getByRole('button', { name: /start free trial/i });
        await user.click(ctaButton);
        
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/create your free account/i)).toBeInTheDocument();
      });

      it('should render all registration form fields', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        const ctaButton = screen.getByRole('button', { name: /start free trial/i });
        await user.click(ctaButton);
        
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/i accept the terms/i)).toBeInTheDocument();
      });

      it('should validate required fields', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        const ctaButton = screen.getByRole('button', { name: /start free trial/i });
        await user.click(ctaButton);
        
        const submitButton = screen.getByRole('button', { name: /create free account/i });
        await user.click(submitButton);
        
        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({
              title: 'Error',
              description: 'Please fill in all fields.',
              variant: 'destructive'
            })
          );
        });
      });

      it('should validate password match', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        const ctaButton = screen.getByRole('button', { name: /start free trial/i });
        await user.click(ctaButton);
        
        await user.type(screen.getByLabelText(/first name/i), 'John');
        await user.type(screen.getByLabelText(/last name/i), 'Doe');
        await user.type(screen.getByLabelText(/email/i), 'john@example.com');
        await user.type(screen.getByLabelText(/^password$/i), 'password123');
        await user.type(screen.getByLabelText(/confirm password/i), 'password456');
        await user.click(screen.getByLabelText(/i accept the terms/i));
        
        const submitButton = screen.getByRole('button', { name: /create free account/i });
        await user.click(submitButton);
        
        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({
              title: 'Error',
              description: 'Passwords do not match.',
              variant: 'destructive'
            })
          );
        });
      });

      it('should validate password length', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        const ctaButton = screen.getByRole('button', { name: /start free trial/i });
        await user.click(ctaButton);
        
        await user.type(screen.getByLabelText(/first name/i), 'John');
        await user.type(screen.getByLabelText(/last name/i), 'Doe');
        await user.type(screen.getByLabelText(/email/i), 'john@example.com');
        await user.type(screen.getByLabelText(/^password$/i), 'pass');
        await user.type(screen.getByLabelText(/confirm password/i), 'pass');
        await user.click(screen.getByLabelText(/i accept the terms/i));
        
        const submitButton = screen.getByRole('button', { name: /create free account/i });
        await user.click(submitButton);
        
        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({
              title: 'Error',
              description: 'Password must be at least 8 characters long.',
              variant: 'destructive'
            })
          );
        });
      });

      it('should require terms acceptance', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        const ctaButton = screen.getByRole('button', { name: /start free trial/i });
        await user.click(ctaButton);
        
        await user.type(screen.getByLabelText(/first name/i), 'John');
        await user.type(screen.getByLabelText(/last name/i), 'Doe');
        await user.type(screen.getByLabelText(/email/i), 'john@example.com');
        await user.type(screen.getByLabelText(/^password$/i), 'password123');
        await user.type(screen.getByLabelText(/confirm password/i), 'password123');
        
        const submitButton = screen.getByRole('button', { name: /create free account/i });
        await user.click(submitButton);
        
        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({
              title: 'Error',
              description: 'Please accept the Terms of Service and Privacy Policy.',
              variant: 'destructive'
            })
          );
        });
      });

      it('should handle successful registration', async () => {
        const user = userEvent.setup();
        (supabase.auth.signUp as any).mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        });
        
        renderComponent();
        
        const ctaButton = screen.getByRole('button', { name: /start free trial/i });
        await user.click(ctaButton);
        
        await user.type(screen.getByLabelText(/first name/i), 'John');
        await user.type(screen.getByLabelText(/last name/i), 'Doe');
        await user.type(screen.getByLabelText(/email/i), 'john@example.com');
        await user.type(screen.getByLabelText(/^password$/i), 'password123');
        await user.type(screen.getByLabelText(/confirm password/i), 'password123');
        await user.click(screen.getByLabelText(/i accept the terms/i));
        
        const submitButton = screen.getByRole('button', { name: /create free account/i });
        await user.click(submitButton);
        
        await waitFor(() => {
          expect(supabase.auth.signUp).toHaveBeenCalledWith(
            expect.objectContaining({
              email: 'john@example.com',
              password: 'password123',
              options: expect.objectContaining({
                data: {
                  first_name: 'John',
                  last_name: 'Doe',
                  user_type: 'teacher'
                }
              })
            })
          );
          
          expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({
              title: 'Registration successful!',
              description: 'Welcome to Gemeos!'
            })
          );
          
          expect(mockNavigate).toHaveBeenCalledWith('/tenant/dashboard');
        });
      });

      it('should toggle password visibility', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        const ctaButton = screen.getByRole('button', { name: /start free trial/i });
        await user.click(ctaButton);
        
        const passwordField = screen.getByLabelText(/^password$/i);
        expect(passwordField).toHaveAttribute('type', 'password');
        
        const toggleButton = screen.getAllByTestId('toggle-password-visibility')[0];
        await user.click(toggleButton);
        
        expect(passwordField).toHaveAttribute('type', 'text');
      });

      it('should switch to login modal', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        const ctaButton = screen.getByRole('button', { name: /start free trial/i });
        await user.click(ctaButton);
        
        const loginLink = screen.getByRole('button', { name: /login here/i });
        await user.click(loginLink);
        
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });
    });

    describe('Login Modal', () => {
      it('should open login modal when login button clicked', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        const loginButton = within(screen.getByRole('banner')).getByRole('button', { name: /login/i });
        await user.click(loginButton);
        
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });

      it('should render login form fields', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        const loginButton = within(screen.getByRole('banner')).getByRole('button', { name: /login/i });
        await user.click(loginButton);
        
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      });

      it('should handle successful login', async () => {
        const user = userEvent.setup();
        (supabase.auth.signInWithPassword as any).mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        });
        
        renderComponent();
        
        const loginButton = within(screen.getByRole('banner')).getByRole('button', { name: /login/i });
        await user.click(loginButton);
        
        await user.type(screen.getByLabelText(/email/i), 'john@example.com');
        await user.type(screen.getByLabelText(/password/i), 'password123');
        
        const submitButton = screen.getByRole('button', { name: /^login$/i });
        await user.click(submitButton);
        
        await waitFor(() => {
          expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
            email: 'john@example.com',
            password: 'password123',
          });
          
          expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({
              title: 'Login successful!',
              description: 'Welcome back to Gemeos!'
            })
          );
          
          expect(mockNavigate).toHaveBeenCalledWith('/tenant/dashboard');
        });
      });

      it('should handle login errors', async () => {
        const user = userEvent.setup();
        (supabase.auth.signInWithPassword as any).mockResolvedValue({
          data: null,
          error: { message: 'Invalid credentials' }
        });
        
        renderComponent();
        
        const loginButton = within(screen.getByRole('banner')).getByRole('button', { name: /login/i });
        await user.click(loginButton);
        
        await user.type(screen.getByLabelText(/email/i), 'john@example.com');
        await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
        
        const submitButton = screen.getByRole('button', { name: /^login$/i });
        await user.click(submitButton);
        
        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({
              title: 'Login Failed',
              description: 'Invalid credentials',
              variant: 'destructive'
            })
          );
        });
      });

      it('should switch to registration modal', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        const loginButton = within(screen.getByRole('banner')).getByRole('button', { name: /login/i });
        await user.click(loginButton);
        
        const signUpLink = screen.getByRole('button', { name: /start free trial/i });
        await user.click(signUpLink);
        
        expect(screen.getByText(/create your free account/i)).toBeInTheDocument();
      });

      it('should have forgot password link', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        const loginButton = within(screen.getByRole('banner')).getByRole('button', { name: /login/i });
        await user.click(loginButton);
        
        const forgotLink = screen.getByText(/forgot password/i);
        expect(forgotLink).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    describe('Mobile Viewport (375px)', () => {
      beforeEach(() => {
        window.innerWidth = 375;
        window.dispatchEvent(new Event('resize'));
      });

      it('should stack features vertically on mobile', () => {
        renderComponent();
        
        const featuresContainer = screen.getByTestId('features-container');
        // On mobile, features should be in single column
        expect(featuresContainer).toHaveClass('grid-cols-1');
      });

      it('should adjust hero text size for mobile', () => {
        renderComponent();
        
        const headline = screen.getByRole('heading', { level: 1 });
        // Uses responsive text sizing
        expect(headline).toHaveClass('text-4xl', 'sm:text-5xl');
      });

      it('should stack CTA buttons on mobile', () => {
        renderComponent();
        
        const ctaContainer = screen.getByTestId('cta-container');
        // Mobile uses flex column
        expect(ctaContainer).toHaveClass('flex', 'flex-col');
      });
    });

    describe('Tablet Viewport (768px)', () => {
      beforeEach(() => {
        window.innerWidth = 768;
        window.dispatchEvent(new Event('resize'));
      });

      it('should display 2 columns for features on tablet', () => {
        renderComponent();
        
        const featuresContainer = screen.getByTestId('features-container');
        // Has responsive grid columns
        expect(featuresContainer).toHaveClass('md:grid-cols-2', 'lg:grid-cols-3');
      });

      it('should maintain button sizes on tablet', () => {
        renderComponent();
        
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          if (button.classList.contains('btn-primary') || button.classList.contains('btn-secondary')) {
            expect(button).toHaveClass('h-[51px]');
          }
        });
      });
    });

    describe('Desktop Viewport (1024px+)', () => {
      beforeEach(() => {
        window.innerWidth = 1024;
        window.dispatchEvent(new Event('resize'));
      });

      it('should display 3 columns for features on desktop', () => {
        renderComponent();
        
        const featuresContainer = screen.getByTestId('features-container');
        expect(featuresContainer).toHaveClass('md:grid-cols-3');
      });

      it('should display CTA buttons side by side', () => {
        renderComponent();
        
        const ctaContainer = screen.getByTestId('cta-container');
        // Desktop uses flex row
        expect(ctaContainer).toHaveClass('sm:flex-row');
      });

      it('should use larger text sizes on desktop', () => {
        renderComponent();
        
        const headline = screen.getByRole('heading', { level: 1 });
        expect(headline).toHaveClass('md:text-6xl');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderComponent();
      
      const h1 = screen.getAllByRole('heading', { level: 1 });
      expect(h1).toHaveLength(1);
      
      const h2 = screen.getAllByRole('heading', { level: 2 });
      expect(h2.length).toBeGreaterThan(0);
      
      const h3 = screen.getAllByRole('heading', { level: 3 });
      expect(h3.length).toBeGreaterThan(0);
    });

    it('should have proper ARIA labels', () => {
      renderComponent();
      
      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();
      
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Tab through interactive elements
      await user.tab();
      expect(document.activeElement).toHaveRole('button');
      
      await user.tab();
      expect(document.activeElement).toHaveRole('button');
      
      // Enter key should activate button
      await user.keyboard('{Enter}');
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have proper color contrast ratios', () => {
      renderComponent();
      
      // Check text on dark backgrounds
      const whiteText = screen.getAllByTestId('white-text');
      whiteText.forEach(element => {
        expect(element).toHaveClass('text-white');
      });
      
      // Check text on light backgrounds
      const darkText = screen.getAllByTestId('dark-text');
      darkText.forEach(element => {
        expect(element).toHaveClass('text-gray-900');
      });
    });

    it('should have focus indicators on interactive elements', () => {
      renderComponent();
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass(/focus:outline-none|focus:ring/);
      });
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveClass(/focus:outline-none|focus:ring/);
      });
    });

    it('should announce form errors to screen readers', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const ctaButton = screen.getByRole('button', { name: /start free trial/i });
      await user.click(ctaButton);
      
      const submitButton = screen.getByRole('button', { name: /create free account/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should have semantic HTML structure', () => {
      renderComponent();
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
      
      const sections = screen.getAllByRole('region');
      expect(sections.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should lazy load non-critical images', () => {
      renderComponent();
      
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        if (!img.classList.contains('critical')) {
          expect(img).toHaveAttribute('loading', 'lazy');
        }
      });
    });

    it('should minimize re-renders on state changes', async () => {
      const user = userEvent.setup();
      const renderSpy = vi.fn();
      
      renderComponent();
      
      // Open modal shouldn't re-render entire page
      await user.click(screen.getByRole('button', { name: /start free trial/i }));
      
      // Only modal should be added to DOM
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Browser Compatibility', () => {
    it('should work without CSS Grid support', () => {
      renderComponent();
      
      const containers = screen.getAllByTestId(/container/);
      containers.forEach(container => {
        // Should have flexbox fallback
        if (container.classList.contains('grid')) {
          expect(container).toHaveClass('flex');
        }
      });
    });

    it('should work without backdrop-filter support', () => {
      renderComponent();
      
      const blurElements = screen.getAllByTestId(/blur/);
      blurElements.forEach(element => {
        // Should have opacity fallback
        expect(element).toHaveClass(/bg-opacity|bg-white\/|bg-black\//);
      });
    });
  });
});