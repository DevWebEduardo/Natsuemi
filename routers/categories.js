const Game = require('../models/game');
const Page = require('../models/page');
const Categorie = require('../models/categorie');
const Mode = require('../models/mode');
const router = require('express').Router();

router.get('/:section/', async (req, res) => {
    try {
      const confirm = await Page.countDocuments({ name: req.params.section }).exec();
      if (confirm === 0) {
        return res.redirect('/');
      }
      const page = await Page.find({ name: req.params.section }).exec();
      const platforms = page.map((page) => page.platforms).flat();
      const categorie = await Categorie.find().exec();
      const categories = categorie.map((categorie) => categorie.name).flat();
      const mode = await Mode.find().exec();
      const modes = mode.map((mode) => mode.name).flat();
      const menuInfo = await Page.find().exec();
      const menu = menuInfo.map((menuInfo) => menuInfo.name).flat();
      const actualPage = parseInt(req.query.page) || 1;
      const gamesPerPage = 12;
      const maxDisplayedPages = 5;
      const filter = {};
      const { categorieForm, platformForm, modeForm } = req.query;
      if (categorieForm && platformForm && modeForm) {
        filter.categorie = { $in: categorieForm };
        filter.platform = { $in: platformForm };
        filter.mode = { $in: modeForm };
      }
      const count = await Game.countDocuments(filter);
      const totalPages = Math.ceil(count / gamesPerPage);
      const games = await Game.find(filter).skip((actualPage - 1) * gamesPerPage).limit(gamesPerPage).exec();
      const gamesList = games.map((game) => ({
        name: game.name,
        description: game.description,
        page: game.page,
        image: game.image,
        mode: game.mode,
        categorie: game.categorie,
        platform: game.platform,
      }));
  
      let startPage = Math.max(1, actualPage - Math.floor(maxDisplayedPages / 2));
      let endPage = Math.min(startPage + maxDisplayedPages - 1, totalPages);
      if (endPage - startPage + 1 < maxDisplayedPages) {
        startPage = Math.max(1, endPage - maxDisplayedPages + 1);
      }
      const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
      const context = {
        menu,
        games: gamesList,
        pages: totalPages > 1 ? pages : [],
        platform: platforms,
        mode: modes,
        categorie: categories,
        section: req.params.section,
      };
      res.render('section', context);
    } catch (err) {
      // console.log(err.toString());
      res.redirect('/');
    }
  });
  
module.exports = router;