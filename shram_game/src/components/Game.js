import React, { useState, useEffect, useCallback } from 'react';
import Confetti from 'react-confetti';
import { useSpring, animated } from 'react-spring';
import Leaderboard from './Leaderboard';

function Game({ onScoreUpdate, highScore, username }) {
  const [targetNumber, setTargetNumber] = useState(0);
  const [guess, setGuess] = useState('');
  const [message, setMessage] = useState('');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isNearHighScore, setIsNearHighScore] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'newGame'
  const [wsConnection, setWsConnection] = useState(null);
  const [realtimeScores, setRealtimeScores] = useState({});
  const [toast, setToast] = useState(null);
  const [totalPlayers, setTotalPlayers] = useState(0);

  const getDifficultyRange = useCallback(() => {
    switch (difficulty) {
      case 'easy': return { min: 1, max: 50 };
      case 'hard': return { min: 1, max: 200 };
      default: return { min: 1, max: 100 };
    }
  }, [difficulty]);

  const startNewGame = useCallback(() => {
    const { min, max } = getDifficultyRange();
    setTargetNumber(Math.floor(Math.random() * (max - min + 1)) + min);
    setGuess('');
    setMessage('');
    setAttempts(0);
    setScore(0);
    setIsNearHighScore(false);
    setGameState('playing');
  }, [getDifficultyRange]);

  useEffect(() => {
    const wsUrl = process.env.REACT_APP_WS_URL || 'wss://shram.onrender.com';
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnection(ws);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'SCORE_UPDATE') {
        setRealtimeScores(prev => {
          const newScores = {
            ...prev,
            [data.username]: data.score
          };
          // Check if the updated score is higher than the current user's high score
          if (data.username !== username && data.score > highScore) {
            setToast(`${data.username} has beaten your high score with ${data.score} points!`);
            // Hide the toast after 3 seconds
            setTimeout(() => setToast(null), 3000);
          }
          return newScores;
        });
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [highScore, username]);

  const sendScoreUpdate = useCallback((newScore) => {
    if (wsConnection) {
      wsConnection.send(JSON.stringify({
        type: 'UPDATE_SCORE',
        username,
        score: newScore
      }));
    }
  }, [wsConnection, username]);

  const handleGuess = async (e) => {
    e.preventDefault();
    const userGuess = parseInt(guess);
    setAttempts(prevAttempts => prevAttempts + 1);

    if (userGuess === targetNumber) {
      const newScore = calculateScore();
      setMessage('Congratulations! You guessed the number!');
      setScore(newScore);
      sendScoreUpdate(newScore);
      setGameState('won');
      try {
        await onScoreUpdate(newScore);
        if (newScore > highScore) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      } catch (error) {
        console.error('Failed to update score:', error);
        setMessage('Congratulations! You guessed the number, but there was an error saving your score.');
      }
    } else {
      const hint = userGuess < targetNumber ? 'Too low!' : 'Too high!';
      const distance = Math.abs(userGuess - targetNumber);
      const { max } = getDifficultyRange();
      const closeness = distance <= max * 0.1 ? ` You're getting close!` : '';
      setMessage(`${hint}${closeness} Try again.`);
      setIsNearHighScore(score > highScore * 0.8);
    }
    setGuess('');
  };

  const calculateScore = useCallback(() => {
    const { max } = getDifficultyRange();
    const baseScore = max - attempts;
    const difficultyMultiplier = difficulty === 'easy' ? 1 : difficulty === 'hard' ? 3 : 2;
    return Math.max(0, baseScore * difficultyMultiplier);
  }, [getDifficultyRange, attempts, difficulty]);

  const pulseAnimation = useSpring({
    transform: isNearHighScore ? 'scale(1.05)' : 'scale(1)',
    config: { tension: 300, friction: 10 },
  });

  const gameAnimation = useSpring({
    opacity: gameState === 'won' ? 0.8 : 1,
    transform: gameState === 'won' ? 'scale(1.05)' : 'scale(1)',
    config: { tension: 300, friction: 10 },
  });

  useEffect(() => {
    startNewGame();
  }, [difficulty, startNewGame]);

  const renderRealtimeScores = () => (
    <div className="realtime-scores">
      <h3>Real-time Scores</h3>
      <ul>
        {Object.entries(realtimeScores).map(([user, score]) => (
          <li key={user}>{user}: {score}</li>
        ))}
      </ul>
    </div>
  );

  const renderToast = () => {
    if (!toast) return null;
    return (
      <div className="toast">
        {toast}
      </div>
    );
  };

  const fadeIn = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { duration: 1000 }
  });

  const handleRankChange = useCallback((playerName, newRank) => {
    setToast(`🏆 ${playerName} has overtaken you! They are now rank ${newRank}. 🏆`);
    // Increase the duration to 5 seconds
    setTimeout(() => setToast(null), 5000);
  }, []);

  return (
    <animated.div style={fadeIn} className={`game ${isNearHighScore ? 'near-high-score' : ''}`}>
      {showConfetti && <Confetti />}
      {toast && <div className="toast">{toast}</div>}
      <h1>Number Guessing Game</h1>
      <div className="game-container">
        <div className="game-area">
          <div className="difficulty-selector">
            <label htmlFor="difficulty">Difficulty: </label>
            <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div className="game-content">
            <div className="game-info">
              {gameState === 'won' ? (
                <div className="game-over">
                  <p>Congratulations! You guessed the number {targetNumber}!</p>
                  <p className="current-score">Your score: {score}</p>
                  <p className="attempts">Attempts: {attempts}</p>
                  <button onClick={() => setGameState('newGame')}>Play Again</button>
                </div>
              ) : gameState === 'newGame' ? (
                <div className="new-game">
                  <p>Ready for a new game?</p>
                  <button onClick={startNewGame}>Start New Game</button>
                </div>
              ) : (
                <>
                  <p>Guess a number between {getDifficultyRange().min} and {getDifficultyRange().max}</p>
                  <p className="message">{message}</p>
                  <p className="attempts">Attempts: {attempts}</p>
                  <p className="current-score">Current Score: {score}</p>
                </>
              )}
              <p className="high-score">High Score: {highScore}</p>
            </div>
            <div className="game-controls">
              <form onSubmit={handleGuess} className="guess-input">
                <input
                  type="number"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  min={getDifficultyRange().min}
                  max={getDifficultyRange().max}
                  required
                />
                <button type="submit">Guess</button>
              </form>
            </div>
          </div>
          {renderRealtimeScores()}
        </div>
        <Leaderboard currentUser={username} onRankChange={handleRankChange} />
      </div>
    </animated.div>
  );
}

export default Game;