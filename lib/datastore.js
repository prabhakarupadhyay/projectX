exports.feedDatastore = (datastore,newJson,kind,entityName,callback)=>{
    
    var jsonKey = Object.keys(newJson)[0];
    getEntity(datastore,kind,entityName,function(readEntity){
        if(readEntity != 'error'){
            
            if(readEntity == undefined){
                saveData(datastore,newJson,kind,entityName,'upsert',function(saveResponse){
                    callback(saveResponse);
                });   
            }else{
                
                if(readEntity[jsonKey] && Array.isArray(readEntity[jsonKey])){
                    var numArr = [];
                    for(let i in readEntity[jsonKey]){
                        for(let j in newJson[jsonKey]){
                            
                            if(newJson[jsonKey][j] == readEntity[jsonKey][i]){
                                numArr.push(j); 
                            }
                            if(i == readEntity[jsonKey].length-1 && j == newJson[jsonKey].length-1){
                            
                                if(numArr.length != 0){
                                    
                                    for(let l in newJson[jsonKey]){
                                        var flag = false;
                                        for(let s in numArr){
                                            if(numArr[s] == l){
                                                flag = true;   
                                            }
                                            if(s==numArr.length-1 && flag !=true){
                                                readEntity[jsonKey].push(newJson[jsonKey][l]);
                                            }
                                                
                                            if(l == newJson[jsonKey].length-1 && s == numArr.length-1){
                                                console.log("update few");
                                                saveData(datastore,readEntity,kind,entityName,'update',function(saveResponse){
                                                    callback(saveResponse);
                                                });                 
                                            }                                               
                                        }
                                    }                                     
                                }else{
                                    for(let p in newJson[jsonKey]){
                                        readEntity[jsonKey].push(newJson[jsonKey][p]);
                                        if(p == newJson[jsonKey].length-1){    
                                            console.log("update all");
                                            saveData(datastore,readEntity,kind,entityName,'update',function(saveResponse){
                                                callback(saveResponse);
                                            });              
                                        }                                        
                                    }
                                }
                            }
                        }   
                    }                    
                 
                }else{
                    
                    readEntity[jsonKey] = newJson[jsonKey];
                    saveData(datastore,readEntity,kind,entityName,'update',function(saveResponse){
                        callback(saveResponse);
                    });                        
                }
            }
            
        }else{
            callback('could not access the datastore');
        }
        
    });
    
}


exports.feedDatastoreBooking = (datastore,newJson,kind,entityName,callback)=>{
    
    var jsonKey = Object.keys(newJson)[0];
    getEntity(datastore,kind,entityName,function(readEntity){
        if(readEntity != 'error'){
            if(readEntity == undefined){
                
                saveData(datastore,newJson,kind,entityName,'upsert',function(saveResponse){
                    callback(saveResponse);
                });   
            }else if(readEntity[jsonKey] == undefined){
                readEntity[jsonKey] = newJson[jsonKey];
                saveData(datastore,readEntity,kind,entityName,'update',function(saveResponse){
                    callback(saveResponse);
                });                
                
            }else{
                if(readEntity[jsonKey] && Array.isArray(readEntity[jsonKey])){
                    for(let p in newJson[jsonKey]){
                        readEntity[jsonKey].push(newJson[jsonKey][p]);
                        if(p == newJson[jsonKey].length-1){    
                            console.log("update all");
                            saveData(datastore,readEntity,kind,entityName,'update',function(saveResponse){
                                callback(saveResponse);
                            });              
                        }                                           
                    } 
                }
            }
            
        }else{
            callback('could not access the datastore');
        }
        
    });
    
}



function saveData(datastore,jsonDat,kind,entityName,Method,callback){
    var key;
    if(entityName != null){
        key = datastore.key([kind,entityName]);
    }else{key = datastore.key(kind);}
    
    const entity = {
        key: key,
        method: Method,
        data: jsonDat 
    };

    datastore.save(entity, function(err) {
        
        if(err){
            callback('could not save the data');
        }else{
            callback('insertion/updation successfull');
        }
    });
    
}


function getEntity(datastore,kind,entityName,callback){
    var key;
    if(entityName != null){
        key = datastore.key([kind,entityName]);
    }else{key = datastore.key(kind);}
    
    datastore.get(key, function(err, entity) {
    
        if(err){
            console.log(err);
            callback('error');
        }else{
            callback(entity);
        }
        
    });    
}







exports.fetchDataStore = (datastore,shopIdObj,callback)=>{
    var keyw = datastore.key(['SHOPS', 'CARS_AVAILABLE']);

    var carStoreArr = []; 
    //get cars names from selected shop
    datastore.get(keyw, function(err, entity) {
        
        var countCars = 0;
        if(entity != undefined){
            entity[shopIdObj.Shop_Sub_Id].forEach((carName)=>{
                   
            const query = datastore.createQuery(carName);
            //gets all cars images and links in a nested object followed by an array
            datastore.runQuery(query)
                .then((results) => {
                countCars++; 
                if(results[0] != ''){
                    console.log("countCars2");
                    console.log(countCars);
                    const entities = results[0];
                    var carStoreObjMain = {}; 
                    var carStoreObj = carStoreObjMain;
            
                    entities.forEach((entity) => {
                                            
                        const key = entity[datastore.KEY];
                        var kind = key.path[0];
                        var entityName = key.path[1];
                        if (!(kind in carStoreObj)){
                            carStoreObj[kind] = {};
                            carStoreObj = carStoreObj[kind];
                        }
                        if (!(entityName in carStoreObj)){
                            
                            carStoreObj = carStoreObjMain[kind];
                            carStoreObj[entityName] = {};        
                            carStoreObj = carStoreObj[entityName];
    
                            for(let i in entity){
                                var splitEntId = i.split('@');
                                if(shopIdObj.Shop_Sub_Id == splitEntId[splitEntId.length-1]){
                                    var splitFirst = i.split('_');
                                    if(splitFirst[0] == 'IMAGE' || splitFirst[0] == 'LINK'){
                                        carStoreObj[splitEntId[0]] = entity[i];
                                    }                                    
                                }
                            }
                            carStoreObj = carStoreObjMain[kind];
                        }
                    });

                    carStoreArr.push(carStoreObjMain);
                    if(countCars == entity[shopIdObj.Shop_Sub_Id].length){
                        callback(carStoreArr);
                    }                   
                }
            });
        }); 
        
        }else{
            callback([null]);
        }
        
    });
}



exports.fetchDataStoreBooking = (datastore,shopIdObj,idKey,callback)=>{
    
    var keyw = datastore.key(['SHOPS', shopIdObj.Shop_Sub_Id]); 
    //get booking info of the current shop
    datastore.get(keyw, function(err, entity) {
        if(entity != undefined){
            var bookingArr = entity[idKey+"_"+shopIdObj[idKey]];
            if(bookingArr != undefined && bookingArr[bookingArr.length-1] == true){
                callback([bookingArr[bookingArr.length-2]]);
            }else{
                callback(["null"]);
            }
        }else{
            callback(["null"]);
        }
        
    });    
}


exports.fetchAdminBooking = (datastore,shopId,callback)=>{
    
    var Shop_Id_Arr = [];
    var Shop_Booking = [];
    var User_Id_Arr = [];
    var User_Booking = [];
    var keyw = datastore.key(['SHOPS',shopId]); 
    //get booking info of the current shop
    datastore.get(keyw, function(err, entity) {
        if(entity != undefined){
            var entityKeys = Object.keys(entity);
            for(var p in entityKeys){
                var bookingArr = entity[entityKeys[p]];
                if(bookingArr != undefined && bookingArr[bookingArr.length-1] == true){
                    var splitKey = entityKeys[p].split('_');
                    if(splitKey[0] == 'Shop'){
                        Shop_Id_Arr.push(splitKey[2]);
                        Shop_Booking.push(bookingArr[bookingArr.length-2]);
                    }else{
                        User_Id_Arr.push(splitKey[2]);
                        User_Booking.push(bookingArr[bookingArr.length-2]);
                    }
                    
                    if(p == entityKeys.length-1){
                        callback(Shop_Id_Arr,Shop_Booking,User_Id_Arr,User_Booking);
                    }
                }else{
                    //exclude this one                    
                    if(p == entityKeys.length-1){
                        callback(Shop_Id_Arr,Shop_Booking,User_Id_Arr,User_Booking);
                    }
                }
            }
        }else{
            callback("null");
        }
        
    });    
}

