import * as THREE from 'three';
import { BVHLoader } from './BVHLoader';
import {MotionClip, MySkeleton} from './MySkeleton';


/// Scene Initialization

const clock = new THREE.Clock();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set( 0, 200, 300 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

/// Settings:
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
});

//// Initialization ////

const plane_geo = new THREE.PlaneGeometry(1000, 1000);
const plane_color = new THREE.Color();
plane_color.setRGB(0.3, 0.3, 0.3);
const plane_mat = new THREE.MeshBasicMaterial({color: plane_color});
const plane = new THREE.Mesh(plane_geo, plane_mat);
plane.rotation.x = THREE.MathUtils.degToRad(-90);
plane.position.y = 100;
scene.add(plane);

let mixer, figure, figure_skeleton, motion_clip, duration;

// Load BVH file //

const loader = new BVHLoader();
loader.load("./resources/wave.bvh", function(result) {
    const skeletonHelper = new THREE.SkeletonHelper( result.skeleton.bones[ 0 ] );

    // scene.add( result.skeleton.bones[ 0 ] );
    // scene.add( skeletonHelper );
    scene.updateMatrixWorld(true);

    //mixer = new THREE.AnimationMixer( result.skeleton.bones[ 0 ] );
    //mixer.clipAction( result.clip ).play();

    figure_skeleton = new MySkeleton(result.skeleton);
    motion_clip = new MotionClip(result.clip);
    const root = figure_skeleton.generateFigure();
    figure = new THREE.Object3D();
    figure.add(root);
    figure.position.y = 100;
    scene.add(figure);

    
    duration = result.clip.duration;
    //const update_values = motion_clip.getUpdate(0);

    // console.log(skeletonHelper);
    // console.log(result.clip);
    // console.log(figure_skeleton);
    // console.log("Figure before", figure);
    // console.log(update_values);
    // figure_skeleton.updateSkeleton(update_values);
    // console.log("Figure after", figure);
    // console.log("skeleton after", figure_skeleton);

    
    animate();
} );


//// Animation ////


// Animation loop
function animate() {
	requestAnimationFrame( animate );

    const delta = clock.getDelta();
    var elasped = clock.getElapsedTime();
    if (elasped > duration){
        elasped = elasped - duration;
    }
    // if ( mixer ) mixer.update( delta );

    const update_values = motion_clip.getUpdate(elasped);
    figure_skeleton.updateSkeleton(update_values);

	renderer.render( scene, camera );
}