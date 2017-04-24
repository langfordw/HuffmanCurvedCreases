/**
 * Created by ghassaei on 10/27/16.
 */

globals = {};


$(function() {

    globals = initGlobals();
    
    var e = new Conic("ellipse", new THREE.Vector3(0,50,0), new THREE.Vector3(0,-1,0), 60, 60, [-120,120], 0);
    var h = new Conic("hyperbola", new THREE.Vector3(100,50,0), new THREE.Vector3(0,-1,0), 60, 60, [-120,120], 0);


    // getCurveIntersection(p.focus,p.aVec,plane)
    // var p2 = new (new THREE.Vector3(0,50,0),new THREE.Vector3(0,-20,0),[-100,100],0);

    // var poly1 = CSG.fromPolygons([p.exteriorPolygonVertices]);
    // var poly2 = CSG.fromPolygons([p2.exteriorPolygonVertices]);

    // // console.log(poly1);
    // // console.log(poly2);

    // var intersection = poly1.intersect(poly2);
    // console.log(intersection)

    // var result = new THREE.Geometry();

    // var intersectionVertices = intersection.toPolygons();


    // // for (var i=0; i < intersection.segments.length; i++) {
    // //     result.vertices.push(new THREE.Vector3(intersection.segments[i].vertices[0].x,intersection.segments[i].vertices[0].y,0))
    // // }

    // // var intersectionVertices = intersection.toPolygons();
    // // console.log(intersectionVertices)

    // console.log(intersectionVertices)
    
    // for (var j=0; j < intersectionVertices.length; j++) {
    //     // var j = 0;
    //     for (var i=0; i < intersectionVertices[j].length; i++) {
    //         // console.log(intersectionVertices[j][i])
    //         result.vertices.push(new THREE.Vector3(intersectionVertices[j][i].x,intersectionVertices[j][i].y));
    //     }
    // }
    // console.log(result.vertices)
    
    // var outline = new THREE.Line(result, boundaryMat);
    // globals.threeView.sceneAdd(outline)

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
            console.log(highlightedObj)
            if (highlightedObj) {
               $('#conicType').html(highlightedObj.conic.type); 
            }
            break;
        case 2://middle button
            break;
        case 3://right button
            break;
    }



    }, false);

    document.addEventListener('mouseup', function(e){
        if (isDraggingNode){
            isDraggingNode = false;
            // globals.threeView.enableControls(true);
        }
        if (isDraggingForce){
            isDraggingForce = false;
            // globals.threeView.enableControls(true);
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

                globals.controls.setInput("#focusX", globals.selectedObject.conic.focus.x, function(val){
                    globals.selectedObject.conic.focus.x = val;
                    console.log('here')
                    globals.selectedObject.conic.moveCurve();
                });
                globals.controls.setInput("#focusY", globals.selectedObject.conic.focus.y, function(val){
                    globals.selectedObject.conic.focus.y = val;
                    globals.selectedObject.conic.moveCurve();
                });

                highlightedObj.moveManually(intersection);
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