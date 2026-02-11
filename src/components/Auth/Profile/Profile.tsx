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

      // Only include vehicle info if user is a driver
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
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32"></div>
          
          {/* Profile Content */}
          <div className="px-8 pb-8">
            {/* Profile Photo */}
            <div className="relative -mt-16 mb-6">
              <div className="relative inline-block">
                <div className="h-32 w-32 rounded-full bg-white p-2 shadow-xl">
                  {userProfile.photoURL ? (
                    <img
                      src={userProfile.photoURL}
                      alt={userProfile.displayName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                      {userProfile.displayName.charAt(0)}
                    </div>
                  )}
                </div>
                <label
                  htmlFor="photo-upload"
                  className="absolute bottom-0 right-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition shadow-lg"
                >
                  {uploading ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{userProfile.displayName}</h1>
                  <p className="text-gray-600">{userProfile.email}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                      {userProfile.userType}
                    </span>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="h-5 w-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
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
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : isEditing ? 'Save' : 'Edit Profile'}
                </button>
              </div>

              {/* Editable Fields */}
              {isEditing ? (
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
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
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <input
                          type="text"
                          name="vehicle.model"
                          value={formData.vehicleInfo.model}
                          onChange={handleChange}
                          placeholder="Model"
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <input
                          type="text"
                          name="vehicle.year"
                          value={formData.vehicleInfo.year}
                          onChange={handleChange}
                          placeholder="Year"
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <input
                          type="text"
                          name="vehicle.color"
                          value={formData.vehicleInfo.color}
                          onChange={handleChange}
                          placeholder="Color"
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <input
                          type="text"
                          name="vehicle.licensePlate"
                          value={formData.vehicleInfo.licensePlate}
                          onChange={handleChange}
                          placeholder="License Plate"
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <input
                          type="number"
                          name="vehicle.seats"
                          value={formData.vehicleInfo.seats}
                          onChange={handleChange}
                          placeholder="Seats"
                          min="1"
                          max="8"
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  {userProfile.phoneNumber && (
                    <div>
                      <div className="text-sm text-gray-500">Phone</div>
                      <div className="text-gray-900">{userProfile.phoneNumber}</div>
                    </div>
                  )}
                  
                  {userProfile.bio && (
                    <div>
                      <div className="text-sm text-gray-500">Bio</div>
                      <div className="text-gray-900">{userProfile.bio}</div>
                    </div>
                  )}

                  {(userProfile.userType === 'driver' || userProfile.userType === 'both') && userProfile.vehicleInfo && (
                    <div>
                      <div className="text-sm text-gray-500 mb-2">Vehicle</div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><span className="text-gray-500">Make:</span> {userProfile.vehicleInfo.make || 'N/A'}</div>
                          <div><span className="text-gray-500">Model:</span> {userProfile.vehicleInfo.model || 'N/A'}</div>
                          <div><span className="text-gray-500">Year:</span> {userProfile.vehicleInfo.year || 'N/A'}</div>
                          <div><span className="text-gray-500">Color:</span> {userProfile.vehicleInfo.color || 'N/A'}</div>
                          <div><span className="text-gray-500">Plate:</span> {userProfile.vehicleInfo.licensePlate || 'N/A'}</div>
                          <div><span className="text-gray-500">Seats:</span> {userProfile.vehicleInfo.seats || 'N/A'}</div>
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
    </div>
  );
};
