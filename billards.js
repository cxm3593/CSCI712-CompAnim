import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Physics Parameters:
const friction_coefficient = 0.3;
const g = 9.8;

// Initiate Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initiate Scene, Clock, Camera
const scene = new THREE.Scene();

const clock = new THREE.Clock();
clock.stop();
let elasped = 0.0;

const camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set( 0, 200, 300 );
const controls = new OrbitControls( camera, renderer.domElement );
controls.minDistance = 300;
controls.maxDistance = 700;

// Add ground plane
const plane_geo = new THREE.PlaneGeometry(280, 140);
const plane_color = new THREE.Color();
plane_color.setRGB(0.3, 0.6, 0.3);
const plane_mat = new THREE.MeshBasicMaterial({color: plane_color});
const plane = new THREE.Mesh(plane_geo, plane_mat);
plane.rotation.x = THREE.MathUtils.degToRad(-90);
plane.position.y = 0;
scene.add(plane);

// Add cusion
const wall_w_geo = new THREE.BoxGeometry(280, 20, 10);
const wall_color = new THREE.Color();
wall_color.setRGB(0.6, 0.3, 0.3);
const wall_mat = new THREE.MeshBasicMaterial({color: wall_color});
const wall_w1 = new THREE.Mesh(wall_w_geo, wall_mat);
wall_w1.position.z = -70;
wall_w1.position.y = 10;
scene.add(wall_w1);
const wall_w2 = new THREE.Mesh(wall_w_geo, wall_mat);
wall_w2.position.z = 70;
wall_w2.position.y = 10;
scene.add(wall_w2);

const wall_d_geo = new THREE.BoxGeometry(10, 20, 140);
const wall_d1 = new THREE.Mesh(wall_d_geo, wall_mat);
wall_d1.position.y = 10;
wall_d1.position.x = 140;
scene.add(wall_d1);
const wall_d2 = new THREE.Mesh(wall_d_geo, wall_mat);
wall_d2.position.y = 10;
wall_d2.position.x = -140;
scene.add(wall_d2);

// Button
window.setPlay = setPlay;
function setPlay() {
    clock.start();
}
document.getElementById('play_button').addEventListener('click', setPlay);

// Classes
class Ball{
    constructor(ball_object, name){
        this.name = name;
        this.ball = ball_object;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.mass = 5;
        this.radius = 4;
        this.hasCollided = false;
    }

    setVelocity(new_velocity){
        this.velocity = new_velocity;
    }

    ballCollisionDetection(test_ball){
        const ball1 = this.ball;
        const ball2 = test_ball.ball;

        let distance = ball1.position.distanceTo(ball2.position);
        let sumOfRadii = this.radius + test_ball.radius;


        if (distance <= sumOfRadii && (this.hasCollided == false || test_ball.hasCollided == false)) {
            console.log("Collision detected", elasped, this.name, test_ball.name);
            

            // Collision detected
            let normal = new THREE.Vector3().subVectors(ball2.position, ball1.position).normalize();

            // Position correction to avoid getting into each other:
            this.hasCollided = true;
            test_ball.hasCollided = true;

            let overlap = (this.radius + test_ball.radius) - this.ball.position.distanceTo(test_ball.ball.position);
            let correction = normal.clone().multiplyScalar(overlap / 2);

            this.ball.position.sub(correction);
            test_ball.ball.position.add(correction);
            
            
            let v1 = this.velocity.clone();
            let v2 = test_ball.velocity.clone();

            let relativeVelocity = new THREE.Vector3().subVectors(v2, v1);
            let velocityAlongNormal = relativeVelocity.dot(normal);

            // Calculate impulse scalar
            let j_scalar =  (velocityAlongNormal * this.mass) / 2;

            // Calculate impulse vector
            let j = normal.clone().multiplyScalar(j_scalar);

            const newMomentum = this.velocity.clone().multiplyScalar(this.mass).add(j);
            let v1_new = newMomentum.divideScalar(this.mass);

            const newMomentumBall2 = test_ball.velocity.clone().multiplyScalar(test_ball.mass).sub(j);
            let v2_new = newMomentumBall2.divideScalar(test_ball.mass);

            // Update velocities
            this.velocity = v1_new;
            test_ball.velocity = v2_new;
        }
    }

    update(delta_time){
        // Apply friction
        if (this.velocity.length() >= 0.0001){
            const frictionForceMagnitude = friction_coefficient * this.mass * g;
            const frictionForce = this.velocity.clone().normalize().multiplyScalar(-frictionForceMagnitude);

            const momentumChange = frictionForce.multiplyScalar(delta_time);
            const newMomentum = this.velocity.clone().multiplyScalar(this.mass).add(momentumChange);
            this.velocity.copy(newMomentum.divideScalar(this.mass));
        }
        
        const displacement = this.velocity.clone().multiplyScalar(delta_time);
        const new_position = this.ball.position.clone().add(displacement);

        this.ball.position.copy(new_position);

        const radius = 8;
        // Detection Collision:
        for (let i = 0; i < balls.length; i++){
            var test_ball = balls[i];
            if (test_ball.name == this.name) {
                continue;
            }
            else{
                this.ballCollisionDetection(test_ball);
            }
        }


        // Wall Collision Detection
        if (this.ball.position.x - radius <= -140 || this.ball.position.x + radius >= 140) {
            // Collision with left or right wall
            this.velocity.x *= -1; // Invert velocity in x-direction
        }
        if (this.ball.position.z - radius <= -70 || this.ball.position.z + radius >= 70) {
            // Collision with top or bottom wall
            this.velocity.z *= -1; // Invert velocity in z-direction
        }

    }

}

// Add ball
const Ball_geo = new THREE.SphereGeometry(4);
const cue_color = new THREE.Color();
cue_color.setRGB(0.9, 0.9, 0.9);
const cue_mat = new THREE.MeshBasicMaterial({color: cue_color});
const cue_ball = new THREE.Mesh(Ball_geo, cue_mat);
cue_ball.position.y = 4;
scene.add(cue_ball);
const cue_ball_object = new Ball(cue_ball, "Cue");
cue_ball_object.setVelocity(new THREE.Vector3(100, 0, 75));

const redBall_color = new THREE.Color();
redBall_color.setRGB(0.9, 0.1, 0.1);
const redBall_mat = new THREE.MeshBasicMaterial({color: redBall_color});
const red_ball = new THREE.Mesh(Ball_geo, redBall_mat);
red_ball.position.copy(new THREE.Vector3(25, 4, 15));
scene.add(red_ball);
const red_ball_object = new Ball(red_ball, "Red");

const greenBall_color = new THREE.Color();
greenBall_color.setRGB(0.1, 0.9, 0.1);
const greenBall_mat = new THREE.MeshBasicMaterial({color: greenBall_color});
const green_ball = new THREE.Mesh(Ball_geo, greenBall_mat);
green_ball.position.copy(new THREE.Vector3(30, 4, 30));
scene.add(green_ball);
const green_ball_object = new Ball(green_ball, "Green");

let balls = [];
balls.push(cue_ball_object);
balls.push(red_ball_object);
balls.push(green_ball_object);


// Animation Loop
function animate() {
	requestAnimationFrame( animate );
    var delta_time = clock.getDelta();
    elasped = clock.getElapsedTime();

    for (let i = 0; i < balls.length; i++){
        var the_ball = balls[i];
        the_ball.update(delta_time);
    }

    for (let i = 0; i < balls.length; i++){
        var the_ball = balls[i];
        the_ball.hasCollided = false;
    }

    renderer.render( scene, camera );
}

animate();