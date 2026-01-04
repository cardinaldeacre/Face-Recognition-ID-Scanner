const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const app = express();

// PENTING: Gunakan process.env.PORT untuk Deployment
const port = process.env.PORT || 3000; 

const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('./swagger');
const UserController = require('./controllers/UserController');
const permissionController = require('./controllers/PermissionController');
const AttendanceLogController = require('./controllers/AttendanceLogController');
const GateController = require('./controllers/GateController');

// Middleware
app.use(express.json());

// PERBAIKAN: Konfigurasi CORS yang lebih dinamis untuk Vercel
app.use(cors({
  origin: function (origin, callback) {
    // Mengizinkan request tanpa origin (seperti alat testing API)
    if (!origin) return callback(null, true);
    
    // Logika: Izinkan localhost ATAU domain yang mengandung '.vercel.app'
    const isLocal = origin.includes('localhost');
    const isVercel = origin.includes('.vercel.app');
    
    if (isLocal || isVercel) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Tambahan: Tangani preflight request untuk semua route
app.options('/*', cors());

app.use(cookieParser());

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