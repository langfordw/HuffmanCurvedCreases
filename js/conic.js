function Parabola(focus,a,angle,extents) {

	this.type = "parabola";
	this.focus = focus;
	this.a = a;
	this.angle = angle;
	this.extents = extents;
	this.vertex = null;

	this.control_points = [];
	this.beams = [];

	this.computeGeometry();

    this.focus_node = new Node(this.focus,globals,"focus");
    this.focus_node.conic = this;
    this.vertex_node = new Node(this.focus.clone().sub(new THREE.Vector3(-this.a*Math.sin(this.angle),this.a*Math.cos(this.angle),0)), globals, "vertex");
    this.vertex_node.conic = this;
    this.end_node = new Node(this.points[0],globals,"end");
    this.start_node = new Node(this.points[this.points.length-1],globals,"start")
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
}

Parabola.prototype.updateA = function() {
	this.vertex = this.vertex_node.getPosition();
	this.a = this.focus.y - this.vertex.y; // this will need to change with angle

	this.computeGeometry();

	this.end_node.move(this.points[this.points.length-1]);
	this.start_node.move(this.points[0]);
}