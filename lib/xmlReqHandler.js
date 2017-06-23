
var request = require("request");
var handleSql = require("./sql tables/handleSql.js");

var priorityEmails = ['onlinefreenotes@gmail.com']

exports.handleXmlReq = function(res,req,pool,reqName){
    
    req.on('data',function(data){
        
        if(reqName == "googleLogin"){
           
            var stringtoken = data.toString();
            //var splittoken = stringtoken.split("=");
            //splittoken.shift();
            var requestUrl = stringtoken;
            readSignInUser(pool,requestUrl);      
        }
    });
    
    req.on('end',function(){
        console.log('****end req****');  
    });
    
}




function readSignInUser(pool,requestUrl){
   
    request(requestUrl,function(error,response,body){
        if(!error && response.statusCode == 200){
             
            var obj = JSON.parse(body);
            
            isAccepted(pool,obj.email,function(istrue){
               
                if(istrue == true){
                    var relevantDatJson = {
                        
                        Shop_Id : obj.sub,
                        Shop_User_Email_Name : obj.name,
                        Shop_User_Email : obj.email,
                        Shop_User_Picture : obj.picture 
                    }; 
                    handleSql.manageQueries(pool,relevantDatJson,'shopLogin',SchemaName.Shop.UserSchema);
                }
                else if(istrue == 'normalUser'){
                    
                    var relevantDatJson = {
                        User_Id : obj.sub,
                        User_Email_Name : obj.name,
                        User_Email : obj.email,
                        User_Picture : obj.picture
                    };
                    handleSql.manageQueries(pool,relevantDatJson,'userLogin',SchemaName.User.Schema);
                }
                
              else{
            
                  return;
                }
                
            });
            
        }    
        else{
            console.log("ERROR=-=-="+error+"RESPONSE=-=-=-"+response.statusCode);         
        }
    });
}



function isAccepted(pool,newMail,callback){
    for(var i in priorityEmails){    
        
        if(newMail == priorityEmails[i]){
            handleSql.checkEmailDuplicates(pool,newMail,function(answer){
                callback(answer);
            });
        }
        else if(i == priorityEmails.length -1){
            callback('normalUser');
        }
    }
}



