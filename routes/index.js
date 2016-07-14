var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var url = 'mongodb://kirsty:kirsty@cloud2.plenary-group.com:27019/kirsty';

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended : false }));
var async = require('async');

module.exports = function(app,passport){
    
app.get('/', function (req, res) {
    var e = new Date();
    var weekday = new Array(7);
    weekday[0] = "sunday";
    weekday[1] = "monday";
    weekday[2] = "tuesday";
    weekday[3] = "wednesday";
    weekday[4] = "thursday";
    weekday[5] = "friday";
    weekday[6] = "saturday";
    var n = weekday[e.getDay()];
    MongoClient.connect(url, function (err, db) {
        db.collection('food1').find({ day:{$in: ["all", n]}}).sort({type: -1}).toArray(function (err, docs) {
            var menu = {};
            for(var i = 0; i < docs.length; i++){
                menu[docs[i]["_id"]] = docs[i];
            };
            res.render('index.ejs', {"data": docs, "menu":menu});
        });
    });
});   
 
app.get('/login', function(req, res) {
    res.render('login.ejs'); 
});
    
app.get('/profile', isLoggedIn, function(req, res) {
  MongoClient.connect(url,function(err,db){
         db.collection('food1').find({}).toArray(function(err,data){
             res.render('pages/food', {"data": data});
             db.close();
         });
     });
 });
 
 app.get('/overview', isLoggedIn, function(req, res) {
  MongoClient.connect(url,function(err,db){
         db.collection('order').find().sort({timestamp: -1}).toArray(function(err,data){
             res.render('pages/orders', {"data": data});
             db.close();
         });
     });
 });

app.get('/kitchen',isLoggedIn, function(req, res) {
    MongoClient.connect(url,function(err,db){
        db.collection('order').find({"status.food":{$in:["not started", "started"]}}).sort({_id:1}).toArray(function(err,da){
            res.render('kitchen.ejs',{"order": da}); 
        });
    });
});

app.get('/waitress',isLoggedIn, function (req, res) {
    var order = {};
    var topay = {};
    MongoClient.connect(url, function (err, db) {
        async.parallel([function (callback) {
                db.collection('order').find({"status.pay": "not payed"}).toArray(function (err, data) {
                    topay = data;
                    callback();
                });
            }, function (callback) {
                db.collection('order').find({"status.food": "complete"}).toArray(function (err, data) {
                    order = data;
                    callback();
                });
            }], function () {
            res.render('waitress.ejs', {"order": order, "topay": topay});
            db.close();
        });
    });
});

app.get('/add', isLoggedIn, function(req, res, next) {
  res.render('pages/add');
});
 
app.get('/signup',isLoggedIn, function(req, res) {
    res.render('signup.ejs');
});

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

app.post('/signup', passport.authenticate('local-signup', {  
  successRedirect: '/profile',
  failureRedirect: '/signup',
  session:false
}));

app.post('/login', passport.authenticate('local-login', {  
  successRedirect: '/profile',
  failureRedirect: '/login'
}));

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
};
 
 app.post('/deleted', function (req, res) {
    var dataf = {};
    dataf.selection = req.body.selection;
    var ed = new mongodb.ObjectID(dataf.selection);
    MongoClient.connect(url,function(err,db){
        db.collection('food1').remove({"_id" : ed });
        res.redirect('/profile');            
        db.close();
    });
});

app.post('/view',function (req,res){
    var dataf = {};
    dataf.selection = req.body.selection;
    var ed = new mongodb.ObjectID(dataf.selection);
    MongoClient.connect(url,function(err,db){
        db.collection('food1').find({"_id" : ed }).toArray(function(err,data){
            res.render('pages/food', {"data": data});
            db.close();
        });
    });
});

app.post('/editedstuff', function (req, res) {
    var dataf = {};
    dataf.selection = req.body.selection;
    var ed = new mongodb.ObjectID(dataf.selection);
    var dat = {};
    dat.selection = req.body.dated;
    var c = dat.selection;
    MongoClient.connect(url,function(err,db){
        db.collection('food1').update({"_id": ed},{ $set:{"description" : req.body.des,
            "type" : req.body.type,"dated": c, "price" : req.body.price }});
        res.redirect('/profile');
        db.close();
    });
});

app.post('/cat', function(req,res){
    var orderid;
    var cc; var e={};
    e=req.body;
    async.waterfall([function (callback) { 
            MongoClient.connect(url, function (err, db) {
                db.collection('food1').find({}).sort({type: -1}).toArray(function (err, docs) {
                    for(var i = 0; i < docs.length; i++){
                        var cs =docs[i]._id+"[table]";
                        if(e[cs]){
                            cc = e[cs];
                        }  
                    } 
                db.close();
            });
            callback();
        });
    },
    //, session:req.session
    function(callback){
        MongoClient.connect(url,function(err,db){
            db.collection('order').insert({table: cc,status:{food: "not started", pay: "not payed"}, timestamp: new Date()},function(err,docsInserted){
                orderid = docsInserted.insertedIds[0];
                db.close();
            });
        });
        callback();
    },
    function(callback){
        var a = Date();
        var b = a;
        var options =[];
        var c,dd,ee,cs;
        MongoClient.connect(url, function (err, db) {
            db.collection('food1').find({}).sort({type: -1}).toArray(function (err, docs) {
                var menu = {};
                for(var i = 0; i < docs.length; i++){
                    menu[docs[i]["_id"]] = docs[i];
                    c = docs[i]._id;
                    dd = docs[i].description;
                    ee = c+"[qty]";
                    cs = docs[i]._id+"[options][0][]";
                    if(e[cs]){
                        for (var er = 0;er<e[ee];er++){
                            options[er] = e[c+"[options]["+er+"][]"];
                        }
                    }
                    if (e[ee]){
                        db.collection('order').update({"_id":orderid},{ $push:{ orderitem:{orderitemid : docs[i]._id, ordertime:b, description :docs[i].description, type : docs[i].type, price : docs[i].price, qty: e[ee], options:options } }});
                    }
                }
                
                db.close();
            });
        });
        callback();
   }],
   function(){
       res.json({message:"10 minute wait"});
   });
});

app.post('/nextstagestarted', function (req, res) {
    var stuff = req.body.id;
    var dtyle = new mongodb.ObjectID(stuff);
    MongoClient.connect(url,function(err,db){
        db.collection('order').update({"_id": dtyle},{ $set:{"status.food":"complete"}});
        res.redirect('/kitchen');
        db.close();
    });
});

app.post('/nextstagecomplete', function (req, res) {
    var stuff = req.body.id;
    var dtyle = new mongodb.ObjectID(stuff);
    MongoClient.connect(url,function(err,db){
        db.collection('order').update({"_id": dtyle},{ $set:{"status.food":"delievered"}});
        res.redirect('/waitress');
        db.close();
    });
});

app.post('/nextstagenot%20payed', function (req, res) {
    var stuff = req.body.payed;
    var dtyle = new mongodb.ObjectID(stuff);
    MongoClient.connect(url,function(err,db){
        db.collection('order').update({"_id": dtyle},{$set:{"status.pay":"payed"}});
        res.redirect('/waitress');
        db.close();
    });
});

app.post('/nextstagenot%20started', function (req, res) {
    var stuff = req.body.id;
    var dtyle = new mongodb.ObjectID(stuff);
    MongoClient.connect(url,function(err,db){
        db.collection('order').update({"_id": dtyle},{$set:{"status.food":"started"}});
        res.redirect('/kitchen');
        db.close();
    });
});

app.post('/editstuff', function (req, res) {
    var dataf = {};
    dataf.selection = req.body.selection;
    var ed = new mongodb.ObjectID(dataf.selection);
    MongoClient.connect(url,function(err,db){
        db.collection('food1').find({"_id" : ed }).toArray(function(err,data){
            res.render('pages/edit', {"data": data});
            db.close();
        });
    });
});
  
app.post('/added', function (req, res) {
    var g = req.body;
    var f = new Date();
    var des =g.description;
    var type = g.type;
    var price = g.price;
    var options = [];
    var day = g.day;
    if(g[options]){
        for(var i = 0; i < g["options[]"].length; i++){
            options.push({item:g["options[]"][i]});
        };
        MongoClient.connect(url,function(err,db){
            db.collection('food1').insert({description : des,
                type : type, price : price, day: day, created:f, options:options},function(){
                res.json({message:"new item added"});
                db.close();
            });
        });
    }else{
        MongoClient.connect(url,function(err,db){
            db.collection('food1').insert({description : des,
                type : type, price : price, created:f, day: day},function(){
                res.json({message:"new item added"});
                db.close();
            });    
        });
    };
});

};
