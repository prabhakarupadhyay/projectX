
var sessionHandle = require('./sessionHandler.js');
var {google} = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var config = require('./config.js');
global.refreshAcess = require('passport-oauth2-refresh');
/*
 *
 get google credentials
*
*/

var oauth2Client = new OAuth2(
    config.google.clientID,
    config.google.clientSecret,
    config.google.callbackURL
);


exports.init = function(pool,passport,config,GoogleStrategy){
    
var strategy   = new GoogleStrategy({

        clientID: config.google.clientID,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackURL,
  
    },
  (accessToken, refreshToken,callbackInfo,profile, done) => {
        process.nextTick(function() {
           sessionHandle.handleOauthSession(pool,extractProfile(accessToken, refreshToken,callbackInfo.id_token,profile,'https://www.googleapis.com/plus/v1/people/me?access_token='),true,done);
        });
    });
    //https://graph.facebook.com/me?access_token={accessToken}
    passport.use(strategy);
    refreshAcess.use(strategy);


    passport.serializeUser((user, done) => {
    
        done(null,[user.id,user.email]);

    });
    

    passport.deserializeUser((specificDetails, done) => {
    
        sessionHandle.handleOauthSession(pool,{id:specificDetails[0],email:specificDetails[1]},false,done);
        //console.log(specificDetails[0]);
        //done(null, specificDetails);

    });

}



function extractProfile (accessToken, refreshToken,id_Token,profile,tokenReqUrl) {
    
    let imageUrl = '';
    if (profile.photos && profile.photos.length) {
        imageUrl = profile.photos[0].value;

    }
    console.log('mmm.................');

    
    
    return {
        id: profile.id,
        name: profile.displayName,
        picture: imageUrl,
        email: profile.email,
        access:accessToken,
        refresh:refreshToken,
        idToken:id_Token,
        tokReq:tokenReqUrl
    };

}


