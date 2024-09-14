import React, { useState, useEffect, useCallback } from 'react';
import Game from './components/Game';
import LoginForm from './components/LoginForm';
import RegistrationForm from './components/RegistrationForm';
import UserProfile from './components/UserProfile';
import Leaderboard from './components/Leaderboard';
import ErrorBoundary from './components/ErrorBoundary';
import { useGameAPI } from './hooks/useGameAPI';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const { apiCall, loading, error } = useGameAPI();
  const [leaderboardUpdateTrigger, setLeaderboardUpdateTrigger] = useState(0);

  const fetchUserData = useCallback(async () => {
    try {
      const userData = await apiCall('/users/me');
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [apiCall]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserData();
    }
  }, [fetchUserData]);

  const handleLogin = async (username, password) => {
    try {
      console.log('Attempting login for:', username);
      const { token, userId, username: loggedInUsername } = await apiCall('/users/login', 'POST', { username, password });
      console.log('Login successful, setting user data');
      localStorage.setItem('token', token);
      setUser({ id: userId, username: loggedInUsername });
      await fetchUserData();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleRegister = async (username, password) => {
    try {
      await apiCall('/users/register', 'POST', { username, password });
      console.log('Registration successful, attempting login');
      await handleLogin(username, password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const handleScoreUpdate = async (newScore) => {
    try {
      const result = await apiCall('/users/scores', 'POST', { score: newScore });
      setUser(prevUser => ({
        ...prevUser,
        highScore: result.highScore,
        pastScores: [...(prevUser.pastScores || []), { score: newScore, date: new Date() }]
      }));
      setLeaderboardUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Failed to update score:', error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <ErrorBoundary>
      <div className="App">
        {user ? (
          <>
            <UserProfile user={user} onLogout={handleLogout} />
            <Game 
              onScoreUpdate={handleScoreUpdate} 
              highScore={user.highScore} 
              username={user.username}
              leaderboardUpdateTrigger={leaderboardUpdateTrigger}
            />
          </>
        ) : (
          showRegistration ? (
            <RegistrationForm onRegister={handleRegister} onSwitch={() => setShowRegistration(false)} />
          ) : (
            <LoginForm onLogin={handleLogin} onSwitch={() => setShowRegistration(true)} />
          )
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;