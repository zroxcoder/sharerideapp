import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';

export const PostRide: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    from: '',
    to: '',
    date: '',
    time: '',
    availableSeats: 1,
    pricePerSeat: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error('Please login first');
      return;
    }

    if (!formData.from || !formData.to || !formData.date || !formData.time) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const rideData = {
        driverId: currentUser.uid,
        driverName: userProfile?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
        driverPhoto: userProfile?.photoURL || currentUser.photoURL || '',
        driverRating: typeof userProfile?.rating === 'number' ? userProfile.rating : 0,
        from: formData.from.trim(),
        to: formData.to.trim(),
        date: Timestamp.fromDate(new Date(`${formData.date}T${formData.time}`)),
        time: formData.time,
        availableSeats: parseInt(String(formData.availableSeats)) || 1,
        pricePerSeat: parseFloat(String(formData.pricePerSeat)) || 0,
        description: formData.description.trim(),
        vehicleInfo: userProfile?.vehicleInfo || {
          make: 'Not specified',
          model: 'Not specified',
          color: 'Not specified',
          licensePlate: 'Not specified'
        },
        status: 'upcoming',
        createdAt: Timestamp.now(),
        passengers: [],
      };

      await addDoc(collection(db, 'rides'), rideData);
      
      toast.success('Ride posted successfully!');
      
      setFormData({
        from: '',
        to: '',
        date: '',
        time: '',
        availableSeats: 1,
        pricePerSeat: '',
        description: '',
      });
      
      setTimeout(() => navigate('/my-rides'), 1000);
      
    } catch (error: any) {
      let errorMessage = 'Failed to post ride. Please try again.';
      
      if (error?.code === 'unavailable') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error?.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please try logging out and back in.';
      } else if (error?.code === 'unauthenticated') {
        errorMessage = 'Authentication error. Please login again.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900">Post a ride</h1>
          <p className="text-gray-600 mt-1">Share your journey and earn money</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Route */}
          <div className="space-y-4">
            <div>
              <label htmlFor="from" className="block text-sm font-medium text-gray-900 mb-2">
                Pickup location
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                </div>
                <input
                  type="text"
                  id="from"
                  name="from"
                  required
                  value={formData.from}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  placeholder="Enter pickup location"
                />
              </div>
            </div>

            <div>
              <label htmlFor="to" className="block text-sm font-medium text-gray-900 mb-2">
                Dropoff location
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <div className="w-2 h-2 bg-black"></div>
                </div>
                <input
                  type="text"
                  id="to"
                  name="to"
                  required
                  value={formData.to}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  placeholder="Enter dropoff location"
                />
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-900 mb-2">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-900 mb-2">
                Time
              </label>
              <input
                type="time"
                id="time"
                name="time"
                required
                value={formData.time}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Seats & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="availableSeats" className="block text-sm font-medium text-gray-900 mb-2">
                Available seats
              </label>
              <select
                id="availableSeats"
                name="availableSeats"
                value={formData.availableSeats}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
              >
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pricePerSeat" className="block text-sm font-medium text-gray-900 mb-2">
                Price per seat
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  $
                </div>
                <input
                  type="number"
                  id="pricePerSeat"
                  name="pricePerSeat"
                  min="0"
                  step="0.01"
                  value={formData.pricePerSeat}
                  onChange={handleChange}
                  className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
              Additional details (optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none text-sm"
              placeholder="Add any preferences or additional information..."
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? 'Posting...' : 'Post ride'}
          </button>
        </form>
      </div>
    </div>
  );
};