/*
 *
 load modules
*
*/

var express = require('express');
var app = express();
var server = require("http").Server(app);
var fs = require("fs");
var mime = require("mime");
var async = require("async");
var path = require("path");
var io = require("socket.io")(server);
var mysql = require("mysql");
var events = require("events");
var session = require('client-sessions');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth2').Strategy;
var finalhandler = require('finalhandler');
var Router = require('router');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var router = express.Router();

const Storage = require('@google-cloud/storage');
const Datastore = require('@google-cloud/datastore');

// Activate Google Cloud Trace and Debug when in production
if (process.env.NODE_ENV === 'production') {
  require('@google-cloud/trace-agent').start();
  require('@google-cloud/debug-agent').start();
}


/*
 *
 other file paths
*
*/



var myauth = require("./myauth.js");
var manageSockets = require("./lib/manageSockets.js");
//var ftpHandler = require("./lib/ftpHandler.js");
var xmlReqHandler = require("./lib/xmlReqHandler.js");
var createSql = require("./lib/sql tables/createSql.js");
var sessionHandle = require('./lib/sessionHandler.js');
var config = require('./lib/config.js');
//var config2 = require('./lib/config2.js');
var operations = require("./lib/operations.js");
var passportOauth = require("./lib/passport.js");
var readHtml = require("./lib/readHtml.js");
var Bucket = require("./lib/bucket.js");



/*
*
*
express middlewares
*
*
*/

//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');
// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(cookieParser(config.session.sessionSecret));
app.use(bodyParser.urlencoded({ extended: true  }));
app.use(bodyParser.json());
app.use(require('express-session')({
    secret: config.session.sessionSecret,
    saveUninitialized: true, // saved new sessions
    resave: false,
    cookie : { httpOnly: true, maxAge: 90000 } // configure when sessions expires
}));
app.use(passport.initialize());
app.use(passport.session());
app.use("/assets",express.static(path.join(__dirname, 'public/assets')));
console.log(path.join(__dirname, 'public/assets'));
app.use(require('connect-livereload')({
    port: 35729
  }));


var Multer = require('multer');
var multer = Multer({
  storage: Multer.MemoryStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // no larger than 5mb
  }
});

/*
 *
 some global variables
*
*/
global.exportProcessUrl;
global.eventEmit = new events.EventEmitter();
eventEmit.setMaxListeners(100);
global.requestNormalWait = true;

/*
 *
 some local variables
*
*/

var cache = {};
//var dirName = __dirname + "/public";

var htmlFiles = ['./public/index1.html','./public/private/secretWindow/myadmin.html','./public/dynamic.html']


/*
 *
 select between openshift or local port
*
*/
var server_port = process.env.PORT || 8080;
var server_ip_address = 'localhost';

if(typeof server_ip_address ==='undefined'){
    server_ip_address = '127.0.0.1';
}



/*
 *
 connect to mysql server
*
*/

//global sql 
var options = {

  client: process.env.SQL_CLIENT,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database:  process.env.SQL_DATABASE
    
}




//local cloud sql connection via proxy
//var options = {
//
//  host: '127.0.0.1',
//  port:'3307',
//  user: 'local',
//  password: 'nadhukar123',
//  database:  'localDB'
//    
//}

if (process.env.INSTANCE_CONNECTION_NAME && process.env.NODE_ENV === 'production') {

    if (process.env.SQL_CLIENT === 'mysql') {
    
        options.socketPath = `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`;

    }
  
}

var pool = mysql.createPool(options);



//var pool = mysql.createPool({
//    host:     'localhost',
//    user:     'root',
//    password: 'nadhukar123',
//    port:     '3306',
//    database: 'database3',
//    connectionLimit : 500
//    });
//            

/*
 *
 connect to bucket storage
*
*/
//global bucket
var cloudBucket = process.env.CLOUD_BUCKET;
var storage = Storage({
  projectId: process.env.PROJECT_ID,
    keyFilename: './MyFirstProject-34650eef0b12.json'
});
var bucket = storage.bucket(cloudBucket);


//local connection with the cloud storage
//var cloudBucket = 'titanium-flash-171510.appspot.com';
//var storage = Storage({
//  projectId: 'titanium-flash-171510',
//    keyFilename: './MyFirstProject-34650eef0b12.json'
//});
//var bucket = storage.bucket(cloudBucket);


/*
 *
 connect to datastore(nosql)
*
*/

//global datastore
var datastore = Datastore({
  projectId: process.env.PROJECT_ID,
    keyFilename: './MyFirstProject-34650eef0b12.json'
});


//var datastore = Datastore({
//  projectId: 'titanium-flash-171510',
//    keyFilename: './MyFirstProject-34650eef0b12.json'
//});



/****
*
*
////////////////////////////////PROCCESS//////////////////////////////////
*
*
****/


//create mysql tables
createSql.createTables(pool);

passportOauth.init(pool,passport,config,GoogleStrategy);
manageSockets.listen(io,pool,datastore,bucket);

readHtml.readAll(htmlFiles);

var myLogger = function (req, res, next) {
    setHead(res);
    next();
}

app.use(myLogger);

app.use(function(req, res, next ) {
    
    if(req.method == 'POST'){
        var splitUrl = req.url.split('_');
        if(splitUrl[0] == '/adminUpload'){
            next();
        }else{
            res.write('Post request error : Unable to detect the request');
            res.end();
        }
        
    }else{
        //check for dynamic shop request
        checkDynamicShopReq(req,function(isDynamic,dynamicUrl){
            if(isDynamic){
                //pass on dynamic shop html page
                console.log("dynamic page here..........");
                requestNormalWait = true;
                operations.loadPageFourDat(req,res,pool,bucket,datastore,dynamicUrl,htmlFiles[2]);
            }else{
                next(); 
            }
            
        });
    }
    
});


app.post('*',multer.single('fileUpload'),function(req,res) {
    //emited from ManageSockets.js
     eventEmit.on('pushShopId',function(jsonShopId){
         req.file.Shop_Sub_Id = jsonShopId.Shop_Sub_Id;
     });
    
    operations.sortPostUploads(req,res,function(actualPath,fileType){
    
        if(actualPath != undefined){
        
            res.write("storing file in cloud storage.."+'\n\n');
            Bucket.feadBucket(req,bucket,actualPath,fileType,function(isPresent,response,totalPath,message){
          
                if(isPresent != undefined){ 
                    req.file.cloudStoragePublicUrl = response;
                    req.file.storedPath = totalPath;
                    res.write('data:'+message+'\n\n');
                    res.write("writing data in cloud DB.."+'\n\n');
                    operations.StoreFilesDb(req,pool,datastore,function(DbResponse){
                        res.write('data:'+DbResponse+'\n\n');
                        res.end();                          
                    });
                }else{
                    res.write('data:'+message+'\n\n');
                    res.write('data:'+response+'\n\n');
                    res.end();                    
                }
        
            });
        }else{
                res.write(fileType);
                res.end();            
        }
    });
});

         
         
         
app.get('/', function (req, res) {
    requestNormalWait = true;
    var absPath =  htmlFiles[0];
    operations.sortPageName(htmlFiles[0],function(pgName){
        if(pgName != undefined){
            operations.loadPageOneDat(pool,pgName);
            
            eventEmit.once(pgName+'_trigger',function(pageData){
                if(requestNormalWait != true){
                    exportProcessUrl(res,absPath,pageData);        
                }
            });     
        }
    });
});


app.get('/searchData', function (req, res) {
    res.end("request proccessed............fuck yeah!!!!!!!!!!!");
});


//approvalPrompt : 'force'
app.get('/auth/google',
   passport.authenticate('google', { successRedirect: '/',accessType: 'offline',scope:
    [ 'https://www.googleapis.com/auth/plus.login',
  	  'https://www.googleapis.com/auth/plus.profile.emails.read']}));


app.get('/auth/google/callback',
        
        passport.authenticate('google', {
                    successRedirect : '/signIn',
                    failureRedirect : '/'
            }),function(err,user){cosole.log('goo');
                                                          
        });


app.get('/signIn', isLoggedIn, function(req, res) {

    res.redirect('/');
    
});



app.get('/mysecretwindow', function(req, res) {
    requestNormalWait = true;
    var absPath = htmlFiles[1];
    console.log("------------->>>>>>");
    myauth.auth(req,res,absPath,pool);
    
});




app.use( function( error, request, response, next ) {
    if(!error) {
        return next();
    }
   Error404(response);
});



function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}


// server.listen(server_port,server_ip_address, () => {
//    const port = server.address().port;
//    console.log(`App listening on port ${port}`);
//  });
//


server.listen(server_port,function () {
    console.log( "Listening on server_port " + server_port );
});



/*
 *
 functions starts here
*
*/
global.exportProcessUrl = function processUrl(res,absPath,data){
     
    //lookup the content type
    var head = mime.lookup(path.basename(absPath));
    executeUrl(res,data,head);
    
}




function executeUrl(res,data,head){
    res.writeHead(200,{'Content-Type':head});
    res.end(data);
}




function Error404(res){
    res.writeHead(404,'Content-Type:text/plain');
    res.write('404 error : resourse not found');
    res.end();
}



function setHead(res){
     // Website you wish to allow connection- * (all)
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
}



pool.on('connection',function(con){
    console.log('connection setup');
    });


function checkDynamicShopReq(req,callback){
    
    var splitUrl = req.url.split('/');
    var lastId = splitUrl[splitUrl.length-1];
    for(let i in splitUrl){
        if(splitUrl[i] == "dynamicShop"){
           return callback(true,lastId);
        }else if(i == splitUrl.length-1){
            console.log(i);
           return callback(false,lastId);  
        }
    }
     
}




