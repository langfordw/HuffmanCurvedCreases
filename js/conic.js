var lineMat = new THREE.LineBasicMaterial({color: 0x000077});
var curveMat = new THREE.LineBasicMaterial({color: 0xff0000});
var polyMat = new THREE.MeshBasicMaterial({color: 0x005500, side: THREE.DoubleSide, transparent: true, opacity:0.25, wireframe: false});
var polyMat2 = new THREE.MeshBasicMaterial({color: 0x000055, side: THREE.DoubleSide, transparent: true, opacity:0.25, wireframe: false});
var polyMatWire = new THREE.MeshBasicMaterial({color: 0x444444, side: THREE.DoubleSide, transparent: true, opacity:0.25, wireframe: true});

function getAngle(vec1) {
	return Math.atan2(vec1.y,vec1.x)+Math.PI/2;
}

function vectorBetweenVectors(A,B,C) {
	// checks if C is between A and B
	var AxB = A.clone().cross(B).z;
	var AxC = A.clone().cross(C).z;
	var CxB = C.clone().cross(B).z;

	if (AxB >= 0) { // 180-360 angle
		if (AxC < 0 || CxB < 0) {
			return true;
		}
	} else { // 0-180 angle
		if (-CxB >= 0 && -AxC >= 0) {
			return true;
		}
	}
	return false;
}

function getBoundaryIntersection(fromPoint,alongVector) {
	ray = new THREE.Ray(fromPoint,alongVector);
	box = new THREE.Box3(new THREE.Vector3(globals.xmin,globals.ymin,0),
						 new THREE.Vector3(globals.xmax,globals.ymax,0));
 	return ray.intersectBox(box);
}

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
	this.polygon = null;
	this.polygon2 = null;
	this.polyFrame = null;
	this.polyFrame2 = null;

	this.interiorBorderPoints = [];
	this.exteriorBorderPoints = [];
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

    this.updateGeometry();
}


Parabola.prototype.computeCurve = function() {
	globals.threeView.sceneRemove(this.curve);

	var a = this.aVec.length();
	angle = getAngle(this.aVec);

	this.curvePoints = [];
	for (var t=this.extents[0]; t <= this.extents[1]; t+=10) {
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

Parabola.prototype.updateGeometry = function() {
	this.computeCurve();
	this.vertex_node.move(this.focus.clone().add(this.aVec));
	this.end_node.move(this.curvePoints[this.curvePoints.length-1])
	this.start_node.move(this.curvePoints[0])
	this.calculateInteriorBoundingLines2();
	this.calculateExteriorBoundingLines();
	this.createInteriorPolygon2();
	this.createExteriorPolygon();
}

Parabola.prototype.moveCurve = function(position) {
	this.focus = this.focus_node.getPosition().clone();
	this.updateGeometry();
}

Parabola.prototype.moveVertex = function() {
	this.vertex = this.vertex_node.getPosition();
	this.aVec = this.vertex.clone().sub(this.focus);
	this.updateGeometry();
}

Parabola.prototype.moveExtents = function(type,position) {
	var xaxis = this.aVec.clone().applyAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2).divideScalar(this.aVec.length());
	if (type == "start") {
		this.extents[0] = position.sub(this.focus).dot(xaxis);
	}
	else if (type == "end") {
		this.extents[1] = position.sub(this.focus).dot(xaxis);
	}
	this.updateGeometry();
}

Parabola.prototype.calculateInteriorBoundingLines = function() {
	this.interiorBorderPoints = [];

	globals.threeView.sceneRemove(this.boundingLines[0])
	globals.threeView.sceneRemove(this.boundingLines[1])

	var end_intersect = getBoundaryIntersection(this.focus,this.end_node.getPosition().sub(this.focus))
	
	var lineGeo = new THREE.Geometry();
	lineGeo.vertices = [this.end_node.getPosition(),end_intersect];
	this.boundingLines[0] = new THREE.Line(lineGeo, lineMat);
	globals.threeView.sceneAdd(this.boundingLines[0]);

	var start_intersect = getBoundaryIntersection(this.focus,this.start_node.getPosition().sub(this.focus))
	
	lineGeo = new THREE.Geometry();
	lineGeo.vertices = [this.start_node.getPosition(),start_intersect];
	this.boundingLines[1] = new THREE.Line(lineGeo, lineMat);
	globals.threeView.sceneAdd(this.boundingLines[1]);

	// checkCorners
	bottomLeftCorner = new THREE.Vector3(globals.xmin,globals.ymin,0);
	topLeftCorner = new THREE.Vector3(globals.xmin,globals.ymax,0);
	bottomRightCorner = new THREE.Vector3(globals.xmax,globals.ymin,0);
	topRightCorner = new THREE.Vector3(globals.xmax,globals.ymax,0);

	var A = this.start_node.getPosition().sub(this.focus);
	var B = this.end_node.getPosition().sub(this.focus);

	this.interiorBorderPoints.push(end_intersect);

	if (Math.abs(end_intersect.x - globals.xmin) < 1) {
		if (vectorBetweenVectors(A,B,bottomLeftCorner.clone().sub(this.focus))) {
			this.interiorBorderPoints.push(bottomLeftCorner)
		}
		if (vectorBetweenVectors(A,B,bottomRightCorner.clone().sub(this.focus))) {
			this.interiorBorderPoints.push(bottomRightCorner)
		}
		if (vectorBetweenVectors(A,B,topRightCorner.clone().sub(this.focus))) {
			this.interiorBorderPoints.push(topRightCorner)
		}
		if (vectorBetweenVectors(A,B,topLeftCorner.clone().sub(this.focus))) {
			this.interiorBorderPoints.push(topLeftCorner)
		}
	} else if (Math.abs(end_intersect.y - globals.ymin) < 1) {
		if (vectorBetweenVectors(A,B,bottomRightCorner.clone().sub(this.focus))) {
			this.interiorBorderPoints.push(bottomRightCorner)
		}
		if (vectorBetweenVectors(A,B,topRightCorner.clone().sub(this.focus))) {
			this.interiorBorderPoints.push(topRightCorner)
		}
		if (vectorBetweenVectors(A,B,topLeftCorner.clone().sub(this.focus))) {
			this.interiorBorderPoints.push(topLeftCorner)
		}
		if (vectorBetweenVectors(A,B,bottomLeftCorner.clone().sub(this.focus))) {
			this.interiorBorderPoints.push(bottomLeftCorner)
		}
	} else if (Math.abs(end_intersect.x - globals.xmax) < 1) {
		if (vectorBetweenVectors(A,B,topRightCorner.clone().sub(this.focus))) {
			this.interiorBorderPoints.push(topRightCorner)
		}
		if (vectorBetweenVectors(A,B,topLeftCorner.clone().sub(this.focus))) {
			this.interiorBorderPoints.push(topLeftCorner)
		}
		if (vectorBetweenVectors(A,B,bottomLeftCorner.clone().sub(this.focus))) {
			this.interiorBorderPoints.push(bottomLeftCorner)
		}
		if (vectorBetweenVectors(A,B,bottomRightCorner.clone().sub(this.focus))) {
			this.interiorBorderPoints.push(bottomRightCorner)
		}
	} else if (Math.abs(end_intersect.y - globals.ymax) < 1){
		if (vectorBetweenVectors(A,B,topLeftCorner.clone().sub(this.focus))) {
			this.interiorBorderPoints.push(topLeftCorner)
		}
		if (vectorBetweenVectors(A,B,bottomLeftCorner.clone().sub(this.focus))) {
			this.interiorBorderPoints.push(bottomLeftCorner)
		}
		if (vectorBetweenVectors(A,B,bottomRightCorner.clone().sub(this.focus))) {
			this.interiorBorderPoints.push(bottomRightCorner)
		}
		if (vectorBetweenVectors(A,B,topRightCorner.clone().sub(this.focus))) {
			this.interiorBorderPoints.push(topRightCorner)
		}
	}

	this.interiorBorderPoints.push(start_intersect);
}

Parabola.prototype.calculateInteriorBoundingLines2 = function() {
	this.interiorBorderPoints = [];

	globals.threeView.sceneRemove(this.boundingLines[0])
	globals.threeView.sceneRemove(this.boundingLines[1])

	var end_intersect = getBoundaryIntersection(this.focus,this.end_node.getPosition().sub(this.focus))
	
	var lineGeo = new THREE.Geometry();
	lineGeo.vertices = [this.end_node.getPosition(),end_intersect];
	this.boundingLines[0] = new THREE.Line(lineGeo, lineMat);
	globals.threeView.sceneAdd(this.boundingLines[0]);

	var start_intersect = getBoundaryIntersection(this.focus,this.start_node.getPosition().sub(this.focus))
	
	lineGeo = new THREE.Geometry();
	lineGeo.vertices = [this.start_node.getPosition(),start_intersect];
	this.boundingLines[1] = new THREE.Line(lineGeo, lineMat);
	globals.threeView.sceneAdd(this.boundingLines[1]);

	for (var i=0; i < this.curvePoints.length; i++) {
	 	this.interiorBorderPoints.push(getBoundaryIntersection(this.curvePoints[i], 
	 				this.curvePoints[i].clone().sub(this.focus)));
	}

	// // checkCorners
	// bottomLeftCorner = new THREE.Vector3(globals.xmin,globals.ymin,0);
	// topLeftCorner = new THREE.Vector3(globals.xmin,globals.ymax,0);
	// bottomRightCorner = new THREE.Vector3(globals.xmax,globals.ymin,0);
	// topRightCorner = new THREE.Vector3(globals.xmax,globals.ymax,0);

	// var A = this.start_node.getPosition().sub(this.focus);
	// var B = this.end_node.getPosition().sub(this.focus);

	// this.interiorBorderPoints.push(end_intersect);

	// if (Math.abs(end_intersect.x - globals.xmin) < 1) {
	// 	if (vectorBetweenVectors(A,B,bottomLeftCorner.clone().sub(this.focus))) {
	// 		this.interiorBorderPoints.push(bottomLeftCorner)
	// 	}
	// 	if (vectorBetweenVectors(A,B,bottomRightCorner.clone().sub(this.focus))) {
	// 		this.interiorBorderPoints.push(bottomRightCorner)
	// 	}
	// 	if (vectorBetweenVectors(A,B,topRightCorner.clone().sub(this.focus))) {
	// 		this.interiorBorderPoints.push(topRightCorner)
	// 	}
	// 	if (vectorBetweenVectors(A,B,topLeftCorner.clone().sub(this.focus))) {
	// 		this.interiorBorderPoints.push(topLeftCorner)
	// 	}
	// } else if (Math.abs(end_intersect.y - globals.ymin) < 1) {
	// 	if (vectorBetweenVectors(A,B,bottomRightCorner.clone().sub(this.focus))) {
	// 		this.interiorBorderPoints.push(bottomRightCorner)
	// 	}
	// 	if (vectorBetweenVectors(A,B,topRightCorner.clone().sub(this.focus))) {
	// 		this.interiorBorderPoints.push(topRightCorner)
	// 	}
	// 	if (vectorBetweenVectors(A,B,topLeftCorner.clone().sub(this.focus))) {
	// 		this.interiorBorderPoints.push(topLeftCorner)
	// 	}
	// 	if (vectorBetweenVectors(A,B,bottomLeftCorner.clone().sub(this.focus))) {
	// 		this.interiorBorderPoints.push(bottomLeftCorner)
	// 	}
	// } else if (Math.abs(end_intersect.x - globals.xmax) < 1) {
	// 	if (vectorBetweenVectors(A,B,topRightCorner.clone().sub(this.focus))) {
	// 		this.interiorBorderPoints.push(topRightCorner)
	// 	}
	// 	if (vectorBetweenVectors(A,B,topLeftCorner.clone().sub(this.focus))) {
	// 		this.interiorBorderPoints.push(topLeftCorner)
	// 	}
	// 	if (vectorBetweenVectors(A,B,bottomLeftCorner.clone().sub(this.focus))) {
	// 		this.interiorBorderPoints.push(bottomLeftCorner)
	// 	}
	// 	if (vectorBetweenVectors(A,B,bottomRightCorner.clone().sub(this.focus))) {
	// 		this.interiorBorderPoints.push(bottomRightCorner)
	// 	}
	// } else if (Math.abs(end_intersect.y - globals.ymax) < 1){
	// 	if (vectorBetweenVectors(A,B,topLeftCorner.clone().sub(this.focus))) {
	// 		this.interiorBorderPoints.push(topLeftCorner)
	// 	}
	// 	if (vectorBetweenVectors(A,B,bottomLeftCorner.clone().sub(this.focus))) {
	// 		this.interiorBorderPoints.push(bottomLeftCorner)
	// 	}
	// 	if (vectorBetweenVectors(A,B,bottomRightCorner.clone().sub(this.focus))) {
	// 		this.interiorBorderPoints.push(bottomRightCorner)
	// 	}
	// 	if (vectorBetweenVectors(A,B,topRightCorner.clone().sub(this.focus))) {
	// 		this.interiorBorderPoints.push(topRightCorner)
	// 	}
	// }

	// this.interiorBorderPoints.push(start_intersect);
}


Parabola.prototype.calculateExteriorBoundingLines = function() {
	this.exteriorBorderPoints = [];

	for (var i=0; i < this.curvePoints.length; i++) {
	 	this.exteriorBorderPoints.push(getBoundaryIntersection(this.curvePoints[i], this.aVec.clone().negate()));
	}
}

Parabola.prototype.createInteriorPolygon = function() {
	globals.threeView.sceneRemove(this.polygon);
	globals.threeView.sceneRemove(this.polyFrame);

	var polyGeom = new THREE.Geometry();

	polyGeom.vertices.push(this.focus);
	for (var i=0; i < this.curvePoints.length; i++) {
		polyGeom.vertices.push(this.curvePoints[i]);
	}

	for (var i=0; i < this.interiorBorderPoints.length; i++) {
		polyGeom.vertices.push(this.interiorBorderPoints[i]);
	}

	for (var i=1; i < polyGeom.vertices.length; i++) {
		polyGeom.faces.push(new THREE.Face3(0,i,i-1));
	}

	this.polygon = new THREE.Mesh(polyGeom,polyMat);
	this.polyFrame = new THREE.Mesh(polyGeom,polyMatWire);
	
	globals.threeView.sceneAdd(this.polygon);
	globals.threeView.sceneAdd(this.polyFrame);
}

Parabola.prototype.createInteriorPolygon2 = function() {
	globals.threeView.sceneRemove(this.polygon);
	globals.threeView.sceneRemove(this.polyFrame);

	var polyGeom = new THREE.Geometry();

	for (var i=0; i < this.curvePoints.length; i++) {
		polyGeom.vertices.push(this.curvePoints[i]);
		polyGeom.vertices.push(this.interiorBorderPoints[i]);
	}

	for (var i=2; i < polyGeom.vertices.length; i++) {
		polyGeom.faces.push(new THREE.Face3(i,i-1,i-2));
	}

	this.polygon = new THREE.Mesh(polyGeom,polyMat);
	this.polyFrame = new THREE.Mesh(polyGeom,polyMatWire);
	
	globals.threeView.sceneAdd(this.polygon);
	globals.threeView.sceneAdd(this.polyFrame);
}

Parabola.prototype.createExteriorPolygon = function() {
	globals.threeView.sceneRemove(this.polygon2);
	globals.threeView.sceneRemove(this.polyFrame2);

	var polyGeom = new THREE.Geometry();

	for (var i=0; i < this.curvePoints.length; i++) {
		polyGeom.vertices.push(this.curvePoints[i]);
		polyGeom.vertices.push(this.exteriorBorderPoints[i]);
	}

	for (var i=2; i < polyGeom.vertices.length; i++) {
		polyGeom.faces.push(new THREE.Face3(i,i-1,i-2));
	}

	this.polygon2 = new THREE.Mesh(polyGeom,polyMat2);
	this.polyFrame2 = new THREE.Mesh(polyGeom,polyMatWire);
	
	globals.threeView.sceneAdd(this.polygon2);
	globals.threeView.sceneAdd(this.polyFrame2);
}