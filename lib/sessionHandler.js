var handleSql = require("./sql tables/handleSql.js");
var operations = require("./operations.js");

var priorityEmails = ['commona007@gmail.com','1developer.mail@gmail.com'];

exports.checkIdSessions= function(req,res,pool,callback){        
    
    var mySession = req.userSession;
    
    if(mySession.length != undefined){
    
        console.log(req.userSession + '----->>>');
        
        handleSql.checkSessionId(pool,req.userSession,function(istrue,sessionIdVal){
            
            //returning user
        
            callback(istrue,sessionIdVal);
            
        });
    
    }else{
            
        //pure guest
        console.log('pure guest');
        callback(false,'Welcome Guest:Sign in to access more features');
          
    }
        
}



exports.handleOauthSession = function(pool,obj,isOauth,done){
 
    isPresentInDb(pool,obj.email,obj.id,isOauth,function(isUntrue){
        
        if(isUntrue == 'errorLogin'){
            return;
        }
              console.log("----------------------------------");
        console.log(isUntrue);
        
        
        if(isUntrue == true){
        
            var relevantDatJson = {
                               
                Shop_Id : obj.id,
                Shop_User_Email_Name : obj.name,
                Shop_User_Email : obj.email,
                Shop_User_Picture : obj.picture 
                
            };
            
                        
            tokenSorting(obj,relevantDatJson,function(modifiedObj){
                handleSql.manageQueries(pool,modifiedObj,'shopLogin',SchemaName.Shop.UserSchema,function(status,dat){
                    if(status){    
                        return done(null,obj);
                    }else{
                        //here dat contains error
                        return done(dat,null); 
                    }
                });
            });  
        }
        
        else if(isUntrue == 'normalUser'){
        
            var relevantDatJson = {
            
                User_Id : obj.id,
                User_Email_Name : obj.name,
                User_Email : obj.email,
                User_Picture : obj.picture
                
            };      
        
            tokenSorting(obj,relevantDatJson,function(modifiedObj){
                handleSql.manageQueries(pool,modifiedObj,'userLogin',SchemaName.User.Schema,function(status,dat){
                    if(status){
                        return done(null,obj);
                    }else{
                        //here dat contains error
                        return done(dat,null);   
                    } 
            
                });
                            
            });    
        }
        
        else{
         
            if(isUntrue == 'falseNormalUser'){  
                //pass normal user socket events
                var userObj = {
                    User_Id : obj.id,
                    User_Email : obj.email
                }
              
                console.log('bllllllllllooooooowwwwwwww');
                operations.loginUserCredentials(pool,userObj);
                return  done(null,obj);              
                
            }else{    
                //pass Shop Owner socket event
                var OwnerObj = {
                    Shop_Id : obj.id,
                    Shop_User_Email : obj.email    
                }
               
                console.log('blllllooooww2222222222'); 
                operations.loginUserCredentials(pool,OwnerObj);
                return  done(null,obj);          
                
            }
            
        }       
        
    });   

}

function tokenSorting(oldObj,newObj,callback){
    
    var keyNames = Object.keys(newObj);
    var splitName = keyNames[0].split('_');
    var elementName = splitName[0];
    var newAccessTokenName;
    var newRefreshTokenName;
            
    if(elementName == 'Shop' || elementName == 'User'){
        newAccessTokenName = elementName + "_AccessToken";
        newRefreshTokenName = elementName + "_RefreshToken"; 
    }
    
    if(oldObj.access != undefined){
        newObj[newAccessTokenName] = oldObj.tokReq+oldObj.access;
    }
    
    if(oldObj.refresh != undefined){   
       newObj[newRefreshTokenName] = oldObj.refresh;
    }
    
    callback(newObj);
}


function isPresentInDb(pool,newMail,newId,isOauth,callback){
    var presentFlag = false;
    for(var i in priorityEmails){    
        
        if(newMail == priorityEmails[i]){
            var presentFlag = true;
            handleSql.checkEmailDuplicates(pool,newId,newMail,function(answer){
                if(isOauth){
                    if(answer == 'errorLogin'){
                        callback(answer);
                    }else{
                        answer = true;
                        callback(answer);
                        //modify user on authentication
                    }
                }else{
                    callback(answer);
                }
                
            });
        }
        else if(i == priorityEmails.length -1 && presentFlag != true){
            handleSql.checkSessionId(pool,{'User_Id':newId},function(isPresent,data){
                
                if(isPresent){
                    if(isOauth){
                        ////modify user on authentication
                        callback('normalUser');
                    }else{
                        //user present 
                        callback('falseNormalUser');
                    }
                }else{
                    
                    //not present
                    callback('normalUser');
                    
                }
                
            });   
        }
    }
}

