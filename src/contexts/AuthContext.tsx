import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config'; // ✅ FIXED PATH
import { User } from '@/types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string, userType: 'driver' | 'rider' | 'both') => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from Firestore
  const fetchUserData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data() as User);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Signup function
  const signup = async (
    email: string,
    password: string,
    displayName: string,
    userType: 'driver' | 'rider' | 'both'
  ) => {
    try {
      // Set persistence first
      await setPersistence(auth, browserLocalPersistence);
      
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile
      await updateProfile(user, { displayName });

      // Create user document in Firestore
      const newUser: User = {
        uid: user.uid,
        email: user.email!,
        displayName,
        userType,
        rating: 5,
        totalRides: 0,
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', user.uid), newUser);
      setUserData(newUser);
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      // ✅ Set persistence BEFORE login
      await setPersistence(auth, browserLocalPersistence);
      
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      await fetchUserData(user.uid);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Better error messages
      let errorMessage = 'Failed to login';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later';
      }
      
      throw new Error(errorMessage);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
      setCurrentUser(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout');
    }
  };

  // ✅ Auth state listener with proper cleanup
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;

      if (user) {
        setCurrentUser(user);
        await fetchUserData(user.uid);
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      
      setLoading(false);
    });

    // Cleanup function
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};