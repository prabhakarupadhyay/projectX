var request = require("request");
var injectHtml = require("./injectHtml.js");
var handleSql = require("./sql tables/handleSql.js");

exports.extractIdFromToken = function(pool,jsonObj,firReqName,newToken,callback){
    var accessKeyName = firReqName+'_AccessToken';
    //updateAccessToken = (pool,jsonData,firstName)
    request(jsonObj[accessKeyName],function(error,response,body){
        if(!error && response.statusCode == 200){
            
            var bodyObj = JSON.parse(body);
            var idKeyName = firReqName + '_Id';
            jsonObj[idKeyName] = bodyObj.id;
            if(newToken){
                storeAccessDb(pool,jsonObj,firReqName,idKeyName,accessKeyName);
            }
            delete jsonObj[accessKeyName];       
            callback(jsonObj);
        
        }else{
            //token expired refesh a new one
            handleSql.getRefreshToken(pool,accessKeyName,jsonObj[accessKeyName],firReqName,function(refreshT){
                
                if(refreshT != undefined){
                    if(jsonObj[accessKeyName].search("google") != -1){
                        //google access token
                        refreshAcessToken('google',refreshT,pool,jsonObj,firReqName,callback);
                        
                    }else{
                        //facebook access token
                        
                    }
                }
                
            });
        
        }
     
     });
    
}


function storeAccessDb(pool,oldObj,firReqName,idKeyName,accessKeyName){
    var newObj = {};
    newObj[idKeyName] = oldObj[idKeyName];
    newObj[accessKeyName] = oldObj[accessKeyName];
    console.log(newObj);
    handleSql.updateAccessToken(pool,newObj,firReqName);
}

exports.extReqCode = function(req,callback){
    
    var splitReq = req.url.split('?');

    if(splitReq[1] != undefined){
 
        var splitCode = splitReq[1].split('=');
 
        if(splitCode[0] == "code"){
            
            //google oauth callback successfull
            callback(splitReq[0]);
            
        }else{
            
            callback(undefined);
            
        }
    }else{
        callback(undefined); 
    }

}



exports.loadPageOneDat = function(pool,pageName){
    
    //returned db object
    var obj = {shops : '1,2,3,4,5'};
    requestNormalWait = false;
    console.log('loadPageOneDat');
    injectHtml(pageName,obj,1);
    
}



exports.loadAdminPanelDat = function(pool,pageName){
    
    //returned db object
    var obj = {shops : '6,7,8,9,0'};
    requestNormalWait = false;
    injectHtml(pageName,obj,1);
    
}

exports.loginUserCredentials = function(pool,userCreds){
    
    //returned db object
    handleSql.getAccessToken(pool,userCreds,function(token){
        console.log('loginUserCredentials');
        injectHtml(null,token,2);
        
    });
             
}

exports.loginOwnerCredentials = function(pool,userCreds){
    console.log('loginOwnerCredentials');
    //returned db object
    handleSql.getAccessToken(pool,userCreds,function(token){
        
        injectHtml(null,token,2);
        
    });
             
}



function refreshAcessToken(strategyName,refreshToken,pool,jsonObj,firReqName,callback){
    refreshAcess.requestNewAccessToken(strategyName,refreshToken[firReqName+'_RefreshToken'],function(err, accessTok, refreshTok) {
    
        if(err){
            console.log('refresh token expired --> '+err);
            //callback(err);
        }else{
            var accessKeyName = firReqName+'_AccessToken';
            var splitAccessReq = jsonObj[accessKeyName].split('=')[0];
            delete jsonObj[accessKeyName];
            jsonObj[accessKeyName] = splitAccessReq +"="+ accessTok;
            exports.extractIdFromToken(pool,jsonObj,firReqName,true,callback);
        }
    
    });
    
}


