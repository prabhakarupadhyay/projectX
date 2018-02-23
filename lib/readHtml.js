var fs = require("fs");
var cheerio = require('cheerio');

var cache = {};
var recursionNum = 0;

exports.readAll = function(htmlFiles){
     recursiveFunc(htmlFiles);
}

exports.selectFromCache = function(index,callback){
    
    if(cache[index]){
        callback(cache[index]);
    }else{
        callback(undefined);
    }
    
}


function recursiveFunc(htmlFiles){
    
    var totalRecursion = htmlFiles.length;
    
    if(recursionNum == totalRecursion){
        console.log(cache);
        recursionNum = 0;
        return;
    }
    
    sortPageName(htmlFiles[recursionNum],function(cacheIndex){
        
        readDatFile(htmlFiles,cacheIndex);
        
    });    
    
}


function sortPageName(pathName,callback){
    if(pathName != undefined){ 
        var pathArr = pathName.split('/');
        var lastElem = pathArr[pathArr.length-1];
        var firstNamePg = lastElem.split('.')[0];
        callback(firstNamePg);
    
    }
}


function readDatFile(htmlFiles,cacheIndex){
    fs.exists(htmlFiles[recursionNum],function(exist){
        if(exist){
            //if exist read the file
            fs.readFile(htmlFiles[recursionNum],function(err,fileData){
                if(err){
                    console.log(err);  
                }
                else{
                    //save into cache after reading for the next whirl
                    cache[cacheIndex] =  fileData; 
                    recursionNum++;
                    recursiveFunc(htmlFiles);       
                } 
            });
        }
        else{
            console.log('could not find the file : '+ htmlFiles[recursionNum]);
            recursionNum++;
            recursiveFunc(htmlFiles);                   
        }
    });          
}



