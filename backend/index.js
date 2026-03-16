const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db');

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json());
app.use(cors());
// Serve uploaded files (chat images, etc.) as static assets
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/modules', require('./routes/modules'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/backup', require('./routes/backup'));

app.get('/', (req, res) => res.send('Creoed LMS API Running'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
