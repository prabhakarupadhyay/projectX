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

