

exports.feadBucket = (req,bucket,actualPath,fileType,callback)=>{
    var gcsname = req.file.originalname;
    var cloudName = fileType+"_"+gcsname;
    const file = bucket.file(actualPath+cloudName);

    
    file.exists(function(err, exists) {
       
        if(exists){
            
            var message = 'this file already exist at path: '+actualPath+"   =>  overwriting file...";
            
        }else{
            
            var message = 'path created: '+actualPath+"   =>  inserting file...";
            
        }
        
            const stream = file.createWriteStream({
                metadata: {
                    contentType: req.file.mimetype
                }
            }); 
    
            stream.on('error', (err2) => {
                callback(undefined,err2,null,"cloud store error");
            });
            stream.on('finish', () => {
                
                file.makePublic(function(err3, apiResponse) {
                    if(err){
                        console.log(err3);
                        callback(undefined,err3,null,"could not create a public url of the file at path: "+actualPath+cloudName);  
                    }
                    else{
                        callback(exists,getPublicUrl(actualPath+cloudName),actualPath+cloudName,message);         
                    }
                    
                });
            });
            stream.end(req.file.buffer);        
        
            
    });

}

//
//function getPublicUrl (filename) {
//  return `https://storage.googleapis.com/${CLOUD_BUCKET}/${filename}`;
//}


function getPublicUrl (filename) {
  return `https://storage.googleapis.com/titanium-flash-171510.appspot.com/${filename}`;
}

    
