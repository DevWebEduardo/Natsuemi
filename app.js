const express = require('express');
const app = express();
const engine = require('express-handlebars').engine;
const bodyParser = require('body-parser');
const indexRouter = require('./routers/index');
const adminRouter = require('./routers/painel');
const categorieRouter = require('./routers/categories');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');

app.use(session({
    secret:'asd',
    resave:true,
    saveUninitialized:true
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport.js')(passport);
app.use((req, res, next)=>{
    res.locals.error_msg = req.flash('error_msg');
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error = req.flash("error");
    res.locals.user = req.user || null;
    return next();
});

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views')

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter);
app.use('/page/', categorieRouter);
app.use('/admin/', adminRouter);

app.listen('9914', () => {
    console.log('SERVER: Online');
});
