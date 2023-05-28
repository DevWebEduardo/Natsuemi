const auth = (req, res, next)=>{
    if (req.isAuthenticated()){
        return next();
    }
    req.flash('sucess_msg', "");
    res.redirect('/admin/login');
}

module.exports = auth;