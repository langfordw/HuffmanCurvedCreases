/**
 * Created by ghassaei on 10/27/16.
 */

globals = {};
var outputs = [];


$(function() {

    globals = initGlobals();

    // globals.addConic( new Conic("parabola", new THREE.Vector3(0,50,0), new THREE.Vector3(0,-1,0), 60, 0, [-120,120], "converging") );
    globals.addConic( new Conic("hyperbola", new THREE.Vector3(50,50,0), new THREE.Vector3(0,-1,0), 40, 60, [-120,120], "converging") );
    globals.addConic( new Conic("parabola", new THREE.Vector3(-30,100,0), new THREE.Vector3(0,1,0), 40, 60, [-120,120], "converging") );
    // globals.addConic( new Conic("ellipse", new THREE.Vector3(-100,50,0), new THREE.Vector3(0,-1,0), 60, 60, [-120,120], 0) );
    
    console.log(findIntersections(globals.conics[0].curvePoints,globals.conics[1].curvePoints));
    globals.threeView.render();

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    var raycasterPlane = new THREE.Plane(new THREE.Vector3(0,0,1));
    var highlightedObj;
    var isDragging = false;
    var isDraggingNode = false;
    var isDraggingForce = false;
    var mouseDown = false;

    function setHighlightedObj(object){
        if (highlightedObj && (object != highlightedObj)) {
            highlightedObj.unhighlight();
        }
        highlightedObj = object;
        if (object != null) {
            globals.selectedObject = object;
        }
        if (highlightedObj) highlightedObj.highlight();
        globals.threeView.render();
    }

    var shift = false;
    $(document).on("keydown", function (e) {
        if (e.keyCode == 16){
            shift = true;
        }
    });
    $(document).on("keyup", function (e) {
        if (e.keyCode == 16){
            shift = false;
        }
    });


    $(document).dblclick(function() {
    });

    document.addEventListener('mousedown', function(e){

        switch (e.which) {
        case 1://left button
            mouseDown = true;
            globals.snapToIndex = null;
            globals.controls.updateControls();
            if (highlightedObj) {
               console.log(highlightedObj)
            }
            globals.mouseDownPos = new THREE.Vector3((e.clientX/window.innerWidth)*2-1,-(e.clientY/window.innerHeight)*2+1,0);
            break;
        case 2://middle button
            break;
        case 3://right button
            break;
    }



    }, false);

    document.addEventListener('mouseup', function(e){
        if (isDraggingNode){
            // if there's another focus close enough to snap to, then snap:
            if (globals.snapToIndex != null) {
                var position = globals.conics[globals.snapToIndex].focus;
                globals.selectedObject.object3D.position.set(position.x, position.y, 0);
                globals.selectedObject.conic.moveCurve(position);
            }
            isDraggingNode = false;
        }
        if (isDraggingForce){
            isDraggingForce = false;
        }
        isDragging = false;
        mouseDown = false;
    }, false);

    document.addEventListener( 'mousemove', mouseMove, false );
    function mouseMove(e){

        if (mouseDown) {
            isDragging = true;
        }

        e.preventDefault();
        mouse.x = (e.clientX/window.innerWidth)*2-1;
        mouse.y = - (e.clientY/window.innerHeight)*2+1;
        raycaster.setFromCamera(mouse, globals.threeView.camera);

        var _highlightedObj = null;

        if (!isDragging) {
            var objsToIntersect = globals.threeView.getObjToIntersect();
            _highlightedObj = checkForIntersections(e, objsToIntersect);
            setHighlightedObj(_highlightedObj);
        } else if (isDragging && highlightedObj){

            if (highlightedObj.type == "node"){
                if (!isDraggingNode) {
                    isDraggingNode = true;
                    // globals.threeView.enableControls(false);
                }
                var intersection = getIntersectionWithObjectPlane(highlightedObj.getPosition());
                var data = "Position: " +
                            "&nbsp;&nbsp;  x : " + intersection.x.toFixed(2) + "&nbsp;  y : " + intersection.y.toFixed(2);

                // globals.controls.setInput("#focusX", globals.selectedObject.conic.focus.x, function(val){
                //     globals.selectedObject.conic.focus.x = val;
                //     console.log(globals.selectedObject.conic.focus)
                //     globals.selectedObject.conic.focusNode.move(val,globals.selectedObject.conic.focus.y,0);
                //     globals.selectedObject.conic.moveCurve();
                // });
                // globals.controls.setInput("#focusY", globals.selectedObject.conic.focus.y, function(val){
                //     globals.selectedObject.conic.focus.y = val;
                //     globals.selectedObject.conic.moveCurve();
                // });

                globals.controls.updateControls();

                highlightedObj.moveManually(intersection,shift);
                console.log(checkOverlap(getBoundingBox(globals.conics[0].curvePoints),getBoundingBox(globals.conics[1].curvePoints)));
                // findIntersections(globals.conics[0].curvePoints,globals.conics[1].curvePoints)
                globals.controls.viewModeCallback();
                
            }
        }
    }

    function getIntersectionWithObjectPlane(position){
        var cameraOrientation = globals.threeView.camera.getWorldDirection();
        var dist = position.dot(cameraOrientation);
        if (globals.xyOnly) {
            raycasterPlane.set(new THREE.Vector3(0,0,1), 0);
        } else {
            raycasterPlane.set(cameraOrientation, -dist);
        }
        var intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(raycasterPlane, intersection);
        return intersection;
    }

    function getPointOfIntersectionWithObject(object){
        var intersections = raycaster.intersectObjects([object], false);
        if (intersections.length > 0) {
            return intersections[0].point;
        }
        console.warn("no intersection found");
        return null;
    }

    function checkForIntersections(e, objects){
        var _highlightedObj = null;
        var intersections = raycaster.intersectObjects(objects, true);
        if (intersections.length > 0) {
            var objectFound = false;
            _.each(intersections, function (thing) {
                if (objectFound) return;
                if (thing.object && thing.object._myNode && thing.object._myNode.type == "node"){
                    _highlightedObj = thing.object._myNode;
                    objectFound = true;
                } else if (thing.object && thing.object._myBeam && thing.object._myBeam.type == "beam") {
                    _highlightedObj = thing.object._myBeam;
                    objectFound = true;
                } else if (thing.object && thing.object._myForce && thing.object._myForce.type == "force") {
                    _highlightedObj = thing.object._myForce;
                    objectFound = true;
                }
            });
        }
        return _highlightedObj;
    }

});