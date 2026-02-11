import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Ride } from '../../../types';

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
    pricePerSeat: 0,
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !userProfile) {
      toast.error('Please login first');
      return;
    }

    if (!formData.from || !formData.to || !formData.date || !formData.time) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const rideData: Omit<Ride, 'id'> = {
        driverId: currentUser.uid,
        driverName: userProfile.displayName,
        driverPhoto: userProfile.photoURL,
        driverRating: userProfile.rating,
        from: formData.from,
        to: formData.to,
        date: new Date(formData.date),
        time: formData.time,
        availableSeats: formData.availableSeats,
        pricePerSeat: formData.pricePerSeat,
        description: formData.description,
        vehicleInfo: userProfile.vehicleInfo,
        status: 'upcoming',
        createdAt: new Date(),
        passengers: [],
      };

      await addDoc(collection(db, 'rides'), {
        ...rideData,
        date: formData.date,
        createdAt: new Date().toISOString(),
      });

      toast.success('Ride posted successfully!');
      navigate('/my-rides');
    } catch (error) {
      console.error('Error posting ride:', error);
      toast.error('Failed to post ride');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'availableSeats' || name === 'pricePerSeat' ? Number(value) : value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Post a Ride</h1>
          
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
