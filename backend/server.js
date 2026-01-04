const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const app = express();

const port = process.env.PORT || 3000; 

const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('./swagger');
const UserController = require('./controllers/UserController');
const permissionController = require('./controllers/PermissionController');
const AttendanceLogController = require('./controllers/AttendanceLogController');
const GateController = require('./controllers/GateController');

// 1. Middleware dasar
app.use(express.json());

// 2. Middleware CORS (Ini sudah otomatis menangani OPTIONS/Preflight)
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.includes('localhost') || origin.includes('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());

// 3. Penempatan Route
app.use('/api/user', UserController);
app.use('/api/permission', permissionController);
app.use('/api/attendance', AttendanceLogController);
app.use('/api/gate', GateController);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
    res.send('Backend Server is running on Cloud.');
});

// Run server
app.listen(port, "0.0.0.0", () => {
    console.log(`Server is listening on port ${port}`);
});