var id = {
    
    google: {
        
        clientID: '284593292198-8nqha6iqa3jpduj0l8ldtmn5bh8gv3uh.apps.googleusercontent.com',
        clientSecret: 'ERRaQHL_5ZVc6rqYcd95AV77',
        callbackURL: 'http://modsfusion.com/auth/google/callback'  
    },   
    facebook: {
        
        clientID: '165682537414972',
        clientSecret: '68bf9d2d31ccce0b8d84f176904ab8d4',
        callbackURL: 'http://modsfusion.com/auth/google/callback'  
    },
    session : {
        
        sessionSecret : 'AJSNS90S-SIS_SJKD8334S-SHW8'
    },

    firebase:{
        
        databaseURL: "https://titanium-flash-171510.firebaseio.com"
        
    },
    mysql: {
        host:     'localhost',
        user:     'modsfusi_root',
        password: 'nadhukar123',
        database: 'modsfusi_database',
        connectionLimit : 500
    }
};



module.exports = id;


//callbackURL: 'https://titanium-flash-171510.appspot.com/auth/google/callback' 


// http://modsfusion-modsfusion.193b.starter-ca-central-1.openshiftapps.com/

//http://localhost:8080/auth/google/callback
