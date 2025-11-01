import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { User, Phone, Mail, Camera, Moon, Sun, LogOut, Settings, AlertCircle, CheckCircle, Users, Plus, Trash2 } from 'lucide-react';

export function Profile() {
  const { profile, user, signOut, updateProfile } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone_number: profile?.phone_number || '',
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sharingContacts, setSharingContacts] = useState<Array<{ id?: number; name: string; phone: string }>>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '' });

  const handleUpdateProfile = async () => {
    setError('');
    setSuccess('');

    try {
      await updateProfile(formData);
      setSuccess('Profile updated successfully');
      setEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      await updateProfile({ profile_picture_url: publicUrl });
      setSuccess('Profile picture updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  useEffect(() => {
    loadSharingContacts();
  }, [profile]);

  const loadSharingContacts = async () => {
    if (!profile) return;

    const { data, error: fetchError } = await supabase
      .from('location_sharing_contacts')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: true });

    if (!fetchError && data) {
      setSharingContacts(data);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone) {
      setError('Please fill in all fields');
      return;
    }

    if (sharingContacts.length >= 3) {
      setError('You can only add up to 3 contacts');
      return;
    }

    setError('');
    try {
      const { error: insertError } = await supabase
        .from('location_sharing_contacts')
        .insert({
          user_id: profile!.id,
          name: newContact.name,
          phone: newContact.phone,
        });

      if (insertError) throw insertError;

      setSuccess('Contact added successfully');
      setNewContact({ name: '', phone: '' });
      setShowAddContact(false);
      loadSharingContacts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add contact');
    }
  };

  const handleRemoveContact = async (contactId: number) => {
    if (!confirm('Are you sure you want to remove this contact?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('location_sharing_contacts')
        .delete()
        .eq('id', contactId);

      if (deleteError) throw deleteError;

      setSuccess('Contact removed successfully');
      loadSharingContacts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove contact');
    }
  };

  return (
    <Layout title="Profile">
      <div className="px-4 py-6 max-w-2xl mx-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 mb-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center overflow-hidden">
                {profile?.profile_picture_url ? (
                  <img
                    src={profile.profile_picture_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-white" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-pink-500 hover:bg-pink-600 rounded-full cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2">
                <Camera className="w-5 h-5 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {editing ? (
              <div className="w-full space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border calm-pink-border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-4 py-2 border calm-pink-border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditing(false)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {profile?.full_name}
                </h2>
                <button
                  onClick={() => setEditing(true)}
                  className="text-pink-600 dark:text-pink-400 hover:underline text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                >
                  Edit Profile
                </button>
              </>
            )}
          </div>

          <div className="space-y-4 border-t dark:border-gray-700 pt-6">
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <Mail className="w-5 h-5" />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <Phone className="w-5 h-5" />
              <span>{profile?.phone_number}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white p-6 border-b dark:border-gray-700">
            <Users className="w-5 h-5 inline mr-2" />
            Location Sharing Contacts
          </h3>

          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Add up to 3 people who can see your location when you share it.
            </p>

            {sharingContacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No contacts added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sharingContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{contact.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{contact.phone}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveContact(contact.id!)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {sharingContacts.length < 3 && (
              <>
                {!showAddContact ? (
                  <button
                    onClick={() => setShowAddContact(true)}
                    className="w-full flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Contact
                  </button>
                ) : (
                  <div className="space-y-3 pt-4 border-t dark:border-gray-700">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={newContact.name}
                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                        className="w-full px-4 py-2 border calm-pink-border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Contact name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={newContact.phone}
                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                        className="w-full px-4 py-2 border calm-pink-border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Phone number"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowAddContact(false);
                          setNewContact({ name: '', phone: '' });
                          setError('');
                        }}
                        className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddContact}
                        className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white p-6 border-b dark:border-gray-700">
            <Settings className="w-5 h-5 inline mr-2" />
            Settings
          </h3>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Toggle dark theme
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
              >
                {isDark ? (
                  <Moon className="w-6 h-6 text-gray-900 dark:text-white" />
                ) : (
                  <Sun className="w-6 h-6 text-gray-900 dark:text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </Layout>
  );
}