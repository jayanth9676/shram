import React from 'react';
import { useSpring, animated } from 'react-spring';

function UserRank({ username, rank, totalPlayers }) {
  const animation = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { tension: 300, friction: 10 }
  });

  return (
    <animated.div style={animation} className="user-rank">
      <h3>Your Rank</h3>
      <div className="rank-display">
        <span className="rank-number">{rank}</span>
        <span className="rank-ordinal">{getOrdinal(rank)}</span>
      </div>
      <p>{username}</p>
      <p className="total-players">out of {totalPlayers} players</p>
    </animated.div>
  );
}

function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default UserRank;