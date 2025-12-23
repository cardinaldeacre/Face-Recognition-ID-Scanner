const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const app = express();
const port = 3000;
const UserController = require('./controllers/UserController');
const permissionController = require('./controllers/PermissionController');
const AttendanceLogController = require('./controllers/AttendanceLogController');
const GateController = require('./controllers/GateController');

// Middleware
app.use(express.json());
app.use(
	cors({
		origin: 'http://localhost:5173',
		credentials: true,
	})
);
app.use(cookieParser());

app.use('/api/user', UserController);
app.use('/api/permission', permissionController);
app.use('/api/attendance', AttendanceLogController);
app.use('/api/gate', GateController);

app.get('/api/', (req, res) => {
	res.send('Backend Server is running.');
});

// Run server
app.listen(port, () => {
	console.log(`Server is listening on http://localhost:${port}`);
});
