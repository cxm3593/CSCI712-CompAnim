// Skeleton Class
// Author: Chengyi Ma

import {
	Bone,
	Quaternion,
	QuaternionKeyframeTrack,
	Skeleton,
	Vector3,
	VectorKeyframeTrack,
	Color,
	SphereGeometry,
	MeshBasicMaterial,
	Mesh,
	BufferGeometry,
	LineBasicMaterial,
	Line
} from 'three';

class JointNode{
	// Convert a three bone into a custom joint
	constructor(bone, parent=null){
		this.name = bone.name;
		this.position = bone.position;
		this.rotation = bone.rotation;
		this.quaternion = bone.quaternion;
		

		// Set Parent
		if(parent != null){
			this.parent = parent;
		}
		else{
			this.parent = null;
		}

		// Handle child nodes
		this.children = new Array();
		if(bone.children.length > 0){
			for (let c of bone.children){
				let newChildren = new JointNode(c, this);
				this.children.push(newChildren);
			}
		}
	};

	// Build the figure recursively
	buildFigure(){
		const geometry = new SphereGeometry(1, 32, 32);  // radius = 1, widthSegments = 32, heightSegments = 32
		const joint_color = new Color();
		joint_color.setRGB(1.0, 0.0, 0.0);
		const material = new MeshBasicMaterial({ color: joint_color });  // red
		const sphere = new Mesh(geometry, material);
		sphere.name = this.name;
		sphere.position.copy(this.position);
		sphere.quaternion.copy(this.quaternion);

		this.figureObject = sphere;

		// Handle children
		for (let c of this.children) {
			const child_object = c.buildFigure();
			this.figureObject.add(child_object);
			this.figureObject.updateMatrixWorld(true);

			// Draw line to connect
			const p1 = new Vector3();
			// this.figureObject.getWorldPosition(p1);
			const p2 = child_object.position.clone();
			//child_object.getWorldPosition(p2);

			const geometry = new BufferGeometry().setFromPoints([p1, p2]);
			const line_color = new Color();
			line_color.setRGB(0.0, 1.0, 0.0);
			const material = new LineBasicMaterial({color: line_color});
			const line = new Line(geometry, material);
			this.figureObject.add(line);
			c.parentLine = line;
		}

		return sphere;
	}

	registerName(joint_table){
		joint_table[this.name] = this;
		if(this.children.length > 0){
			for (let c of this.children){
				c.registerName(joint_table);
			}
		}
	}

	// Update joints recursively
	updateJoint(update_values){
		// Find values
		const joint_values = update_values[this.name];
		if(joint_values == null){
			return null;
		}
		// console.log(this.name, "update position", this.position, joint_values.position);
		//console.log(this.name, "update quaternion", this.quaternion, joint_values.quaternion);
		const position = joint_values.position;
		const quaternion = joint_values.quaternion;

		this.position.copy(position);
		this.quaternion.copy(quaternion);

		this.updateJointFigure();
		
		if(this.children.length > 0){
			for (let c of this.children){
				c.updateJoint(update_values);
			}
		}
	}

	updateJointFigure(){
		this.figureObject.position.copy(this.position);
		this.figureObject.quaternion.copy(this.quaternion);
		if(this.parentLine != null && this.parent != null){
			const p1 = new Vector3(0, 0, 0);  // Starting point in parent's local coordinate space
        	const p2 = this.figureObject.position;
			this.parentLine.geometry.setFromPoints([p1, p2]);
		}
		this.figureObject.updateMatrixWorld(true);
	}
};

class MotionClip{
	constructor(clip){
		this.tracks = clip.tracks;
	}

	// Given a time, return a value for each joint
	getUpdate(time){
		const update_values = {};
		for (let t of this.tracks){
			const track_name = t.name;
			const splitted_names = track_name.split(".");
			const joint_name = splitted_names[0];
			const property_name = splitted_names[1];

			let interpolant;
			if(property_name == "position"){
				interpolant = t.createInterpolant(new Vector3());
			}
			else if(property_name == "quaternion"){
				interpolant = t.createInterpolant(new Quaternion());
			}

			const valueArray = interpolant.evaluate(time);

			if(update_values[joint_name] == null){
				update_values[joint_name] = {};
			}
			
			if(property_name == "position"){
				// Create a new Vector3 object from the array values
				update_values[joint_name][property_name] = new Vector3(valueArray[0], valueArray[1], valueArray[2]);
			} else if(property_name == "quaternion"){
				// Create a new Quaternion object from the array values
				update_values[joint_name][property_name] = new Quaternion(valueArray[0], valueArray[1], valueArray[2], valueArray[3]);
			}
		}

		return update_values;
	}
}

class MySkeleton{
	// skeletonInput: skeleton
	constructor(skeletonInput){
		this.root = new JointNode(skeletonInput.bones[0]);
		this.registerNames();
	}

	// Generate a figure made of threejs objects
	generateFigure(){

		this.figure = this.root.buildFigure();
		return this.figure;
	}

	// register joints with their names for quick indexing
	registerNames(){
		this.joint_table = {};
		this.root.registerName(this.joint_table);
	}

	// Update skeleton based
	updateSkeleton(update_values){
		this.root.updateJoint(update_values);
	}
};

export {MySkeleton, MotionClip};