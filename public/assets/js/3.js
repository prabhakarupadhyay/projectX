/*var Ser_comLoadDat = [{
        "Name": "Auto Marg"
        , "Dynamic_Url": "rkxVUpY5rZ"
        , "Images": "./assets/shop1.jpg,https://storage.googleapis.com/titanium-flash-171510.appspot.com/SHOPS/Auto Marg/shop_1/IMAGE_audi Q7.PNG,https://storage.googleapis.com/titanium-flash-171510.appspot.com/SHOPS/Auto Marg/shop_1/IMAGE_Xlogo.png"
}, {
        "Name": "Vasant Marg"
        , "Dynamic_Url": "rkxVUpY5rZ"
        , "Images": "./assets/shop1.jpg,https://storage.googleapis.com/titanium-flash-171510.appspot.com/SHOPS/Auto Marg/shop_1/IMAGE_audi Q7.PNG,https://storage.googleapis.com/titanium- flash-171510.appspot.com/SHOPS/Auto Marg/shop_1/IMAGE_Xlogo.png"
}, {
        "Name": "Marg Marg"
        , "Dynamic_Url": "rkxVUpY5rZ"
        , "Images": "./assets/shop1.jpg,https://storage.googleapis.com/titanium-flash-171510.appspot.com/SHOPS/Auto Marg/shop_1/IMAGE_audi Q7.PNG,https://storage.googleapis.com/titanium- flash-171510.appspot.com/SHOPS/Auto Marg/shop_1/IMAGE_Xlogo.png"
}, {
        "Name": "Raghu Marg"
        , "Dynamic_Url": "rkxVUpY5rZ"
        , "Images": "./assets/shop1.jpg,https://storage.googleapis.com/titanium-flash-171510.appspot.com/SHOPS/Auto Marg/shop_1/IMAGE_audi Q7.PNG,https://storage.googleapis.com/titanium-flash-171510.appspot.com/SHOPS/Auto Marg/shop_1/IMAGE_Xlogo.png"
}, {
        "Name": "Dayan Marg"
        , "Dynamic_Url": "rkxVUpY5rZ"
        , "Images": "./assets/shop1.jpg,https://storage.googleapis.com/titanium-flash-171510.appspot.com/SHOPS/Auto Marg/shop_1/IMAGE_audi Q7.PNG,https://storage.googleapis.com/titanium- flash-171510.appspot.com/SHOPS/Auto Marg/shop_1/IMAGE_Xlogo.png"
}, {
        "Name": "Nhp Marg"
        , "Dynamic_Url": "rkxVUpY5rZ"
        , "Images": "./assets/shop1.jpg,https://storage.googleapis.com/titanium-flash-171510.appspot.com/SHOPS/Auto Marg/shop_1/IMAGE_audi Q7.PNG,https://storage.googleapis.com/titanium- flash-171510.appspot.com/SHOPS/Auto Marg/shop_1/IMAGE_Xlogo.png"
    }

];
*/
//Shop Allocation
var dynamicAlloc = document.getElementById('dynamicAlloc');
var dynamicTag = document.getElementById('DynamicTag');
//check if common variable is present or not
if (typeof Ser_comLoadDat != 'undefined') {
    executeComUserFunc();
}
//DYNAMIC SHOP ARRANGEMENT
function executeComUserFunc() {
    var cnt = 0;
    var countObj = Ser_comLoadDat.length;
    for (let i in Ser_comLoadDat) {
        var currentObj = Ser_comLoadDat[i];
        var objectKeys = Object.keys(currentObj);
        for (let j in objectKeys) {
            var currentKey = objectKeys[j];
            var currentTag = dynamicTag.querySelector('#' + currentKey);
            feedTags(currentTag, currentObj[currentKey], function (newCurrentTag) {
                console.log(newCurrentTag);
            });
        }
        if (i == 0) {
            dynamicTag = dynamicTag.cloneNode(true);
        }
        else {
            dynamicAlloc.appendChild(dynamicTag);
            dynamicTag = dynamicTag.cloneNode(true);
        }
    }
}

function feedTags(currentTag, tagValue, callback) {
    if (currentTag.tagName == 'IMG') {
        var tagValueArr = tagValue.split(',');
        if (Array.isArray(tagValueArr)) {
            //currently using only first url of shop images
            currentTag.setAttribute('src', tagValueArr[0]);
            callback(currentTag);
            return;
        }
        currentTag.setAttribute('src', tagValue);
        callback(currentTag);
    }
    else if (currentTag.tagName == 'A') {
        var createWebUrl = document.location.origin + '/' + 'dynamicShop' + '/' + tagValue
        currentTag.setAttribute('href', createWebUrl);
        callback(currentTag);
    }
    else if (currentTag.tagName == 'DIV' || currentTag.tagName == 'P') {
        currentTag.innerHTML = tagValue;
        callback(currentTag);
    }
    else {
        callback("tag not found.");
    }
}