var fs = require('fs');
var handleSql = require("./sql tables/handleSql.js");
var operations = require("./operations.js");
var Datastore = require("./datastore.js");


var socketCache = [];

exports.listen = function(fireDatastore,pool,datastore,bucket){
    
    var socketChannelPath = 'Channels/Sockets';                 
    var socketChannel = fireDatastore.ref(socketChannelPath);
    var adminSocketChannel = fireDatastore.ref("Channels/AdminSockets");
   // var notifChannel = fireDatastore.ref('Channels/notification/');  

    socketChannel.on("value", function(socket) {
        if(socket.val() != null && socket.val() != undefined){
            changeEventData(socket.val());
           sortValueChange(fireDatastore,socket.val(),socketChannelPath,function(clientObj,socketChannelRes){
                receiveUserSockets(socketChannelRes,clientObj,pool,datastore,bucket);
            });
            
        }
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
    
    
    adminSocketChannel.on("value", function(socket) {
        if(socket.val() != null && socket.val() != undefined){
           // changeEventData(socket.val());
            receiveAdminSockets(adminSocketChannel,socket.val(),pool,datastore,bucket);
            receiveEvents(adminSocketChannel);
        }
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });    
     
}


function changeEventData(dataChange){
    
    console.log('\n-------------------------------');
    console.log('event change called : ');
    console.log(dataChange);    
    console.log('\n-------------------------------');

}

    function receiveAdminSockets(socketChannelRes,clientObj,pool,datastore,bucket){
        
        if(clientObj.Event_Name == "ShopData"){
            delete clientObj.Event_Name;
            
            checkObjOnlyEmail(clientObj,function(checkRes){
                
                if(checkRes){
                    var newEmailObj = new Object();
                    newEmailObj["Shop_User_Email"] = clientObj["Shop_User_Email"];
                    handleSql.feedEmailStash(pool,newEmailObj,SchemaName.Stack.EmailSchema,function(stat,resp){
                        if(stat){
                            priorityEmails.push(newEmailObj["Shop_User_Email"]);
                            console.log(priorityEmails);
                            socketChannelRes.set(resp+'-------'+'emails : '+priorityEmails); 
                        }else{
                            socketChannelRes.set("failed to store in the Email Stash");    
                        }
                    });
                    
                }else if(checkRes == false){ 
                    eventEmit.emit('shopPath',[clientObj.Name+"/shop_"+clientObj.Shop_Number+"/"]);
                    handleSql.fromEmailToId(pool,clientObj,SchemaName.Shop.UserSchema,function(jsonData){
                        if(jsonData != undefined){    
                            handleSql.checkShopSubId(pool,jsonData,SchemaName.Shop.Schema,function(diceyJson){
                                if(!diceyJson){
                                    //geneate sub id
                                    operations.generateShopSubId(jsonData,function(realJson){
                                        //for post shop image request
                                        eventEmit.emit('pushShopId',{Shop_Sub_Id:realJson.Shop_Sub_Id});
                                        shopDataHandler(pool,realJson,socketChannelRes);
                                    });
                                }else{ 
                                    eventEmit.emit('pushShopId',{Shop_Sub_Id:diceyJson.Shop_Sub_Id});
                                    shopDataHandler(pool,diceyJson,socketChannelRes);
                                }
                            });
                        }else{
                            eventEmit.emit('pushShopId',{Shop_Sub_Id:undefined});
                            socketChannelRes.set("invalid email: owner not registered.");
                        }
                    });                      
                }else{
                    socketChannelRes.set(checkRes);
                }
            });
        }
      
          
        if(clientObj.Event_Name == "availableCars"){
            delete clientObj.Event_Name;     
            handleSql.fromEmailToId(pool,clientObj,SchemaName.Shop.UserSchema,function(jsonData){
                
                handleSql.checkShopSubId(pool,jsonData,SchemaName.Shop.Schema,function(diceyJson){
                    
                    if(!diceyJson){
                        operations.generateShopSubId(jsonData,function(realJson){ 
                            operations.prepareJsonForDatastore(realJson.Shop_Sub_Id,realJson.Car_Names,function(datastorejson){
                                Datastore.feedDatastore(datastore,datastorejson,'SHOPS','CARS_AVAILABLE',function(storeRes){ 
                                    socketChannelRes.set(storeRes);
                                }); 
                            });
                        });
                    }else{
                        
                        operations.prepareJsonForDatastore(diceyJson.Shop_Sub_Id,diceyJson.Car_Names,function(datastorejson){
                            Datastore.feedDatastore(datastore,datastorejson,'SHOPS','CARS_AVAILABLE',function(storeRes){ 
                                socketChannelRes.set(storeRes);
                            }); 
                        });
                    }
                });
          
            });
            
        }  
        
        
        if(clientObj.Event_Name == "modelLinkWeb"){
            delete clientObj.Event_Name;  
            var splitKey = clientObj.req.file.storedPath.split('_');
            clientObj.req.file.storedPath = '';
            for(let i in splitKey){
                if(i == splitKey.length-1){
                    clientObj.req.file.storedPath += splitKey[i];
                }else{
                    clientObj.req.file.storedPath += splitKey[i]+'/';
                }
                
            }
            operations.StoreFilesDb(clientObj.req,pool,datastore,function(resLink){
                socketChannelRes.set(resLink);
            });
        }
        
        if(clientObj.Event_Name == "getBookings"){
            
            handleSql.getCols(pool,"Shop_Sub_Id,Name",SchemaName.Shop.Schema,function(shopDatObj){
                var countArr = 0;
                if(shopDatObj != undefined){
                    getBookings(datastore,pool,socketChannelRes,shopDatObj,countArr);
                }
            })
            
        }
        
    }


    
    function receiveUserSockets(socketChannelRes,clientObj,pool,datastore,bucket){
                    
        if(clientObj.Event_Name == "UserData"){
            delete clientObj.Event_Name;
            operations.extractIdFromToken(pool,clientObj,'User',false,function(DatWithId){
                if(clientObj.Event_Name2 != undefined && clientObj.Event_Name2 == "UserDataBook"){
                    delete clientObj.Event_Name2;    
                    operations.prepareJsonForDatastore("User_Id_"+DatWithId.User_Id,[DatWithId.Book_Option,true],function(datastorejson){
                        handleSql.shopsForDisplay(pool,[SchemaName.Shop.Schema],"Shop_Sub_Id","Dynamic_Url",DatWithId.Dynamic_Url,null,1,function(shopsObj){
                            Datastore.feedDatastoreBooking(datastore,datastorejson,'SHOPS',shopsObj[0].Shop_Sub_Id,function(storeRes){ 
                                socketChannelRes.set(storeRes);    
                            });                                         
                        });                            
                    }); 
                }else{
                    handleSql.manageQueries(pool,DatWithId,'UserData',SchemaName.User.PerSchema,function(status,dat){
                        if(status){
                            socketChannelRes.set("userData saved successfully");
                        }else{
                            socketChannelRes.set("userData could not save.Try again");
                        }
                    });
                }
                
            });
        }
        
        
        
        if(clientObj.Event_Name == "ShopOwnerData"){
            delete clientObj.Event_Name;
            operations.extractIdFromToken(pool,clientObj,'Shop',false,function(DatWithId){  
                if(clientObj.Event_Name2 != undefined && clientObj.Event_Name2 == "ShopOwnerDataBook"){
                    delete clientObj.Event_Name2;
                    operations.prepareJsonForDatastore("Shop_Id_"+DatWithId.Shop_Id,[DatWithId.Book_Option,true],function(datastorejson){
                        handleSql.shopsForDisplay(pool,[SchemaName.Shop.Schema],"Shop_Sub_Id","Dynamic_Url",DatWithId.Dynamic_Url,null,1,function(shopsObj){
                            Datastore.feedDatastoreBooking(datastore,datastorejson,'SHOPS',shopsObj[0].Shop_Sub_Id,function(storeRes){ 
                                socketChannelRes.set(storeRes);    
                            });                                         
                        });
                    });
                    
                }else{
                    handleSql.manageQueries(pool,DatWithId,'ShopOwnerData',SchemaName.Shop.UserPerSchema,function(status,dat){
                        if(status){
                            socketChannelRes.set("ShopOwnerData saved successfully");
                        }else{
                            socketChannelRes.set("ShopOwnerData could not save.Try again");
                        }
                    }); 
                }
            
            });
        }
        
        
        
        if(clientObj.Event_Name == "deleteTokValue"){
            delete clientObj.Event_Name;
            
            var schemaName;
            if(clientObj.Array_info[0].split('_')[0] == "User"){
                schemaName = SchemaName.User.Schema;
            }else{
                schemaName = SchemaName.Shop.UserSchema;
            }
            handleSql.deleteValue(pool,clientObj.Array_info,schemaName,function(delRes){
                console.log(delRes); 
            });
            
        }
        
    }


function getBookings(datastore,pool,socketChannelRes,shopDatObj,countArr){

    Datastore.fetchAdminBooking(datastore,shopDatObj[countArr]['Shop_Sub_Id'],function(Shop_Id_Arr,Shop_Booking,User_Id_Arr,User_Booking){
        if(User_Id_Arr != '' && User_Booking != ''){
            handleSql.fetchDatFromIds(pool,"Name,Number","User_Id",User_Id_Arr,SchemaName.User.PerSchema,function(UserInfo){ 
                socketChannelRes.set(["bookingSocket",shopDatObj[countArr]['Name']+" : User bookings",User_Booking,UserInfo]);
                if(Shop_Id_Arr != '' && Shop_Booking != ''){          
                    handleSql.fetchDatFromIds(pool,"Name,Number","Shop_Id",Shop_Id_Arr,SchemaName.Shop.UserPerSchema,function(shopInfo){
                        socketChannelRes.set(["bookingSocket",shopDatObj[countArr]['Name']+" : Shop Owner bookings",Shop_Booking,shopInfo]);
                        recursive(datastore,pool,socketChannelRes,shopDatObj,countArr);
                    });
                }else{
                    recursive(datastore,pool,socketChannelRes,shopDatObj,countArr);
                }
            });
        }else if(Shop_Id_Arr != '' && Shop_Booking != ''){          
            handleSql.fetchDatFromIds(pool,"Name,Number","Shop_Id",Shop_Id_Arr,SchemaName.Shop.UserPerSchema,function(shopInfo){
                socketChannelRes.set(["bookingSocket",shopDatObj[countArr]['Name']+" : Shop Owner bookings",Shop_Booking,shopInfo]);
                recursive(datastore,pool,socketChannelRes,shopDatObj,countArr);
            });
        }else{
            console.log("No bookings for Shop "+shopDatObj[countArr]['Name']+"....searching other shops....YOU SUCK!!");
            recursive(datastore,pool,socketChannelRes,shopDatObj,countArr);
        }
    });
}


function recursive(datastore,pool,socketChannelRes,shopDatObj,countArr){
    
    if(countArr == shopDatObj.length-1){
        socketChannelRes.set("Search Complete dont press that button too much.....SUCKER!!");
    }else{
        countArr++;
        getBookings(datastore,pool,socketChannelRes,shopDatObj,countArr);
    }
}


function receiveEvents(socketChannelRes){
    
//    eventEmit.on('LoggedInUser',function(sessionId){
//        
//        //push all authorized user info and shop info here
//        console.log(sessionId);
//    });
//    
//    
//     
//    eventEmit.on('GuestUser',function(sessionInfo){
//        console.log('----->>>>>');
//        //push all guest user info and shop info here
//        console.log(sessionInfo);
//        
//    });
    
}



/**************FEW MORE FUNCTIONS******************/

function shopDataHandler(pool,realJson,socketChannelRes){
    
    splitShopNumber(realJson,function(jsonShopNum){
                
        handleSql.manageQueries(pool,realJson,'ShopData',SchemaName.Shop.Schema,function(status,dat){
            console.log(status);
            socketChannelRes.set(dat);
            
            if(status && jsonShopNum['Number'] != undefined){
                handleSql.manageQueries(pool,jsonShopNum,'ShopNumbers',SchemaName.Shop.numberSchema,function(status2,dat2){
                    console.log(status);
                    socketChannelRes.set(dat);                   
                });
            } 
        });              
    });   
}






function partFtpData(jsonData,callback){
     
    var shopImages = jsonData.Shop_Images;
    delete jsonData['Shop_Images'];
    callback(jsonData,shopImages); 
}
    
       

function splitShopNumber(dat,callback){
    
    var newJsonNumbers = {};
    newJsonNumbers['Number'] = dat['Number'];
    newJsonNumbers['Shop_Sub_Id'] = dat['Shop_Sub_Id'];
    delete dat['Number'];
    callback(newJsonNumbers);
}

function sortValueChange(fireDatastore,socketVal,socketChannelPath,callback){
    
    let splitValue = Object.keys(socketVal);//splitValue[0] contains the firebase id of user
    var clientObj = socketVal[splitValue[0]];
    var channel2 = fireDatastore.ref(socketChannelPath+'/'+splitValue[0]);
    callback(clientObj,channel2);
    
}

function checkObjOnlyEmail(dataObj,callback){
    var countKeys = 0;
    var objLen = Object.keys(dataObj).length;
    
        
    if(dataObj['Shop_User_Email'] == ""){
    
        console.log("no email provided");
        callback("no email provided");
    }
    else
    {
        for(var i in dataObj){
            if(dataObj[i] == ""){
                countKeys++;
            }else{
                //do nothing
            }
        }
        if(countKeys == objLen-1){
            //feed email to the stack
            console.log("to the stash");
            callback(true);
        }else{
            console.log("regular feed");
            callback(false);
        }
    }
}



