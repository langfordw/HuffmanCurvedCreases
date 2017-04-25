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
        showPolygons: true,
        showWireframe: false,

        conic_resolution: 20, //
        rule_resolution: 20,

        width: window.innerWidth*0.6,
        height: window.innerHeight*0.6,
        xmin: -window.innerWidth*0.6/2.0,
        xmax: window.innerWidth*0.6/2.0,
        ymin: -window.innerHeight*0.6/2.0,
        ymax: window.innerHeight*0.6/2.0,

        mouseDownPos: null,

        boundingBox: new THREE.Box3(new THREE.Vector3(globals.xmin,globals.ymin,0),
                                    new THREE.Vector3(globals.xmax,globals.ymax,0)),

        selectedObject: {},

        nodes : [],
        addNode: addNode,
        removeNode: removeNode,
        conics : [],
        addConic: addConic,
        removeConic: removeConic,
        edges: [],
        addEdge: addEdge,
        removeEdge: removeEdge,
        getInfo: getInfo
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

    _globals.threeView = initThreeView(_globals);
    _globals.controls = initControls(_globals);

    return _globals;
}