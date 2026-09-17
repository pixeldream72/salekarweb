import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  fetchCustomerProfile,
  createCustomerProfile,
  updateCustomerProfile,
} from '../services/supabaseService.js';

function ProfilePage() {
  const { session } = useAuth();
  const customerId = session?.user?.id;
  const customerEmail = session?.user?.email || '';

  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [cargo, setCargo] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!customerId) {
        if (isMounted) {
          setError('No logged-in user found.');
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError('');
      setSuccess('');

      console.log(
        'Loading customer profile for:',
        customerId
      );

      const { data, error: profileError } =
        await fetchCustomerProfile(customerId);

      if (!isMounted) {
        return;
      }

      console.log('Customer profile:', data);
      console.log(
        'Customer profile error:',
        profileError
      );

      if (profileError) {
        setError(profileError.message);
        setIsLoading(false);
        return;
      }

      // -----------------------------------------
      // Profile does not exist.
      // This is OK. User can create it.
      // -----------------------------------------
      if (!data) {
        setProfile(null);
        setFullName('');
        setPhone('');
        setCity('');
        setCargo('');
        setIsEditing(false);
        setIsLoading(false);
        return;
      }

      // -----------------------------------------
      // Profile exists.
      // -----------------------------------------
      setProfile(data);
      setFullName(data.fullName || '');
      setPhone(data.phone || '');
      setIsEditing(false);
      setIsLoading(false);
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [customerId]);

  const handleSave = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!fullName.trim() || !phone.trim()) {
      setError('Please fill in both fields.');
      return;
    }

    if (!customerId) {
      setError('No logged-in user found.');
      return;
    }

    setIsSaving(true);

    try {
      let result;

      // -----------------------------------------
      // CREATE NEW PROFILE
      // -----------------------------------------
      if (!profile) {
        result = await createCustomerProfile({
          customerId,
          email: customerEmail,
          fullName,
          phone,
          city,
          cargo,
        });

        if (result.error) {
          throw result.error;
        }

        setProfile(result.data);
        setFullName(result.data.fullName);
        setPhone(result.data.phone);

        setSuccess(
          'Your profile was created successfully.'
        );

        setIsEditing(false);
      }

      // -----------------------------------------
      // UPDATE EXISTING PROFILE
      // -----------------------------------------
      else {
        result = await updateCustomerProfile(
          customerId,
          {
            fullName,
            phone,
            city,
            cargo,
          }
        );

        if (result.error) {
          throw result.error;
        }

        setProfile(result.data);
        setFullName(result.data.fullName);
        setPhone(result.data.phone);
        setCity(result.data.city || '');
        setCargo(result.data.cargo || '');

        setSuccess(
          'Profile updated successfully.'
        );

        setIsEditing(false);
      }
    } catch (err) {
      console.error(
        'Profile save error:',
        err
      );

      setError(
        err.message ||
          'Failed to save your profile.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFullName(profile.fullName || '');
      setPhone(profile.phone || '');
      setCity(profile.city || '');
      setCargo(profile.cargo || '');
      setIsEditing(false);
    } else {
      setFullName('');
      setPhone('');
      setCity('');
      setCargo('');
    }

    setError('');
    setSuccess('');
  };

  // -----------------------------------------
  // LOADING
  // -----------------------------------------
  if (isLoading) {
    return (
      <section className="page-card">
        <p className="eyebrow">Profile</p>

        <h1>Loading...</h1>

        <p>
          Loading your profile information...
        </p>
      </section>
    );
  }

  // -----------------------------------------
  // ERROR WHILE LOADING
  // -----------------------------------------
  if (error && !profile && !fullName && !phone) {
    // Only show this as a full-page error when
    // there is an actual error.
    //
    // A missing profile is NOT an error.
    if (error !== '') {
      return (
        <section className="page-card">
          <p className="eyebrow">Profile</p>

          <h1>My Profile</h1>

          <p className="form-message error-message">
            {error}
          </p>
        </section>
      );
    }
  }

  // -----------------------------------------
  // CREATE PROFILE
  // -----------------------------------------
  if (!profile) {
    return (
      <section className="page-card">
        <p className="eyebrow">Profile</p>

        <h1>Create Your Profile</h1>

        <p>
          Please enter your name and phone number.
          Your email is already linked to your
          account.
        </p>

        <div
          className="info-card"
          style={{
            marginTop: '1.5rem',
            maxWidth: '400px',
          }}
        >
          <ul className="data-list compact">
            <li>
              <strong>Email</strong>
              <span>
                {customerEmail || 'Not available'}
              </span>
            </li>
          </ul>
        </div>

        {error && (
          <p className="form-message error-message">
            {error}
          </p>
        )}

        {success && (
          <p className="form-message success-message">
            {success}
          </p>
        )}

        <form
          className="auth-form"
          onSubmit={handleSave}
          style={{
            marginTop: '1.5rem',
            maxWidth: '400px',
          }}
        >
          <label className="field">
            <span>Full name</span>

            <input
              type="text"
              value={fullName}
              onChange={(event) =>
                setFullName(event.target.value)
              }
              placeholder="Your full name"
              disabled={isSaving}
            />
          </label>

          <label className="field">
            <span>Phone number</span>

            <input
              type="tel"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              placeholder="03XX-XXXXXXX"
              disabled={isSaving}
            />
          </label>
          <label className="field">
  <span>City</span>

  <input
    type="text"
    value={city}
    onChange={(event) =>
      setCity(event.target.value)
    }
    placeholder="Your city"
    disabled={isSaving}
  />
</label>

<label className="field">
  <span>Cargo</span>

  <input
    type="text"
    value={cargo}
    onChange={(event) =>
      setCargo(event.target.value)
    }
    placeholder="Your cargo"
    disabled={isSaving}
  />
</label>

          <button
            type="submit"
            className="header-button primary"
            style={{ marginTop: '1rem' }}
            disabled={isSaving}
          >
            {isSaving
              ? 'Creating...'
              : 'Create Profile'}
          </button>
        </form>
      </section>
    );
  }

  // -----------------------------------------
  // EXISTING PROFILE - VIEW MODE
  // -----------------------------------------
  if (!isEditing) {
    return (
      <section className="page-card">
        <p className="eyebrow">Profile</p>

        <h1>My Profile</h1>

        <p style={{ color: '#64748b' }}>
          {customerEmail}
        </p>

        {error && (
          <p className="form-message error-message">
            {error}
          </p>
        )}

        {success && (
          <p className="form-message success-message">
            {success}
          </p>
        )}

        <div
          className="info-card"
          style={{ marginTop: '1.5rem' }}
        >
          <ul className="data-list compact">
            <li>
              <strong>Full name</strong>
              <span>
                {profile.fullName}
              </span>
            </li>

            <li>
              <strong>Phone</strong>
              <span>
                {profile.phone}
              </span>
            </li>

            <li>
  <strong>City</strong>
  <span>{profile.city}</span>
</li>

<li>
  <strong>Cargo</strong>
  <span>{profile.cargo}</span>
</li>
          </ul>
        </div>

        <button
          type="button"
          className="header-button primary"
          style={{ marginTop: '1.5rem' }}
          onClick={() => {
            setError('');
            setSuccess('');
            setIsEditing(true);
          }}
        >
          Edit Profile
        </button>
      </section>
    );
  }

  // -----------------------------------------
  // EXISTING PROFILE - EDIT MODE
  // -----------------------------------------
  return (
    <section className="page-card">
      <p className="eyebrow">Profile</p>

      <h1>Edit Profile</h1>

      <p style={{ color: '#64748b' }}>
        {customerEmail}
      </p>

      {error && (
        <p className="form-message error-message">
          {error}
        </p>
      )}

      {success && (
        <p className="form-message success-message">
          {success}
        </p>
      )}

      <form
        className="auth-form"
        onSubmit={handleSave}
        style={{
          marginTop: '1.5rem',
          maxWidth: '400px',
        }}
      >
        <label className="field">
          <span>Full name</span>

          <input
            type="text"
            value={fullName}
            onChange={(event) =>
              setFullName(event.target.value)
            }
            placeholder="Your full name"
            disabled={isSaving}
          />
        </label>

        <label className="field">
          <span>Phone number</span>

          <input
            type="tel"
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value)
            }
            placeholder="03XX-XXXXXXX"
            disabled={isSaving}
          />
        </label>

        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          <button
            type="submit"
            className="header-button primary"
            disabled={isSaving}
          >
            {isSaving
              ? 'Saving...'
              : 'Save changes'}
          </button>

          <button
            type="button"
            className="header-button secondary"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

export default ProfilePage;