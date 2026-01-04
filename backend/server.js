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

// PENTING: Update CORS untuk mengizinkan akses dari Vercel & Hugging Face
app.use(
    cors({
        origin: true, // Set 'true' sementara agar semua domain (Vercel/HF) bisa akses
        credentials: true,
    })
);
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