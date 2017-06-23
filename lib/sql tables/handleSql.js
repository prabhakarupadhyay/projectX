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





function fromEmailToId(connection,jsonData,requestName,schemaName,callback){
    
    getIdName(schemaName,function(IDkeyName){
        
        var splitIdName = IDkeyName.split('_');
        var emailKeyName = splitIdName[0] + '_Email';
        connection.query('SELECT '+IDkeyName+' FROM '+schemaName+' WHERE '+emailKeyName+' LIKE ?',[jsonData[emailKeyName]],function(err,IdResult){
            
            jsonData[IDkeyName] = IdResult[0][IDkeyName];
            delete jsonData[emailKeyName];
               
            //exports.manageColumns(pool,jsonData,requestName,schemaName);
        
            callback();
        });   
    }); 
}


function selectSchemaIdToStore(connection,jsonData,requestName,schemaName,callback){
        
        getIdName(schemaName,function(IDkeyName){
        
            addOrUpdate(connection,jsonData,requestName,schemaName,IDkeyName,callback);
        
        });
            
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
//                if(requestName == 'userLogin' || requestName == 'shopLogin'){
//                    console.log('user logged in already'); 
//                    return;
//                }
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
        
        }else if(splitColumnName[i] == 'Description'){
        
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
           // console.log('successfully stored all the details in '+schemaName);
            callback(true,'successfully stored all the details in ' +schemaName);
            connection.release();
        }
        });
    
}


function updateDetails(connection,jsonData,schemaName,ID,callback){
    
      seperateBlankFields(jsonData,function(selectedFileds){
          
          connection.query('UPDATE '+schemaName+' SET ? WHERE '+ID+' = ?',[jsonData,jsonData[ID]],function(err,upResult){
              
              if(err){
                  console.log(err);
                  callback(false,err);
                  connection.release();
              }else{
                  
                 // console.log(schemaName+' : all fields updated at '+jsonData[ID]);
                  callback(true,schemaName+' : all fields updated at '+jsonData[ID]);
                  connection.release();
              }
              
          });
          
      });
            
}



function seperateBlankFields(jsonData,callback){
    
    var storeSelectedField = [];
    var keyNames = Object.keys(jsonData);
    
    for(var i in keyNames){
        if(jsonData[keyNames[i]] == '' || jsonData[keyNames[i]] == null || jsonData[keyNames[i]].indexOf(' ') >= 0){        
            //do nothing blank fields
        
        }else{
            storeSelectedField.push(keyNames[i]);
        }
    }
    
    callback(storeSelectedField);
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

