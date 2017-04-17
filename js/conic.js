var lineMat = new THREE.LineBasicMaterial({color: 0x000077, linewidth: 10});

function Parabola(focus,a,angle,extents) {

	this.type = "parabola";
	this.focus = focus;
	this.a = a;
	this.angle = angle;
	this.extents = extents;
	this.vertex = null;

	this.control_points = [];
	this.beams = [];

	this.boundingLines = [];

	this.computeGeometry();

    this.focus_node = new Node(this.focus,globals,"focus");
    this.focus_node.conic = this;
    this.vertex_node = new Node(this.focus.clone().sub(new THREE.Vector3(-this.a*Math.sin(this.angle),this.a*Math.cos(this.angle),0)), globals, "vertex");
    this.vertex_node.conic = this;
    this.start_node = new Node(this.points[0],globals,"start");
    this.start_node.conic = this;
    this.end_node = new Node(this.points[this.points.length-1],globals,"end")
    this.end_node.conic = this;

    this.createRulePolys();
}

Parabola.prototype.computeGeometry = function() {
	this.points = [];
	for (var t=this.focus.x+this.extents[0]; t <= this.focus.x+this.extents[1]; t++) {
		var x = t;
		var y = (t-this.focus.x)*(t-this.focus.x)/(4*this.a)+this.focus.y-this.a;
		this.points.push(new THREE.Vector3(x*Math.cos(this.angle) - y*Math.sin(this.angle),
										   x*Math.sin(this.angle) + y*Math.cos(this.angle),
										   0));
    }

    this.curve = new THREE.SplineCurve(this.points);
	this.path = new THREE.Path(this.curve.getPoints(50))
	var geometry = this.path.createPointsGeometry(50);
	var material = new THREE.LineBasicMaterial({color:0xff0000 });
	globals.threeView.thirdPassSceneRemove(this.splineObject);
	this.splineObject = new THREE.Line(geometry, material)

	globals.threeView.thirdPassSceneAdd(this.splineObject);
}

Parabola.prototype.move = function(position) {
	this.focus = this.focus_node.getPosition().clone();
	this.computeGeometry();
	this.end_node.move(this.points[this.points.length-1])
	this.start_node.move(this.points[0])
	this.vertex_node.move(this.focus.clone().sub(new THREE.Vector3(-this.a*Math.sin(this.angle),this.a*Math.cos(this.angle),0)));

	this.createRulePolys();
}

Parabola.prototype.updateA = function() {
	this.vertex = this.vertex_node.getPosition();
	this.a = this.focus.y - this.vertex.y; // this will need to change with angle

	this.computeGeometry();

	this.end_node.move(this.points[this.points.length-1]);
	this.start_node.move(this.points[0]);

	this.createRulePolys();
}

Parabola.prototype.updateExtents = function(type,position) {
	if (type == "start") {
		this.extents[0] = position.x-this.focus.x;
	}
	else if (type == "end") {
		this.extents[1] = position.x-this.focus.x;
	}
	// this.extents[1] = this.focus.x-position.x;
	console.log(this.extents)

	this.computeGeometry();
	this.end_node.move(this.points[this.points.length-1]);
	this.start_node.move(this.points[0]);

	this.createRulePolys();
}

Parabola.prototype.createRulePolys = function() {
	globals.threeView.sceneRemove(this.boundingLines[0])
	globals.threeView.sceneRemove(this.boundingLines[1])

	var ray = new THREE.Ray(this.focus,this.end_node.getPosition().sub(this.focus));
	console.log(ray)
	var box = new THREE.Box3(new THREE.Vector3(-window.innerWidth/2.,-window.innerHeight/2.,-10),
							new THREE.Vector3(window.innerWidth/2.,window.innerHeight/2.,10));
	var intersect = ray.intersectBox(box)
	console.log(intersect);
	new Node(intersect,globals)
	
	var lineGeo = new THREE.Geometry();
	lineGeo.dynamic = true;
	lineGeo.vertices = [this.end_node.getPosition(),intersect];
	var line = new THREE.Line(lineGeo, lineMat);

	this.boundingLines[0] = line;
	globals.threeView.sceneAdd(line);

	var ray = new THREE.Ray(this.focus,this.start_node.getPosition().sub(this.focus));
	console.log(ray)
	var box = new THREE.Box3(new THREE.Vector3(-window.innerWidth/2.,-window.innerHeight/2.,-10),
							new THREE.Vector3(window.innerWidth/2.,window.innerHeight/2.,10));
	var intersect = ray.intersectBox(box)
	console.log(intersect);
	new Node(intersect,globals)

	var lineGeo = new THREE.Geometry();
	lineGeo.dynamic = true;
	lineGeo.vertices = [this.start_node.getPosition(),intersect];
	var line = new THREE.Line(lineGeo, lineMat);

	this.boundingLines[1] = line;
	globals.threeView.sceneAdd(line);
}