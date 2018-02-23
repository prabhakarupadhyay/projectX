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


//SchemaName.Shop.numberSchema

exports.loadPageOneDat = function(pool,pageName,req,callback){
    
    //returned db object
    handleSql.shopsForDisplay(pool,[SchemaName.Shop.Schema,SchemaName.Shop.ImageSchema],"Name,Dynamic_Url",null,null,pageName,4,function(shopsObj){
        console.log('loadPageOneDat');
        injectHtml(pageName,shopsObj,req,callback);
    
    });
    
}


exports.loadPageTwoDat = function(pool,pageName,req,callback){
    injectHtml(pageName,null,req,callback);       
}

exports.loadPageAboutDat = function(pool,pageName,req,callback){
    injectHtml(pageName,null,req,callback);       
}



exports.loadPageThreeDat = function(pool,pageName,req,callback){
    
    handleSql.shopsForDisplay(pool,[SchemaName.Shop.Schema,SchemaName.Shop.ImageSchema,SchemaName.Shop.numberSchema],"Name,Dynamic_Url,Email,description,Lat,Lon",null,null,pageName,20,function(shopsObj){
        console.log('loadPageThreeDat');
        
        calShopDist(req.query.latitude,req.query.longitude,shopsObj,function(newShopObj){
            injectHtml(pageName,newShopObj,req,callback);
        });
                
    });      

}





exports.loadPageFourDat = (req,pool,bucket,datastore,dynamicUrl,absPath,callback)=>{

    exports.sortPageName(absPath,function(pgName){
    
        if(pgName != undefined){        
            
            handleSql.shopsForDisplay(pool,[SchemaName.Shop.Schema,SchemaName.Shop.ImageSchema,SchemaName.Shop.numberSchema],"Shop_Sub_Id,Name,Email,description,Address,Website","Dynamic_Url",dynamicUrl,pgName,1,function(shopsObj){
                        
                var shopIdObj = {};
                if(shopsObj[0] != undefined){
                    shopIdObj.Shop_Sub_Id = shopsObj[0]["Shop_Sub_Id"];
                    delete shopsObj[0]["Shop_Sub_Id"];       
                    if(req.user != undefined){        
                        if(req.user[0].Shop_AccessToken != undefined){
                            shopIdObj["Shop_AccessToken"] = req.user[0].Shop_AccessToken;
                            exports.extractIdFromToken(pool,shopIdObj,'Shop',false,function(DatWithId){ 
                                Datastore.fetchDataStoreBooking(datastore,DatWithId,"Shop_Id",function(BookingArr){
                                    shopsObj.push(BookingArr);
                                });
                                Datastore.fetchDataStore(datastore,shopIdObj,function(carStoreArr){
                                    shopsObj.push(carStoreArr);
                                    console.log("loadPageFourDat");
                                    injectHtml(pgName,shopsObj,req,callback);
                                });                                
                            });
                        }else{
                            shopIdObj["User_AccessToken"] = req.user[0].User_AccessToken;
                            exports.extractIdFromToken(pool,shopIdObj,'User',false,function(DatWithId){
                                Datastore.fetchDataStoreBooking(datastore,DatWithId,"User_Id",function(BookingArr){
                                    shopsObj.push(BookingArr);            
                                }); 
                                
                                Datastore.fetchDataStore(datastore,shopIdObj,function(carStoreArr){
                                    shopsObj.push(carStoreArr);
                                    console.log("loadPageFourDat");
                                    injectHtml(pgName,shopsObj,req,callback);
                                });                                
                            });                 
                        }                        
                    }else{
                        Datastore.fetchDataStore(datastore,shopIdObj,function(carStoreArr){
                            shopsObj.push(carStoreArr);
                            console.log("loadPageFourDat");
                            injectHtml(pgName,shopsObj,req,callback);
                        });
                    }        
                }
            });         
        } 
    });   
}





 
exports.loadAdminPanelDat = function(pool,pageName,req,callback){
    
    //returned db object
    var obj = {shops : '6,7,8,9,0'};
    injectHtml(pageName,obj,req,callback);
    
}





exports.loginUserCredentials = function(pool,userCreds,callback){
    
    let newObj = {};
    newObj['User_Id'] = userCreds['User_Id'];
    let requiredFields = "User_Email_Name,User_Picture,User_AccessToken,User_IdToken";
    handleSql.getAuthData(pool,[SchemaName.User.Schema,SchemaName.User.PerSchema],newObj,[requiredFields,'*'],function(userObj){
//        if(userObj == undefined){
//            userObj["User_Email_Name"] = "Error.Please login again";
//        }
       // injectHtml(null,userObj,2);    
        callback(userObj);
    });   
    
}




exports.loginOwnerCredentials = function(pool,userCreds,callback){
    
    //returned db object
    let newObj = {};
    newObj['Shop_Id'] = userCreds['Shop_Id'];
    let requiredFields = "Shop_User_Email_Name,Shop_User_Picture,Shop_AccessToken,Shop_IdToken";
    handleSql.getAuthData(pool,[SchemaName.Shop.UserSchema,SchemaName.Shop.UserPerSchema],newObj,[requiredFields,'*'],function(shopsObj){
//        if(shopsObj == undefined){
//            shopsObj["Shop_User_Email_Name"] = "Error.Please login again";
//        }        
        //injectHtml(null,shopsObj,2);  
        callback(shopsObj);
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
        eventEmit.once('shopPath',function(shopPath){
            absPath += shopPath[0];
            callback(absPath,fileType);
        });
        
    }else if(splitReq[1] == 'CARS'){
            callback(absPath,fileType);
            //model
        }else{
            callback(undefined,'wrong request.');
        }
    
}





exports.StoreFilesDb = (req,pool,datastore,callback)=>{
    
    var splitPath = req.file.storedPath.split('/');
    var jsonData = {};
    jsonData.Shop_Sub_Id = req.file.Shop_Sub_Id;
    jsonData.Image = req.file.cloudStoragePublicUrl;
    if(splitPath[0] == "SHOPS"){
        //Image col name in db
        handleSql.manageQueries(pool,jsonData,'ShopImages',SchemaName.Shop.ImageSchema,function(status,dat){
            callback(dat);
        });    
    }
    else if(splitPath[0] == "CARS"){
        //store in data store
        let keysplit = req.file.storedPath.split('/');
        //car/parts images per shop stored in this unique key 
        var key = keysplit[keysplit.length - 1]+'@'+jsonData.Shop_Sub_Id;    
        pathToDatastore(splitPath,function(kind,entityName){ 
                
            exports.prepareJsonForDatastore(key,jsonData.Image,function(datastorejson){
                            
                Datastore.feedDatastore(datastore,datastorejson,kind,entityName,function(storeRes){ 
                    console.log("stored response----------------");
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


function calShopDist(lat1,lon1,shopsObj,callback){
    
    for(var i in shopsObj){
        
        var lat2 = shopsObj[i]['Lat'];
        var lon2 = shopsObj[i]['Lon'];
        delete shopsObj[i]['Lat'];
        delete shopsObj[i]['Lon'];
        
        geoDistance(lat1, lon1, lat2, lon2,function(myDistance){
            var rounded = Math.round( myDistance * 10 ) / 10;
            shopsObj[i]['Distance'] = rounded;
            if(i == shopsObj.length-1){
                callback(shopsObj);
            }
        });
        
    }
    
}

function geoDistance(lat1, lon1, lat2, lon2,callback) {
  var p = 0.017453292519943295;    // Math.PI / 180
  var c = Math.cos;
  var a = 0.5 - c((lat2 - lat1) * p)/2 + 
          c(lat1 * p) * c(lat2 * p) * 
          (1 - c((lon2 - lon1) * p))/2;

  callback(12742 * Math.asin(Math.sqrt(a))); // 2 * R; R = 6371 km
}










                    
//                    
//                    
//                    var keyw = datastore.key(['SHOPS', 'CARS_AVAILABLE']);
//
//datastore.get(keyw, function(err, entity) {
//    console.log(entity);
//});
//           
                    
                    
                    
//                    
//                    const query = datastore.createQuery('SWIFT').filter();
//                    
//                    datastore.runQuery(query)
//  .then((results) => {
//    // Task entities found.
//    const tasks = results[0];
//    console.log('Tasks:');
//    tasks.forEach((task) => console.log(task));
//  });
//                            
                    
      




//                   // var keyw = [datastore.key(['SWIFT','MAIN']),datastore.key(['SWIFT','HEADLIGHTS']),datastore.key(['SWIFT','TAILLIGHTS'])];
//                    var keyw = datastore.key(['SWIFT']);
//
//                    datastore.get(keyw, function(err, entity) {
//if(err){
//    console.log(err);return;
//}else{
//    console.log(entity);
//}
//                        
//                        
//
//                    });
//           






                //    const ancestorKey = datastore.key(['__kind__', 'SWIFT'])  
//                   
//                    const query = datastore.createQuery('SWIFT')
//                    .select('__key__');
//                    
//  return datastore.runQuery(query)
//    .then((results) => {
//      const entities = results[0];
//    
//      entities.forEach((entity) => {
//        const key = entity[datastore.KEY];
//
//        console.log(key.path);
//
//      });
//      
//  });
         




//
//
//                    
//                        const query = datastore.createQuery('SWIFT')
//                    
//  return datastore.runQuery(query)
//    .then((results) => {
//      const entities = results[0];
//      
//      const propertiesByKind = {};
//      
//      entities.forEach((entity) => {
//        const key = entity[datastore.KEY];
//        const kind = key.path[1];
//        const property = key.path[3];
//        console.log(key.path);
//
//        propertiesByKind[kind] = propertiesByKind[kind] || [];
//        propertiesByKind[kind].push(property);
//      });
//      
//            console.log('Properties by Kind:');
//      for (let key in propertiesByKind) {
//       console.log(key, propertiesByKind[key]);
//      }
//      
//  });
//                     
//      





