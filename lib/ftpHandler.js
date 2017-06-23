var fs = require("fs");
var path = require("path");


exports.connectFTP = function(ftpClient,connectionProperties,pool){
    
   

    ftpClient.on("end",function(){
        console.log("ftp closed");
        ftpClient.connect(connectionProperties);
        console.log("connecting ftp again...");
    });
    
    
      eventEmit.on('carModelData',function(uploadedDat){
              console.log("ftp connected");
              ftpClient.put(uploadedDat.modelData,'eagleModel.fbx',function(err){
                  if (err){console.log(err);return;}
                  console.log("dataUploaded");
                  ftpClient.end();
              });
          
      });
    
}





