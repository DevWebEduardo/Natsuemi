const router = require('express').Router();
const User = require('../models/account');
const bcrypt = require('bcrypt');
const login_middleware = require('../middleware/auth');
const passport = require('passport');
const Game = require('../models/game');
const Categorie = require('../models/categorie');
const Page = require('../models/page');
const Platform = require('../models/platform');
const Mode = require('../models/mode');
//To format ids from mongoose:
const db = require('../models/db');
const ObjectId = db.Types.ObjectId;
//Multer for image upload
const multer = require('multer');
const path = require('path');
const upload = multer({dest: path.join(__dirname, "../public/assets/games")});

router.get('/register', (req, res) => {
    User.countDocuments().then((count)=>{
        if (count > 0){
            req.flash('error_msg', "Just one Admin account is allowed.");
            res.redirect('/');
        }else{
            res.render('register', {layout:'login'});
        }
    });
});

router.post('/register', async (req, res) => {
        try{
            const count = await User.countDocuments();
            if (count > 0){
                req.flash('error_msg', "Just one Admin account is allowed.");
                res.redirect('/admin/login');
            }else{
                const { user, password, passwordconf } = req.body;
                if (!user || user.trim().length < 6) {
                    req.flash('error_msg', "User field is required and must have at least 6 characters.");
                    res.redirect('/admin/register');
                }
                if (!password || password.length < 8) {
                    req.flash('error_msg', "Password field is required and must have at least 8 characters.");
                    res.redirect('/admin/register');
                }
                if (!password || password !== passwordconf) {
                    req.flash('error_msg', "The passwords dont match.");
                    res.redirect('/admin/register');
                }
                const password_enc = await bcrypt.hash(password, 10);
                const account = new User({
                    'user': user,
                    'password': password_enc
                });
                await account.save();        
                res.redirect('/admin/login')
            }   
        }catch(err){
            context = {
                'error': err.toString(),
                layout:'login',
            }
            res.render('register',context);
        } 
});

router.get('/login', (req, res) => {
    if (req.isAuthenticated()){
        res.redirect('/admin/');
    }else{
        res.render('login', {layout:'login'});
    }
});

router.post('/login', (req, res, next) => {
    passport.authenticate("local", {
        successRedirect: '/admin/',
        failureRedirect: '/admin/login',
        failureFlash: true
    })(req, res, next);
});

router.get('/logout', (req, res, next)=>{
    req.logout((err)=>{
        if (err) { 
            return next(err);
        }
        res.redirect('/');
    });
});

//Painel

router.get('/', login_middleware, async (req, res) => {
    const game = await Game.find().sort('-date').limit(10);
    const games = game.map(game=>({
        page: game.page,
        name: game.name,
        id: game._id,
    }));
    context = {
        layout:'painel',
        'games': games,
    }
    res.render('painel', context);
}); 

//Games

router.get('/games', login_middleware, async (req, res) => {
    try{
        const game = await Game.find().sort('-date').limit(10).exec();
        const games = game.map(game=>({
            _id: game._id,
            name: game.name,
            page: game.page,
        }));
        Page.find().then((result)=>{
            const pages = result.map(result => result.name);
            context = {
                layout:'painel',
                'games': games,
                'pages': pages,
            }
            res.render('games', context);
        });
    }catch(err){
        req.flash("error_msg", err.toString());
        res.redirect('/admin/games');
    }
}); 

router.post('/new_game', login_middleware, async (req, res) => {
    try{
        const foundPages = await Page.countDocuments({name: req.body.pages});
        if(foundPages > 0){
            const page = await Page.find({name: req.body.pages}).exec();
            const platforms = page.map(page=> page.platforms).flat();
            const categorie = await Categorie.find().exec();
            const categories = categorie.map(categorie=> categorie.name);
            const mode = await Mode.find().exec();
            const modes = mode.map(mode=> mode.name);
            const context = {
                layout: 'painel',
                'page': req.body.pages,
                'platforms': platforms,
                'categories': categories,
                'modes': modes,
            }
            res.render('new_game', context);
        }else{
            req.flash("error_msg", "This page do not exist.");
            res.redirect('/admin/games');    
        }
    }catch(err){
        req.flash("error_msg", err.toString());
        res.redirect('/admin/games');
    }
}); 

router.post('/new_game/post/:page', login_middleware , upload.single('thumb'), async(req, res)=>{
    try{
        const foundPages = await Page.countDocuments({name : req.params.page}).exec();
        if (foundPages > 0){
            const page = await Page.find({name : req.params.page}).exec();
            const existingPlatforms = page.map(page=> page.platforms).flat();
            const categorie = await Categorie.find().exec();
            const existingCategories = categorie.map(categorie=>categorie.name).flat();
            const mode = await Mode.find().exec();
            const existingModes = mode.map(mode=>mode.name).flat();
            const formPlatforms = Array.isArray(req.body.platforms) ? req.body.platforms : [];
            const formCategories = Array.isArray(req.body.categories) ? req.body.categories : [];
            const formModes = Array.isArray(req.body.modes) ? req.body.modes : [];
            const missingPlatforms = formPlatforms.filter(formPlatforms=> !existingPlatforms.includes(formPlatforms));
            const missingCategories = formCategories.filter(formCategories=> !existingCategories.includes(formCategories));
            const missingModes = formModes.filter(formModes => !existingModes.includes(formModes));
            if(missingPlatforms.length === 0 && missingCategories.length === 0 && missingModes.length === 0 && req.file) {
                const new_game = new Game({
                    'page': req.params.page,
                    'name': req.body.game,
                    'description': req.body.description,
                    'image': req.file.filename,
                    'categorie': req.body.categories,
                    'platform': req.body.platforms,
                    'mode': req.body.modes,
                });
                await new_game.save();
                req.flash('success_msg', req.body.game + ' Created.');
                res.redirect('/admin/games');
            }else{
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                req.flash("error_msg", "Entered data is invalid.");
                res.redirect('/admin/games');    
            }
        }else{
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            req.flash("error_msg", "This page do not exist.");
            res.redirect('/admin/games');    
        }
    }catch(err){
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        req.flash("error_msg", err.toString());
        res.redirect('/admin/games');
    }
});

router.get('/game/edit/:id', login_middleware, async (req, res) => {
    try{
        const foundGame = await Game.countDocuments({_id : req.params.id}).exec();
        if(foundGame > 0){  
            const actualGame = await Game.findById(req.params.id).exec();
            const foundPageInfo = await Page.find({name: actualGame.page}).exec();
            const permitedPlatforms = foundPageInfo.map(foundPageInfo => foundPageInfo.platforms).flat();
            const foundCategoriesInfo = await Categorie.find().exec();
            const permitedCategories = foundCategoriesInfo.map(foundCategoriesInfo=>foundCategoriesInfo.name);
            const foundModesInfo = await Mode.find().exec();
            const permitedModes = foundModesInfo.map(foundModesInfo=>foundModesInfo.name);
            const actualInfo = {
                id: req.params.id,
                page: actualGame.page,
                name: actualGame.name,
                description: actualGame.description,
                categories: permitedCategories,
                platforms: permitedPlatforms,
                modes: permitedModes,
            };
            context = {
                layout:'painel',
                'actualInfo': actualInfo,

            }
            res.render('edit_game', context);
        }else{
            req.flash("error_msg", "This game do not exist.");
            res.redirect('/admin/games');
        }
    }catch(err){
        req.flash("error_msg", err.toString());
        res.redirect('/admin/games');
    }
}); 

router.post('/game/edit/:id', login_middleware, upload.single('thumb') ,async (req, res) => {
    try{
        const foundGames = await Game.countDocuments({_id : req.params.id}).exec();
        if (foundGames > 0){
            const actualGame = await Game.findById(req.params.id).exec();
            const page = await Page.find({name : actualGame.page}).exec();
            const existingPlatforms = page.map(page=> page.platforms).flat();
            const categorie = await Categorie.find().exec();
            const existingCategories = categorie.map(categorie=>categorie.name).flat();
            const mode = await Mode.find().exec();
            const existingModes = mode.map(mode=>mode.name).flat();
            const formPlatforms = Array.isArray(req.body.platforms) ? req.body.platforms : [];
            const formCategories = Array.isArray(req.body.categories) ? req.body.categories : [];
            const formModes = Array.isArray(req.body.modes) ? req.body.modes : [];
            const missingPlatforms = formPlatforms.filter(formPlatforms=> !existingPlatforms.includes(formPlatforms));
            const missingCategories = formCategories.filter(formCategories=> !existingCategories.includes(formCategories));
            const missingModes = formModes.filter(formModes => !existingModes.includes(formModes));
            if(missingPlatforms.length === 0 && missingCategories.length === 0 && missingModes.length === 0) {
                if(req.file){
                    await Game.findByIdAndUpdate(
                        req.params.id 
                        , {
                            'page': actualGame.page,
                            'name': req.body.game,
                            'description': req.body.description,
                            'image': req.file.filename,
                            'categorie': req.body.categories,
                            'platform': req.body.platforms,
                            'mode': req.body.modes,
                        })
                }else{
                    await Game.findByIdAndUpdate(
                        req.params.id 
                        , {
                            'page': actualGame.page,
                            'name': req.body.game,
                            'description': req.body.description,
                            'categorie': req.body.categories,
                            'platform': req.body.platforms,
                            'mode': req.body.modes,
                        })
                }
                req.flash('success_msg', req.body.game + ' Updated.');
                res.redirect('/admin/games');
            }else{
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                req.flash("error_msg", "Entered data is invalid.");
                res.redirect('/admin/games');    
            }
        }else{
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            req.flash("error_msg", "This game do not exist.");
            res.redirect('/admin/games');    
        }
    }catch(err){
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        req.flash("error_msg", err.toString());
        res.redirect('/admin/games');
    }
}); 

router.get('/game/delete/:id', login_middleware, async(req, res)=>{
    try{
        const check = await Game.countDocuments({_id : req.params.id}).exec();
        if (check > 0){
            await Game.findByIdAndDelete(req.params.id).exec();
            req.flash('success_msg', 'Removed with sucess');
            res.redirect('/admin/games');
        }else{
            req.flash('error_msg', 'This game do not exists.');
            res.redirect('/admin/games');
        }
    }catch(err){
        req.flash('error_msg', err.toString());
        res.redirect('/admin/games');
    }
});

//Pages

router.get('/pages', login_middleware, async (req, res) => {
    try{
        Page.find().sort('-date').limit(10).then((response)=>{
            const pages = response.map(response => ({
                _id: response._id,
                name: response.name,
                categories: response.categories,
                platforms: response.platforms,
              }));
        context = {
            layout:'painel',
            'pages': pages,
        }
        res.render('pages', context);
    })
    }catch(err){
        req.flash('error_msg', err.toString());
        res.redirect('/admin/pages');
    }
}); 

router.get('/new_page', login_middleware, async (req, res) => {
    try{
        Platform.find().then((result)=>{
            const platforms = result.map(result=>({
                name: result.name,
            }))
            context = {
                layout:'painel',
                'platforms': platforms,
            }
            res.render('new_page', context);
        });
    }catch(err){
        req.flash('error_msg', err.toString());
        res.redirect('/admin/pages');
    }   
}); 

router.post('/new_page', login_middleware, async (req, res) => {
    try{
        var new_page = new Page({
            'name': req.body.name,
            'platforms': req.body.platforms,
        });
        await new_page.save();
        req.flash('success_msg', req.body.name + " Created");
        res.redirect('/admin/pages');
    }catch(err){
        req.flash('error_msg', err.toString());
        res.redirect('/admin/new_page');
    }
});

router.get('/page/edit/:id', login_middleware, async (req, res)=>{
    try{
        Platform.find().then(response => {
            var platforms = response.map(response => response.name);
            Page.findOne({_id : req.params.id}).then((response)=>{
                const page = {
                    _id: response._id,
                    name: response.name,
                    platforms: platforms
                };            
                context = {
                    page: page,
                    layout: 'painel',
                }
                res.render('edit_page', context);
            });
        })
    }catch(err){
        req.flash('error_msg', err.toString());
        res.redirect('/admin/page/edit/' + req.params.id);
    }
});

router.post('/page/edit/:id', login_middleware, async (req, res)=>{
    try{
        const platforms = Array.isArray(req.body.platforms) ? req.body.platforms : [];
        const foundPlatforms = await Platform.find({ name: { $in: platforms } }).exec();
        const existingPlatforms = foundPlatforms.map(platform => platform.name);
        const missingPlatforms = platforms.filter(platform => !existingPlatforms.includes(platform));    
        if (!missingPlatforms.length > 0){
            Page.findByIdAndUpdate(req.params.id, {name: req.body.name, platforms: req.body.platforms}, {new:true}).then((success)=>{
                if(success){
                    req.flash('success_msg', req.body.name + " Updated.");
                    res.redirect('/admin/pages');
                }else{
                    req.flash('error_msg', "Update error.");
                    res.redirect('/admin/page/edit/' + req.params.id);
                }
            })
        }else{
            req.flash('error_msg', "This platform does not exists.");
            res.redirect('/admin/page/edit/' + req.params.id);
        }
    }catch(err){
        req.flash('error_msg', err.toString());
        res.redirect('/admin/page/edit/' + req.params.id);
    }
});

router.get('/page/delete/:id', login_middleware, async(req, res)=>{
    try{
        const check = await Page.countDocuments({_id : req.params.id}).exec();
        if (check > 0){
            await Page.findByIdAndDelete(req.params.id).exec();
            req.flash('success_msg', 'Removed with sucess');
            res.redirect('/admin/pages');
        }else{
            req.flash('error_msg', 'This page do not exists.');
            res.redirect('/admin/pages');
        }
    }catch(err){
        req.flash('error_msg', err.toString());
        res.redirect('/admin/pages');
    }
});

//Platform

router.get('/platforms', login_middleware, async (req, res) => {
    try{
        Platform.find().then((response)=>{
            const platforms = response.map(response => ({
                _id: response._id,
                name: response.name,
              }));
        context = {
            layout:'painel',
            'platforms': platforms,
        }
        res.render('platform', context);
    })
    }catch(err){
        req.flash('error_msg', err.toString());
        res.redirect('/admin/platform');
    }
});

router.get('/new_platform', login_middleware, async (req, res) => {
    try{
        Page.find().then((result)=>{
            const pages = result.map(result=>({
                pages : result.name,
                id : result._id.toString(),
            }))
            context = {
                'pages':pages,
                layout:'painel',
            }
            res.render('new_platform', context);
        });
    }catch(err){
        req.flash('error_msg', err.toString());
        res.redirect('/admin/platform');
    }
}); 

router.post('/new_platform', login_middleware, async (req, res) => {
    try{
        var new_platform = new Platform({
            'name': req.body.name,
        });
        await new_platform.save();
        req.flash('success_msg', req.body.name + ' Created');
        res.redirect('/admin/platforms');
    }catch(err){
        req.flash('error_msg', err.toString());
        res.redirect('/admin/new_platform');
    }
});

router.get('/platform/delete/:id', login_middleware, (req, res)=>{
    try{
        Platform.findByIdAndDelete(req.params.id).then(()=>{
            req.flash('success_msg', 'Removed with sucess.');
            res.redirect('/admin/platforms');
        })
    }catch(err){
        req.flash('error_msg', err.toString());
        res.redirect('/admin/platforms');
    }
});

//Categories

router.get('/categories', login_middleware, async (req, res) => {
    try{
        Categorie.find().then((response)=>{
            const categories = response.map(response => ({
                _id: response._id,
                name: response.name,
              }));
        context = {
            layout:'painel',
            'categories': categories,
        }
        res.render('categories', context);
    })
    }catch(err){
        req.flash('error_msg', err.toString());
        res.redirect('/admin/categorie');
    }
}); 

router.get('/new_categorie', login_middleware, async (req, res) => {
    try{
        Page.find().then((result)=>{
            const pages = result.map(result=>({
                pages : result.name,
                id : result._id.toString(),
            }))
            context = {
                'pages':pages,
                layout:'painel',
            }
            res.render('new_categorie', context);
        });
    }catch(err){
        req.flash('error_msg', err.toString());
        res.redirect('/admin/categorie');
    }
}); 

router.post('/new_categorie', login_middleware, async (req, res) => {
    try{
        var new_categorie = new Categorie({
            'name': req.body.name,
        });
        await new_categorie.save();
        req.flash('success_msg', req.body.name + " Created");
        res.redirect('/admin/categories');
    }catch(err){
        req.flash('error_msg', err.toString());
        res.redirect('/admin/new_categorie');
    }
});

router.get('/categorie/delete/:id', login_middleware, (req, res)=>{
    try{
        Categorie.findByIdAndDelete(req.params.id).then(()=>{
            req.flash('success_msg', 'Removed with sucess.');
            res.redirect('/admin/categories');
        })
    }catch(err){
        req.flash('error_msg', err.toString());
        res.redirect('/admin/categories');
    }
});

//Modes

router.get('/modes', login_middleware, async (req, res) => {
    try{
        Mode.find().then((response)=>{
            const modes = response.map(response => ({
                _id: response._id,
                name: response.name,
              }));
        context = {
            layout:'painel',
            'modes': modes,
        }
        res.render('modes', context);
    })
    }catch(err){
        req.flash('error_msg', err.toString());
        res.redirect('/admin/modes');
    }
}); 

router.get('/new_mode', login_middleware, async (req, res) => {
    try{
        Page.find().then((result)=>{
            const modes = result.map(result=>({
                name : result.name,
                id : result._id.toString(),
            }))
            context = {
                'modes': modes,
                layout:'painel',
            }
            res.render('new_mode', context);
        });
    }catch(err){
        req.flash('error_msg', err.toString());
        res.redirect('/admin/modes');
    }
}); 

router.post('/new_mode', login_middleware, async (req, res) => {
    try{
        var new_mode = new Mode({
            'name': req.body.name,
        });
        await new_mode.save();
        req.flash('success_msg', req.body.name + " Created");
        res.redirect('/admin/modes');
    }catch(err){
        req.flash('error_msg', err.toString());
        res.redirect('/admin/new_mode');
    }
});

router.get('/mode/delete/:id', login_middleware, (req, res)=>{
    try{
        Mode.findByIdAndDelete(req.params.id).then(()=>{
            req.flash('success_msg', 'Removed with sucess.');
            res.redirect('/admin/modes');
        })
    }catch(err){
        req.flash('error_msg', err.toString());
        res.redirect('/admin/modes');
    }
});

module.exports = router;