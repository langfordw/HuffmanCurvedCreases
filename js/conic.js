// To do:
// - debug raycasting to curve
// - fix intersection of curve with border
// - fix ellipse A, B, (secondaryFocus not updating with those)
// - add handles for B
// - compute correct polygons for ellipse and hyperbola
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
	// var alongVector = new THREE.Vector3(0,300,0)
	// var raycaster = new THREE.Raycaster(fromPoint.clone().add(new THREE.Vector3(0,0,10)),alongVector,0,Infinity);
	// raycaster.linePrecision = 5;
	// console.log("curves to intersect: ")
	// console.log(globals.threeView.getCurvesToIntersect(exceptCurve))
	// var intersects = raycaster.intersectObjects(globals.threeView.getCurvesToIntersect(exceptCurve),true);
	// if (intersects[0] != undefined) {
	// 	new Node(intersects[0].point,globals)
	// 	return intersects[0]
	// }
	// return null

	var creaseLine = new THREE.PlaneGeometry(400,20,1,1);
    var plane = new THREE.Mesh(creaseLine, boundaryMat);
    // plane.rotateX(Math.PI/2);
    // plane.translateZ(-10);
    // globals.threeView.sceneAdd(plane);

    var box = new THREE.Box3(new THREE.Vector3(-200,-100,0),
                             new THREE.Vector3(200,-100,0));

	var ray = new THREE.Ray(fromPoint,alongVector);
	// console.log(ray);
	// console.log(plane)
 	// return ray.intersectPlane(plane);
 	return ray.intersectBox(box);
}

function Conic(type,focus,orientation,a,b,extents,polarity) {

	this.objectWrapper = [];
	this.deleting = false;

	// input parameters
	this.type = type;					// conic type (parabola, hyperbola, ellipse)
	this.focus = focus; 				// the x,y,z focal point
	this.a = a;							// the distance between the vertex and the center point
	this.b = b;							// not used in parabolas
	this.c = null;						// the distance between the focus and the center point (defined later)
	this.orientationVec = orientation; 	// unit vector pointing from focal point to vertex
	this.extents = extents; 			// the x-span of the function (orthogonal to aVec)
	this.polarity = polarity 			// determines which focal point the rule lines converge on

	// dependent variables
	if (this.type == "parabola") {

		this.b = 0;
		this.c = 0;
		this.focusVertexVec = this.orientationVec.clone().multiplyScalar(this.a).negate();
		this.vertex = this.focus.clone().add(this.focusVertexVec);		// the x,y,z of the vertex
		this.secondaryFocusVec = null;
		this.secondaryFocus = null;
		this.centerPoint = null;

	} else if (this.type == "ellipse") {

		this.c = Math.sqrt(this.a*this.a - this.b*this.b);
		this.focusVertexVec = this.orientationVec.clone().multiplyScalar(this.c-this.a);
		this.secondaryFocusVec = this.orientationVec.clone().multiplyScalar(2*this.c);
		this.secondaryFocus = this.focus.clone().sub(this.secondaryFocusVec);
		this.vertex = this.focus.clone().add(this.focusVertexVec);		// the x,y,z of the vertex
		this.centerPoint = this.focus.clone().sub(this.secondaryFocusVec.clone().divideScalar(2));

	} else if (this.type == "hyperbola") {

		this.c = Math.sqrt(this.a*this.a + this.b*this.b);
		this.focusVertexVec = this.orientationVec.clone().multiplyScalar(this.c-this.a).negate();
		this.secondaryFocusVec = this.orientationVec.clone().multiplyScalar(2*this.c);
		this.secondaryFocus = this.focus.clone().sub(this.secondaryFocusVec);
		this.vertex = this.focus.clone().add(this.focusVertexVec);		// the x,y,z of the vertex
		this.centerPoint = this.focus.clone().sub(this.secondaryFocusVec.clone().divideScalar(2));

	} 
	
	this.curvePoints = [];					// the vertices of the curve
	this.curve = {};						// the object3D of the curve
	this.computeCurve();

	this.interiorPolygonBoundary = {};		// lines extending from the curve endpoints to the boundary along interior rules
	this.interiorPolygonVertices = [];		// vertices of the interior polygon
	this.interiorPolygon = {};				// interior polygon
	this.interiorPolyFrame = {};			// wireframe mesh of the interior polygon

	this.exteriorPolygonBoundary = {};		// lines extending from the curve endpoints to the boundary along exterior rules
	this.exteriorPolygonVertices = [];		// vertices of the exterior polygon
	this.exteriorPolygon = {};				// exterior polygon
	this.exteriorPolyFrame = {};			// wireframe mesh of the exterior polygon

	this.interiorBorderPoints = [];
	this.exteriorBorderPoints = [];
	this.boundingLines = [];

	// Define Nodes:
    this.focusNode = new Node(this.focus,globals,"focus", this);
    this.objectWrapper.push(this.focusNode.object3D);

    if (this.type == "ellipse" || this.type == "hyperbola") {
    	this.secondaryFocusNode = new Node(this.secondaryFocus,globals,"secondaryFocus", this);
    	this.objectWrapper.push(this.secondaryFocusNode.object3D);
    }

    this.vertexNode = new Node(this.vertex, globals, "vertex", this);
    this.objectWrapper.push(this.vertexNode.object3D);

    this.startNode = new Node(this.curvePoints[0],globals,"start", this);
    this.objectWrapper.push(this.startNode.object3D);

    this.endNode = new Node(this.curvePoints[this.curvePoints.length-1],globals,"end", this)
    this.objectWrapper.push(this.endNode.object3D);



   	// Update Geometry
    this.updateGeometry();
}

Conic.prototype.computeCurve = function() {
	this.removeObject(this.curve);

	var angle = getAngle(this.orientationVec);

	// TO DO: figure out why this is necessary...
	if (this.type == "ellipse") {
		angle += Math.PI/2;
	} else if (this.type == "hyperbola") {
		angle -= Math.PI/2;
	} else if (this.type == "parabola") {
		angle += Math.PI;
	}

	// construct curve:
	this.curvePoints = [];
	var x, y;
	for (var t=this.extents[0]; t <= this.extents[1]; t+=10) {

		if (this.type == "ellipse") {
			x = this.a*Math.cos(t/100);
			y = this.b*Math.sin(t/100);

			this.curvePoints.push(new THREE.Vector3(x*Math.cos(angle) - y*Math.sin(angle),
										   		x*Math.sin(angle) + y*Math.cos(angle),
										   		0).sub(this.orientationVec.clone().multiplyScalar(this.c)).add(this.focus));
		} else if (this.type == "hyperbola") {
			x = this.a/Math.cos(t/100);
			y = this.b*Math.tan(t/100);

			this.curvePoints.push(new THREE.Vector3(x*Math.cos(angle) - y*Math.sin(angle),
										   		x*Math.sin(angle) + y*Math.cos(angle),
										   		0).sub(this.orientationVec.clone().multiplyScalar(this.c)).add(this.focus));
		} else if (this.type == "parabola") {
			x = t;
			y = (t)*(t)/(4*this.a)-this.a;

			this.curvePoints.push(new THREE.Vector3(x*Math.cos(angle) - y*Math.sin(angle),
										   		x*Math.sin(angle) + y*Math.cos(angle),
										   		0).add(this.focus));
		}

		
    }

    var curveGeo = new THREE.Geometry();
	curveGeo.vertices = this.curvePoints;
	this.curve = new THREE.Line(curveGeo, curveMat);
	this.addObject(this.curve);
}

Conic.prototype.updateGeometry = function() {
	this.computeCurve();
	
	if (this.type == "parabola") {
		this.vertexNode.move(this.focus.clone().add(this.focusVertexVec));
	} else if (this.type == "ellipse") {
		this.secondaryFocusNode.move(this.focus.clone().sub(this.secondaryFocusVec));
		this.vertexNode.move(this.focus.clone().add(this.focusVertexVec));
		this.centerPoint = this.focus.clone().sub(this.secondaryFocusVec.clone().divideScalar(2));
	} else if (this.type == "hyperbola") {
		this.secondaryFocusNode.move(this.focus.clone().sub(this.secondaryFocusVec));
		this.vertexNode.move(this.focus.clone().add(this.focusVertexVec));
		this.centerPoint = this.focus.clone().sub(this.secondaryFocusVec.clone().divideScalar(2));
	}

	this.endNode.move(this.curvePoints[this.curvePoints.length-1])
	this.startNode.move(this.curvePoints[0])
	
	this.calculateInteriorBoundingLines();
	this.calculateExteriorBoundingLines();
	this.createInteriorPolygon();
	this.createExteriorPolygon();

	globals.threeView.render();
}

Conic.prototype.moveCurve = function(position) {
	this.focus = this.focusNode.getPosition().clone();
	this.updateGeometry();
}

Conic.prototype.moveVertex = function() {
	this.vertex = this.vertexNode.getPosition();
	this.focusVertexVec = this.vertex.clone().sub(this.focus);
	this.orientationVec = this.focusVertexVec.clone().divideScalar(this.focusVertexVec.length()).negate();
	
	if (this.type == "ellipse" || this.type == "hyperbola") {
		this.secondaryFocusVec= this.orientationVec.clone().multiplyScalar(2*this.c);
		this.secondaryFocus = this.focus.clone().sub(this.secondaryFocusVec);
		this.centerPoint = this.focus.clone().sub(this.secondaryFocusVec.clone().divideScalar(2));
		this.a = this.vertex.clone().sub(this.centerPoint).length();
	} else {
		this.a = this.focusVertexVec.length();
	}
	
	this.updateGeometry();
}

Conic.prototype.moveExtents = function(type,position) {
	var xaxis = this.focusVertexVec.clone().applyAxisAngle(new THREE.Vector3(0,0,1),-Math.PI/2).divideScalar(this.focusVertexVec.length());
	if (type == "start") {
		this.extents[0] = position.sub(this.focus).dot(xaxis);
		if (this.type == "hyperbola") {
			if (this.extents[0] < -156) {
				this.extents[0] = -156;
			}
		}
	}
	else if (type == "end") {
		this.extents[1] = position.sub(this.focus).dot(xaxis);
		if (this.type == "hyperbola") {
			if (this.extents[1] > 156) {
				this.extents[1] = 156;
			}
		}
	}
	this.updateGeometry();
}

Conic.prototype.calculateInteriorBoundingLines = function() {
	this.interiorBorderPoints = [];

	globals.threeView.sceneRemove(this.boundingLines[0])
	globals.threeView.sceneRemove(this.boundingLines[1])

	if (this.polarity) {
		var end_intersect = getBoundaryIntersection(this.focus,this.endNode.getPosition().sub(this.focus))
		
		// var lineGeo = new THREE.Geometry();
		// lineGeo.vertices = [this.end_node.getPosition(),end_intersect];
		// this.boundingLines[0] = new THREE.Line(lineGeo, lineMat);
		// globals.threeView.sceneAdd(this.boundingLines[0]);

		var start_intersect = getBoundaryIntersection(this.focus,this.startNode.getPosition().sub(this.focus))
		
		// lineGeo = new THREE.Geometry();
		// lineGeo.vertices = [this.start_node.getPosition(),start_intersect];
		// this.boundingLines[1] = new THREE.Line(lineGeo, lineMat);
		// globals.threeView.sceneAdd(this.boundingLines[1]);

		// checkCorners
		bottomLeftCorner = new THREE.Vector3(globals.xmin,globals.ymin,0);
		topLeftCorner = new THREE.Vector3(globals.xmin,globals.ymax,0);
		bottomRightCorner = new THREE.Vector3(globals.xmax,globals.ymin,0);
		topRightCorner = new THREE.Vector3(globals.xmax,globals.ymax,0);

		var A = this.startNode.getPosition().sub(this.focus);
		var B = this.startNode.getPosition().sub(this.focus);

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


Conic.prototype.calculateExteriorBoundingLines = function() {
	this.exteriorBorderPoints = [];

	if (this.polarity) {
		for (var i=0; i < this.curvePoints.length; i++) {
			// var intersects = getCurveIntersection(this.curvePoints[i],this.focus.clone().sub(this.curvePoints[i]).negate(),this.curve);
			// if (intersects != null) {
			// 	this.exteriorBorderPoints.push(intersects[0])
			// } else {
			// 	this.exteriorBorderPoints.push(getBoundaryIntersection(this.curvePoints[i], this.aVec));
			// }
			// console.log(this.exteriorBorderPoints)
		 	this.exteriorBorderPoints.push(getBoundaryIntersection(this.curvePoints[i], this.focusVertexVec));
		 	// console.log(getCurveIntersection(this.curvePoints[i],this.focus.clone().sub(this.curvePoints[i]).negate(),this.curve))

		}
	} else {
		for (var i=0; i < this.curvePoints.length; i++) {
			// var intersects = getCurveIntersection(this.curvePoints[i],this.focus.clone().sub(this.curvePoints[i]).negate(),this.curve);
			// if (intersects != null) {
			// 	this.exteriorBorderPoints.push(intersects[0])
			// } else {
			// 	this.exteriorBorderPoints.push(getBoundaryIntersection(this.curvePoints[i], this.aVec.clone().negate()));
			// }
			// this.exteriorBorderPoints.push(getCurveIntersection(this.curvePoints[i],this.focus.clone().sub(this.curvePoints[i]),this.curve))
		 	this.exteriorBorderPoints.push(getBoundaryIntersection(this.curvePoints[i], this.focusVertexVec.clone().negate()));
		 	// console.log(getCurveIntersection(this.curvePoints[i],this.focus.clone().sub(this.curvePoints[i]),this.curve))
		}
	}
}

Conic.prototype.createInteriorPolygon = function() {
	this.removeObject(this.polygon);
	this.removeObject(this.polyFrame);
	this.removeObject(this.interiorPolygonBoundary);

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
	
	// globals.threeView.sceneAdd(this.interiorPolygonBoundary);
	// globals.threeView.sceneAdd(this.polygon);
	this.addObject(this.polygon);
	// globals.threeView.sceneAdd(this.polyFrame);
}

Conic.prototype.createExteriorPolygon = function() {
	this.removeObject(this.polygon2);
	this.removeObject(this.polyFrame2);
	this.removeObject(this.exteriorPolygonBoundary);

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
	
	// globals.threeView.sceneAdd(this.exteriorPolygonBoundary);
	// globals.threeView.sceneAdd(this.polygon2);
	this.addObject(this.polygon2);
	// globals.threeView.sceneAdd(this.polyFrame2);
}

Conic.prototype.addObject = function(object){
	globals.threeView.sceneAdd(object);
	this.objectWrapper.push(object);
};

Conic.prototype.removeObject = function(object){
	globals.threeView.sceneRemove(object);
	var index = this.objectWrapper.indexOf(object);
    if (index>=0) { 
    	this.objectWrapper.splice(index, 1);
    }
};

//deallocate

Conic.prototype.destroy = function(){
    if (this.deleting) return;
    this.deleting = true;
    for (var i=0; i < this.objectWrapper.length; i++) {
    	globals.threeView.sceneRemove(this.objectWrapper[i]);
    	this.objectWrapper[i] = null;
    }
    this.objectWrapper = [];
    globals.threeView.render();
};