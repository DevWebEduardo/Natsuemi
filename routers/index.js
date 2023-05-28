const Game = require('../models/game');
const Page = require('../models/page');
const Categorie = require('../models/categorie');
const Platform = require('../models/platform');
const Mode = require('../models/mode');
const router = require('express').Router();

router.get('/', async (req, res) => {
    try {
    const menuInfo = await Page.find().exec();
    const menu = menuInfo.map(menuInfo=> menuInfo.name).flat();
    const games = await Game.find().limit(12).exec();
    const gamesList = games.map((games) => ({
        name: games.name,
        description: games.description,
        page: games.page,
        image: games.image,
        mode: games.mode,
        categorie: games.categorie,
        platform: games.platform,
    }));
    const context = {
        'menu':menu,
        'games': gamesList,
    };
    res.render('index', context);
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
});

router.get('/about', async (req, res) => {
    const menuInfo = await Page.find().exec();
    const menu = menuInfo.map(menuInfo=> menuInfo.name).flat();
    context = {
        'menu':menu,
    }
    res.render('about', context)
});

module.exports = router;