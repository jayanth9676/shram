import React, { useState, useEffect, useCallback } from 'react';
import { useGameAPI } from '../hooks/useGameAPI';
import { useSpring, animated } from 'react-spring';

function Leaderboard({ currentUser, onRankChange }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [userScore, setUserScore] = useState(null);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const { apiCall } = useGameAPI();

  const fetchLeaderboard = useCallback(async () => {
    try {
      const data = await apiCall('/leaderboard');
      setLeaderboard(data.topTen);
      setUserRank(data.userRank);
      setUserScore(data.userScore);
      setTotalPlayers(data.totalPlayers);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchLeaderboard();

    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'LEADERBOARD_UPDATE' || data.type === 'SCORE_UPDATE') {
        fetchLeaderboard();
        if (data.username !== currentUser && userRank && data.oldRank < userRank && data.newRank >= userRank) {
          console.log(`Rank change detected: ${data.username} overtook ${currentUser}`);
          onRankChange(data.username, data.newRank);
        }
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [fetchLeaderboard, currentUser, userRank, onRankChange]);

  const animation = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { tension: 300, friction: 10 }
  });

  const isUserInTop10 = leaderboard.some(player => player.username === currentUser);

  return (
    <animated.div style={animation} className="leaderboard">
      <h2>Top 10 Players</h2>
      <ol>
        {leaderboard.map((player, index) => (
          <li key={index} className={player.username === currentUser ? 'current-user' : ''}>
            {player.username} - {player.highScore}
          </li>
        ))}
		{/* {
			!isUserInTop10 && userRank && (
				<li className="current-user">
					{userRank}. {currentUser} - {userScore}
				</li>
			)
		} */}
      </ol>
      {/* {userRank && (
        <div className="user-rank">
          <h3>Your Rank: {userRank}</h3>
        </div>
      )} */}
      {!isUserInTop10 && userRank && (
        <div className="current-user-rank">
          <p className="user-rank-row current-user">
            {userRank}. {currentUser} - {userScore}
          </p>
        </div>
      )}
      <p className="total-players">Total Players: {totalPlayers}</p>
    </animated.div>
  );
}

export default Leaderboard;