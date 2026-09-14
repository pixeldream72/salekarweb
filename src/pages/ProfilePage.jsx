import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../services/supabaseClient.js';

function ProfilePage() {
  const { session } = useAuth();
  const customerId = session?.user?.id;

  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!customerId) return;

      const { data, error: fetchError } = await supabase
        .from('customer_profile')
        .select('full_name, phone')
        .eq('id', customerId)
        .maybeSingle();

      if (!isMounted) return;

      if (!fetchError && data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
      }
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

    setIsSaving(true);

    try {
      const { error: updateError } = await supabase
        .from('customer_profile')
        .update({ full_name: fullName.trim(), phone: phone.trim() })
        .eq('id', customerId);

      if (updateError) {
        throw updateError;
      }

      setProfile({ full_name: fullName.trim(), phone: phone.trim() });
      setSuccess('Profile updated successfully.');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(profile?.full_name || '');
    setPhone(profile?.phone || '');
    setIsEditing(false);
    setError('');
  };

  if (!profile) {
    return (
      <section className="page-card">
        <p className="eyebrow">Profile</p>
        <h1>Loading...</h1>
      </section>
    );
  }

  return (
    <section className="page-card">
      <p className="eyebrow">Profile</p>
      <h1>My Profile</h1>
      <p style={{ color: '#64748b' }}>{session?.user?.email}</p>

      {!isEditing ? (
        <>
          <div className="info-card" style={{ marginTop: '1.5rem' }}>
            <ul className="data-list compact">
              <li>
                <strong>Full name</strong>
                <span>{profile.full_name}</span>
              </li>
              <li>
                <strong>Phone</strong>
                <span>{profile.phone}</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            className="header-button primary"
            style={{ marginTop: '1.5rem' }}
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </button>
        </>
      ) : (
        <form className="auth-form" onSubmit={handleSave} style={{ marginTop: '1.5rem', maxWidth: '400px' }}>
          <label className="field">
            <span>Full name</span>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your full name"
            />
          </label>

          <label className="field">
            <span>Phone number</span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="03XX-XXXXXXX"
            />
          </label>

          {error && <p className="form-message error-message">{error}</p>}
          {success && <p className="form-message success-message">{success}</p>}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" className="header-button primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
            <button type="button" className="header-button secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default ProfilePage;