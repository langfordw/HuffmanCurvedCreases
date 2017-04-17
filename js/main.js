/**
 * Created by ghassaei on 10/27/16.
 */

globals = {};

$(function() {

    globals = initGlobals();

    var p = new Parabola(new THREE.Vector3(50,50,0),new THREE.Vector3(0,-10,0),[-50,50]);
    // var p2 = new Parabola(new THREE.Vector3(-50,50,0),new THREE.Vector3(0,-10,0),[-50,50]);
    console.log(p)

    // _.each(nodePositions, function(pos){
        // var position = new THREE.Vector3(10,20,0);
        // var node = new Node(position, globals);
        // globals.addNode(node);
    // });
    // _.each(edgeConnections, function(connection){
    //     var edge = new Beam([globals.nodes[connection[0]], globals.nodes[connection[1]]], globals);
    //     globals.addEdge(edge);
    // });

    globals.threeView.render();

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    var raycasterPlane = new THREE.Plane(new THREE.Vector3(0,0,1));
    var highlightedObj;
    var isDragging = false;
    var isDraggingNode = false;
    var isDraggingForce = false;
    var mouseDown = false;
    var beamInProgress = null;

    function setHighlightedObj(object){
        if (highlightedObj && (object != highlightedObj)) {
            highlightedObj.unhighlight();
            globals.controls.hideMoreInfo();
        }
        highlightedObj = object;
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
        } else if (e.keyCode == 13){
            globals.linked.link();
        } else if (e.keyCode == 27){
            globals.linked.deselectAll();
        }
        //console.log(e.keyCode);
    });


    $(document).dblclick(function() {
        if (highlightedObj && highlightedObj.type == "node"){
            if (globals.lockTopology) return;
            beamInProgress = new BeamBuilding(highlightedObj, highlightedObj.getPosition(), globals);
            setHighlightedObj(null);
        } else if (highlightedObj && highlightedObj.type == "beam"){
            if (globals.lockTopology) return;
            var position = getPointOfIntersectionWithObject(highlightedObj.getObject3D());
            if (position === null) return;
            var oldEdge = highlightedObj;
            var node = new Node(position, globals);
            globals.addNode(node);
            var connectedNodes = oldEdge.getNodes();
            var beam1 = new Beam([connectedNodes[0], node], globals);
            globals.addEdge(beam1);
            var beam2 = new Beam([connectedNodes[1], node], globals);
            globals.addEdge(beam2);
            setHighlightedObj(node);
            globals.removeEdge(oldEdge);
            // globals.solver.resetK_matrix();
            // globals.solver.resetF_matrix();
            // globals.solver.solve();
            globals.controls.viewModeCallback();
        }
    });

    document.addEventListener('mousedown', function(e){

        switch (e.which) {
        case 1://left button
            mouseDown = true;
            console.log("mouse down")
            console.log(highlightedObj)
            break;
        case 2://middle button
            break;
        case 3://right button

            if (highlightedObj && highlightedObj.type == "node"){
                var position = highlightedObj.getPosition();
                globals.controls.editMoreInfoXY({x:position.x.toFixed(2), y:position.y.toFixed(2)}, e, function(val, axis){
                    val = parseFloat(val);
                    if (isNaN(val)) return;
                    var _position = highlightedObj.getPosition();
                    _position[axis] = val;
                    highlightedObj.moveManually(_position);
                    globals.linked.move(highlightedObj, _position);
                    // globals.solver.resetK_matrix();
                    // globals.solver.solve();
                    globals.threeView.render();
                });
            } else if (highlightedObj && highlightedObj.type == "beam"){
                //globals.controls.editMoreInfo(highlightedObj.getLength().toFixed(2), e, function(val){
                //    console.log(val);
                //});
            } else if (highlightedObj && highlightedObj.type == "force"){
                var force = highlightedObj.getForce();
                globals.controls.editMoreInfoXY({x:force.x.toFixed(2), y:force.y.toFixed(2)}, e, function(val, axis){
                    val = parseFloat(val);
                    if (isNaN(val)) return;
                    var _force = highlightedObj.getForce();
                    _force[axis] = val;
                    highlightedObj.setForce(_force);
                    // globals.solver.resetF_matrix();
                    // globals.gradient.resetF_matrix();
                    // globals.solver.solve();
                    globals.threeView.render();
                });
            }
            break;
    }



    }, false);

    document.addEventListener('mouseup', function(e){
        if (isDraggingNode){
            isDraggingNode = false;
            globals.threeView.enableControls(true);
        }
        if (isDraggingForce){
            isDraggingForce = false;
            globals.threeView.enableControls(true);
        }
        if (shift && highlightedObj && highlightedObj.type == "node"){
            globals.linked.selectNode(highlightedObj);
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
                    globals.threeView.enableControls(false);
                }
                var intersection = getIntersectionWithObjectPlane(highlightedObj.getPosition());
                var data = "Position: " +
                            "&nbsp;&nbsp;  x : " + intersection.x.toFixed(2) + "&nbsp;  y : " + intersection.y.toFixed(2);
                if (!globals.xyOnly) data += "&nbsp;  z : " + intersection.z.toFixed(2);
                globals.controls.showMoreInfo(data  + " m", e);
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