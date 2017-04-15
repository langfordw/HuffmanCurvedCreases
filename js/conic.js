function Parabola(focus,a,angle,extents) {

	this.type = "parabola";
	this.focus = focus;
	this.a = a;
	this.angle = angle;
	this.extents = extents;

	this.control_points = [];
	this.beams = [];


	this.points = [];

	for (var t=this.extents[0]; t <= this.extents[1]; t++) {
		var x = t;
		var y = (t-focus.x)*(t-focus.x)/(4*a)+focus.y-a;
		this.points.push(new THREE.Vector3(x*Math.cos(this.angle) - y*Math.sin(this.angle),
										   x*Math.sin(this.angle) + y*Math.cos(this.angle),
										   0));
    }

    this.focus_node = new Node(this.focus,globals,"focus");
    this.vertex_node = new Node(this.focus.clone().sub(new THREE.Vector3(-a*Math.sin(this.angle),a*Math.cos(this.angle),0)), globals, "vertex");
    this.end_node = new Node(this.points[0],globals,"end");
    this.start_node = new Node(this.points[this.points.length-1],globals,"start")

	this.curve = new THREE.SplineCurve(this.points);

	this.path = new THREE.Path(this.curve.getPoints(50))
	var geometry = this.path.createPointsGeometry(50);
	var material = new THREE.LineBasicMaterial({color:0xff0000 });
	this.splineObject = new THREE.Line(geometry, material)

	globals.threeView.thirdPassSceneAdd(this.splineObject);
}
