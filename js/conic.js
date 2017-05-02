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

var boundingBoxes = [];
var boundingBoxes2 = [];

var counter = 0;
var intersections = [];
var intersectionPoint = undefined;
var intersectionPoints = [];
var reflectionCounter = 0;

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

function createMesh() {
	var nodes = [];
	var edges = [];
	var faces = [];
	_.each(globals.conics, function(conic) {
		console.log(conic.spacedRulePoints);
		console.log(conic.ruleLines);
	});

	var ruleLineIndexBase = 0;
	_.each(globals.conics, function(conic,i) {
		_.each(conic.spacedRulePoints, function(rulePoint, j) {
			var node = {};
			node.position = rulePoint;
			node.index = j;
			node.curve = i;
			node.curveNeighbors = [];
			node.ruleNeighbors = [];
			var neighbors = findClosestTwoPoints(rulePoint,conic.spacedRulePoints);
			if (neighbors.index2 == -1) node.curveNeighbors.push(neighbors.index1);
			else node.curveNeighbors = node.curveNeighbors.concat([neighbors.index1, neighbors.index2]);
			_.each(conic.ruleLines, function(ruleLine, k) {
				var index = lookupIndexByPosition(rulePoint,[ruleLine.start, ruleLine.end])
				if (index != -1) {
					node.ruleNeighbors.push(ruleLineIndexBase+k);
				}
			})
			nodes.push(node);
		});
		ruleLineIndexBase += conic.ruleLines.length;
	});

	var ruleLineIndexBase = 0;
	// var nodeIndexBase = 0;
	_.each(globals.conics, function(conic,i) {
		_.each(conic.ruleLines, function(ruleLine, j) {
			var node = {};
			var tol = 0.1;
			if (Math.abs(ruleLine.end.x) < tol || Math.abs(ruleLine.end.y) < tol || Math.abs(ruleLine.end.x-globals.width) < tol || Math.abs(ruleLine.end.y-globals.height) < tol) {
				//boundry node
				// console.log("end on boundary")
				node.position = ruleLine.end;
				node.curve = -1;
				node.index = ruleLineIndexBase+j;
				node.ruleNeighbors = [];
				node.ruleNeighbors.push(lookupIndexByPosition(ruleLine.start,conic.spacedRulePoints));
				nodes.push(node);
			}
		});
		ruleLineIndexBase += conic.ruleLines.length;
		// nodeIndexBase += conic.spacedRulePoints.length;
	});

	console.log(nodes);

	_.each(nodes, function(node) {
		if (node.curve >= 0) { 
			console.log(node) 
			var edge = {};
			edge.nodes = [];
			edge.nodes.push(node.index)
			_.each(node.ruleNeighbors, function(otherNode) {
				if (!_.contains(edge.nodes,otherNode)) {
					edge.nodes.push(otherNode);
				}
			})
			edges.push(edge)
		}
	});

		// _.each(conic.ruleLines, function(ruleLine) {
		// 	var nodePos = ruleLine.start;
		// 	_.each(globals.conics, function(subconic) {
		// 		_.each(subconic.spacedRulePoints, function(rulePoint) {
		// 			if (nodePos.equals(rulePoint)) {

		// 			}
		// 		})
				
		// 	})
			
		// }

		// _.each(conic.spacedRulePoints, function(nodePoint) {
		// 	nodes.push(nodePoint);
		// });
		// _.each(conic.ruleLines, function(ruleLine) {
		// 	var edge = {
		// 		points: [lookupIndexByPosition(ruleLine.start), 
		// 				 lookupIndexByPosition(ruleLine.end)],
		// 		type: 0
		// 	}
		// 	edges.push(edge);
		// })
	// });

	// console.log(nodes)
	console.log(edges)
}

// function lookupIndexByPosition(rulePointPosition) {
// 	_.each(globals.conics, function(conic,i) {
// 		_.each(conic.spacedRulePoints, function(nodePoint,j) {
// 			if (nodePoint.equals(rulePointPosition)) {
// 				return [i,j];
// 			}
// 			return -1;
// 		});
// 		for (var j=0; j < conic.spacedRulePoints.length; j++) {
// 			console.log(j)
			
// 		}
// 	});
// }

function lookupIndexByPosition(position, list) {
	console.log(list)
	var tol = 0.01;
	for (var i=0; i < list.length; i++) {
		if (position.distanceTo(list[i]) < tol) {
			return i;
		}
	}
	console.log('warning no point found')
	return -1;
}

function findClosestPoint(point,pointList) {
	var closestPoint = null;
	var closestIndex = -1;
	var closestDistance = 1000;
	for (var i=0; i < pointList.length; i++) {
		if (closestPoint != null) ;
		if (closestDistance > pointList[i].distanceTo(point)) {
			closestPoint = pointList.clone();
			closestDistance = closestPoint.distanceTo(point);
			closestIndex = i;
		}
	}
	return {
		point:closestPoint,
		index:closestIndex
	}
}

function findClosestTwoPoints(point,pointList) {
	var closestPoint = null;
	var nextClosestPoint = null;
	var closestIndex = -1;
	var nextClosestIndex = -1;
	var closestDistance = 1000;
	var nextClosestDistance = 1000;
	for (var i=0; i < pointList.length; i++) {
		if (closestDistance > pointList[i].distanceTo(point) && Math.abs(pointList[i].distanceTo(point))>0.001) {
			nextClosestPoint = closestPoint;
			closestPoint = pointList[i].clone();
			nextClosestDistance = closestDistance;
			closestDistance = closestPoint.distanceTo(point);
			nextClosestIndex = closestIndex;
			closestIndex = i;
		}
	}
	return {
		point1:closestPoint,
		index1:closestIndex,
		point2:nextClosestPoint,
		index2:nextClosestIndex
	}
}

function getBoundaryIntersection(fromPoint,alongVector) {
	var ray = new THREE.Ray(fromPoint,alongVector);
	var box = new THREE.Box3(new THREE.Vector3(globals.xmin,globals.ymin,0),
                                    new THREE.Vector3(globals.xmax,globals.ymax,0));
 	return ray.intersectBox(box);
}

// function getCurveIntersection(fromPoint, alongVector) {
// 	alongVector.divideScalar(alongVector.length());
// 	var ray = [fromPoint,fromPoint.clone().add(alongVector.multiplyScalar(globals.width*2))];
// 	var outputs = [];
// 	for (var i = 0; i < globals.conics.length; i++) {
// 		outputs.concat(computeCurveCurveIntersection(ray, globals.conics[i].curvePoints));
// 	}
// 	console.log(outputs);
// }

// function getNearestIntersection(fromPoint,alongVector,exceptThis) {
// 	// console.log(_.reject(globals.threeView.wrapper.children, function(val) { return val == exceptThis});
// 	var raycast = new THREE.Raycaster(fromPoint,alongVector);
// 	var intersects = raycast.intersectObject(globals.threeView.wrapper,true);
// 	console.log(intersects)
// 	console.log("from point:")
// 	console.log(fromPoint)
// 	for (var i=0; i < intersects.length; i++) {
// 		if (intersects[i].distance > 2) {
// 		if (intersectionPoint != undefined) { intersectionPoint.destroy(); }
// 		intersectionPoint = new Node(intersects[i].point, globals) 
// 		return intersects[i].point;
// 		}
// 	}
// 	return null;
// }

// from: http://processingjs.nihongoresources.com/intersections/
function computeCurveCurveIntersection(curve1, curve2, debug=false, draw=false) {
	counter=0;
    intersections = [];
    findIntersections(curve1,curve2);
    if (debug) console.log(intersections)
    if (draw) {
	    for (var i=0; i < intersectionPoints.length; i++) {
	        if (intersectionPoints[i] != undefined) { intersectionPoints[i].destroy(); }
	    }
	    for (var i=0; i < intersections.length; i++) {
	        intersectionPoints.push(new Node(new THREE.Vector3(intersections[i][0],intersections[i][1],0),globals));
	    }
	}
	// var ints = intersections.slice()
	return intersections;
}

function computeLineLineIntersection(line1, line2, debug=false) {
	//lines are of the form [Vector3, Vector3], with each vector representing start and end points
	var withinBounds1 = false;
	var withinBounds2 = false;

	var a1 = line1[1].y - line1[0].y;
	var b1 = line1[0].x - line1[1].x;
	var xm1 = (line1[0].x + line1[1].x)/2.;
	var ym1 = (line1[0].y + line1[1].y)/2.;
	var c1 = a1*xm1+b1*ym1;

	var a2 = line2[1].y - line2[0].y;
	var b2 = line2[0].x - line2[1].x;
	var xm2 = (line2[0].x + line2[1].x)/2.;
	var ym2 = (line2[0].y + line2[1].y)/2.;
	var c2 = a2*xm2+b2*ym2;

	var A = [[a1, b1],
			 [a2, b2]];
	// var B = [c1,c2];
	// var point = numeric.solve(A,B);

	// use Cramer's rule to solve system of equations (~3x faster than solve)
	var det = numeric.det(A);
	var detx = numeric.det([[c1, b1],[c2,b2]]);
	var dety = -numeric.det([[c1, a1],[c2,a2]]);
	point = [detx/det, dety/det];

	if (debug) {
		console.log("x11 = " + line1[0].x)
		console.log("x12 = " + line1[1].x)
		console.log("y11 = " + line1[0].y)
		console.log("y12 = " + line1[1].y)
		console.log("x21 = " + line2[0].x)
		console.log("x22 = " + line2[1].x)
		console.log("y21 = " + line2[0].y)
		console.log("y22 = " + line2[1].y)
		console.log("a1 = " + a1)
		console.log("b1 = " + b1)
		console.log("a2 = " + a2)
		console.log("b2 = " + b2)
	}

	var tol = 0.01;
	// check if point between bounds:
	if (point[0]+tol >= line1[0].x && point[0]-tol <= line1[1].x) {
		if (point[1]+tol >= line1[0].y && point[1]-tol <= line1[1].y) {
			withinBounds1 = true;
		}
	}
	if (point[0]-tol <= line1[0].x && point[0]+tol >= line1[1].x) {
		if (point[1]+tol >= line1[0].y && point[1]-tol <= line1[1].y) {
			withinBounds1 = true;
		}
	}
	if (point[0]+tol >= line1[0].x && point[0]-tol <= line1[1].x) {
		if (point[1]-tol <= line1[0].y && point[1]+tol >= line1[1].y) {
			withinBounds1 = true;
		}
	}
	if (point[0]-tol <= line1[0].x && point[0]+tol >= line1[1].x) {
		if (point[1]-tol <= line1[0].y && point[1]+tol >= line1[1].y) {
			withinBounds1 = true;
		}
	}

	if (point[0]+tol >= line2[0].x && point[0]-tol <= line2[1].x) {
		if (point[1]+tol >= line2[0].y && point[1]-tol <= line2[1].y) {
			withinBounds2 = true;
		}
	}
	if (point[0]-tol <= line2[0].x && point[0]+tol >= line2[1].x) {
		if (point[1]+tol >= line2[0].y && point[1]-tol <= line2[1].y) {
			withinBounds2 = true;
		}
	}
	if (point[0]+tol >= line2[0].x && point[0]-tol <= line2[1].x) {
		if (point[1]-tol <= line2[0].y && point[1]+tol >= line2[1].y) {
			withinBounds2 = true;
		}
	}
	if (point[0]-tol <= line2[0].x && point[0]+tol >= line2[1].x) {
		if (point[1]-tol <= line2[0].y && point[1]+tol >= line2[1].y) {
			withinBounds2 = true;
		}
	}

	return {
		point:point,
		withinBounds:withinBounds1&withinBounds2
	}
}

function findIntersections(curve1,curve2,debug=false) {
	if(debug) console.log("curve1: " + curve1[0].toArray() + " --> " + curve1[1].toArray())
	if(debug) console.log("curve2: " + curve2[0].toArray() + " --> " + curve2[1].toArray())

	var bounds1 = getBoundingBox(curve1);
	var bounds2 = getBoundingBox(curve2);
	
	counter = counter + 1;
	if (counter > 500) {
		console.log("warning: iterations exceded")
		return;
	}

	if (checkOverlap(bounds1, bounds2) && curve1.length > 2 && curve2.length > 2) {
		var s1 = curve1.slice(0,Math.ceil(curve1.length/2));
		var s2 = curve1.slice(Math.ceil(curve1.length/2)-1,curve1.length);
		var s3 = curve2.slice(0,Math.ceil(curve2.length/2));
		var s4 = curve2.slice(Math.ceil(curve2.length/2)-1,curve2.length);
		if (debug) console.log("iterating");
		findIntersections(s1,s3);
		findIntersections(s1,s4);
		findIntersections(s2,s3);
		findIntersections(s2,s4);
		return;
	} else if (curve1.length == 2 && curve2.length == 2) {
		if (debug) console.log('found possible intersection')

		// compute intersection
		var intersectPoint = computeLineLineIntersection(curve1,curve2);

		if (intersectPoint.withinBounds) {
			if (debug) console.log("INTERSECTION @ " + intersectPoint.point)
			intersections.push(intersectPoint.point);
		} else {
			if (debug) console.log("INVALID INTERSECTION @ " + intersectPoint.point)
		}

		return;
	} else if (curve1.length == 2) {
		// curve 1 is as small as possible, divide only curve 2
		var s3 = curve2.slice(0,Math.ceil(curve2.length/2));
		var s4 = curve2.slice(Math.ceil(curve2.length/2)-1,curve2.length);
		findIntersections(curve1,s3);
		findIntersections(curve1,s4);
		return;
	} else if (curve2.length == 2) {
		// curve 2 is as small as possible, divide only curve 1
		var s1 = curve1.slice(0,Math.ceil(curve1.length/2));
		var s2 = curve1.slice(Math.ceil(curve1.length/2)-1,curve1.length);
		findIntersections(s1,curve2);
		findIntersections(s2,curve2);
		return;
	} else {
		if (debug) console.log("no points of intersection");
		return;
	}
}

function checkOverlap(bounds1, bounds2) {
	// check if two bounding boxes overlap
	if (bounds1.maxx <= bounds2.minx) return false;
	if (bounds1.minx >= bounds2.maxx) return false;
	if (bounds1.maxy <= bounds2.miny) return false;
	if (bounds1.miny >= bounds2.maxy) return false;
	return true;
}

function getBoundingBox(points,draw=false) {
	var minx, maxx, miny, maxy;

	minx = globals.width;
	miny = globals.height;
	maxx = -globals.width;
	maxy = -globals.height;
	for (var i=0; i < points.length; i++) {
		if (points[i].x < minx) minx = points[i].x;
		if (points[i].x > maxx) maxx = points[i].x;
		if (points[i].y < miny) miny = points[i].y;
		if (points[i].y > maxy) maxy = points[i].y;
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

function getRayIntersection(fromPoint,alongVector,exceptCurve) {
	// this isn't working as it's supposed to.... there's something strange about it getting trimmed at canvasHeight/2 and not working consistently with intersecting other curves
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
	this.definedRules = false;

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
	this.boundingLinePoints = [];

	this.spacedRulePoints = [];
	this.ruleLines = [];

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
	for (var t=this.extents[0]; t <= this.extents[1]; t+=globals.conic_resolution) {

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

	this.calculateBoundingLinePoints();

	globals.threeView.render();
}

Conic.prototype.moveCurve = function(position) {
	this.focus = this.focusNode.getPosition();
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

Conic.prototype.setRulePoints = function(resolution=11,points) {
	// console.log('setting rule points')
	if (points == undefined) {
		var curve = new THREE.SplineCurve(this.curvePoints);
		this.spacedRulePoints = _.range(resolution).map(function(i){ 
			var vec2 = curve.getPointAt(i/(resolution-1));
			return new THREE.Vector3(vec2.x,vec2.y,0);
		});
	} else {
		this.spacedRulePoints = points;
	}

	for (var i=0; i < this.spacedRulePoints.length; i++) {
		this.projectRuleLine(this.spacedRulePoints[i],this.focusVertexVec.clone().negate());
		this.projectRuleLine(this.spacedRulePoints[i],this.spacedRulePoints[i].clone().sub(this.focus));
	}
	// this.projectRuleLine(this.spacedRulePoints[0],this.focusVertexVec.clone().negate());
	// this.projectRuleLines();
}

Conic.prototype.createRulePoint = function(atPoint,fromSide, debug=false) {
	if (debug) console.log('create rule point at:')
	if (debug) console.log(atPoint)

	this.spacedRulePoints.push(atPoint);
	this.projectRuleLine(atPoint,atPoint.clone().sub(this.focus))
}

Conic.prototype.getCurveIntersection = function(fromPoint, alongVector) {
	// returns nearest curve intersection (if there is one), otherwise returned undefined

	// normalize vector
	alongVector.divideScalar(alongVector.length());

	//project long ray
	var ray = [fromPoint,fromPoint.clone().add(alongVector.multiplyScalar(globals.width*2))];

	var closestIntersect = ray[1];
	var closestIndex = [];
	for (var i = 0; i < globals.conics.length; i++) {
		// console.log(i)
		if (globals.conics[i] != this) {
			var intersects = computeCurveCurveIntersection(ray, globals.conics[i].curvePoints);

			if (intersects.length > 0) {
				var point = new THREE.Vector3(intersects[0][0],intersects[0][1],0);

				// check if this new point is closer
				if (point.distanceTo(fromPoint) < closestIntersect.distanceTo(fromPoint)) {
					closestIntersect = point;
					closestIndex = i;
				}
			} 

		}
	}

	if (!closestIntersect.equals(ray[1])) {
		return {
			point: closestIntersect,
			curveIndex: closestIndex
		}
	} else {
		return {
			point: undefined,
			curveIndex: undefined
		}
	}
}

Conic.prototype.getNearestIntersection = function(fromPoint, alongVector, debug=false) {
	var curveIntersection = this.getCurveIntersection(fromPoint, alongVector);
	var boundaryIntersection = getBoundaryIntersection(fromPoint, alongVector);

	var nearestIntersect = {};
	if (curveIntersection.point != undefined) {
		// nearest intersect = curve
		nearestIntersect = {
			point: curveIntersection.point,
			curveIndex: curveIntersection.curveIndex
		};
	} else {
		// nearest intersect = boundary
		nearestIntersect.point = boundaryIntersection;
		nearestIntersect.curveIndex = undefined;
	}

	if (debug) console.log('nearest Intersect:');
	if (debug) console.log(nearestIntersect);

	return nearestIntersect;
}

Conic.prototype.projectRuleLine = function(fromPoint, direction1, direction2, debug=false) {
	if (debug) {
		console.log("projecing rule line")
		console.log("from:")
		console.log(fromPoint)
		console.log("alongVector:")
		console.log(direction1)
	}

	var nearestIntersect = this.getNearestIntersection(fromPoint,direction1);
	newRule = new RuleLine(fromPoint, nearestIntersect.point);
	this.ruleLines.push( newRule );

	// globals.threeView.render();

	if (nearestIntersect.curveIndex != undefined) {
		// we hit a curve, create a rule point
		if (debug) console.log("hit curve " + nearestIntersect.curveIndex)

		// counter to make sure we don't start an infinite loop
		reflectionCounter = reflectionCounter+1;
		if (reflectionCounter < 250) {
			globals.conics[nearestIntersect.curveIndex].createRulePoint(nearestIntersect.point);
		} else {
			console.log("warning! exceded maximium number of reflections")
		}
	} else {
		if (debug) console.log("hit boundary")
	}
}

// Conic.prototype.projectRuleLines = function() {
// 	console.log('project rule lines')
// 	var points = [];
// 	this.definedRules = true;
// 	for (var i=0; i < this.ruleLines.length; i++) {
// 		this.ruleLines[i].destroy();
// 	}
// 	for (var i=0; i < this.spacedRulePoints.length; i++) {
// 		var intersect;
// 		if (this.type == "parabola") {
// 			if (this.polarity == "converging") {
// 				intersect = this.getCurveIntersection(this.spacedRulePoints[i],this.focusVertexVec.clone().negate());
// 			} else {
// 				intersect = this.getCurveIntersection(this.spacedRulePoints[i],this.focus.clone().sub(this.spacedRulePoints[i]).negate());
// 			}
			
// 		} else {
// 			intersect = this.getCurveIntersection(this.spacedRulePoints[i],this.focus.clone().sub(this.spacedRulePoints[i]).negate());
// 		}
// 		var point, whichCurve;
// 		whichCurve = intersect.curveIndex;
// 		if (intersect.point != undefined) {
// 			point = new THREE.Vector3(intersect.point[0],intersect.point[1],0);
// 			points.push(point);
// 			console.log(point);
// 			this.ruleLines.push(new RuleLine( new THREE.Vector3(this.spacedRulePoints[i].x,this.spacedRulePoints[i].y, 0), point));
// 		} else {
// 			// point = this.focus;
// 		}	
		
// 	}
// 	console.log(this.ruleLines)
// 	console.log("project to: " + whichCurve)
// 	if (!globals.conics[whichCurve].definedRules) {
// 		globals.conics[whichCurve].setRulePoints(26,points);
// 	}
	
// }

Conic.prototype.calculateBoundingLinePoints = function() {
	this.boundingLinePoints = [this.interiorBorderPoints[0]].concat(this.curvePoints,
		this.interiorBorderPoints[this.interiorBorderPoints.length-1]);
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

Conic.prototype.removeRuleLine = function(ruleLine) {
	var index = this.ruleLines.indexOf(ruleLine);
    if (index>=0) { 
    	// ruleLine.
    	this.ruleLines.splice(index, 1);
    }
}

//deallocate

Conic.prototype.destroy = function(){
    if (this.deleting) return;
    this.deleting = true;
    for (var i=0; i < this.objectWrapper.length; i++) {
    	globals.threeView.sceneRemove(this.objectWrapper[i]);
    	this.objectWrapper[i] = null;
    }
    for (var i=0; i < this.ruleLines.length; i++) {
    	this.ruleLines[i].destroy();
    }
    this.objectWrapper = [];
    globals.removeConic(this);
    globals.threeView.render();
};