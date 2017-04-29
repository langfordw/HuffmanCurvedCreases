// To do:
// - debug raycasting to curve
// - fix intersection of curve with border
// - fix ellipse A, B, (secondaryFocus not updating with those)
// - add handles for B
// - add export to SVG / Zund
// - debug parabola --> hyperbola

var lineMat = new THREE.LineBasicMaterial({color: 0x000077});
var curveMat = new THREE.LineBasicMaterial({color: 0xff0000});
var boundaryMat = new THREE.LineBasicMaterial({color: 0x000000, linewidth: 2});
var polyMat = new THREE.MeshBasicMaterial({color: 0x005500, side: THREE.DoubleSide, transparent: true, opacity:0.25, wireframe: false});
var polyMat2 = new THREE.MeshBasicMaterial({color: 0x000055, side: THREE.DoubleSide, transparent: true, opacity:0.25, wireframe: false});
var polyMatWire = new THREE.MeshBasicMaterial({color: 0x444444, side: THREE.DoubleSide, transparent: true, opacity:0.25, wireframe: true});

var intersections = [];
var counter = 0;
var boundingBoxes = [];
var boundingBoxes2 = [];

var intersectionPoint = undefined;

var firstHalf = _.range(26).map(function(val) {
	return val/50;
});


var secondHalf = _.range(26).map(function(val) {
	return .5+val/50;
});



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

function getNearestIntersection(fromPoint,alongVector,exceptThis) {
	// console.log(_.reject(globals.threeView.wrapper.children, function(val) { return val == exceptThis});
	var raycast = new THREE.Raycaster(fromPoint,alongVector);
	var intersects = raycast.intersectObject(globals.threeView.wrapper,true);
	console.log(intersects)
	console.log("from point:")
	console.log(fromPoint)
	for (var i=0; i < intersects.length; i++) {
		if (intersects[i].distance > 2) {
		if (intersectionPoint != undefined) { intersectionPoint.destroy(); }
		intersectionPoint = new Node(intersects[i].point, globals) 
		return intersects[i].point;
		}
	}
	return null;
}

function findIntersections(curve1,curve2) {

	// var curve1 = new THREE.SplineCurve(linePoints1);
	// var curve2 = new THREE.SplineCurve(linePoints2);

	var bounds1 = getBoundingBox(curve1);
	var bounds2 = getBoundingBox(curve2);

	console.log(bounds1)
	console.log(bounds2)

	var boundingBoxGeom = new THREE.Geometry();
	boundingBoxGeom.vertices = [new THREE.Vector3(bounds1.minx, bounds1.miny, 0),
								new THREE.Vector3(bounds1.minx, bounds1.maxy, 0),
								new THREE.Vector3(bounds1.maxx, bounds1.maxy, 0),
								new THREE.Vector3(bounds1.maxx, bounds1.miny, 0),
								new THREE.Vector3(bounds1.minx, bounds1.miny, 0)];

	var boundingBox = new THREE.Line(boundingBoxGeom, boundaryMat);
	globals.threeView.sceneAdd(boundingBox);

	var boundingBoxGeom2 = new THREE.Geometry();
	boundingBoxGeom2.vertices = [new THREE.Vector3(bounds2.minx, bounds2.miny, 0),
								 new THREE.Vector3(bounds2.minx, bounds2.maxy, 0),
								 new THREE.Vector3(bounds2.maxx, bounds2.maxy, 0),
								 new THREE.Vector3(bounds2.maxx, bounds2.miny, 0),
								 new THREE.Vector3(bounds2.minx, bounds2.miny, 0)];
								
	var boundingBox2 = new THREE.Line(boundingBoxGeom2, boundaryMat);
	boundingBoxes.push(boundingBox);
	boundingBoxes2.push(boundingBox2);
	globals.threeView.sceneAdd(boundingBox2);
	globals.threeView.render();
	
	counter = counter + 1;
	console.log("Count = " + counter);
	if (counter > 50) {
		console.log("iterations exceded")
		return;
	}

	if (checkOverlap(bounds1, bounds2) && curve1.length > 2 && curve2.length > 2) {
		// var s1 = curve1.splice(0,Math.floor(curve1.length/2));
		// var s2 = curve1;
		// var s3 = curve2.splice(0,Math.floor(curve2.length/2));
		// var s4 = curve2;
		// var midpoint1 = curve1.getSpacedPoints(2)[1];
		// var midpoint2 = curve2.getSpacedPoints(2)[1];
		var s1 = curve1.slice(0,Math.ceil(curve1.length/2));
		var s2 = curve1.slice(Math.ceil(curve1.length/2)-1,curve1.length);
		var s3 = curve2.slice(0,Math.ceil(curve2.length/2));
		var s4 = curve2.slice(Math.ceil(curve2.length/2)-1,curve2.length);
		// var s1 = _.range(26).map(function(i){ return curve1.getPointAt(firstHalf[i]) });
		// var s2 = _.range(26).map(function(i){ return curve1.getPointAt(secondHalf[i]) });
		// var s3 = _.range(26).map(function(i){ return curve2.getPointAt(firstHalf[i]) });
		// var s4 = _.range(26).map(function(i){ return curve2.getPointAt(secondHalf[i]) });
		console.log("iterating");
		console.log(s1.length)
		console.log(s2.length)
		console.log(s3.length)
		console.log(s4.length)
		intersections.concat(findIntersections(s1,s3));
		intersections.concat(findIntersections(s1,s4));
		intersections.concat(findIntersections(s2,s3));
		intersections.concat(findIntersections(s2,s4));
		return intersections;
	} else if (curve1.length == 2 && curve2.length == 2) {
		console.log('found intersection!!! Here:')
		console.log(bounds1);
		console.log('and here')
		console.log(bounds2);
		new Node(new THREE.Vector3((curve1[0].x+curve1[1].x)/2.,(curve1[0].y+curve1[1].y)/2.,0),globals);
		return curve1;
	} else if (curve1.length == 2) {
		// curve 1 is as small as possible, divide only curve 2
		var s3 = curve2.slice(0,Math.ceil(curve2.length/2));
		var s4 = curve2.slice(Math.ceil(curve2.length/2)-1,curve2.length);
		intersections.concat(findIntersections(curve1,s3));
		intersections.concat(findIntersections(curve1,s4));
		return intersections;
	} else if (curve2.length == 2) {
		// curve 2 is as small as possible, divide only curve 1
		var s1 = curve1.slice(0,Math.ceil(curve1.length/2));
		var s2 = curve1.slice(Math.ceil(curve1.length/2)-1,curve1.length);
		intersections.concat(findIntersections(s1,curve2));
		intersections.concat(findIntersections(s2,curve2));
		return intersections;
	} else {
		console.log("no points of intersection");
		// globals.threeView.sceneRemove(boundingBoxes.pop());
		// globals.threeView.sceneRemove(boundingBoxes2.pop());
		return [];
	}
}

function checkOverlap(bounds1, bounds2) {
	// check if they overlap
	if (bounds1.maxx < bounds2.minx) return false;
	if (bounds1.minx > bounds2.maxx) return false;
	if (bounds1.maxy < bounds2.miny) return false;
	if (bounds1.miny > bounds2.maxy) return false;
	return true;
}

function getBoundingBox(points,draw=false) {
	var minx, maxx, miny, maxy;

	minx = globals.width;
	miny = globals.height;
	maxx = -globals.width;
	maxy = -globals.height;
	for (var i=0; i < points.length; i++) {
		if (points[i].x < minx) {
			minx = points[i].x;
		}
		if (points[i].x > maxx) {
			maxx = points[i].x;
		}
		if (points[i].y < miny) {
			miny = points[i].y;
		}
		if (points[i].y > maxy) {
			maxy = points[i].y;
		}
	}

	if (draw) {
		var boundingBoxGeom = new THREE.Geometry();
		boundingBoxGeom.vertices = [new THREE.Vector3(minx, miny, 0),
									new THREE.Vector3(minx, maxy, 0),
									new THREE.Vector3(maxx, maxy, 0),
									new THREE.Vector3(maxx, miny, 0),
									new THREE.Vector3(minx, miny, 0)];

		var boundingBox = new THREE.Line(boundingBoxGeom, boundaryMat);
		globals.threeView.sceneAdd(boundingBox);
		globals.threeView.render();
	}

	var bounds = {
		minx: minx,
		maxx: maxx,
		miny: miny,
		maxy: maxy,
		spanx: Math.abs(maxx-minx),
		spany: Math.abs(maxy-miny)
	}
	return bounds;
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

	console.log(globals.threeView.wrapper.children);
	console.log(_.filter(globals.threeView.wrapper.children,function(val) {
		return (val != exceptCurve.curve) && (val != exceptCurve.focusNode)  && (val != exceptCurve.vertexNode)
	}))
	var raycast = new THREE.Raycaster(fromPoint,alongVector);
	var intersects = raycast.intersectObject(globals.threeView.wrapper,true);
	console.log(intersects)
	_.each(intersects, function(intersect){
		new Node(intersect.point, globals)
	})
	// var creaseLine = new THREE.PlaneGeometry(400,20,1,1);
 //    var plane = new THREE.Mesh(creaseLine, boundaryMat);
 //    // plane.rotateX(Math.PI/2);
 //    // plane.translateZ(-10);
 //    // globals.threeView.sceneAdd(plane);

 //    var box = new THREE.Box3(new THREE.Vector3(-200,-100,0),
 //                             new THREE.Vector3(200,-100,0));

	// var ray = new THREE.Ray(fromPoint,alongVector);
	// // console.log(ray);
	// // console.log(plane)
 // 	// return ray.intersectPlane(plane);
 // 	return ray.intersectBox(box);
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
	angle += Math.PI

	// construct curve:
	this.curvePoints = [];
	var x, y;
	for (var t=this.extents[0]; t <= this.extents[1]; t+=2) {

		if (this.type == "ellipse") {
			y = -this.a*Math.cos(t/100);
			x = this.b*Math.sin(t/100);

			this.curvePoints.push(new THREE.Vector3(x*Math.cos(angle) - y*Math.sin(angle),
										   		x*Math.sin(angle) + y*Math.cos(angle),
										   		0).sub(this.orientationVec.clone().multiplyScalar(this.c)).add(this.focus));
		} else if (this.type == "hyperbola") {
			y = this.a/Math.cos(t/100);
			x = this.b*Math.tan(t/100);

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
	this.focus = this.focusNode.getPosition();
	// this.secondaryFocus = this.focusNode.getPosition().add(this.secondaryFocusVec);
	if (this.type != "parabola") this.secondaryFocus = this.secondaryFocusNode.getPosition();
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
	if (this.type == "parabola") var center = this.focus;
	else var center = this.centerPoint;

	var mousePos = position.clone().sub(center);

	var initPos, tangent;
	if (type == "start") {
		initPos = this.startNode.getPosition().sub(center);
		tangent = this.curvePoints[0].clone().sub(this.curvePoints[1]);
	} else {
		initPos = this.endNode.getPosition().sub(center);
		tangent = this.curvePoints[this.curvePoints.length-1].clone().sub(this.curvePoints[this.curvePoints.length-2]);
	}
	var dPos = mousePos.clone().sub(initPos);
	var dPosDotTangent = dPos.clone().dot(tangent)/100;


	if (type == "start") this.extents[0] -= dPosDotTangent;
	else this.extents[1] += dPosDotTangent;

	this.updateGeometry();
}

Conic.prototype.calculateInteriorBoundingLines = function() {
	this.interiorBorderPoints = [];

	if (this.polarity == "converging") {
		for (var i=0; i < this.curvePoints.length; i++) {
			if (this.type == "parabola") {
				this.interiorBorderPoints.push(getBoundaryIntersection(this.curvePoints[i], this.focusVertexVec.clone().negate()));
			} else {
				this.interiorBorderPoints.push(getBoundaryIntersection(this.curvePoints[i], 
		 				this.curvePoints[i].clone().sub(this.secondaryFocus)));
			}
		 	
		}
	} else {
		for (var i=0; i < this.curvePoints.length; i++) {
			if (this.type == "parabola") {
				this.interiorBorderPoints.push(this.focus);
			} else {
				this.interiorBorderPoints.push(this.focus);
			}
		}
	}
	console.log(this.interiorBorderPoints);
}

Conic.prototype.calculateExteriorBoundingLines = function() {
	this.exteriorBorderPoints = [];

	if (this.polarity == "converging") {
		for (var i=0; i < this.curvePoints.length; i++) {
			if (this.type == "parabola") {
				this.exteriorBorderPoints.push(getBoundaryIntersection(this.curvePoints[i], 
		 				this.curvePoints[i].clone().sub(this.focus)));
			} else {
				this.exteriorBorderPoints.push(getBoundaryIntersection(this.curvePoints[i], 
		 				this.curvePoints[i].clone().sub(this.focus)));
			}
		 	
		}
	} else {
		for (var i=0; i < this.curvePoints.length; i++) {
			if (this.type == "parabola") {
				this.exteriorBorderPoints.push(getBoundaryIntersection(this.curvePoints[i], this.focusVertexVec));
			} else {
				this.exteriorBorderPoints.push(this.secondaryFocus);
			}
		 }	
	}
}

Conic.prototype.createInteriorPolygon = function() {
	this.removeObject(this.polygon);
	this.removeObject(this.polyFrame);

	var polyGeom = new THREE.Geometry();

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


	this.polygon = new THREE.Mesh(polyGeom,polyMat);
	this.polyFrame = new THREE.Mesh(polyGeom,polyMatWire);
	
	if (globals.showPolygons) this.addObject(this.polygon);
	if (globals.showWireframe) this.addObject(this.polyFrame);
}

Conic.prototype.createExteriorPolygon = function() {
	this.removeObject(this.polygon2);
	this.removeObject(this.polyFrame2);

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
	
	if (globals.showPolygons) this.addObject(this.polygon2);
	if (globals.showWireframe) this.addObject(this.polyFrame2);
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
    globals.removeConic(this);
    globals.threeView.render();
};