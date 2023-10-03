import * as THREE from 'three';

const clock = new THREE.Clock();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry( 5, 5, 5 );
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
cube.position.set(0, 0, 0)
camera.position.z = 50;
const duration = 10.0;

// Load inputs:
let input_lines, animArray;
await fetch('keyframe-input.txt')
  .then(response => response.text())
  .then(data => {
    input_lines = data.split('\n');
    animArray = input_lines.map(line => {
        const [time, x, y, z, xa, ya, za, angle] = line.split(' ');
        return {
            time: parseFloat(time),
            x: parseFloat(x),
            y: parseFloat(y),
            z: parseFloat(z),
            xa: parseFloat(xa),
            ya: parseFloat(ya),
            za: parseFloat(za),
            angle: parseFloat(angle)
        };
    });
    console.log(animArray[0]["time"])
  })
  .catch(error => {
    console.error('Error fetching the file:', error);
  });

console.log(animArray);

//// Animation ////
let dataIndexStart, dataIndexEnd;
dataIndexStart = 0;
dataIndexEnd = 1;
clock.start()
console.log(cube.position)

function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

// Check if the interpolation indexes are valid
function checkDataForInterpolation(elapsed_time) {
    if(elapsed_time >= animArray[dataIndexEnd]["time"]){
        dataIndexStart += 1;
        dataIndexEnd += 1;
        checkDataForInterpolation(elapsed_time); // Make sure it still runs with a gap.
    }
}

function customSlerp(q0, q1, t) {
    // Compute the cosine of the angle between the two vectors.
    let cosHalfTheta = q0.dot(q1);

    // If cos(theta) < 0, q1 and q0 are more than 90 degrees apart,
    // so we can invert one to reduce spinning.
    if (cosHalfTheta < 0) {
        q1.negate();
        cosHalfTheta = -cosHalfTheta;
    }

    // If the quaternions are very close, just interpolate linearly
    if (cosHalfTheta >= 1.0 - Number.EPSILON) {
        const result = new THREE.Quaternion(
            q0.x + t * (q1.x - q0.x),
            q0.y + t * (q1.y - q0.y),
            q0.z + t * (q1.z - q0.z),
            q0.w + t * (q1.w - q0.w)
        );
        return result.normalize();
    }

    // Step 3: Compute the actual slerp factors
    const halfTheta = Math.acos(cosHalfTheta);
    const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

    const aFactor = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
    const bFactor = Math.sin(t * halfTheta) / sinHalfTheta;

    // Step 4: Compute the quaternion result
    const qResult = new THREE.Quaternion(
        aFactor * q0.x + bFactor * q1.x,
        aFactor * q0.y + bFactor * q1.y,
        aFactor * q0.z + bFactor * q1.z,
        aFactor * q0.w + bFactor * q1.w
    );

    return qResult.normalize();
}

function intepolateAnimData(elapsed_time) {
    const data_start = animArray[dataIndexStart]
    const data_end = animArray[dataIndexEnd]
    const pos0 = new THREE.Vector3( data_start["x"], data_start["y"], data_start["z"] );
    const pos1 = new THREE.Vector3( data_end["x"], data_end["y"], data_end["z"] );
    const rot0 = new THREE.Quaternion();
    rot0.setFromAxisAngle(new THREE.Vector3(data_start["xa"], data_start["ya"], data_start["za"]), THREE.MathUtils.degToRad(data_start["angle"]));
    const rot1 = new THREE.Quaternion();
    rot1.setFromAxisAngle(new THREE.Vector3(data_end["xa"], data_end["ya"], data_end["za"]), THREE.MathUtils.degToRad(data_end["angle"]));

    const t = (elapsed_time - data_start["time"]) / (data_end["time"] - data_start["time"])
    
    const interpolated_pos = new THREE.Vector3();
    interpolated_pos.lerpVectors(pos0, pos1, t);

    //const interpolated_rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(data_start["xa"], data_start["ya"], data_start["za"]), THREE.MathUtils.degToRad(data_start["angle"]));
    const interpolated_rot = customSlerp(rot0, rot1, t);
    console.log(elapsed_time, t);
    console.log("Before: ", interpolated_rot);
    interpolated_rot.slerp(rot1, t).normalize();
    console.log("After: ", interpolated_rot);
    
    console.log(data_start["xa"], data_start["ya"], data_start["za"], THREE.MathUtils.degToRad(data_start["angle"]));
    console.log(data_end["xa"], data_end["ya"], data_end["za"], THREE.MathUtils.degToRad(data_end["angle"]));
    console.log(interpolated_rot);

    return [interpolated_pos, interpolated_rot]
}

// Listen for keydown event
document.addEventListener('keydown', function(event) {
    // Check if the pressed key is 'Space'
    if (event.code === 'Space') {
        // Toggle the clock's running state
        clock.running = !clock.running;
    }
});

function animate() {
	requestAnimationFrame( animate );

    const delta_time = clock.getDelta();
    const elapsed_time = clock.getElapsedTime();

    checkDataForInterpolation(elapsed_time);
    const [pos, rot] = intepolateAnimData(elapsed_time);

    //console.log(elapsed_time, cube.position, cube.quaternion);
    // console.log(dataIndexStart, dataIndexEnd, elapsed_time);
    if (elapsed_time <= duration){
        cube.position.copy(pos);
        cube.quaternion.copy(rot);
    }
    else{
        console.log(cube.position);
    }
    
	renderer.render( scene, camera );
}

animate();