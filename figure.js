import * as THREE from 'three';
import { BVHLoader } from './resources/BVHLoader';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {MotionClip, MySkeleton} from './resources/MySkeleton';


/// Scene Initialization
var selectedFile = "./resources/wave.bvh";
document.getElementById('bvh-selector').addEventListener('change', function(event) {
    selectedFile = event.target.value;
});

console.log(selectedFile);

const clock = new THREE.Clock();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set( 0, 200, 300 );



const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );
controls.minDistance = 300;
controls.maxDistance = 700;

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

let mixer, figure, figure_skeleton, motion_clip, duration, example;

// Load BVH file //

const loader = new BVHLoader();
loader.load(selectedFile, function(result) {
    const skeletonHelper = new THREE.SkeletonHelper( result.skeleton.bones[ 0 ] );

    example = new THREE.Object3D();
    example.add(result.skeleton.bones[0]);
    example.add(skeletonHelper);
    example.position.y = 50;
    example.position.x = 100;
    scene.add( example);

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

document.getElementById('bvh-selector').addEventListener('change', function(event) {
    selectedFile = event.target.value;
    scene.remove(figure);
    loader.load(selectedFile, function(result) {
        figure_skeleton = new MySkeleton(result.skeleton);
        motion_clip = new MotionClip(result.clip);
        duration = result.clip.duration;
        const root = figure_skeleton.generateFigure();
        figure = new THREE.Object3D();
        figure.add(root);
        figure.position.y = 100;
        scene.add(figure);

        scene.remove(example);
        example = new THREE.Object3D();
        example.add(result.skeleton.bones[0]);
        const skeletonHelper = new THREE.SkeletonHelper( result.skeleton.bones[ 0 ] );
        example.add(skeletonHelper);
        example.position.y = 50;
        example.position.x = 100;
        scene.add( example);
    });

    
})


//// Animation ////
let playback_rate = 1.0;
window.setRate = setRate;
function setRate() {
    playback_rate = parseFloat(document.getElementById('playBackSet').value);
    if (!isNaN(playback_rate)) {
      motion_clip.playbackRate = playback_rate;
    }
}
document.getElementById('button').addEventListener('click', setRate);

window.setPause = setPause;
function setPause() {
    clock.stop();
}
document.getElementById('pause_button').addEventListener('click', setPause);

window.setPlay = setPlay;
function setPlay() {
    clock.start();
}
document.getElementById('play_button').addEventListener('click', setPlay);

// Animation loop
function animate() {
	requestAnimationFrame( animate );

    
    var elasped = clock.getElapsedTime();
    elasped = elasped * playback_rate;
    var playtime = 0.0;
    if (elasped > duration){
        playtime = elasped % duration;
    }
    else{
        playtime = elasped;
    }
    // if ( mixer ) mixer.update( delta );

    const update_values = motion_clip.getUpdate(playtime);
    figure_skeleton.updateSkeleton(update_values);

	renderer.render( scene, camera );
}