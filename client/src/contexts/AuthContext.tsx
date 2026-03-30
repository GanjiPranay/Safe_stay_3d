import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'owner' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  register: (name: string, email: string, password: string, role: 'student' | 'owner') => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [user, setUser] = useState<User | null>(() => {
    // Initialize from localStorage immediately (not in useEffect)
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      try {
        return JSON.parse(storedUser);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          // Optional: Verify token with backend
          const res = await fetch(`${API}/api/profile`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          
          if (res.ok) {
            // Token is valid, keep user
            setUser(JSON.parse(storedUser));
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
          }
        } catch {
          // Network error, keep cached user (offline support)
          setUser(JSON.parse(storedUser));
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, [API]);

  const login = async (email: string, password: string): Promise<any> => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok && data.token) {
      const userData = data.user || data.data?.user;
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", data.token);
      setUser(userData);
      return userData;
    } else {
      throw new Error(data.message || "Invalid credentials");
    }
  };

  const register = async (name: string, email: string, password: string, role: 'student' | 'owner') => {
    const res = await fetch(`${API}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return data;
  };

  const refreshUser = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};