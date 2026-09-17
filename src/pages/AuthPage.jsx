import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTenantPath } from '../hooks/useTenantPath.js';

const initialLoginState = {
  email: '',
  password: '',
};

const initialSignupState = {
  fullName: '',
  phone: '',
  email: '',
  city: '',
  cargo: '',
  password: '',
  confirmPassword: '',
};

const initialResetState = {
  email: '',
};

function getFriendlyMessage(error) {
  if (!error) {
    return 'Something went wrong. Please try again.';
  }

  const message = error.message || '';

  if (/invalid login credentials/i.test(message)) {
    return 'Invalid email or password.';
  }

  if (
    /user already registered|already registered|email already exists/i.test(
      message
    )
  ) {
    return 'An account with this email already exists.';
  }

  if (
    /password/i.test(message) &&
    /weak|length|min|too short/i.test(message)
  ) {
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

function AuthPage({ initialMode = 'login' }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { session, authLoading } = useAuth();

  const { getTenantPath } = useTenantPath();

  const from =
    location.state?.from ||
    getTenantPath('/');

  const [mode, setMode] = useState(initialMode);

  const [loginForm, setLoginForm] = useState(
    initialLoginState
  );

  const [signupForm, setSignupForm] = useState(
    initialSignupState
  );

  const [resetForm, setResetForm] = useState(
    initialResetState
  );

  const [isSubmittingLogin, setIsSubmittingLogin] =
    useState(false);

  const [isSubmittingSignup, setIsSubmittingSignup] =
    useState(false);

  const [isSubmittingReset, setIsSubmittingReset] =
    useState(false);

  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && session) {
      navigate(from, { replace: true });
    }
  }, [
    authLoading,
    session,
    navigate,
    from,
  ]);

  const canSubmitLogin = useMemo(
    () =>
      loginForm.email &&
      loginForm.password,
    [loginForm]
  );

  const canSubmitSignup = useMemo(
    () =>
      signupForm.fullName &&
      signupForm.phone &&
      signupForm.email &&
      signupForm.city &&
      signupForm.cargo &&
      signupForm.password &&
      signupForm.confirmPassword,
    [signupForm]
  );

  const canSubmitReset = useMemo(
    () => resetForm.email,
    [resetForm]
  );

  if (authLoading) {
    return (
      <section className="page-card auth-shell">
        <p className="eyebrow">Loading</p>

        <h1>Checking your session</h1>

        <p>
          Please wait while we verify your account.
        </p>
      </section>
    );
  }

  if (session) {
    return (
      <Navigate
        to={from}
        replace
      />
    );
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoginError('');

    if (
      !loginForm.email ||
      !loginForm.password
    ) {
      setLoginError(
        'Please enter both email and password.'
      );
      return;
    }

    try {
      setIsSubmittingLogin(true);

      const { error } =
        await supabase.auth.signInWithPassword({
          email: loginForm.email.trim(),
          password: loginForm.password,
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      setLoginError(
        getFriendlyMessage(error)
      );
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleSignupSubmit = async (event) => {
    event.preventDefault();
    setSignupError('');

    if (
      !signupForm.fullName.trim() ||
      !signupForm.phone.trim() ||
      !signupForm.email.trim() ||
      !signupForm.city.trim() ||
      !signupForm.cargo.trim() ||
      !signupForm.password ||
      !signupForm.confirmPassword
    ) {
      setSignupError(
        'Please complete all required fields.'
      );
      return;
    }

    if (
      signupForm.password !==
      signupForm.confirmPassword
    ) {
      setSignupError(
        'Passwords do not match.'
      );
      return;
    }

    try {
      setIsSubmittingSignup(true);

      // -----------------------------------------
      // Create Supabase Auth account
      // -----------------------------------------
      const { data, error } =
        await supabase.auth.signUp({
          email: signupForm.email.trim(),
          password: signupForm.password,
        });

      if (error) {
        throw error;
      }

      // -----------------------------------------
      // Create customer profile
      // -----------------------------------------
      if (data.user) {
        const {
          error: profileError,
        } = await supabase
          .from('customer_profile')
          .insert([
            {
              // Auth user ID becomes profile ID
              id: data.user.id,

              // Auth email
              email: data.user.email || signupForm.email.trim(),

              // Customer information
              full_name:
                signupForm.fullName.trim(),

              phone:
                signupForm.phone.trim(),

              city:
                signupForm.city.trim(),

              cargo:
                signupForm.cargo.trim(),

              // Start quotation counter
              last_quotation_no: 0,
            },
          ]);

        if (profileError) {
          console.warn(
            'Failed to save customer profile:',
            profileError.message
          );

          // Don't block account creation.
          // The user can create the profile
          // later from the Profile page.
        }
      }

      // -----------------------------------------
      // Reset signup form
      // -----------------------------------------
      setSignupForm(initialSignupState);

      // Put registered email into login form
      setLoginForm((current) => ({
        ...current,
        email: signupForm.email.trim(),
      }));

      setMode('login');

      setLoginError(
        'Account created. Check your email to confirm your sign-up.'
      );
    } catch (error) {
      setSignupError(
        getFriendlyMessage(error)
      );
    } finally {
      setIsSubmittingSignup(false);
    }
  };

  const handleGoogleLogin = async () => {
    setOauthLoading(true);
    setLoginError('');
    setSignupError('');

    const redirectPath =
      getTenantPath('/auth');

    const { error } =
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo:
            `${window.location.origin}${redirectPath}`,
        },
      });

    if (error) {
      setLoginError(
        getFriendlyMessage(error)
      );

      setOauthLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    setResetError('');
    setResetSuccess('');

    if (!resetForm.email) {
      setResetError(
        'Please enter your email address.'
      );
      return;
    }

    try {
      setIsSubmittingReset(true);

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          resetForm.email.trim(),
          {
            redirectTo:
              `${window.location.origin}${getTenantPath(
                '/reset-password'
              )}`,
          }
        );

      if (error) {
        throw error;
      }

      setResetSuccess(
        'Password reset email sent. Check your inbox.'
      );

      setResetForm(initialResetState);
    } catch (error) {
      setResetError(
        getFriendlyMessage(error)
      );
    } finally {
      setIsSubmittingReset(false);
    }
  };

  return (
    <div className="auth-layout">

      {/* ========================================
          LOGIN
      ======================================== */}
      {mode === 'login' && (
        <section className="page-card auth-panel">
          <p className="eyebrow">
            Welcome back
          </p>

          <h1>
            Login to your account
          </h1>

          <button
            type="button"
            className="auth-button google-button"
            onClick={handleGoogleLogin}
            disabled={oauthLoading}
          >
            {oauthLoading
              ? 'Connecting to Google...'
              : 'Continue with Google'}
          </button>

          <div className="auth-divider">
            <span>
              or continue with email
            </span>
          </div>

          <form
            className="auth-form"
            onSubmit={handleLoginSubmit}
          >
            <label className="field">
              <span>Email</span>

              <input
                type="email"
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm(
                    (current) => ({
                      ...current,
                      email:
                        event.target.value,
                    })
                  )
                }
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            <label className="field">
              <span>Password</span>

              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm(
                    (current) => ({
                      ...current,
                      password:
                        event.target.value,
                    })
                  )
                }
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </label>

            {loginError && (
              <p className="form-message error-message">
                {loginError}
              </p>
            )}

            <div className="auth-row auth-inline-row">
              <button
                type="submit"
                className="header-button primary"
                disabled={
                  !canSubmitLogin ||
                  isSubmittingLogin
                }
              >
                {isSubmittingLogin
                  ? 'Signing in...'
                  : 'Login'}
              </button>

              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setResetError('');
                  setResetSuccess('');

                  setResetForm({
                    email:
                      loginForm.email || '',
                  });

                  setMode('reset');
                }}
              >
                Forgot password?
              </button>
            </div>
          </form>

          <p className="auth-footer-copy">
            Don&apos;t have an account?{' '}

            <button
              type="button"
              className="text-button"
              onClick={() =>
                setMode('signup')
              }
            >
              Sign up
            </button>
          </p>
        </section>
      )}

      {/* ========================================
          SIGN UP
      ======================================== */}
      {mode === 'signup' && (
        <section className="page-card auth-panel">
          <p className="eyebrow">
            Create account
          </p>

          <h2>
            Sign up
          </h2>

          <form
            className="auth-form"
            onSubmit={handleSignupSubmit}
          >

            {/* Full Name */}
            <label className="field">
              <span>
                Full name
              </span>

              <input
                type="text"
                value={signupForm.fullName}
                onChange={(event) =>
                  setSignupForm(
                    (current) => ({
                      ...current,
                      fullName:
                        event.target.value,
                    })
                  )
                }
                placeholder="Your full name"
                autoComplete="name"
              />
            </label>

            {/* Phone */}
            <label className="field">
              <span>
                Phone number
              </span>

              <input
                type="tel"
                value={signupForm.phone}
                onChange={(event) =>
                  setSignupForm(
                    (current) => ({
                      ...current,
                      phone:
                        event.target.value,
                    })
                  )
                }
                placeholder="03XX-XXXXXXX"
                autoComplete="tel"
              />
            </label>

            {/* Email */}
            <label className="field">
              <span>
                Email
              </span>

              <input
                type="email"
                value={signupForm.email}
                onChange={(event) =>
                  setSignupForm(
                    (current) => ({
                      ...current,
                      email:
                        event.target.value,
                    })
                  )
                }
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            {/* City */}
            <label className="field">
              <span>
                City
              </span>

              <input
                type="text"
                value={signupForm.city}
                onChange={(event) =>
                  setSignupForm(
                    (current) => ({
                      ...current,
                      city:
                        event.target.value,
                    })
                  )
                }
                placeholder="Your city"
                autoComplete="address-level2"
              />
            </label>

            {/* Cargo */}
            <label className="field">
              <span>
                Cargo
              </span>

              <input
                type="text"
                value={signupForm.cargo}
                onChange={(event) =>
                  setSignupForm(
                    (current) => ({
                      ...current,
                      cargo:
                        event.target.value,
                    })
                  )
                }
                placeholder="Your cargo"
                autoComplete="organization"
              />
            </label>

            {/* Password */}
            <label className="field">
              <span>
                Password
              </span>

              <input
                type="password"
                value={signupForm.password}
                onChange={(event) =>
                  setSignupForm(
                    (current) => ({
                      ...current,
                      password:
                        event.target.value,
                    })
                  )
                }
                placeholder="Create a password"
                autoComplete="new-password"
              />
            </label>

            {/* Confirm Password */}
            <label className="field">
              <span>
                Confirm password
              </span>

              <input
                type="password"
                value={
                  signupForm.confirmPassword
                }
                onChange={(event) =>
                  setSignupForm(
                    (current) => ({
                      ...current,
                      confirmPassword:
                        event.target.value,
                    })
                  )
                }
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
            </label>

            {signupError && (
              <p className="form-message error-message">
                {signupError}
              </p>
            )}

            <button
              type="submit"
              className="header-button primary"
              disabled={
                !canSubmitSignup ||
                isSubmittingSignup
              }
            >
              {isSubmittingSignup
                ? 'Creating account...'
                : 'Create account'}
            </button>
          </form>

          <p className="auth-footer-copy">
            Already have an account?{' '}

            <button
              type="button"
              className="text-button"
              onClick={() =>
                setMode('login')
              }
            >
              Login
            </button>
          </p>
        </section>
      )}

      {/* ========================================
          RESET PASSWORD
      ======================================== */}
      {mode === 'reset' && (
        <section className="page-card auth-panel reset-panel">
          <p className="eyebrow">
            Need help?
          </p>

          <h2>
            Reset password
          </h2>

          <form
            className="auth-form"
            onSubmit={handleResetPassword}
          >
            <label className="field">
              <span>
                Email
              </span>

              <input
                type="email"
                value={resetForm.email}
                onChange={(event) =>
                  setResetForm({
                    email:
                      event.target.value,
                  })
                }
                placeholder="Enter your email"
                autoComplete="email"
              />
            </label>

            {resetError && (
              <p className="form-message error-message">
                {resetError}
              </p>
            )}

            {resetSuccess && (
              <p className="form-message success-message">
                {resetSuccess}
              </p>
            )}

            <button
              type="submit"
              className="header-button secondary"
              disabled={
                !canSubmitReset ||
                isSubmittingReset
              }
            >
              {isSubmittingReset
                ? 'Sending reset email...'
                : 'Send reset email'}
            </button>
          </form>

          <p className="auth-footer-copy">
            Remembered your password?{' '}

            <button
              type="button"
              className="text-button"
              onClick={() =>
                setMode('login')
              }
            >
              Go back to login
            </button>
          </p>
        </section>
      )}
    </div>
  );
}

export default AuthPage;