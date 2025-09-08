import React, { createContext, useState, useContext, useEffect } from 'react';
import personIcon from '../images/person_icon.png'; // Import the local image

// Create the Auth Context
const AuthContext = createContext();


// Custom hook to use the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check localStorage for existing token on app load
    useEffect(() => {
        const token = localStorage.getItem('esports_token');
        const userData = localStorage.getItem('esports_user');

        if (token && userData) {
            const userObj = JSON.parse(userData);
            // Ensure the avatar uses our local image
            userObj.avatar = personIcon;
            setUser(userObj);
        }
        setLoading(false);
    }, []);

    // Simulated login function
    const login = async (email, password) => {
        try {
            if (email && password) {
                const mockUser = {
                    id: 1,
                    email: email,
                    name: 'eSports Analyst',
                    role: 'analyst',
                    avatar: personIcon, // Use the local image here
                };

                const mockToken = 'mock_jwt_token_12345';

                localStorage.setItem('esports_token', mockToken);
                localStorage.setItem('esports_user', JSON.stringify(mockUser));

                setUser(mockUser);
                return { success: true };
            }
            return { success: false, error: 'Please enter both email and password' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };
    const logout = () => {
        localStorage.removeItem('esports_token');
        localStorage.removeItem('esports_user');
        setUser(null);
    };

    const value = {
        user,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;