class kinectAvatar{

	constructor(world, scale, mirror){
		this.scale = scale;
		if (mirror == true) {
			this.mirror = -1;
		}
		else {
			this.mirror = 1;
		}

		this.JointType = Object.freeze({
		  0: 'SpineBase',
		  1: 'SpineMid',
		  2: 'Neck',
		  3: 'Head',
		  4: 'ShoulderLeft',
		  5: 'ElbowLeft',
		  6: 'WristLeft',
		  7: 'HandLeft',
		  8: 'ShoulderRight',
		  9: 'ElbowRight',
		  10: 'WristRight',
		  11: 'HandRight',
		  12: 'HipLeft',
		  13: 'KneeLeft',
		  14: 'AnkleLeft',
		  15: 'FootLeft',
		  16: 'HipRight',
		  17: 'KneeRight',
		  18: 'AnkleRight',
		  19: 'FootRight',
		  20: 'SpineShoulder',
		  21: 'HandTipLeft',
		  22: 'ThumbLeft',
		  23: 'HandTipRight',
		  24: 'ThumbRight'
		});

		this.lines_in_world = [];

		this.BoneLines = new Array();

		this.bonesDetail = 5;
		this.bonesRadius = 5;

		this.limbsWidth = 0.03*this.scale;
		this.bodyidth = 0.05*this.scale;
        // torso
        this.BoneLines.push({ jointStart: "Head",             jointEnd: "Neck", width: this.bodyidth });
        this.BoneLines.push({ jointStart: "Neck",             jointEnd: "SpineShoulder", width: this.bodyidth });
        this.BoneLines.push({ jointStart: "SpineShoulder",    jointEnd: "SpineMid", width: this.bodyidth });
        this.BoneLines.push({ jointStart: "SpineMid",         jointEnd: "SpineBase", width: this.bodyidth });
        this.BoneLines.push({ jointStart: "SpineShoulder",    jointEnd: "ShoulderRight", width: this.bodyidth });
        this.BoneLines.push({ jointStart: "SpineShoulder",    jointEnd: "ShoulderLeft", width: this.bodyidth });
        this.BoneLines.push({ jointStart: "SpineBase",        jointEnd: "HipRight", width: this.bodyidth });
        this.BoneLines.push({ jointStart: "SpineBase",        jointEnd: "HipLeft", width: this.bodyidth });

        // right arm    
        this.BoneLines.push({ jointStart: "ShoulderRight",    jointEnd: "ElbowRight", width: this.limbsWidth });
        this.BoneLines.push({ jointStart: "ElbowRight",       jointEnd: "WristRight", width: this.limbsWidth });
        this.BoneLines.push({ jointStart: "WristRight",       jointEnd: "HandRight", width: this.limbsWidth });
        this.BoneLines.push({ jointStart: "HandRight",        jointEnd: "HandTipRight", width: this.bodyidth });
        this.BoneLines.push({ jointStart: "WristRight",       jointEnd: "ThumbRight", width: this.bodyidth });

        // left arm
        this.BoneLines.push({ jointStart: "ShoulderLeft",     jointEnd: "ElbowLeft", width: this.limbsWidth });
        this.BoneLines.push({ jointStart: "ElbowLeft",        jointEnd: "WristLeft", width: this.limbsWidth });
        this.BoneLines.push({ jointStart: "WristLeft",        jointEnd: "HandLeft", width: this.limbsWidth });
        this.BoneLines.push({ jointStart: "HandLeft",         jointEnd: "HandTipLeft", width: this.bodyidth });
        this.BoneLines.push({ jointStart: "WristLeft",        jointEnd: "ThumbLeft", width: this.bodyidth });

        // right leg
        this.BoneLines.push({ jointStart: "HipRight",         jointEnd: "KneeRight", width: this.limbsWidth });
        this.BoneLines.push({ jointStart: "KneeRight",        jointEnd: "AnkleRight", width: this.limbsWidth });
        this.BoneLines.push({ jointStart: "AnkleRight",       jointEnd: "FootRight", width: this.bodyidth });

        // left leg
        this.BoneLines.push({ jointStart: "HipLeft",          jointEnd: "KneeLeft", width: this.limbsWidth });
        this.BoneLines.push({ jointStart: "KneeLeft",         jointEnd: "AnkleLeft", width: this.limbsWidth });
        this.BoneLines.push({ jointStart: "AnkleLeft",        jointEnd: "FootLeft", width: this.bodyidth });

		function swap(json){
		  var ret = {};
		  for(var key in json){
		    ret[json[key]] = key;
		  }
		  return ret;
		}

		this.inverseJointType = swap(this.JointType);
		this.counter = 0;

		this.world = world;

		this.scene = this.world.scene;
		this.active = false;

		this.line_material = new THREE.LineBasicMaterial({
			color: 0x0000ff,
			linewidth: 1
		});


		this.sphereMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00} );

		this.material = new THREE.MeshNormalMaterial();

		// hand
		this.handMaterial = new THREE.MeshNormalMaterial();
		var handRadius = 0.1*this.scale;
		this.handGeometry = new THREE.SphereGeometry(handRadius);


		var headRadius = 0.15*this.scale;
		this.headGeometry = new THREE.SphereGeometry(headRadius),
		this.headMaterial = new THREE.MeshNormalMaterial();

		this.head = null;
		this.handRight = null;
		this.handLeft = null;

		this.pantsMaterial = new THREE.MeshToonMaterial({color: 0x000000});
		this.shirtMaterial =  new THREE.MeshToonMaterial({color: 0x5A6372});

		this.quantoOneMaterial = new THREE.MeshBasicMaterial( {color: 0x3333cc} );
		this.quantoTwoMaterial = new THREE.MeshBasicMaterial( {color: 0x009933} );
		this.quantoThreeMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00} );
		this.quantoFourMaterial = new THREE.MeshBasicMaterial( {color: 0xff0066} );
		this.quantoFiveMaterial = new THREE.MeshBasicMaterial( {color: 0xffffff} );
		this.quantoNormal = new THREE.MeshNormalMaterial();
	}

	addToScene(scene){
		this.active = true;
		this.scene = scene;
	}

	removeFromScene(scene){
		this.world.removeLines(this.lines_in_world);
		this.active = false;
		if (this.handRight != null) {
			this.scene.remove(this.handRight);
			this.handRight = null;
		}
		if (this.handLeft != null) {
			this.scene.remove(this.handLeft);
			this.handLeft = null;
		}
		if (this.head !=null) {			
			this.scene.remove(this.head);
			this.head = null;
		}
	}

	doDispose (obj)
    {
        if (obj !== null)
        {
            for (var i = 0; i < obj.children.length; i++)
            {
                doDispose(obj.children[i]);
            }
            if (obj.geometry)
            {
                obj.geometry.dispose();
                obj.geometry = undefined;
            }
            if (obj.material)
            {
                if (obj.material.map)
                {
                    obj.material.map.dispose();
                    obj.material.map = undefined;
                }
                obj.material.dispose();
                obj.material = undefined;
            }
        }
        obj = undefined;
    };

	refresh(data){
		if (!this.active) {
			return;
		}
		// console.log(data);
		if(this.counter == 0){
			this.startTime = performance.now();
		}

		this.counter++;

		if(this.counter % 1000 ==0){

			var t1 = performance.now();

			var frames_per_sec = this.counter*1000/(t1-this.startTime);

		}

		if (this.counter % 1000 == 0){
			console.log('this.body ',this.body);
		}

		// this.world.removeLines(this.lines_in_world);
		for (i=0;i<this.lines_in_world.length;i++) {
			this.world.scene.remove(this.lines_in_world[i]);
			this.doDispose(this.lines_in_world[i]);
		}

		// deallocate
		this.lines_in_world = null;
		this.lines_in_world = [];


		var i;

		function cylinderMesh(pointx, pointY, material, cylinderWidth) {
		    var direction = new THREE.Vector3().subVectors(pointY, pointx);
		    var orientation = new THREE.Matrix4();
		    orientation.lookAt(pointx, pointY, new THREE.Object3D().up);
		    var m = new THREE.Matrix4(); m.set(1,0,0,0,0,0,1,0,0,-1,0,0,0,0,0,1); orientation.multiply(m); 
		    var edgeGeometry = new THREE.CylinderGeometry(cylinderWidth, cylinderWidth, direction.length());
		    var edge = new THREE.Mesh(edgeGeometry, material);
		    edge.applyMatrix(orientation);
		    // position based on midpoints - there may be a better solution than this
		    edge.position.x = (pointY.x + pointx.x) / 2;
		    edge.position.y = (pointY.y + pointx.y) / 2;
		    edge.position.z = (pointY.z + pointx.z) / 2;
		    return edge;
		}

		this.center = new THREE.Vector3(
			(data.joints[this.inverseJointType["HipRight"]].x*this.scale*this.mirror+data.joints[this.inverseJointType["HipLeft"]].x*this.scale*this.mirror)/2, 
			(data.joints[this.inverseJointType["HipRight"]].y*this.scale+data.joints[this.inverseJointType["HipLeft"]].y*this.scale)/2, 
			(data.joints[this.inverseJointType["HipRight"]].z*this.scale+data.joints[this.inverseJointType["HipLeft"]].z*this.scale)/2);
		//var pointY = new THREE.Vector3(data.joints[this.inverseJointType[jointEnd]].x*this.scale*this.mirror, data.joints[this.inverseJointType[jointEnd]].y*this.scale, data.joints[this.inverseJointType[jointEnd]].z*this.scale);


		for (i=0; i<this.BoneLines.length;i++) {
			var jointStart = this.BoneLines[i].jointStart;
			var jointEnd = this.BoneLines[i].jointEnd;
			var width = this.BoneLines[i].width;
			var pointx = new THREE.Vector3(data.joints[this.inverseJointType[jointStart]].x*this.scale*this.mirror, data.joints[this.inverseJointType[jointStart]].y*this.scale, data.joints[this.inverseJointType[jointStart]].z*this.scale);
			var pointY = new THREE.Vector3(data.joints[this.inverseJointType[jointEnd]].x*this.scale*this.mirror, data.joints[this.inverseJointType[jointEnd]].y*this.scale, data.joints[this.inverseJointType[jointEnd]].z*this.scale);
			// normalize 
			pointx = this.center.clone().multiplyScalar(-1).add(pointx);
			pointY = this.center.clone().multiplyScalar(-1).add(pointY);


			var material = this.material;

			if (jointStart === "SpineMid" && jointEnd === "SpineBase") {
				material = this.shirtMaterial;
			}

			if (jointStart === "SpineShoulder" && jointEnd === "SpineMid") {
				material = this.shirtMaterial;
			}

			if (jointStart === "SpineShoulder" && jointEnd === "ShoulderRight") {
				material = this.shirtMaterial;
			}

			if (jointStart === "SpineShoulder" && jointEnd === "ShoulderLeft") {
				material = this.shirtMaterial;
			}

			if (jointStart === "SpineBase" && jointEnd === "HipRight") {
				material = this.pantsMaterial;
			}

			if (jointStart === "SpineBase" && jointEnd === "HipLeft") {
				material = this.pantsMaterial;
			}

			if (jointStart === "HipRight" && jointEnd === "KneeRight") {
				material = this.pantsMaterial;
			}

			if (jointStart === "HipLeft" && jointEnd === "KneeLeft") {
				material = this.pantsMaterial;
			}

			if (jointStart === "WristRight" && jointEnd === "ThumbRight") {
				continue
			}

			if (jointStart === "WristLeft" && jointEnd === "ThumbLeft") {
				continue
			}

			var cylinder = cylinderMesh(pointx, pointY, material, width);

			this.scene.add(cylinder);
			this.lines_in_world.push(cylinder);
		}

//		var head = new THREE.Vector3(data.joints[this.inverseJointType["Head"]].x*this.scale*this.mirror, data.joints[this.inverseJointType["Head"]].y*this.scale, data.joints[this.inverseJointType["Head"]].z*this.scale);
//		head = this.center.clone().multiplyScalar(-1).add(head);
		if (this.head != null) {
			this.head.position.set(data.joints[this.inverseJointType["Head"]].x*this.scale*this.mirror-this.center.x, data.joints[this.inverseJointType["Head"]].y*this.scale-this.center.y, data.joints[this.inverseJointType["Head"]].z*this.scale-this.center.z);
		}
		else {
			// console.log("adding head")

			this.head = new THREE.Mesh(
			   this.headGeometry,
			   this.headMaterial
			);

//			this.head.position.set(head);
			this.head.position.set(data.joints[this.inverseJointType["Head"]].x*this.scale*this.mirror-this.center.x, data.joints[this.inverseJointType["Head"]].y*this.scale-this.center.y, data.joints[this.inverseJointType["Head"]].z*this.scale-this.center.z);

			this.scene.add(this.head);
		}

		this.createHandRight(data);
		this.createHandLeft(data);


	}

	createHandRight(data) {

		if (this.handRight != null) {
			this.handRight.position.set(data.joints[this.inverseJointType["HandTipRight"]].x*this.scale*this.mirror-this.center.x, data.joints[this.inverseJointType["HandTipRight"]].y*this.scale-this.center.y, data.joints[this.inverseJointType["HandTipRight"]].z*this.scale-this.center.z);
		}
		else {
			this.handRight = new THREE.Mesh(
			   this.handGeometry,
			   this.handMaterial);

			this.handRight.position.set(data.joints[this.inverseJointType["HandTipRight"]].x*this.scale*this.mirror-this.center.x, data.joints[this.inverseJointType["HandTipRight"]].y*this.scale-this.center.y, data.joints[this.inverseJointType["HandTipRight"]].z*this.scale-this.center.z);

			// add the sphere to the scene
			this.scene.add(this.handRight);
		}

	}

	createHandLeft(data) {

		if (this.handLeft != null) {
			this.handLeft.position.set(data.joints[this.inverseJointType["HandTipLeft"]].x*this.scale*this.mirror-this.center.x, data.joints[this.inverseJointType["HandTipLeft"]].y*this.scale-this.center.y, data.joints[this.inverseJointType["HandTipLeft"]].z*this.scale-this.center.z);
		}
		else {
			this.handLeft = new THREE.Mesh(
			   this.handGeometry,
			   this.handMaterial);

			this.handLeft.position.set(data.joints[this.inverseJointType["HandTipLeft"]].x*this.scale*this.mirror-this.center.x, data.joints[this.inverseJointType["HandTipLeft"]].y*this.scale-this.center.y, data.joints[this.inverseJointType["HandTipLeft"]].z*this.scale-this.center.z);

			// add the sphere to the scene
			this.scene.add(this.handLeft);
		}

	}

	refreshHands(bendQuanto) {
		var color, material;
		if (bendQuanto == 1) { 
			material = this.quantoOneMaterial;
		}
		else if (bendQuanto == 2){
			material = this.quantoTwoMaterial;
		}
		else if (bendQuanto == 3){
			material = this.quantoThreeMaterial;
		}
		else if (bendQuanto == 4){
			material = this.quantoFourMaterial;
		}
		else if (bendQuanto == 5){
			material = this.quantoFiveMaterial;
		}
		else {
			material = this.quantoNormal;
		}
		if (this.handLeft != null) {
			this.handLeft.material = material;
			material.needsUpdate = true;
		}
	}
}

