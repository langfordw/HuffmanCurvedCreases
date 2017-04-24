/**
 * Created by ghassaei on 9/16/16.
 */

function initThreeView(globals) {

    var scene = new THREE.Scene();
    var wrapper = new THREE.Object3D();
    var camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -1000, 1000);//-40, 40);
    var renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.autoClear = false;
    var controls;

    var canvasWidth = window.innerWidth*0.6;
    var canvasHeight = window.innerHeight*0.6; 

    var animating = false;

    init();

    var lineObject;

    function init() {

        var container = $("#threeContainer");
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.append(renderer.domElement);

        // scene.background = new THREE.Color(0xf4f4f4);
        scene.background = new THREE.Color(0xe4e4e4);
        scene.add(wrapper);

        var geometry = new THREE.PlaneGeometry( globals.width, globals.height, 1, 1 );
        var material = new THREE.MeshBasicMaterial( {color: 0xf4f4f4, side: THREE.DoubleSide} );
        var plane = new THREE.Mesh( geometry, material );
        plane.translateZ(-1);
        scene.add( plane );

        // camera.zoom = 1;
        // camera.updateProjectionMatrix();
        // camera.position.x = 40;
        // camera.position.y = 40;
        // camera.position.z = 40;

        controls = new THREE.OrbitControls(camera, container.get(0));
        controls.addEventListener('change', render);

        render();
    }

    function render() {
        if (!animating) _render();
    }

    function startAnimation(callback){
        animating = true;
        console.log("starting animation");
        _loop(function(){
            callback();
            _render();
        });
    }

    function stopAnimation(){
        console.log("stop animation");
        animating = false;
    }

    function _render(){
        renderer.clear();
        renderer.render(scene, camera);
        renderer.clearDepth();
    }

    function _loop(callback){
        callback();
        requestAnimationFrame(function(){
            if (animating) _loop(callback);
        });
    }

    function sceneAdd(object) {
        wrapper.add(object);
    }

    function sceneRemove(object) {
        wrapper.remove(object);
    }

    function sceneClear() {
        wrapper.children = [];
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.left = -window.innerWidth / 2;
        camera.right = window.innerWidth / 2;
        camera.top = window.innerHeight / 2;
        camera.bottom = -window.innerHeight / 2;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

        render();
    }

    function enableControls(state){
        controls.enabled = state;
        if (!globals.xyOnly) controls.enableRotate = state;
    }

    function squareWithXY(){
        controls.reset();
        camera.position.x = 0;
        camera.position.y = 0;
        camera.lookAt(new THREE.Vector3(0,0,0));
        render();
    }

    function getObjToIntersect(){
        return scene.children.concat(wrapper.children);
    }

    function getCurvesToIntersect(exceptThis){
        var intersectCurves = [];
        for (var i=0; i<wrapper.children.length; i++) {
            // if (wrapper.children[i].type == "Line") {
                if (wrapper.children[i] != exceptThis) {
                    intersectCurves.push(wrapper.children[i]);
                }
            // }
        }
        return intersectCurves;
    }

    return {
        getObjToIntersect: getObjToIntersect,
        getCurvesToIntersect: getCurvesToIntersect,
        sceneRemove: sceneRemove,
        sceneAdd: sceneAdd,
        sceneClear: sceneClear,
        render: render,
        onWindowResize: onWindowResize,
        startAnimation: startAnimation,
        stopAnimation: stopAnimation,
        enableControls: enableControls,
        squareWithXY: squareWithXY,
        scene: scene,
        camera: camera,
        lineObject: lineObject,
        wrapper: wrapper
    }
}