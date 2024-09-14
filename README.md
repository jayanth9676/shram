# Number Guessing Game

A full-stack web application featuring a number guessing game with user authentication, real-time score updates, and a leaderboard.

## Features

- User registration and authentication
- Number guessing game with adjustable difficulty levels
- Real-time score updates
- High score tracking
- Leaderboard displaying top players
- Responsive design for various screen sizes

## Tech Stack

### Frontend (@src)
- React.js
- CSS3 with custom animations
- WebSocket for real-time updates

### Backend (@server)
- Node.js
- Express.js
- MongoDB with Mongoose
- WebSocket for real-time communication
- JSON Web Tokens (JWT) for authentication

## Getting Started

### Prerequisites
- Node.js (v14 or later)
- MongoDB

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/number-guessing-game.git
   cd number-guessing-game
   ```

2. Install dependencies for both frontend and backend:
   ```bash
   npm install
   cd server
   npm install
   cd ..
   ```

3. Set up environment variables:
   Create a `.env` file in the `server` directory with the following content:
   ```bash
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

4. Start the backend server:
   ```bash
   cd server
   npm start
   ```

5. In a new terminal, start the frontend development server:
   ```bash
   cd src
   npm start
   ```

6. Open your browser and navigate to `http://localhost:3000` to play the game.

## Game Rules

1. Log in or register to start playing.
2. Choose a difficulty level (Easy, Medium, or Hard).
3. Guess the secret number within the given range.
4. Receive feedback on whether your guess is too high or too low.
5. Try to guess the number in as few attempts as possible to achieve a high score.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.