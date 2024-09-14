const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const WebSocket = require('ws');

exports.register = async (req, res) => {
  try {
    console.log('Registration attempt:', req.body.username);
    const { username, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ username, password: hashedPassword });
    await user.save();
    console.log('User registered successfully:', username);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, userId: user._id, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user data', error: error.message });
  }
};

exports.saveScore = async (req, res) => {
  try {
    const { score } = req.body;
    console.log('Received score:', score);
    console.log('User ID:', req.userId);
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const oldRank = await User.countDocuments({ highScore: { $gt: user.highScore } }) + 1;
    
    user.pastScores.push({ score, date: new Date() });
    if (score > user.highScore) {
      user.highScore = score;
    }
    
    await user.save();
    
    const newRank = await User.countDocuments({ highScore: { $gt: user.highScore } }) + 1;
    
    // After saving the score and updating the leaderboard
    const wss = req.app.get('wss');
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ 
          type: 'LEADERBOARD_UPDATE',
          username: user.username,
          score: score,
          oldRank: oldRank,
          newRank: newRank
        }));
      }
    });

    console.log('Score saved successfully');
    res.json({ highScore: user.highScore });
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({ message: 'Failed to save score', error: error.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const topTen = await User.find({}, 'username highScore')
      .sort({ highScore: -1 })
      .limit(10);

    let userRank = null;
    let userScore = null;
    const totalPlayers = await User.countDocuments();

    // Check if the request has a valid user ID
    if (req.userId) {
      const user = await User.findById(req.userId);
      if (user) {
        userScore = user.highScore;
        userRank = await User.countDocuments({ highScore: { $gt: user.highScore } }) + 1;
      }
    }

    res.json({ topTen, userRank, userScore, totalPlayers });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Error fetching leaderboard', error: error.message });
  }
};