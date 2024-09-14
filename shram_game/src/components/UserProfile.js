import React from 'react';

function UserProfile({ user, onLogout }) {
  const recentScores = user.pastScores
    ? [...user.pastScores]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
    : [];

  return (
    <div className="user-profile">
      <h2>Welcome, {user.username}!</h2>
      <p>High Score: {user.highScore}</p>
      <h3>Recent Scores (Last 5):</h3>
      <ul>
        {recentScores.map((score, index) => (
          <li key={index}>{score.score} - {new Date(score.date).toLocaleString()}</li>
        ))}
      </ul>
      <button onClick={onLogout}>Logout</button>
    </div>
  );
}

export default UserProfile;