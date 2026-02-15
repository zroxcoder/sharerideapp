import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../firebase/config';
import { updateProfile } from 'firebase/auth';
import toast from 'react-hot-toast';

export const Profile: React.FC = () => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || '',
    phoneNumber: userProfile?.phoneNumber || '',
    bio: userProfile?.bio || '',
    vehicleInfo: userProfile?.vehicleInfo || {
      make: '',
      model: '',
      year: '',
      color: '',
      licensePlate: '',
      seats: 4,
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${currentUser.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      await updateProfile(currentUser, { photoURL });
      await updateUserProfile({ photoURL });

      toast.success('Profile photo updated!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!userProfile) return;

    setSaving(true);
    try {
      const updates: any = {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        bio: formData.bio,
      };

      if (userProfile.userType === 'driver' || userProfile.userType === 'both') {
        updates.vehicleInfo = formData.vehicleInfo;
      }

      await updateUserProfile(updates);
      
      if (currentUser) {
        await updateProfile(currentUser, { displayName: formData.displayName });
      }

      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('vehicle.')) {
      const vehicleField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        vehicleInfo: {
          ...prev.vehicleInfo,
          [vehicleField]: vehicleField === 'seats' ? Number(value) : value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-700 h-24"></div>
          
          <div className="px-6 pb-6">
            {/* Profile Photo */}
            <div className="relative -mt-12 mb-6">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                  {userProfile.photoURL ? (
                    <img
                      src={userProfile.photoURL}
                      alt={userProfile.displayName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-white text-3xl font-semibold">
                      {userProfile.displayName.charAt(0)}
                    </div>
                  )}
                </div>
                <label
                  htmlFor="photo-upload"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-black rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-800 transition shadow-lg"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{userProfile.displayName}</h1>
                <p className="text-gray-600 mt-1">{userProfile.email}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                    {userProfile.userType}
                  </span>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="text-yellow-500 mr-1">⭐</span>
                    {userProfile.rating?.toFixed(1) || '5.0'}
                  </div>
                  <span className="text-sm text-gray-600">
                    {userProfile.totalRides || 0} rides
                  </span>
                </div>
              </div>
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={saving}
                className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
              </button>
            </div>

            {/* Editable Fields */}
            {isEditing ? (
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                  />
                </div>

                {(userProfile.userType === 'driver' || userProfile.userType === 'both') && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="vehicle.make"
                        value={formData.vehicleInfo.make}
                        onChange={handleChange}
                        placeholder="Make"
                        className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      <input
                        type="text"
                        name="vehicle.model"
                        value={formData.vehicleInfo.model}
                        onChange={handleChange}
                        placeholder="Model"
                        className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      <input
                        type="text"
                        name="vehicle.year"
                        value={formData.vehicleInfo.year}
                        onChange={handleChange}
                        placeholder="Year"
                        className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      <input
                        type="text"
                        name="vehicle.color"
                        value={formData.vehicleInfo.color}
                        onChange={handleChange}
                        placeholder="Color"
                        className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      <input
                        type="text"
                        name="vehicle.licensePlate"
                        value={formData.vehicleInfo.licensePlate}
                        onChange={handleChange}
                        placeholder="License Plate"
                        className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      <input
                        type="number"
                        name="vehicle.seats"
                        value={formData.vehicleInfo.seats}
                        onChange={handleChange}
                        placeholder="Seats"
                        min="1"
                        max="8"
                        className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setIsEditing(false)}
                  className="text-gray-600 hover:text-gray-900 font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-6 border-t border-gray-200">
                {userProfile.phoneNumber && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Phone</div>
                    <div className="text-gray-900">{userProfile.phoneNumber}</div>
                  </div>
                )}
                
                {userProfile.bio && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Bio</div>
                    <div className="text-gray-900">{userProfile.bio}</div>
                  </div>
                )}

                {(userProfile.userType === 'driver' || userProfile.userType === 'both') && userProfile.vehicleInfo && (
                  <div>
                    <div className="text-sm text-gray-500 mb-2">Vehicle</div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-gray-500">Make:</span> <span className="font-medium">{userProfile.vehicleInfo.make || 'N/A'}</span></div>
                        <div><span className="text-gray-500">Model:</span> <span className="font-medium">{userProfile.vehicleInfo.model || 'N/A'}</span></div>
                        <div><span className="text-gray-500">Year:</span> <span className="font-medium">{userProfile.vehicleInfo.year || 'N/A'}</span></div>
                        <div><span className="text-gray-500">Color:</span> <span className="font-medium">{userProfile.vehicleInfo.color || 'N/A'}</span></div>
                        <div><span className="text-gray-500">Plate:</span> <span className="font-medium">{userProfile.vehicleInfo.licensePlate || 'N/A'}</span></div>
                        <div><span className="text-gray-500">Seats:</span> <span className="font-medium">{userProfile.vehicleInfo.seats || 'N/A'}</span></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};