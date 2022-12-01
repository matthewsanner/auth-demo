const express = require('express');
const app = express();
const User = require('./models/user');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');

mongoose.connect('mongodb://localhost:27017/loginDemo', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Mongo connection open!")
    })
    .catch(err => {
        console.log("Oh no, Mongo connection error!")
        console.log(err)
    })

app.listen(3000, () => {
    console.log('Serving your app!')
});

app.set('view engine', 'ejs');
app.set('views', 'views');

// parses request body
app.use(express.urlencoded({ extended: true }));

app.use(session({ secret: 'notagoodsecret', resave: false, saveUninitialized: false }))

const requireLogin = (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login')
    }
    next();
}
app.get('/', (req, res) => {
    res.send('This is the home page');
})
app.get('/register', (req, res) => {
    res.render('register');
})

app.post('/register', async (req, res) => {
    const { password, username } = req.body;
    // moving the hashing logic to the user model
    // const hash = await bcrypt.hash(password, 12);
    // const user = new User({
    //     username,
    //     password: hash
    // })
    const user = new User({ username, password })
    await user.save();
    req.session.user_id = user._id;
    res.redirect('/')
})

app.get('/login', (req, res) => {
    res.render('login');
})
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const foundUser = await User.findAndValidate(username, password)
    // removed and added onto the user model
    // const user = await User.findOne({ username });
    // const validPassword = await bcrypt.compare(password, user.password);
    if (foundUser) {
        req.session.user_id = foundUser._id;
        res.redirect('/secret')
    } else {
        res.redirect('/login')
    }
})

app.post('/logout', (req, res) => {
    req.session.user_id = null;
    // another option is to destroy the session
    // req.session.destroy();
    res.redirect('/login');
})

// added a middleware here to check for user id in the session, rather than doing it inside the route
app.get('/secret', requireLogin, (req, res) => {
    res.render('secret');
});

app.get('/topsecret', requireLogin, (req, res) => {
    res.send('Top secret!')
})