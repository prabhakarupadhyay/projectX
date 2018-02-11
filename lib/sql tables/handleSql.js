var storeReqName = new Array();

exports.manageQueries = function(pool,jsonData,requestName,schemaName,callback){
    
    pool.getConnection(function(error,connection){

            if(firstTimeTrig(requestName)){
                var objKeyCount = 0; 
                loopFunctions(connection,jsonData,requestName,schemaName,objKeyCount,callback);
                
            }else{    
                selectSchemaIdToStore(connection,jsonData,requestName,schemaName,callback);
        
            }
        
    });
}




function selectSchemaIdToStore(connection,jsonData,requestName,schemaName,callback){
        
    if(jsonData['Shop_Sub_Id']){
        
        addOrUpdate(connection,jsonData,requestName,schemaName,'Shop_Sub_Id',callback);
        
    }else{
        
        getIdName(schemaName,function(IDkeyName){
            
            addOrUpdate(connection,jsonData,requestName,schemaName,IDkeyName,callback);   

        });
    }
}
    
    
   
function getIdName(schemaName,callback){
    
    var slitLower = schemaName.split('_')[0].toLowerCase();
    
    var firstLetterCap = slitLower.charAt(0).toUpperCase();
    
    var idNameLast = slitLower.slice(1);
    
    var mainId = firstLetterCap+idNameLast+ '_Id';
    
    callback(mainId);
    
}



function addOrUpdate(connection,jsonData,requestName,schemaName,ID,callback){

    connection.query('SELECT '+ID+' FROM '+schemaName+' WHERE '+ID+' LIKE ?',[jsonData[ID]],function(err,IdResult){
        
        if(err){
            console.log(err);
            callback(false,err);
            
        }else{
            
            if(IdResult == ''){
                
                console.log('add new details');       
                addDetails(connection,jsonData,schemaName,callback);
        
            }else{

                console.log('update details');       
                updateDetails(connection,jsonData,schemaName,ID,callback);
                
            }
            
        }
        
    });

}


function loopFunctions(connection,jsonData,requestName,schemaName,objKeyCount,callback){
    
    var jsonKeys = Object.keys(jsonData);
    var keyLength = jsonKeys.length;
    
    if(keyLength == objKeyCount){
        
        selectSchemaIdToStore(connection,jsonData,requestName,schemaName,callback);
        objKeyCount = 0;
        return;
        
    }  
 
    searchColumns(connection,schemaName,objKeyCount,jsonKeys,function(columnName){
        
        if(columnName != null){
            
        selectDataType(columnName,function(dataType){
            
             addColumns(connection,jsonData,requestName,schemaName,columnName,dataType,objKeyCount,callback);
        });
    
        }else{
        //run the loop again
        objKeyCount++;
        loopFunctions(connection,jsonData,requestName,schemaName,objKeyCount,callback);
    
        }
        
    });
    
}



function selectDataType(columnName,callback){

    var splitColumnName = columnName.split('_');
    var typeName = 'VARCHAR';
    for(var i in splitColumnName){    
        if(splitColumnName[i] == 'Name' ||splitColumnName[i] == 'Id'){
            callback(typeName+'(100)');
            
        }else if(splitColumnName[i] == 'Comment'){
        
            callback('LONGTEXT');
        
        }else if(splitColumnName[i] == 'Description' || splitColumnName[i] == 'IdToken'){
        
            callback(typeName+'(1000)');
        
        }else{
            
            if(i == splitColumnName.length-1){
                //call for varchar 255
                callback(typeName+'(255)');
            }
            
        }
        
    }
    
}



function firstTimeTrig(requestName){
 
    if(storeReqName[requestName]){        
        //call to store values
        return false;
    }else{
        storeReqName[requestName] = requestName;
        return true;   
    }
}




function searchColumns(connection,schemaName,objKeyCount,jsonKeys,callback){
    
console.log(jsonKeys[objKeyCount]);
    connection.query('SELECT '+jsonKeys[objKeyCount]+' FROM '+schemaName,function(err,result){
        if(err){
            console.log('column ^ not present...adding one rn');
            //addnewColumn(connection,formDataVarName[formObjCount],formData,addOrUpdate);
            callback(jsonKeys[objKeyCount]);
        }else{
            
            //loopFunctions(connection,jsonData,schemaName,objKeyCount);  
            callback(null);
        }
    });
}




function addColumns(connection,jsonData,requestName,schemaName,columnName,dataType,objKeyCount,callback){
    
    connection.query('ALTER TABLE '+schemaName+' ADD COLUMN ('+ columnName +' '+dataType+')',function(err,result){
        
        if(err){
            console.log(err);
        }else{
            console.log('column: '+columnName+' added successfuly');
            objKeyCount++;
            loopFunctions(connection,jsonData,requestName,schemaName,objKeyCount,callback);
        }
    });    
}




function addDetails(connection,jsonData,schemaName,callback){
    
    console.log('adding details');
    connection.query('INSERT INTO '+schemaName+' SET ?',jsonData,function(err,RowResult){

        if(err){
            console.log(err);
            callback(false,err);
            connection.release();
        }else{
            
            callback(true,'successfully stored all the details in ' +schemaName);
            connection.release();
        }
      
    });
    
}



function updateDetails(connection,jsonData,schemaName,ID,callback){
    
        
      seperateBlankFields(jsonData,function(selectedFileds){
          
          var jsonDataSelected = {};
          for(let p in selectedFileds){
              jsonDataSelected[selectedFileds[p]] = jsonData[selectedFileds[p]];
          }
          console.log(jsonDataSelected);
          if(schemaName != SchemaName.Shop.ImageSchema && schemaName != SchemaName.Shop.numberSchema){
              
              connection.query('UPDATE '+schemaName+' SET ? WHERE '+ID+' = ?',[jsonDataSelected,jsonDataSelected[ID]],function(err,upResult){
              
                  if(err){
                      console.log(err);
                      callback(false,err);
                      connection.release();
                  }else{
                      callback(true,schemaName+' : all fields updated at '+ID+" = "+jsonDataSelected[ID]);
                      connection.release();
                  }
              });
          }else{       
              checkAddUpdate2Col(connection,jsonDataSelected,schemaName,ID,callback);
          }
          
      });
            
}


function checkAddUpdate2Col(connection,jsonData,schemaName,ID,callback){
    var compareColName;
    for(let i in jsonData){
        if(jsonData[i] != jsonData[ID]){
            compareColName = i;
        }
    }

    if(compareColName != undefined){
     connection.query('SELECT '+ID+' FROM '+schemaName+' WHERE '+compareColName+' LIKE ?',[jsonData[compareColName]],function(err,IdResult){
         if(err){console.log(err);connection.release();}else{
             
              if(IdResult == ''){
                  addDetails(connection,jsonData,schemaName,callback);
                  
              }else{
                  callback(true,schemaName+" : value already exist at "+ID+" = "+jsonData[ID]);
                  connection.release();
              }
            
         }
     });
    }
}




function seperateBlankFields(jsonData,callback){
    var storeSelectedField = [];
    var keyNames = Object.keys(jsonData);
    for(var i in keyNames){
        if(jsonData[keyNames[i]] == '' || jsonData[keyNames[i]] == null || jsonData[keyNames[i]].trim() == ''){        
            //do nothing blank fields
            
        }else{
            
            storeSelectedField.push(keyNames[i]);
        }
        if(i == keyNames.length-1){
            callback(storeSelectedField);
        }
    }
    
    
    
}



function getSchemaName(firstName,callback){
    
    var schemaPart = firstName.toUpperCase();
    var curSchemaName;
    if(schemaPart == 'SHOP'){
        curSchemaName = schemaPart + "_USER_SCHEMA";
    }else{
         curSchemaName = schemaPart + "_SCHEMA";  
    }
    callback(curSchemaName);
    
}



/******************Export functions *********************/


exports.checkEmailDuplicates = function (pool,newId,newMail,callback){
    pool.getConnection(function(error,connection){
        
        connection.query('SELECT Shop_User_Email FROM '+SchemaName.Shop.UserSchema+' WHERE Shop_User_Email = ?',[newMail],function(err,response){
            
            if(err){
                callback(true); 
                connection.release();    
                //means its not a duplicate
            }else{
                if(response == ''){
                    callback(true); 
                    connection.release();
                    //means its not a duplicate 
                    
                }else{
                    connection.query('SELECT Shop_Id FROM '+SchemaName.Shop.UserSchema+' WHERE Shop_Id = ?',[newId],function(errs,respons){
                                
                        if(errs){
                            callback('errorLogin'); 
                            connection.release();    
                            //means its some other login having same email name as owner
                        }else{
                            
                            if(respons == ''){    
                                callback('errorLogin'); 
                                connection.release();    
                                //means its some other login having same email name as owner
                                
                            }else{
                                callback(false); 
                                connection.release();
                                //means its a duplicate
                            }
                        }
                    });

                }
            }
            
        });
    });
    
}



exports.checkSessionId = function (pool,jsonId,callback){
    
    var jsonKeys = Object.keys(jsonId);
    var breakUnder = jsonKeys[0].split('_');
    var curSchemaName;
    getSchemaName(breakUnder[0],function(tableNam){
        curSchemaName = tableNam;
    });
    
    pool.getConnection(function(error,connection){
        connection.query('SELECT '+jsonKeys[0]+' FROM '+curSchemaName+' WHERE ?',jsonId,function(err,response){
            
            if(err){
                callback(false,'Guest : sign in again'); 
                connection.release();    
                //error error
            }else{
                if(response == ''){
                    callback(false,'Guest : sign in again'); 
                    connection.release();
                    //means id is not present 
                    
                }else{
                    
                    callback(true,response[0]); 
                    connection.release();
                    //means id is present 
                }
            }
            
        });
    });
    
}




exports.getAccessToken = (pool,dataObj,callback)=>{
    
    var jsonKeys = Object.keys(dataObj);
    var firstName = jsonKeys[0].split('_');
    var curSchemaName;
    var curAccessTokenName = firstName[0] + '_AccessToken';
    
    getSchemaName(firstName[0],function(tableNam){
        curSchemaName = tableNam;
    });
    for(var i in jsonKeys){
        if(i==0){//leave
        }else{
            delete dataObj[jsonKeys[i]]; 
        } 
    }
    pool.getConnection(function(error,connection){
       
        connection.query('SELECT '+curAccessTokenName+' FROM '+curSchemaName+' WHERE ?',dataObj,function(err,res){
            
           if(err){
               console.log(err);
               callback('could not retrieve the token');
               connection.release();
           }else{
               callback(res[0]);
               connection.release();
           } 
            
        });
   
    });
    
}


exports.getRefreshToken = (pool,accessKeyName,accessValue,reqName,callback)=>{
    
    var refreshKeyName = reqName+'_RefreshToken';
    var curSchemaName;
    
    getSchemaName(reqName,function(tableNam){
        curSchemaName = tableNam;
    });
    pool.getConnection(function(error,connection){
       
        connection.query('SELECT '+refreshKeyName+' FROM '+curSchemaName+' WHERE '+accessKeyName+' = ?',[accessValue],function(err,res){
            
           if(err){
               console.log(err);
               callback(undefined);
               connection.release();
           }else{
               callback(res[0]);
               connection.release();
           } 
            
        });
   
    });    
    
}



exports.updateAccessToken = (pool,jsonData,firstName)=>{
    
    var ID = firstName + '_Id';
    var curSchemaName;
    getSchemaName(firstName,function(tableNam){
        curSchemaName = tableNam;
    });
    pool.getConnection(function(error,connection){
        connection.query('UPDATE '+curSchemaName+' SET ? WHERE '+ID+' = ?',[jsonData,jsonData[ID]],function(err,upResult){
            if(err){
                console.log(err);
                connection.release();
            }else{
                console.log(curSchemaName+' : access token updated at '+jsonData[ID]);
                connection.release(); 
            }
        });   
    });
}






exports.fromEmailToId = (pool,jsonData,schemaName,callback)=>{
    
    pool.getConnection(function(error,connection){
    
        getIdName(schemaName,function(IDkeyName){
        
        
            var splitIdName = IDkeyName.split('_');
        
            if(splitIdName[0] == "Shop"){
           
                var emailKeyName = splitIdName[0] + '_User_Email';
            }
            else{
                var emailKeyName = 'User_Email';
            }
        
            connection.query('SELECT '+IDkeyName+' FROM '+schemaName+' WHERE '+emailKeyName+' LIKE ?',[jsonData[emailKeyName]],function(err,IdResult){
            
                if(err){callback(undefined);connection.release(); }
                else{
                    
                    jsonData[IDkeyName] = IdResult[0][IDkeyName];
                    delete jsonData[emailKeyName];
                    connection.release(); 
                    callback(jsonData);
                }
            });   

        }); 
        
    });
}



exports.fromIdToEmail = (pool,jsonData,schemaName,callback)=>{
    
    pool.getConnection(function(error,connection){
    
        getIdName(schemaName,function(IDkeyName){
        
        
            var splitIdName = IDkeyName.split('_');
        
            if(splitIdName[0] == "Shop"){
           
                var emailKeyName = splitIdName[0] + '_User_Email';
            }
            else{
                var emailKeyName = 'User_Email';
            }
        
            connection.query('SELECT '+emailKeyName+' FROM '+schemaName+' WHERE '+IDkeyName+' LIKE ?',[jsonData[IDkeyName]],function(err,IdResult){
            
                if(err){callback(undefined);connection.release(); }
                else{
                    
                    jsonData[emailKeyName] = IdResult[0][emailKeyName];
                    delete jsonData[IDkeyName];
                    connection.release(); 
                    callback(jsonData);
                }
            });   

        }); 
        
    });
}




exports.deleteValue = (pool,delArr,schemaName,callback)=>{
    
     pool.getConnection(function(error,connection){
         
         connection.query('UPDATE '+schemaName+' SET '+delArr[2]+'= ? WHERE '+delArr[0]+'= ?',[null,delArr[1]],function(err,delVal){             
             if(err){
                 connection.release(); 
                 callback("failed to delete id token"); 
             }else{console.log("id token set to null.");
                 console.log(delArr);
                 
                 callback("id token set to null."); 
                 connection.release(); 
             }
         });
         
     });
    
}



exports.checkShopSubId = (pool,jsonData,schemaName,callback)=>{
    
    var IdFirst = "Shop";
    var fullId = IdFirst + "_Id";
    var subId = IdFirst + "_Sub_Id";
    var shopNum = IdFirst + "_Number";
    
    var jsonKeys = Object.keys(jsonData);
    var firstName = jsonKeys[0].split('_');
    
    pool.getConnection(function(error,connection){
    
         connection.query('SELECT '+subId+' FROM '+schemaName+' WHERE '+fullId+' LIKE ? AND '+shopNum+' LIKE ?',[jsonData[fullId],jsonData[shopNum]],function(err,res){
             
             if(err){
                 //column Shop_Number not present
                 connection.release(); 
                 callback(undefined); 
             }
             else{
                 if(res[0] != undefined && res[0] != ''){
                     console.log(res[0]);
                     jsonData[subId] = res[0][subId];
                     connection.release(); 
                     callback(jsonData);                         
                         
                 }else{
                     connection.release(); 
                     callback(undefined);
                     
                 }
                 
             }
             
         });
    
    });   
    
}



exports.getAllData = (pool,jsonData,schemaName,callback)=>{
    
    pool.getConnection(function(error,connection){
        var myState;
        if(jsonData == null){
            myState = '';
        }else{
            myState = ' WHERE ?';
        }
        
        connection.query('SELECT * FROM '+schemaName+myState,jsonData,function(err,allData){
            if(err){
                connection.release(); 
                callback(undefined);
            }else{
               // console.log(allData)
                if(allData[0] != undefined && allData[0] != ''){
                    connection.release(); 
                    if(jsonData != null){
                        callback(allData[0]);
                    }else{
                        callback(allData);
                    }
                }else{
                    connection.release(); 
                    callback(undefined);
                }
            }
            
        });
        
    });
}




exports.getCols = (pool,colNames,schemaName,callback)=>{
    
    pool.getConnection(function(error,connection){
    
        connection.query('SELECT '+colNames+' FROM '+schemaName,function(err,allCol){ 
            if(err){
                connection.release(); 
                callback(undefined);
            }else{
                callback(allCol);
                connection.release(); 
            }
        });
    });
}






exports.fetchDatFromIds = (pool,colNames,idKeyName,idKeyValueArr,schemaName,callback)=>{
    
    pool.getConnection(function(error,connection){
    
        connection.query('SELECT '+colNames+' FROM '+schemaName+' WHERE '+idKeyName+" IN ('"+idKeyValueArr.join("','")+"') ORDER BY FIELD("+idKeyName+",'"+idKeyValueArr.join("','")+"')",function(err,IdsData){ 
            if(err){
                connection.release(); 
                callback(undefined);
                console.log(err);
            }else{
                callback(IdsData);
                connection.release(); 
            }
        });
    });
}





exports.getAuthData = (pool,schemaName,jsonObjId,requiredFields,callback)=>{
    
    var IdKey = Object.keys(jsonObjId); 
    pool.getConnection(function(error,connection){
    
        connection.query('SELECT '+requiredFields[0]+' FROM '+schemaName[0]+' WHERE ?',jsonObjId,function(err,reqDat){
            
            if(err){callback(undefined);connection.release();}else{
            
                connection.query('SELECT '+requiredFields[1]+' FROM '+schemaName[1]+' WHERE ?',jsonObjId,function(err2,reqDat2){
                   
                    if(err2){callback(undefined);connection.release();}else{
                                         
                        if(reqDat2[0] != undefined){
                            delete reqDat2[0][IdKey];
                            callback([reqDat[0],reqDat2[0]]);
                    
                        }else{
                            callback([reqDat[0]]);
                        }
                        connection.release();
                    }
                    
                });
            }
        });
    });
}





exports.shopsForDisplay = (pool,tableArr,columns,whereClause,whereVal,PageName,count,callback)=>{
    
    pool.getConnection(function(error,connection){
            
        countShops(connection,count,function(myShopCount,val){
            
            if(val != 0){
                
                if(myShopCount == "less"){
                    getShopCountData(connection,tableArr,columns,count,whereClause,whereVal,callback);
                }else{
                    //console.log("not completed yet......third page");
                    getShopCountData(connection,tableArr,columns,count,whereClause,whereVal,callback);
                }
                
            }else{
                callback("Nothing to show........Please add some shops");    
            }
        });
      
    });    

}




function getShopCountData(connection,tableArr,columns,count,whereClause,whereVal,callback){
    
    sortQueries(tableArr,count,whereClause,function(otherTableCol,tableNames,whereClause,groupByClause,orderByClause){
        connection.query('SELECT '+columns+otherTableCol+' FROM '+tableNames+' '+whereClause+' '+groupByClause+' '+orderByClause,[whereVal],function(err,shopData){
        
            if(err){console.log(err);}else{
                console.log(shopData);
                callback(shopData);   
            }
        });        
    });
}

//SELECT name, price, GROUP_CONCAT(photo, ',')
//FROM drinks, drinks_photos
//WHERE drinks.id = drinks_id 
//GROUP BY drinks_id


function sortQueries(tableArr,maxCount,whereClauseVal,callback2){
    
    var goFlag = false;
    var firstChar = 'a';
    var primaryKey = 'Shop_Sub_Id';
    var tableNames = '';
    var otherTableCol = '';
    var groupByClause = 'GROUP BY '+firstChar+'.'+primaryKey;
    var orderByClause = ''
    var whereClause = '';
    var tablesSubArr = [];
    
    if(whereClauseVal == null){
        orderByClause = 'ORDER BY RAND() LIMIT '+maxCount;
    }else{
        whereClause = 'WHERE '+firstChar+'.'+whereClauseVal+' =?';
    }    
    
    for(let i in tableArr){
        tablesSubArr[i] = firstChar;
        if(tableArr[i].search("IMAGE") != -1){
            
            otherTableCol += ',(SELECT GROUP_CONCAT(Image) FROM '+tableArr[i]+' WHERE '+primaryKey+' = '+firstChar+'.'+primaryKey+') AS Images';
            
        }else if(tableArr[i].search("NUMBER") != -1){
            
            otherTableCol += ',(SELECT GROUP_CONCAT(Number) FROM '+tableArr[i]+' WHERE '+primaryKey+' = '+firstChar+'.'+primaryKey+') AS Numbers';
        
        }else{
            tableNames = tableArr[i]+" "+firstChar; 
        }
        
        
        if(i == tableArr.length-1){
            goFlag = true;
        }
        
    }
    //,(SELECT GROUP_CONCAT(Image) FROM SHOP_IMAGE_SCHEMA WHERE Shop_Sub_Id = a.Shop_Sub_Id) AS Images
    if(goFlag != false){
        callback2(otherTableCol,tableNames,whereClause,groupByClause,orderByClause);
    }

}

//            var temp= firstChar.charCodeAt();
//            temp++;
//            firstChar = String.fromCharCode(temp);


function countShops(connection,shopCount,callback){
       
    connection.query('SELECT COUNT(Shop_Sub_Id) FROM '+SchemaName.Shop.Schema,function(err,shopCount){
        if(err){callback('less',0);}else{
        if(shopCount[0]['COUNT(Shop_Sub_Id)'] > shopCount){
            callback('more',shopCount[0]['COUNT(Shop_Sub_Id)']);
        }else{
            callback('less',shopCount[0]['COUNT(Shop_Sub_Id)']);
        }
        }
    });    
}




exports.feedEmailStash = (pool,jsonData,schemaName,callback)=>{
    
        pool.getConnection(function(error,connection){
            
            addDetails(connection,jsonData,schemaName,callback);
            
        });
    
}