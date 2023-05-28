const LocalStrategy = require ('passport-local').Strategy;
const User = require('../models/account');
const bcrypt = require('bcrypt');

module.exports = (passport)=>{
    passport.use(new LocalStrategy({usernameField: 'username', passwordField: 'password'}, (username, password, done)=>{
        User.findOne({'user': username}).then(async (user_info)=>{
            if(!user_info){
                return done(null, false, {message: "Incorrect User or Password."});
            }
            await bcrypt.compare(password, user_info.password, (err, pass)=>{
                if(pass){
                    return done(null, user_info)
                }else{
                    return done(null, false, {message:"Icorrect User of Password."})
                }
            });
        })
    }));

    passport.serializeUser((user_info, done)=>{
        return done(null, user_info.id);
    });

    passport.deserializeUser((user_info, done)=>{
        User.findById(user_info._id).then((check)=>{
            if (check == false){
                return done(null, null, {"message": "DB Error"})
            }else{
                return done(null, user_info)
            }
        })
    });
}