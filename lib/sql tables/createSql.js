
global.SchemaName = {

    User:{    
         
        Schema        : 'USER_SCHEMA',    
        PerSchema     : 'USER_PER_SCHEMA',
    }, 
    
    Shop:{
        
        Schema        : 'SHOP_SCHEMA',
        ImageSchema   : 'SHOP_IMAGE_SCHEMA',
        numberSchema  : 'SHOP_NUMBER_SCHEMA',
        UserSchema    : 'SHOP_USER_SCHEMA',    
        UserPerSchema : 'SHOP_USER_PER_SCHEMA', 
    },
    
    Stack:{
        
        EmailSchema : 'STACK_EMAIL_SCHEMA',
        
    },
}

exports.createTables = function(pool){
    
    pool.getConnection(function(error,connection){
      
        //WARNING :- Table creation is serialized
        createTableUser(connection);
        createTableUserPersonal(connection);
        createTableShopUser(connection);
        createTableShopUserPersonal(connection);
        createTableShop(connection);
        createTableShopImages(connection);
        createTableShopNumbers(connection);
        createTableStackEmail(connection);
        
    });
                       
}


//user auth table
function createTableUser(connection){

    connection.query('CREATE TABLE IF NOT EXISTS '+SchemaName.User.Schema+'(User_Id VARCHAR(100) NOT NULL PRIMARY KEY)',function(err,result){
            
        if(err){console.log(err);return;}
        console.log("table created: "+SchemaName.User.Schema);
    
    });

}


//user personal info table
function createTableUserPersonal(connection){

    connection.query('CREATE TABLE IF NOT EXISTS '+SchemaName.User.PerSchema+'(User_Id VARCHAR(100) NOT NULL,FOREIGN KEY(User_Id) REFERENCES '+SchemaName.User.Schema+' (User_Id))',function(err,result){
            
        if(err){console.log(err);return;}
        console.log("table created: "+SchemaName.User.PerSchema);
    
    });

}


//shop owner auth table
function createTableShopUser(connection){

    connection.query('CREATE TABLE IF NOT EXISTS '+SchemaName.Shop.UserSchema+'(Shop_Id VARCHAR(100) NOT NULL PRIMARY KEY)',function(err,result){
            
        if(err){console.log(err);return;}
        
        console.log("table created: "+SchemaName.Shop.UserSchema);
        
    });

}


//shop owner personal info table
function createTableShopUserPersonal(connection){

    connection.query('CREATE TABLE IF NOT EXISTS '+SchemaName.Shop.UserPerSchema+'(Shop_Id VARCHAR(100) NOT NULL,FOREIGN KEY(Shop_Id) REFERENCES '+SchemaName.Shop.UserSchema+' (Shop_Id))',function(err,result){
            
        if(err){console.log(err);return;}
        console.log("table created: "+SchemaName.Shop.UserPerSchema);
    
    });

}


//shop owners shops table
function createTableShop(connection){

    connection.query('CREATE TABLE IF NOT EXISTS '+SchemaName.Shop.Schema+'(Shop_Id VARCHAR(100) NOT NULL,Shop_Sub_Id VARCHAR(100) NOT NULL PRIMARY KEY,FOREIGN KEY(Shop_Id) REFERENCES '+SchemaName.Shop.UserSchema+' (Shop_Id))',function(err,result){
            
        if(err){console.log(err);return;} 
        console.log("table created: "+SchemaName.Shop.Schema);
        
    });

}


//shops images table
function createTableShopImages(connection){

    connection.query('CREATE TABLE IF NOT EXISTS '+SchemaName.Shop.ImageSchema+'(Shop_Sub_Id VARCHAR(100) NOT NULL,FOREIGN KEY(Shop_Sub_Id) REFERENCES '+SchemaName.Shop.Schema+' (Shop_Sub_Id))',function(err,result){
            
        if(err){console.log(err);return;}
        console.log("table created: "+SchemaName.Shop.Schema);
        
    });

}

//shop numbers table
function createTableShopNumbers(connection){

    connection.query('CREATE TABLE IF NOT EXISTS '+SchemaName.Shop.numberSchema+'(Shop_Sub_Id VARCHAR(100) NOT NULL,FOREIGN KEY(Shop_Sub_Id) REFERENCES '+SchemaName.Shop.Schema+' (Shop_Sub_Id))',function(err,result){
            
        if(err){console.log(err);return;}
        connection.release(); 
        console.log("table created: "+SchemaName.Shop.Schema);
        
    });

}


function createTableStackEmail(connection){
    
    connection.query('CREATE TABLE IF NOT EXISTS '+SchemaName.Stack.EmailSchema+'(Shop_User_Email VARCHAR(100) NOT NULL PRIMARY KEY)',function(err,result){
            
        if(err){console.log(err);return;}
        
        console.log("table created: "+SchemaName.Stack.EmailSchema);
        
    });    
    
}




