var LocalStrategy = require('passport-local').Strategy;  
var bcrypt   = require('bcrypt-nodejs');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var url = 'mongodb://kirsty:kirsty@cloud2.plenary-group.com:27019/kirsty';


module.exports = function(passport) {  
  passport.serializeUser(function(user, done) {
      console.log("serialize called");
    done(null, user._id);
  });
  
  passport.deserializeUser(function(id, done) {
    MongoClient.connect(url,function(err,db){
        db.collection('users2').findOne({"_id":mongodb.ObjectId(id)},function(err,user){
            
            done(err,user);
        });
    });
    
  });

    passport.use('local-signup', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
            function (req, email, password, done) {
                process.nextTick(function () {
                    MongoClient.connect(url, function (err, db) {
                        var collection = db.collection('users2');
                        collection.findOne({'local.email': email}, function (err, user) {
                            if (err)
                                return done(err);
                            if (user) {
                                return done(null, false);
                            } else {
                                var newUser = {local: {email: email, password: hashPassword(password)}};
                                collection.insertOne(newUser,function (err, user) {
                                    if (err)
                                        throw err;
                                    
                                    console.log("user inserted");
                                    db.close();
                                    done(null, user);
                                });
                            }
                        });
                        
                    });
                });
            }));
            
    passport.use('local-login', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
            function (req, email, password, done) {
                MongoClient.connect(url, function (err, db) {
                    db.collection('users2').findOne({'local.email': email}, function (err, user) {
                        if (err)
                            return done(err);
                        if (!user)
                            return done(null, false);
                        if (!verifyPassword(password, user.local.password))
                            return done(null, false);
                        db.close();
                        return done(null, user);
                    });
                });
            }));

function hashPassword(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
}

function verifyPassword(password, storedPassword){
    return bcrypt.compareSync(password, storedPassword);
}

};
