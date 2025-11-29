const jwt = require('jsonwebtoken');

// Replace with your actual user data and secret
const user = { id: 1, email: 'test@example.com' };
const secret = 'your_jwt_secret'; // Or use process.env.JWT_SECRET

const token = jwt.sign({ userId: user.id, email: user.email }, secret, { expiresIn: '1h' });
console.log('JWT Token:', token);