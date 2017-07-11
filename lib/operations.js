var request = require("request");
var injectHtml = require("./injectHtml.js");
var handleSql = require("./sql tables/handleSql.js");
var shortid = require('shortid');
var Datastore = require("./datastore.js");

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










//,SchemaName.Shop.numberSchema


exports.loadPageOneDat = function(pool,pageName){
    
    //returned db object
    handleSql.shopsForDisplay(pool,[SchemaName.Shop.Schema,SchemaName.Shop.ImageSchema],"Name,Dynamic_Url,",null,pageName,10,function(shopsObj){
        console.log('loadPageOneDat');
        console.log(shopsObj);
        requestNormalWait = false;
        
        injectHtml(pageName,shopsObj,1);        
    
    });

    
}












exports.loadPageFourDat = (req,res,pool,bucket,datastore,dynamicUrl,absPath)=>{

    handleSql.getAllData(pool,{Dynamic_Url:dynamicUrl},SchemaName.Shop.Schema,function(datResponse){
        if(datResponse == undefined){
           res.send("Wrong request: Shop could not be found.");
        }else{
             
            
            exports.sortPageName(absPath,function(pgName){
                if(pgName != undefined){
              
                    eventEmit.once(pgName+'_trigger',function(pageData){
                        if(requestNormalWait != true){
                            exportProcessUrl(res,absPath,pageData);        
                        }
                    });   
                    
                    console.log('loadPageFourDat');
                    requestNormalWait = false;
                    injectHtml(pgName,datResponse,1);     
                }
            });
        }
    });     
}




exports.loadAdminPanelDat = function(pool,pageName){
    
    //returned db object
    var obj = {shops : '6,7,8,9,0'};
    requestNormalWait = false;
    injectHtml(pageName,obj,1);
    
}

exports.loginUserCredentials = function(pool,userCreds){
    
    var schemaName;
    var keybreak = Object.keys(userCreds);
    delete userCreds[keybreak[1]];
    var breakthis = keybreak[0].split('_')[0].toUpperCase();
    if(breakthis == 'SHOP'){
        
        schemaName = 'SHOP_USER_SCHEMA';
        
    }else{
        
        schemaName = 'USER_SCHEMA';
        
    }
    
    //returned db object
    handleSql.getAllData(pool,userCreds,schemaName,function(token){
        
                 if(breakthis == 'SHOP'){
        delete token["Shop_RefreshToken"];
        delete token["Shop_Id"];
        delete token["Shop_User_Email"];
                     
        
    }else{
        
               delete token["User_RefreshToken"];
        delete token["User_Id"];
        delete token["User_Email"];
        
    }   
        console.log('loginUserCredentials');
        injectHtml(null,token,2);
        
    });
//    handleSql.getAccessToken(pool,userCreds,function(token){
//
//        
//    });
//             
}




exports.loginOwnerCredentials = function(pool,userCreds){
    //returned db object
    handleSql.getAccessToken(pool,userCreds,function(token){
        console.log('loginOwnerCredentials');
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


exports.generateShopSubId = (jsonObj,callback)=>{
    jsonObj['Shop_Sub_Id'] = shortid.generate();
    jsonObj['Dynamic_Url'] = shortid.generate();
    callback(jsonObj);
}


exports.sortPostUploads = (req,res,callback)=>{
     
    var splitReq = req.url.split('_');
    var absPath = '';
    for(var i = 1; i<=splitReq.length-2; i++){
       
        absPath += splitReq[i]+"/";   
    }
    
    var fileType = splitReq[splitReq.length -1];
    if(splitReq[splitReq.length -2] == "TEX"){
        fileType = "TEX_" + fileType;
    }
    
    if(splitReq[1] == 'SHOPS'){
        //shop images
        eventEmit.on('shopPath',function(shopPath){
            absPath += shopPath[0];
            callback(absPath,fileType);
        });
        
    }else
        if(splitReq[1] == 'CARS'){
            callback(absPath,fileType);
            //model
        }else{
            
            callback(undefined,'wrong request.');
            
        }
    
}


exports.StoreFilesDb = (req,pool,datastore,callback)=>{
    
    var splitPath = req.file.storedPath.split('/');
    if(splitPath[0] == "SHOPS"){
        
        var jsonData = {};
        jsonData.Shop_Sub_Id = req.file.Shop_Sub_Id;
        //Image col name in db
        jsonData.Image = req.file.cloudStoragePublicUrl;
        
        handleSql.manageQueries(pool,jsonData,'ShopImages',SchemaName.Shop.ImageSchema,function(status,dat){
            callback(dat);
        });
        
    }
    else if(splitPath[0] == "CARS"){
        //store in data store
        let keysplit = req.file.storedPath.split('/');
        var key = keysplit[keysplit.length - 1]
        
        pathToDatastore(splitPath,function(kind,entityName){ 
            
            exports.prepareJsonForDatastore(key,req.file.cloudStoragePublicUrl,function(datastorejson){
                            
                Datastore.feedDatastore(datastore,datastorejson,kind,entityName,function(storeRes){ 
                    console.log("stored response----------------");
                    console.log(storeRes);
                    callback(storeRes);
            
                });                 
            
            });
            
        });
        
    } 
}

function pathToDatastore(cloudStoreSplitPath,callback){
    
    var kind = cloudStoreSplitPath[1];
    var entityName = '';
    var partFound = false;
    var tempNum;
    for(let i in cloudStoreSplitPath){
        
        if(cloudStoreSplitPath[i] == "PARTS"){ 
            partFound = true;
            tempNum = i;
        }
    }
    tempNum++;
    entityName = cloudStoreSplitPath[tempNum];
    if(partFound != true){
        entityName = "MAIN";
    }
    callback(kind,entityName);
    
}

exports.prepareJsonForDatastore = (key,value,callback)=>{
    
    var newJson = {};
    newJson[key] = value;
    callback(newJson);
    
}


exports.sortPageName = (pageName,callback)=>{
    if(pageName != null){ 
        var pathArr = pageName.split('/');
        var lastElem = pathArr[pathArr.length-1];
        var firstNamePg = lastElem.split('.')[0];
        callback(firstNamePg);
    
    }else{
        callback(undefined);
    }
    
}

