/**
 * Created by ghassaei on 9/16/16.
 */

var nodeMaterial = new THREE.MeshBasicMaterial({color: 0x333333});
var nodeMaterialFixed = new THREE.MeshBasicMaterial({color: 0x000000});
var nodeMaterialDelete = new THREE.MeshBasicMaterial({color: 0xff0000});
var nodeMaterialHighlight = new THREE.MeshBasicMaterial({color: 0x00ffff});
var nodeGeo = new THREE.CircleGeometry(8);
var nodeFixedGeo = new THREE.CubeGeometry(12, 12, 12);

function Node(position, globals, type, conic, noAdd){

    this.type = "node";
    this.controlType = type;

    this.conic = conic;

    if (noAdd === undefined){
        this.object3D = new THREE.Mesh(nodeGeo, nodeMaterial);
        this.object3D._myNode = this;
        globals.threeView.sceneAdd(this.object3D);

        this.move(position);
    } else {
        this.position = position.clone();
    }
}

Node.prototype.setFixed = function(fixed){
    this.fixed = fixed;
    if (fixed) {
        this.object3D.material = nodeMaterialFixed;
        this.object3D.geometry = nodeFixedGeo;
    }
    else {
        this.object3D.material = nodeMaterial;
        this.object3D.geometry = nodeGeo;
    }
    if (this.externalForce){
        if (fixed) this.externalForce.hide();
        else this.externalForce.show();
    }
};

Node.prototype.getObject3D = function(){
    return this.object3D;
};

Node.prototype.setDeleteMode = function(){
    this.object3D.material = nodeMaterialDelete;
};

Node.prototype.highlight = function(){
    if (globals.deleteMode || (globals.addRemoveFixedMode && this.fixed)) {
        this.setDeleteMode();
    }
    else this.object3D.material = nodeMaterialHighlight;
};

Node.prototype.unhighlight = function(){
    if (this.fixed) {
        this.object3D.material = nodeMaterialFixed;
    }
    else {
        this.object3D.material = nodeMaterial;
    }
};

Node.prototype.hide = function(){
    this.object3D.visible = false;
};
Node.prototype.show = function(){
    this.object3D.visible = true;
};

Node.prototype.moveManually = function(position,shift=false){
    if (this.controlType == "focus") {
        this.object3D.position.set(position.x, position.y, 0);
        this.conic.moveCurve(position);
    } else if (this.controlType == "vertex") {
        if (shift) {
            // snap to coordinate axes
            var dPos = position.clone().sub(this.conic.focus);
            if (Math.abs(dPos.x)/Math.abs(dPos.y) < 0.5) dPos.x = 0;
            else if (Math.abs(dPos.y)/Math.abs(dPos.x) < 0.5) dPos.y = 0;
            var newPos = dPos.add(this.conic.focus);
            this.object3D.position.set(newPos.x,newPos.y,0);
        } else {
            this.object3D.position.set(position.x, position.y, 0);
        }
        this.conic.moveVertex();
    } else if (this.controlType == "start") {
        this.conic.moveExtents("start",position);
    } else if (this.controlType == "end") {
        this.conic.moveExtents("end",position);
    }
};

Node.prototype.move = function(position){
    this.object3D.position.set(position.x, position.y, position.z);
};

Node.prototype.getPosition = function(){
    if (this.position) return this.position.clone();
    return this.object3D.position.clone();
};

Node.prototype.clone = function(){
    var node = new Node(this.getPosition(), globals, true);
    return node;
};


//deallocate

Node.prototype.destroy = function(){
    if (this.deleting) return;
    this.deleting = true;
    globals.threeView.sceneRemove(this.object3D);
    this.object3D._myNode = null;
    this.object3D = null;
};