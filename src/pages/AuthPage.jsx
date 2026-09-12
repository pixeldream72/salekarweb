import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const initialLoginState = { email: '', password: '' };
const initialSignupState = { email: '', password: '', confirmPassword: '' };
const initialResetState = { email: '' };

function getFriendlyMessage(error) {
  if (!error) {
    return 'Something went wrong. Please try again.';
  }

  const message = error.message || '';

  if (/invalid login credentials/i.test(message)) {
    return 'Invalid email or password.';
  }

  if (/user already registered|already registered|email already exists/i.test(message)) {
    return 'An account with this email already exists.';
  }

  if (/password/i.test(message) && /weak|length|min|too short/i.test(message)) {
    return 'Password is too weak. Use at least 6 characters.';
  }

  if (/rate limit|too many requests/i.test(message)) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (/email not confirmed|confirm.*email/i.test(message)) {
    return 'Please confirm your email before logging in.';
  }

  if (/reset password|reset.*email/i.test(message)) {
    return 'Password reset request sent. Check your email.';
  }

  if (/invalid.*email|email.*required/i.test(message)) {
    return 'Please enter a valid email address.';
  }

  return message || 'Something went wrong. Please try again.';
}

function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, authLoading } = useAuth();
  const from = location.state?.from || '/';

  const [loginForm, setLoginForm] = useState(initialLoginState);
  const [signupForm, setSignupForm] = useState(initialSignupState);
  const [resetForm, setResetForm] = useState(initialResetState);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [isSubmittingSignup, setIsSubmittingSignup] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && session) {
      navigate(from, { replace: true });
    }
  }, [authLoading, session, navigate, from]);

  const canSubmitLogin = useMemo(() => loginForm.email && loginForm.password, [loginForm]);
  const canSubmitSignup = useMemo(
    () => signupForm.email && signupForm.password && signupForm.confirmPassword,
    [signupForm],
  );
  const canSubmitReset = useMemo(() => resetForm.email, [resetForm]);

  if (authLoading) {
    return (
      <section className="page-card auth-shell">
        <p className="eyebrow">Loading</p>
        <h1>Checking your session</h1>
        <p>Please wait while we verify your account.</p>
      </section>
    );
  }

  if (session) {
    return <Navigate to={from} replace />;
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoginError('');

    if (!loginForm.email || !loginForm.password) {
      setLoginError('Please enter both email and password.');
      return;
    }

    try {
      setIsSubmittingLogin(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setLoginError(getFriendlyMessage(error));
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleSignupSubmit = async (event) => {
    event.preventDefault();
    setSignupError('');

    if (!signupForm.email || !signupForm.password || !signupForm.confirmPassword) {
      setSignupError('Please complete all required fields.');
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }

    try {
      setIsSubmittingSignup(true);
      const { error } = await supabase.auth.signUp({
        email: signupForm.email.trim(),
        password: signupForm.password,
      });

      if (error) {
        throw error;
      }

      setSignupError('');
      setSignupForm(initialSignupState);
      setLoginForm((current) => ({ ...current, email: signupForm.email.trim() }));
      setLoginError('Account created. Check your email to confirm your sign-up.');
    } catch (error) {
      setSignupError(getFriendlyMessage(error));
    } finally {
      setIsSubmittingSignup(false);
    }
  };

  const handleGoogleLogin = async () => {
    setOauthLoading(true);
    setLoginError('');
    setSignupError('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setLoginError(getFriendlyMessage(error));
      setOauthLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetForm.email) {
      setResetError('Please enter your email address.');
      return;
    }

    try {
      setIsSubmittingReset(true);
      const { error } = await supabase.auth.resetPasswordForEmail(resetForm.email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        throw error;
      }

      setResetSuccess('Password reset email sent. Check your inbox.');
      setResetForm(initialResetState);
    } catch (error) {
      setResetError(getFriendlyMessage(error));
    } finally {
      setIsSubmittingReset(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="page-card auth-panel">
        <p className="eyebrow">Welcome back</p>
        <h1>Login to your account</h1>

        <button
          type="button"
          className="auth-button google-button"
          onClick={handleGoogleLogin}
          disabled={oauthLoading}
        >
          {oauthLoading ? 'Connecting to Google...' : 'Continue with Google'}
        </button>

        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

        <form className="auth-form" onSubmit={handleLoginSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={loginForm.email}
              onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </label>

          {loginError && <p className="form-message error-message">{loginError}</p>}

          <div className="auth-row auth-inline-row">
            <button type="submit" className="header-button primary" disabled={!canSubmitLogin || isSubmittingLogin}>
              {isSubmittingLogin ? 'Signing in...' : 'Login'}
            </button>

            <button
              type="button"
              className="text-button"
              onClick={() => {
                setResetError('');
                setResetSuccess('');
                setResetForm({ email: loginForm.email || '' });
              }}
            >
              Forgot password?
            </button>
          </div>
        </form>
      </section>

      <section className="page-card auth-panel">
        <p className="eyebrow">Create account</p>
        <h2>Sign up</h2>

        <form className="auth-form" onSubmit={handleSignupSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={signupForm.email}
              onChange={(event) => setSignupForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={signupForm.password}
              onChange={(event) => setSignupForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Create a password"
              autoComplete="new-password"
            />
          </label>

          <label className="field">
            <span>Confirm password</span>
            <input
              type="password"
              value={signupForm.confirmPassword}
              onChange={(event) => setSignupForm((current) => ({ ...current, confirmPassword: event.target.value }))}
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
          </label>

          {signupError && <p className="form-message error-message">{signupError}</p>}

          <button type="submit" className="header-button primary" disabled={!canSubmitSignup || isSubmittingSignup}>
            {isSubmittingSignup ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </section>

      <section className="page-card auth-panel reset-panel">
        <p className="eyebrow">Need help?</p>
        <h2>Reset password</h2>

        <form className="auth-form" onSubmit={handleResetPassword}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={resetForm.email}
              onChange={(event) => setResetForm({ email: event.target.value })}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </label>

          {resetError && <p className="form-message error-message">{resetError}</p>}
          {resetSuccess && <p className="form-message success-message">{resetSuccess}</p>}

          <button type="submit" className="header-button secondary" disabled={!canSubmitReset || isSubmittingReset}>
            {isSubmittingReset ? 'Sending reset email...' : 'Send reset email'}
          </button>
        </form>

        <p className="auth-footer-copy">
          Already have an account? <Link to="/login">Go back to login</Link>
        </p>
      </section>
    </div>
  );
}

export default AuthPage;
