import * as THREE from 'three';

const clock = new THREE.Clock();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry( 10, 10, 10 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );

// Settings:
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialization
scene.add( cube );
cube.position.set(-75, -75, 0)
camera.position.z = 150;
const duration = 35.0;


// Animation
clock.start()
console.log(cube.position)

function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

function animate() {
	requestAnimationFrame( animate );

    const delta_time = clock.getDelta();
    const elapsed_time = clock.getElapsedTime();

    if (elapsed_time <= duration){

        cube.position.x += 5 * delta_time
        cube.position.y += 5 * delta_time
        cube.rotation.y += degToRad(18) * delta_time;
    }
    else{
        console.log(cube.position)
    }
    
	renderer.render( scene, camera );
}

animate();