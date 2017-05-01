var ruleLineMat = new THREE.LineBasicMaterial({color: 0x000077});

function RuleLine(start,end) {
	this.objectWrapper = [];
	this.deleting = false;

	// input parameters
	this.start = start;
	this.end = end;
	this.ruleLine = {};

   	// Update Geometry
    this.updateGeometry();
}

RuleLine.prototype.updateGeometry = function() {
	globals.threeView.sceneRemove(this.ruleLine);

	var ruleLineGeo = new THREE.Geometry();
	ruleLineGeo.vertices = [this.start,this.end];
	this.ruleLine = new THREE.Line(ruleLineGeo, ruleLineMat);
	
	globals.threeView.sceneAdd(this.ruleLine);

	globals.threeView.render();
}

//deallocate

RuleLine.prototype.destroy = function(){
    if (this.deleting) return;
    this.deleting = true;
    globals.threeView.sceneRemove(this.ruleLine);
    globals.removeRuleLine(this);
    globals.threeView.render();
};