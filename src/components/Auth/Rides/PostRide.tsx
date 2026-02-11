import React, { useState, useEffect } from 'react';
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

  // DEBUG: Check everything on mount
  useEffect(() => {
    console.log('🔍 === DEBUG INFO ===');
    console.log('Current User:', currentUser);
    console.log('User ID:', currentUser?.uid);
    console.log('User Email:', currentUser?.email);
    console.log('User Profile:', userProfile);
    console.log('DB Instance:', db);
    console.log('DB Type:', typeof db);
    console.log('===================');
  }, [currentUser, userProfile]);

  // Test Firebase button
  const testFirebase = async () => {
    console.log('🧪 Testing Firebase connection...');
    try {
      const testData = {
        test: 'Hello Firebase',
        timestamp: Timestamp.now(),
        user: currentUser?.uid || 'no-user'
      };
      
      console.log('Test data:', testData);
      const docRef = await addDoc(collection(db, 'test'), testData);
      console.log('✅ Test SUCCESS! Doc ID:', docRef.id);
      toast.success(`Firebase works! Doc ID: ${docRef.id}`);
    } catch (error: any) {
      console.error('❌ Test FAILED:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      toast.error(`Test failed: ${error?.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('\n🚀 === STARTING RIDE POST ===');

    // Check authentication
    if (!currentUser) {
      console.error('❌ No current user');
      toast.error('Please login first');
      return;
    }
    console.log('✅ User authenticated:', currentUser.uid);

    // Check profile
    if (!userProfile) {
      console.warn('⚠️ No user profile, will use defaults');
    } else {
      console.log('✅ User profile loaded:', userProfile);
    }

    // Validate form
    if (!formData.from || !formData.to || !formData.date || !formData.time) {
      console.error('❌ Missing required fields');
      toast.error('Please fill in all required fields');
      return;
    }
    console.log('✅ Form validated');

    setIsLoading(true);
    
    try {
      // Build the data object
      const rideData = {
        // User info with fallbacks
        driverId: currentUser.uid,
        driverName: userProfile?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
        driverPhoto: userProfile?.photoURL || currentUser.photoURL || '',
        driverRating: typeof userProfile?.rating === 'number' ? userProfile.rating : 0,
        
        // Ride details
        from: formData.from.trim(),
        to: formData.to.trim(),
        date: Timestamp.fromDate(new Date(`${formData.date}T${formData.time}`)),
        time: formData.time,
        availableSeats: parseInt(String(formData.availableSeats)) || 1,
        pricePerSeat: parseFloat(String(formData.pricePerSeat)) || 0,
        description: formData.description.trim(),
        
        // Vehicle info with fallback
        vehicleInfo: userProfile?.vehicleInfo || {
          make: 'Not specified',
          model: 'Not specified',
          color: 'Not specified',
          licensePlate: 'Not specified'
        },
        
        // Status
        status: 'upcoming',
        createdAt: Timestamp.now(),
        passengers: [],
      };

      console.log('📦 Ride data prepared:', rideData);
      console.log('📦 Data types:', {
        driverId: typeof rideData.driverId,
        driverName: typeof rideData.driverName,
        date: rideData.date.constructor.name,
        availableSeats: typeof rideData.availableSeats,
        pricePerSeat: typeof rideData.pricePerSeat,
      });

      console.log('💾 Attempting to write to Firestore...');
      const docRef = await addDoc(collection(db, 'rides'), rideData);
      
      console.log('✅ SUCCESS! Ride posted with ID:', docRef.id);
      toast.success('Ride posted successfully!');
      
      // Reset form
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
      console.error('\n❌ === ERROR POSTING RIDE ===');
      console.error('Error object:', error);
      console.error('Error type:', error?.constructor?.name);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      // Try to stringify the error
      try {
        console.error('Error JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      } catch (e) {
        console.error('Could not stringify error');
      }
      
      // User-friendly error message
      let userMessage = 'Failed to post ride';
      
      if (error?.code === 'unavailable') {
        userMessage = 'Network error. Please check your internet connection.';
      } else if (error?.code === 'permission-denied') {
        userMessage = 'Permission denied. Please try logging out and back in.';
      } else if (error?.code === 'unauthenticated') {
        userMessage = 'Authentication error. Please login again.';
      } else if (error?.message) {
        userMessage = `Error: ${error.message}`;
      }
      
      toast.error(userMessage);
      console.error('=========================\n');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Post a Ride</h1>
          
          {/* DEBUG PANEL - Remove this after fixing */}
          <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <h3 className="font-bold text-yellow-900 mb-2">🔧 Debug Panel</h3>
            <div className="text-sm space-y-1 text-gray-700">
              <p>User Authenticated: {currentUser ? '✅ Yes' : '❌ No'}</p>
              <p>User ID: {currentUser?.uid || 'N/A'}</p>
              <p>User Email: {currentUser?.email || 'N/A'}</p>
              <p>Profile Loaded: {userProfile ? '✅ Yes' : '❌ No'}</p>
              <p>Profile Name: {userProfile?.displayName || 'N/A'}</p>
              <p>Database: {db ? '✅ Connected' : '❌ Not Connected'}</p>
            </div>
            <button
              type="button"
              onClick={testFirebase}
              className="mt-3 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm font-medium"
            >
              🧪 Test Firebase Connection
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="from" className="block text-sm font-medium text-gray-700 mb-1">
                  From <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="from"
                  name="from"
                  required
                  value={formData.from}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Starting location"
                />
              </div>

              <div>
                <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
                  To <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="to"
                  name="to"
                  required
                  value={formData.to}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Destination"
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  required
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label htmlFor="availableSeats" className="block text-sm font-medium text-gray-700 mb-1">
                  Available Seats
                </label>
                <select
                  id="availableSeats"
                  name="availableSeats"
                  value={formData.availableSeats}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="pricePerSeat" className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Seat ($)
                </label>
                <input
                  type="number"
                  id="pricePerSeat"
                  name="pricePerSeat"
                  min="0"
                  step="0.01"
                  value={formData.pricePerSeat}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                placeholder="Add any additional details about your ride..."
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Posting...' : 'Post Ride'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};