var lineMat = new THREE.LineBasicMaterial({color: 0x000077});
var curveMat = new THREE.LineBasicMaterial({color: 0xff0000});
var polyMat = new THREE.MeshBasicMaterial({color: 0x005500, side: THREE.DoubleSide, transparent: true, opacity:0.25});

function getAngle(vec1) {
	return Math.atan2(vec1.y,vec1.x)+Math.PI/2;
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

	this.firstPolygonPoints = [];
	this.secondPolygonPoints = [];

	this.borderPoints = [];
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

Parabola.prototype.updateGeometry = function() {
	this.computeCurve();
	this.vertex_node.move(this.focus.clone().add(this.aVec));
	this.end_node.move(this.curvePoints[this.curvePoints.length-1])
	this.start_node.move(this.curvePoints[0])
	this.calculateBoundingLines();
	this.createPolygon();
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

function vectorBetweenVectors(A,B,C) {
	// checks if C is between A and B
	var AxB = A.clone().cross(B).z;
	var AxC = A.clone().cross(C).z;
	var CxB = C.clone().cross(B).z;

	// console.log(AxB);
	if (AxB >= 0) { // 180-360 angle
		if (AxC < 0 || CxB < 0) {
			// console.log("AxC: " + AxC + "  CxB: " + CxB + "  AxB: " + AxB);
			return true;
		}
	} else { // 0-180 angle
		if (-CxB >= 0 && -AxC >= 0) {
			// console.log("BxC: " + BxC + "  CxA: " + CxA);
			return true;
		}
	}
	return false;
}

Parabola.prototype.calculateBoundingLines = function() {
	this.borderPoints = [];
	globals.threeView.sceneRemove(this.boundingLines[0])
	globals.threeView.sceneRemove(this.boundingLines[1])

	var ray = new THREE.Ray(this.focus,this.end_node.getPosition().sub(this.focus));
	var box = new THREE.Box3(new THREE.Vector3(globals.xmin,globals.ymin,-10),
							new THREE.Vector3(globals.xmax,globals.ymax,10));
	var intersect1 = ray.intersectBox(box)
	// new Node(intersect,globals)

	// this.borderPoints.push(intersect1);
	
	var lineGeo = new THREE.Geometry();
	lineGeo.vertices = [this.end_node.getPosition(),intersect1];
	this.boundingLines[0] = new THREE.Line(lineGeo, lineMat);
	globals.threeView.sceneAdd(this.boundingLines[0]);

	ray = new THREE.Ray(this.focus,this.start_node.getPosition().sub(this.focus));
	box = new THREE.Box3(new THREE.Vector3(globals.xmin,globals.ymin,-10),
							new THREE.Vector3(globals.xmax,globals.ymax,10));
	var intersect2 = ray.intersectBox(box)
	// new Node(intersect,globals)

	// this.borderPoints.push(intersect2);
	

	lineGeo = new THREE.Geometry();
	lineGeo.vertices = [this.start_node.getPosition(),intersect2];
	this.boundingLines[1] = new THREE.Line(lineGeo, lineMat);
	globals.threeView.sceneAdd(this.boundingLines[1]);

	// checkCorners
	corner0 = new THREE.Vector3(globals.xmin,globals.ymin,0);
	corner1 = new THREE.Vector3(globals.xmin,globals.ymax,0);
	corner2 = new THREE.Vector3(globals.xmax,globals.ymin,0);
	corner3 = new THREE.Vector3(globals.xmax,globals.ymax,0);

	var A = this.start_node.getPosition().sub(this.focus);
	var B = this.end_node.getPosition().sub(this.focus);
	// var C = corner1.clone().sub(this.focus);

	this.borderPoints.push(intersect1);

	if (Math.abs(intersect1.x - globals.xmin) < 1) {
		if (vectorBetweenVectors(A,B,corner0.clone().sub(this.focus))) {
			this.borderPoints.push(corner0)
		}
		if (vectorBetweenVectors(A,B,corner2.clone().sub(this.focus))) {
			this.borderPoints.push(corner2)
		}
		if (vectorBetweenVectors(A,B,corner3.clone().sub(this.focus))) {
			this.borderPoints.push(corner3)
		}
		if (vectorBetweenVectors(A,B,corner1.clone().sub(this.focus))) {
			this.borderPoints.push(corner1)
		}
	} else if (Math.abs(intersect1.y - globals.ymin) < 1) {
		if (vectorBetweenVectors(A,B,corner2.clone().sub(this.focus))) {
			this.borderPoints.push(corner2)
		}
		if (vectorBetweenVectors(A,B,corner3.clone().sub(this.focus))) {
			this.borderPoints.push(corner3)
		}
		if (vectorBetweenVectors(A,B,corner1.clone().sub(this.focus))) {
			this.borderPoints.push(corner1)
		}
		if (vectorBetweenVectors(A,B,corner0.clone().sub(this.focus))) {
			this.borderPoints.push(corner0)
		}
	} else if (Math.abs(intersect1.x - globals.xmax) < 1) {
		if (vectorBetweenVectors(A,B,corner3.clone().sub(this.focus))) {
			this.borderPoints.push(corner3)
		}
		if (vectorBetweenVectors(A,B,corner1.clone().sub(this.focus))) {
			this.borderPoints.push(corner1)
		}
		if (vectorBetweenVectors(A,B,corner0.clone().sub(this.focus))) {
			this.borderPoints.push(corner0)
		}
		if (vectorBetweenVectors(A,B,corner2.clone().sub(this.focus))) {
			this.borderPoints.push(corner2)
		}
	} else if (Math.abs(intersect1.y - globals.ymax) < 1){
		if (vectorBetweenVectors(A,B,corner1.clone().sub(this.focus))) {
			this.borderPoints.push(corner1)
		}
		if (vectorBetweenVectors(A,B,corner0.clone().sub(this.focus))) {
			this.borderPoints.push(corner0)
		}
		if (vectorBetweenVectors(A,B,corner2.clone().sub(this.focus))) {
			this.borderPoints.push(corner2)
		}
		if (vectorBetweenVectors(A,B,corner3.clone().sub(this.focus))) {
			this.borderPoints.push(corner3)
		}
	}

	this.borderPoints.push(intersect2);

	
	
	
	

	console.log(this.borderPoints);

	// var AxB = corner1.clone().sub(this.focus).cross(this.focus.clone().sub(this.start_node.getPosition())).z;
	// var BxC = corner1.clone().sub(this.focus).cross(this.focus.clone().sub(this.end_node.getPosition())).z;
	// var CxA = this.end_node.getPosition().sub(this.focus).cross(this.start_node.getPosition().sub(this.focus)).z;
	// var CxB = this.end_node.getPosition().sub(this.focus).cross(corner1.clone().sub(this.focus)).z;
		
	// console.log("AxB: " + AxB + "  BxC: " + BxC + "  CxA: " + CxA + "  CxB: " + CxB)
	// if (AxB * BxC <= 0 || CxB * CxA <= 0) {
	// 	console.log("present")
	// }
	// var start_angle = getAngle(this.focus.clone().sub(this.start_node.getPosition()));
	// var end_angle = getAngle(this.focus.clone().sub(this.end_node.getPosition()));
	// console.log("start = " + start_angle)
	// console.log("end = " + end_angle)

	// corner1_angle = getAngle(corner1.clone().sub(this.focus))-Math.PI;
	// console.log(corner1_angle)

	// if (corner1_angle < start_angle && corner1_angle > end_angle) {
	// 	console.log("corner 1")
	// }
}

Parabola.prototype.createPolygon = function() {
	globals.threeView.sceneRemove(this.polygon);



	var polyGeom = new THREE.Geometry();

	polyGeom.vertices.push(this.focus);
	for (var i=0; i < this.curvePoints.length; i++) {
		polyGeom.vertices.push(this.curvePoints[i]);
		// if (i > 0) {
		// 	polyGeom.faces.push(new THREE.Face3(0,i,i-1));
		// }
	}

	for (var i=0; i < this.borderPoints.length; i++) {
		polyGeom.vertices.push(this.borderPoints[i]);
	}

	for (var i=1; i < polyGeom.vertices.length; i++) {
		polyGeom.faces.push(new THREE.Face3(0,i,i-1));
	}

	this.polygon = new THREE.Mesh(polyGeom,polyMat);
	
	globals.threeView.sceneAdd(this.polygon);
}