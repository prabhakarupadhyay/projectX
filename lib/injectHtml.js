var fs = require("fs");
var cheerio = require('cheerio');
var readHtml = require("./readHtml.js");

//curReqNum is the request that tells if this function is being loaded once or twice by same req

module.exports = function(eventName,dataObj,req,callback){
    
    if(eventName != undefined && eventName != null){
        readHtml.selectFromCache(eventName,function(body){
      
            if(body != undefined){
                    
                injectData(dataObj,body,req,function(modBody){
                    callback(modBody);
                });  
            }         
        }); 
        
    }
}





function injectData(data,body,req,callback){
    
    $ = cheerio.load(body);
    
    if(req.user != '' && req.user != undefined){
        $('#modifiable').prepend("var Ser_logUserDat = "+JSON.stringify(req.user) + ";");
    }
  
    $('#modifiable').prepend("var Ser_comLoadDat = "+JSON.stringify(data) + ";");
    
    console.log('ddddddddddddddddddddddddddddddddd');
    if($('#companyNumber').text() != '' && companyName != ''){
        $('#companyNumber').text(companyNameValue);
    }
    callback($.html());
    
}


