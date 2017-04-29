/**
 * Created by ghassaei on 10/31/16.
 */


function initGlobals(){

    var _globals = {

        //edit geo
        addForceMode: false,
        addRemoveFixedMode: false,
        deleteMode: false,

        viewMode: "force",
        xyOnly: true,

        gradStepSize: 1,
        gradTolerance: 1,
        sumFL: 0,

        symmetryAngle: 90,
        symmetryPoint: new THREE.Vector3(0,0,0),

        showCreases: true,
        showNodes: true,
        showPolygons: true,
        showWireframe: false,

        conic_resolution: 20, //
        rule_resolution: 20,

        width: window.innerWidth*0.6,
        height: window.innerHeight*0.6,
        xmin: 0,
        xmax: window.innerWidth*0.6,
        ymin: 0,
        ymax: window.innerHeight*0.6,

        mouseDownPos: null,

        boundingBox: new THREE.Box3(new THREE.Vector3(globals.xmin,globals.ymin,0),
                                    new THREE.Vector3(globals.xmax,globals.ymax,0)),

        selectedObject: {},
        snapToIndex: null,


        nodes : [],
        addNode: addNode,
        removeNode: removeNode,
        conics : [],
        addConic: addConic,
        removeConic: removeConic,
        intersection: null,
        edges: [],
        addEdge: addEdge,
        removeEdge: removeEdge,
        getInfo: getInfo,
        getIntersection: getIntersection
    };

    function getInfo(){
    }

    function addNode(node){
        _globals.nodes.push(node);
    }
    function removeNode(node){
        //if (_globals.nodes.length < 2) return;
        var index = _globals.nodes.indexOf(node);
        if (index>=0) _globals.nodes.splice(index, 1);
        node.destroy();
    }

    function addConic(conic){
        _globals.conics.push(conic);
    }
    function removeConic(conic){
        var index = _globals.conics.indexOf(conic);
        if (index>=0) _globals.conics.splice(index, 1);
        console.log(conic)
        conic.destroy();
        console.log(_globals.conics);
    }

    function addEdge(edge){
        _globals.edges.push(edge);
    }
    function removeEdge(edge){
        //if (_globals.edges.length == 1) return;
        var index = _globals.edges.indexOf(edge);
        if (index>=0) _globals.edges.splice(index, 1);
        edge.destroy();
    }

    function getIntersection(conic1, conic2) {
        globals.threeView.sceneRemove(globals.intersection);
        // var poly1 = CSG.fromPolygons([conic1.exteriorPolygonVertices]);
        // var poly2 = CSG.fromPolygons([conic2.exteriorPolygonVertices]);
        var poly1 = CSG.fromPolygons([conic1.interiorPolygonVertices]);
        var poly2 = CSG.fromPolygons([conic2.interiorPolygonVertices]);

        console.log(poly1);
        console.log(poly2);

        var intersection = poly1.intersect(poly2);
        // console.log(intersection)

        var result = new THREE.Geometry();

        var intersectionVertices = intersection.toPolygons()[0];
        // console.log(intersectionVertices)

        for (var i=0; i < intersectionVertices.length; i++) {
            result.vertices.push(new THREE.Vector3(intersectionVertices[i].x,intersectionVertices[i].y,0));
        }

        globals.intersection = new THREE.Line(result, boundaryMat);
        globals.threeView.sceneAdd(globals.intersection);
    }

    _globals.threeView = initThreeView(_globals);
    _globals.controls = initControls(_globals);

    return _globals;
}