// To do:
// - debug raycasting to curve
// - implement ellipse
// - implement hyperbola
// - implement sinusoid
// - add numeric controls to each conic
// - add notion of "canvas" or border --> display it
// - add export to SVG / Zund


var lineMat = new THREE.LineBasicMaterial({color: 0x000077});
var curveMat = new THREE.LineBasicMaterial({color: 0xff0000});
var boundaryMat = new THREE.LineBasicMaterial({color: 0x000000, linewidth: 2});
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
	var ray = new THREE.Ray(fromPoint,alongVector);
	var box = new THREE.Box3(new THREE.Vector3(globals.xmin,globals.ymin,0),
                                    new THREE.Vector3(globals.xmax,globals.ymax,0));
 	return ray.intersectBox(box);
}

function getCurveIntersection(fromPoint,alongVector,exceptCurve) {
	var raycaster = new THREE.Raycaster(fromPoint,alongVector,0,Infinity);
	raycaster.linePrecision = 1;
	console.log(globals.threeView.getCurvesToIntersect(exceptCurve))
	var intersects = raycaster.intersectObjects(globals.threeView.getCurvesToIntersect(exceptCurve),true);
	if (intersects[0] != undefined) {
		new Node(intersects[0].point,globals)
		return intersects[0]
	}
	return null
}

function Parabola(focus,aVec,extents,polarity) {

	this.type = "parabola";

	// input parameters
	this.focus = focus; 	// the x,y,z focal point
	this.aVec = aVec; 			// vector from the focal point to the vertex
	this.extents = extents; // the x-span of the function (orthogonal to aVec)
	this.polarity = polarity // 1 is parallel lines on exterior, 0 is parallel lines on interior

	// dependent variables
	this.vertex = this.focus.clone().add(this.aVec);		// the x,y,z of the vertex
	this.curve = null;
	this.curvePoints = [];
	this.polygon = null;
	this.polygon2 = null;
	this.polyFrame = null;
	this.polyFrame2 = null;

	this.interiorPolygonBoundary = [];
	this.interiorPolygonVertices = [];
	this.exteriorPolygonBoundary = [];
	this.exteriorPolygonVertices = [];

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
	this.calculateInteriorBoundingLines();
	this.calculateExteriorBoundingLines();
	this.createInteriorPolygon();
	this.createExteriorPolygon();
	console.log(getCurveIntersection(this.focus,this.aVec.clone().negate(),this.curve));
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

	if (this.polarity) {
		var end_intersect = getBoundaryIntersection(this.focus,this.end_node.getPosition().sub(this.focus))
		
		// var lineGeo = new THREE.Geometry();
		// lineGeo.vertices = [this.end_node.getPosition(),end_intersect];
		// this.boundingLines[0] = new THREE.Line(lineGeo, lineMat);
		// globals.threeView.sceneAdd(this.boundingLines[0]);

		var start_intersect = getBoundaryIntersection(this.focus,this.start_node.getPosition().sub(this.focus))
		
		// lineGeo = new THREE.Geometry();
		// lineGeo.vertices = [this.start_node.getPosition(),start_intersect];
		// this.boundingLines[1] = new THREE.Line(lineGeo, lineMat);
		// globals.threeView.sceneAdd(this.boundingLines[1]);

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
	} else {
		for (var i=0; i < this.curvePoints.length; i++) {
		 	this.interiorBorderPoints.push(getBoundaryIntersection(this.curvePoints[i], 
		 				this.curvePoints[i].clone().sub(this.focus)));
		}
	}
}


Parabola.prototype.calculateExteriorBoundingLines = function() {
	this.exteriorBorderPoints = [];

	if (this.polarity) {
		for (var i=0; i < this.curvePoints.length; i++) {
		 	this.exteriorBorderPoints.push(getBoundaryIntersection(this.curvePoints[i], this.aVec));
		}
	} else {
		for (var i=0; i < this.curvePoints.length; i++) {
		 	this.exteriorBorderPoints.push(getBoundaryIntersection(this.curvePoints[i], this.aVec.clone().negate()));
		}
	}
}

Parabola.prototype.createInteriorPolygon = function() {
	globals.threeView.sceneRemove(this.polygon);
	globals.threeView.sceneRemove(this.polyFrame);
	globals.threeView.sceneRemove(this.interiorPolygonBoundary);

	var polyGeom = new THREE.Geometry();

	if (this.polarity) {
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

		var polygonBoundaryGeom2 = new THREE.Geometry();
		polygonBoundaryGeom2.vertices = [];
		this.interiorPolygonBoundary = new THREE.Line(polygonBoundaryGeom2, boundaryMat);
		
		for (var i=0; i < this.curvePoints.length; i++) {
			polygonBoundaryGeom2.vertices.push(this.curvePoints[i]);
			this.interiorPolygonVertices.push([this.curvePoints[i].x,this.curvePoints[i].y]);
		}
		for (var i=0; i < this.interiorBorderPoints.length; i++) {
			polygonBoundaryGeom2.vertices.push(this.interiorBorderPoints[i]);
			this.interiorPolygonVertices.push([this.interiorBorderPoints[i].x,this.interiorBorderPoints[i].y]);
		}
		polygonBoundaryGeom2.vertices.push(this.curvePoints[0]);
		this.interiorPolygonVertices.push([this.curvePoints[0].x,this.curvePoints[0].y]);

	} else {
		

		for (var i=0; i < this.curvePoints.length; i++) {
			polyGeom.vertices.push(this.curvePoints[i]);
			polyGeom.vertices.push(this.interiorBorderPoints[i]);
		}

		for (var i=2; i < polyGeom.vertices.length; i++) {
			polyGeom.faces.push(new THREE.Face3(i,i-1,i-2));
		}


		var polygonBoundaryGeom2 = new THREE.Geometry();
		polygonBoundaryGeom2.vertices = [];
		this.interiorPolygonBoundary = new THREE.Line(polygonBoundaryGeom2, boundaryMat);
		
		for (var i=0; i < this.curvePoints.length; i++) {
			polygonBoundaryGeom2.vertices.push(this.curvePoints[i]);
			this.interiorPolygonVertices.push([this.curvePoints[i].x,this.curvePoints[i].y]);
		}
		for (var i=this.interiorBorderPoints.length-1; i >= 0; i--) {
			polygonBoundaryGeom2.vertices.push(this.interiorBorderPoints[i]);
			this.interiorPolygonVertices.push([this.interiorBorderPoints[i].x,this.interiorBorderPoints[i].y]);
		}
		polygonBoundaryGeom2.vertices.push(this.curvePoints[0]);
		this.interiorPolygonVertices.push([this.curvePoints[0].x,this.curvePoints[0].y]);

	}


	this.polygon = new THREE.Mesh(polyGeom,polyMat);
	this.polyFrame = new THREE.Mesh(polyGeom,polyMatWire);
	
	globals.threeView.sceneAdd(this.interiorPolygonBoundary);
	globals.threeView.sceneAdd(this.polygon);
	globals.threeView.sceneAdd(this.polyFrame);
}

Parabola.prototype.createExteriorPolygon = function() {
	globals.threeView.sceneRemove(this.polygon2);
	globals.threeView.sceneRemove(this.polyFrame2);
	globals.threeView.sceneRemove(this.exteriorPolygonBoundary);

	var polyGeom = new THREE.Geometry();

	for (var i=0; i < this.curvePoints.length; i++) {
		polyGeom.vertices.push(this.curvePoints[i]);
		polyGeom.vertices.push(this.exteriorBorderPoints[i]);
	}

	for (var i=2; i < polyGeom.vertices.length; i++) {
		polyGeom.faces.push(new THREE.Face3(i,i-1,i-2));
	}

	var polygonBoundaryGeom = new THREE.Geometry();
	polygonBoundaryGeom.vertices = [];
	this.exteriorPolygonBoundary = new THREE.Line(polygonBoundaryGeom, boundaryMat);
	

	for (var i=0; i < this.curvePoints.length; i++) {
		polygonBoundaryGeom.vertices.push(this.curvePoints[i]);
		this.exteriorPolygonVertices.push([this.curvePoints[i].x,this.curvePoints[i].y])
	}
	for (var i=this.exteriorBorderPoints.length-1; i >= 0; i--) {
		polygonBoundaryGeom.vertices.push(this.exteriorBorderPoints[i]);
		this.exteriorPolygonVertices.push([this.exteriorBorderPoints[i].x,this.exteriorBorderPoints[i].y])
	}
	polygonBoundaryGeom.vertices.push(this.curvePoints[0]);
	this.exteriorPolygonVertices.push([this.curvePoints[0].x,this.curvePoints[0].y])

	this.polygon2 = new THREE.Mesh(polyGeom,polyMat2);
	this.polyFrame2 = new THREE.Mesh(polyGeom,polyMatWire);
	
	globals.threeView.sceneAdd(this.exteriorPolygonBoundary);
	globals.threeView.sceneAdd(this.polygon2);
	globals.threeView.sceneAdd(this.polyFrame2);
}