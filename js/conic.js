var lineMat = new THREE.LineBasicMaterial({color: 0x000077});
var curveMat = new THREE.LineBasicMaterial({color: 0xff0000});


function Parabola(focus,aVec,extents) {

	this.type = "parabola";

	// input parameters
	this.focus = focus; 	// the x,y,z focal point
	this.aVec = aVec; 			// vector from the focal point to the vertex
	this.extents = extents; // the x-span of the function (orthogonal to aVec)

	// dependent variables
	this.vertex = this.focus.clone().add(this.aVec);		// the x,y,z of the vertex
	this.curve = null;
	this.curvePoints = [];

	this.boundingLines = [];

	this.computeCurve();

    this.focus_node = new Node(this.focus,globals,"focus");
    this.focus_node.conic = this;
    this.vertex_node = new Node(this.vertex, globals, "vertex");
    this.vertex_node.conic = this;
    this.start_node = new Node(this.curvePoints[0],globals,"start");
    this.start_node.conic = this;
    this.end_node = new Node(this.curvePoints[this.curvePoints.length-1],globals,"end")
    this.end_node.conic = this;

    this.createRulePolys();
}

function getAngle(vec1) {
	return Math.atan2(vec1.y,vec1.x)+Math.PI/2;
}

Parabola.prototype.computeCurve = function() {
	globals.threeView.sceneRemove(this.curve);

	var a = this.aVec.length();
	angle = getAngle(this.aVec);

	this.curvePoints = [];
	for (var t=this.extents[0]; t <= this.extents[1]; t++) {
		var x = t;
		var y = (t)*(t)/(4*a)-a;
		this.curvePoints.push(new THREE.Vector3(x*Math.cos(angle) - y*Math.sin(angle),
										   		x*Math.sin(angle) + y*Math.cos(angle),
										   		0).add(this.focus));
    }

    var curveGeo = new THREE.Geometry();
	curveGeo.vertices = this.curvePoints;
	this.curve = new THREE.Line(curveGeo, curveMat);
	globals.threeView.sceneAdd(this.curve);
}

Parabola.prototype.moveCurve = function(position) {
	this.focus = this.focus_node.getPosition().clone();
	this.computeCurve();

	this.end_node.move(this.curvePoints[this.curvePoints.length-1])
	this.start_node.move(this.curvePoints[0])
	this.vertex_node.move(this.focus.clone().add(this.aVec));

	this.createRulePolys();
}

Parabola.prototype.moveVertex = function() {
	this.vertex = this.vertex_node.getPosition();
	this.aVec = this.vertex.clone().sub(this.focus);

	this.computeCurve();

	this.end_node.move(this.curvePoints[this.curvePoints.length-1]);
	this.start_node.move(this.curvePoints[0]);

	this.createRulePolys();
}

Parabola.prototype.moveExtents = function(type,position) {
	var xaxis = this.aVec.clone().applyAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2).divideScalar(this.aVec.length());
	if (type == "start") {
		this.extents[0] = position.sub(this.focus).dot(xaxis);
	}
	else if (type == "end") {
		this.extents[1] = position.sub(this.focus).dot(xaxis);
	}

	this.computeCurve();
	this.end_node.move(this.curvePoints[this.curvePoints.length-1]);
	this.start_node.move(this.curvePoints[0]);

	this.createRulePolys();
}

Parabola.prototype.createRulePolys = function() {
	globals.threeView.sceneRemove(this.boundingLines[0])
	globals.threeView.sceneRemove(this.boundingLines[1])

	var ray = new THREE.Ray(this.focus,this.end_node.getPosition().sub(this.focus));
	// console.log(ray)
	var box = new THREE.Box3(new THREE.Vector3(-window.innerWidth/2.,-window.innerHeight/2.,-10),
							new THREE.Vector3(window.innerWidth/2.,window.innerHeight/2.,10));
	var intersect = ray.intersectBox(box)
	// console.log(intersect);
	new Node(intersect,globals)
	
	var lineGeo = new THREE.Geometry();
	lineGeo.dynamic = true;
	lineGeo.vertices = [this.end_node.getPosition(),intersect];
	var line = new THREE.Line(lineGeo, lineMat);

	this.boundingLines[0] = line;
	globals.threeView.sceneAdd(line);

	var ray = new THREE.Ray(this.focus,this.start_node.getPosition().sub(this.focus));
	// console.log(ray)
	var box = new THREE.Box3(new THREE.Vector3(-window.innerWidth/2.,-window.innerHeight/2.,-10),
							new THREE.Vector3(window.innerWidth/2.,window.innerHeight/2.,10));
	var intersect = ray.intersectBox(box)
	// console.log(intersect);
	new Node(intersect,globals)

	var lineGeo = new THREE.Geometry();
	lineGeo.dynamic = true;
	lineGeo.vertices = [this.start_node.getPosition(),intersect];
	var line = new THREE.Line(lineGeo, lineMat);

	this.boundingLines[1] = line;
	globals.threeView.sceneAdd(line);
}