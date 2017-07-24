// Initialize the viewer
var iframe = document.getElementById('api-frame');
var version = '1.0.0';
var urlid = 'a94560a66da247afa01ac3f6c26c2fb0';
var client = new Sketchfab(version, iframe);
client.init(urlid, {
    success: function onSuccess(api) {
        api.start();
        api.addEventListener('viewerready', function () {
            // API is ready to use
            // Insert your code here
            console.log('Viewer is ready');
        });
    }
    , error: function onError() {
        console.log('Viewer error');
    }
});