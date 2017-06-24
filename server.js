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
var ftpHandler = require("./lib/ftpHandler.js");
var xmlReqHandler = require("./lib/xmlReqHandler.js");
var createSql = require("./lib/sql tables/createSql.js");
var sessionHandle = require('./lib/sessionHandler.js');
var config = require('./lib/config.js');
var config2 = require('./lib/config2.js');
var operations = require("./lib/operations.js");
var passportOauth = require("./lib/passport.js");
var readHtml = require("./lib/readHtml.js");


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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true  }));

app.use(require('express-session')({
    secret: config.session.sessionSecret,
    saveUninitialized: true, // saved new sessions
    resave: false,
    cookie : { httpOnly: true, maxAge: 90000 } // configure when sessions expires
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public/assets')));

app.use(require('connect-livereload')({
    port: 35729
  }));


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

var htmlFiles = ['./public/index.html','./public/private/secretWindow/myadmin.html']


/*
 *
 select between openshift or local port
*
*/
var server_port = process.env.PORT || 8080;
var server_ip_address = '10.128.0.2';

if(typeof server_ip_address ==='undefined'){
    server_ip_address = '127.0.0.1';
}



/*
 *
 connect to mysql server
*
*/

//local database


var options = {

  host: '104.197.220.246',
  user: 'admin',
  password: 'nadhukar123',
  database: 'database3',
     dialectOptions: {
 socketPath: '/cloudsql/titanium-flash-171510:us-central1:mysqlcloud0007'
 }
    
}


if (config2.get('INSTANCE_CONNECTION_NAME') && config2.get('NODE_ENV') === 'production') {
  options.socketPath = `/cloudsql/${config2.get('INSTANCE_CONNECTION_NAME')}`;
}


var pool = mysql.createPool(options);



/*
//original
var connection = mysql.createConnection({
  host     : process.env.OPENSHIFT_MYSQL_DB_HOST,
  user     : process.env.OPENSHIFT_MYSQL_DB_USERNAME,
  password : process.env.OPENSHIFT_MYSQL_DB_PASSWORD,
  port     : process.env.OPENSHIFT_MYSQL_DB_PORT,
  database : process.env.OPENSHIFT_APP_NAME,
  connectionLimit : 500,
 });

*/

            




//create mysql tables
createSql.createTables(pool);

passportOauth.init(pool,passport,config,GoogleStrategy);
manageSockets.listen(io,pool);

readHtml.readAll(htmlFiles);


var myLogger = function (req, res, next) {
    setHead(res);
    next();
}

app.use(myLogger);

app.use(function(request, response, next ) {

    console.log(request.url);
    next();
});


app.use( function( error, request, response, next ) {
    if(!error) {
        return next();
    }
   Error404(response);
});


app.get('/', function (req, res) {
    requestNormalWait = true;
    var absPath =  htmlFiles[0];
    eventEmit.once('index_trigger',function(pageData){
        console.log('pageData');
        if(requestNormalWait != true){
            exportProcessUrl(res,absPath,pageData);        
        }
    });
            
    operations.loadPageOneDat(pool,absPath);

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




function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}



 server.listen(server_port,server_ip_address, () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });



//server.listen(server_port,function () {
//    console.log( "Listening on " + server_ip_address + ", server_port " + server_port );
//});


/*
 *
 create server Main
*
*/
//var server = http.createServer(function(req,res){
//    console.log("request received- " + req.url);
//   
//    setHead(res);
//    var absPath = '';
//    var filePath = './';
//    
//    
//    //initial request
//    if(req.url == "/"){
//         sessions(req,res,pool,sessionHandler,function(isLoggedIn,sessionData){
//             
//             absPath = filePath+"public/index.html";
//             global.exportProcessUrl(req,res,absPath);
//              manageSockets.listen(server,socketio,pool,'UserPanel');
//             
//             if(isLoggedIn){
//                 eventEmit.emit('LoggedInUser',sessionData);
//                 return;
//             }
//            //setTimeout(function(){eventEmit.emit('GuestUser',sessionData);},7000); 
//             
//         });
//        
//    }
//    else if(req.url == "/mysecretwindow" || req.url == "/private/secretWindow/myadmin.html"){
//        //initiate authentication password for admin panel
//        myauth.auth(req,res,server,socketio,pool);
//        //  ftpHandler.connectFTP(ftpClient,connectionProperties,pool);
//        
//    }   
//    else if(req.url == '/auth/google'){
//       
//       // xmlReqHandler.handleXmlReq(res,req,pool,'googleLogin');
//        router(req, res, finalhandler(req, res));
//        
//    }
//    //rest requests
//    else{
//        
//        operations.extReqCode(req,function(reqCallback){
//            
//            if(reqCallback != undefined){
//                
//                router(req, res, finalhandler(req, res));
//                
//            }else{
//            
//                absPath = filePath+"public"+req.url;
//                global.exportProcessUrl(req,res,absPath);
//           
//            }
//            
//        });
//           
//    }
//    
//    });
//
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

