const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const port = 3000;
const host = '0.0.0.0'; // Important: Listen on all interfaces

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Session configuration
app.use(session({
    secret: 'canteen-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24
    }
}));

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Demo data
const users = [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin', email: 'admin@college.com', created_at: new Date() },
    { id: 2, username: 'student', password: 'password', role: 'customer', email: 'student@college.com', created_at: new Date() }
];

const menuItems = [
    { id: 1, name: 'Chicken Biryani', price: 120, category: 'Main Course' },
    { id: 2, name: 'Veg Fried Rice', price: 80, category: 'Main Course' },
    { id: 3, name: 'Cold Coffee', price: 50, category: 'Beverages' }
];

let orders = [];
let orderIdCounter = 1;

// Routes
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/menu');
    } else {
        res.render('login', { error: null, success: null });
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        req.session.user = user;
        if (user.role === 'admin') {
            res.redirect('/admin');
        } else {
            res.redirect('/menu');
        }
    } else {
        res.render('login', { error: 'Invalid credentials', success: null });
    }
});

app.post('/register', (req, res) => {
    const { username, password, email } = req.body;
    
    if (users.find(u => u.username === username)) {
        return res.render('login', { error: 'Username exists', success: null });
    }
    
    const newUser = {
        id: users.length + 1,
        username,
        password,
        email,
        role: 'customer',
        created_at: new Date()
    };
    users.push(newUser);
    
    res.render('login', { error: null, success: 'Registration successful! Please login.' });
});

app.get('/menu', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    
    const menuByCategory = {};
    menuItems.forEach(item => {
        if (!menuByCategory[item.category]) menuByCategory[item.category] = [];
        menuByCategory[item.category].push(item);
    });
    
    res.render('menu', { user: req.session.user, menu: menuByCategory });
});

app.post('/order', (req, res) => {
    if (!req.session.user) return res.json({ success: false });
    
    const { items } = req.body;
    const order = {
        id: orderIdCounter++,
        user_id: req.session.user.id,
        username: req.session.user.username,
        items: [{ name: 'Test Item', quantity: 1, price: 100, total: 100 }],
        total_amount: 100,
        status: 'pending',
        order_date: new Date()
    };
    
    orders.push(order);
    res.json({ success: true, orderId: order.id });
});

app.get('/my-orders', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const studentOrders = orders.filter(order => order.user_id === req.session.user.id);
    res.render('student-orders', { user: req.session.user, orders: studentOrders });
});

app.get('/admin', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/');
    res.render('admin', { user: req.session.user, orders: orders });
});

app.post('/admin/update-status', (req, res) => {
    const { orderId, status } = req.body;
    const order = orders.find(o => o.id == orderId);
    if (order) order.status = status;
    res.json({ success: true });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Network test route
app.get('/network-test', (req, res) => {
    res.json({ 
        message: 'Server is running!',
        clientIp: req.ip,
        timestamp: new Date().toISOString()
    });
});

app.listen(port, host, () => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    
    console.log('🚀 Server started successfully!');
    console.log('📍 Local access:');
    console.log('   → http://localhost:' + port);
    console.log('   → http://127.0.0.1:' + port);
    
    console.log('📍 Network access (use these on other devices):');
    Object.keys(networkInterfaces).forEach(interfaceName => {
        networkInterfaces[interfaceName].forEach(interface => {
            if (interface.family === 'IPv4' && !interface.internal) {
                console.log('   → http://' + interface.address + ':' + port);
            }
        });
    });
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure devices are on same WiFi');
    console.log('   2. Try disabling firewall temporarily');
    console.log('   3. Test with: http://your-ip:3000/network-test');
});