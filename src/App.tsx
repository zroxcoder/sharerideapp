import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Auth/Layout/Navbar';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { Home } from './components/Auth/Home/Home';
import { PostRide } from './components/Auth/Rides/PostRide';
import { FindRide } from './components/Auth/Rides/FindRide';
import { MyRides } from './components/Auth/Rides/MyRides';
import { ChatList } from './components/Auth/Chat/ChatList';
import { Profile } from './components/Auth/Profile/Profile';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return !currentUser ? <>{children}</> : <Navigate to="/" />;
};

function AppRoutes() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <div className="min-h-screen">
          <Navbar />
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/post-ride" element={<PrivateRoute><PostRide /></PrivateRoute>} />
            <Route path="/find-rides" element={<PrivateRoute><FindRide /></PrivateRoute>} />
            <Route path="/my-rides" element={<PrivateRoute><MyRides /></PrivateRoute>} />
            <Route path="/chat" element={<PrivateRoute><ChatList /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export function App() {
  return <AppRoutes />;
}
