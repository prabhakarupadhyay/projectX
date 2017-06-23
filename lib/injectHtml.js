var fs = require("fs");
var cheerio = require('cheerio');
var readHtml = require("./readHtml.js");

var tempStore2 = [];
var curReqNum2 = 0;

//curReqNum is the request that tells if this function is being loaded once or twice by same req

module.exports = function(pageName,dataObj,reqNum){

    sortPageName(pageName,function(eventName){
        if(eventName != undefined){
            
            readHtml.selectFromCache(eventName,function(body){
      
                if(body != undefined){
                    
                    injectData(dataObj,body,reqNum,function(modBody){
                        
                         eventEmit.emit(eventName+'_trigger',modBody);
                        
                    });  
                }         
            });
            
        }else{
            if(reqNum == 2){
                curReqNum2 = reqNum;
                tempStore2 = [];
                tempStore2.push(dataObj);                
            }
        } 
    }); 
}


function sortPageName(pageName,callback){
    if(pageName != null){ 
        var pathArr = pageName.split('/');
        var lastElem = pathArr[pathArr.length-1];
        var firstNamePg = lastElem.split('.')[0];
        callback(firstNamePg);
    
    }else{
        callback(undefined);
    }
    
}




function injectData(data,body,reqNum,callback){
    
    $ = cheerio.load(body);
    
    if(tempStore2[0] != '' && tempStore2[0] != undefined && curReqNum2 == 2){
        $('#modifiable').prepend("var Ser_logUserDat = "+JSON.stringify(tempStore2) + ";");
    }
  
    $('#modifiable').prepend("var Ser_comLoadDat = "+JSON.stringify(data) + ";");
    tempStore2 = [];
    curReqNum2 = 0;
    callback($.html());
}


