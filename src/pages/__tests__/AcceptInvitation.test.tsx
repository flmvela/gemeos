import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AcceptInvitation from '../AcceptInvitation';
import { invitationService } from '@/services/invitation.service';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/services/invitation.service');
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      updateUser: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('?tenant=test-tenant&invitationId=123&token=abc123')],
  };
});

describe('AcceptInvitation Component', () => {
  const mockInvitation = {
    id: '123',
    email: 'user@example.com',
    tenant_id: 'tenant-123',
    role_name: 'member',
    status: 'pending',
    expires_at: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
    invited_by: 'inviter-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenant: {
      id: 'tenant-123',
      name: 'Test Organization',
      slug: 'test-org',
    },
    invited_by_user: {
      id: 'inviter-id',
      email: 'admin@example.com',
    },
    role: {
      id: 'role-id',
      name: 'member',
      display_name: 'Member',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display invitation context information', async () => {
    vi.mocked(invitationService.getInvitationByToken).mockResolvedValue(mockInvitation);

    render(
      <BrowserRouter>
        <AcceptInvitation />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
      expect(screen.getByText(/invited by admin@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/Member/)).toBeInTheDocument();
    });
  });

  it('should validate password strength requirements', async () => {
    vi.mocked(invitationService.getInvitationByToken).mockResolvedValue(mockInvitation);

    render(
      <BrowserRouter>
        <AcceptInvitation />
      </BrowserRouter>
    );

    // Wait for invitation to load
    await waitFor(() => {
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
    });

    // Get password input by its specific id
    const passwordInput = screen.getByPlaceholderText('Create a strong password');
    
    // Test weak password
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    
    // Test password without uppercase
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(screen.getByText(/uppercase letter/i)).toBeInTheDocument();
    
    // Test password without number
    fireEvent.change(passwordInput, { target: { value: 'Password' } });
    expect(screen.getByText(/number/i)).toBeInTheDocument();
    
    // Test strong password
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123' } });
    // When password is strong, requirements should show as green (they're still visible but styled differently)
    await waitFor(() => {
      const minLengthReq = screen.getByText(/at least 8 characters/i);
      // Check that the requirement text itself has the green color class
      expect(minLengthReq.closest('.text-green-600')).toBeInTheDocument();
    });
  });

  it('should handle expired invitation token', async () => {
    const expiredInvitation = {
      ...mockInvitation,
      expires_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    };
    
    vi.mocked(invitationService.getInvitationByToken).mockResolvedValue(expiredInvitation);

    render(
      <BrowserRouter>
        <AcceptInvitation />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/invitation has expired/i)).toBeInTheDocument();
    });
  });

  it('should handle invalid invitation token', async () => {
    vi.mocked(invitationService.getInvitationByToken).mockResolvedValue(null);

    render(
      <BrowserRouter>
        <AcceptInvitation />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/invitation not found/i)).toBeInTheDocument();
    });
  });

  it('should successfully accept invitation and redirect', async () => {
    vi.mocked(invitationService.getInvitationByToken).mockResolvedValue(mockInvitation);
    vi.mocked(invitationService.acceptInvitation).mockResolvedValue(undefined);
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({ data: { user: {} }, error: null });
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ 
      data: { user: { id: 'user-id' }, session: {} }, 
      error: null 
    });

    render(
      <BrowserRouter>
        <AcceptInvitation />
      </BrowserRouter>
    );

    // Wait for invitation to load
    await waitFor(() => {
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
    });

    // Fill in password
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPass123' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /set password/i });
    fireEvent.click(submitButton);

    // Verify success message and redirect
    await waitFor(() => {
      expect(screen.getByText(/account activated successfully/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard', { replace: true });
    }, { timeout: 3000 });
  });

  it('should handle network errors gracefully', async () => {
    vi.mocked(invitationService.getInvitationByToken).mockRejectedValue(
      new Error('Network error')
    );

    render(
      <BrowserRouter>
        <AcceptInvitation />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load invitation/i)).toBeInTheDocument();
    });
  });

  it('should show password mismatch error', async () => {
    vi.mocked(invitationService.getInvitationByToken).mockResolvedValue(mockInvitation);

    render(
      <BrowserRouter>
        <AcceptInvitation />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPass123' } });

    const submitButton = screen.getByRole('button', { name: /set password/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('should display loading state while fetching invitation', () => {
    vi.mocked(invitationService.getInvitationByToken).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <BrowserRouter>
        <AcceptInvitation />
      </BrowserRouter>
    );

    expect(screen.getByText(/loading invitation/i)).toBeInTheDocument();
  });
});