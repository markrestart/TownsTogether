// #region Player class
class Player{
    constructor(name){

        this.speed = .15;

        this.transform = new BABYLON.Mesh(name, scene);

        this.model = null;
    }

    addModel = function(modelFile, textureFile) {
        BABYLON.SceneLoader.ImportMeshAsync("", "/character/Model/", modelFile).then((result) => {
            this.model = result.meshes[0];
            this.model.parent = this.transform;
            this.model.scaling = new BABYLON.Vector3(.01,.01,.01);

            var characterMat = new BABYLON.StandardMaterial("charMat", scene);
            characterMat.emissiveTexture = new BABYLON.Texture("/character/Skins/" + textureFile, scene);
            this.model.material = characterMat;
        });
    }

    move = function(v){
        //Normalize input to ensure player object controls speed
        v.normalize();

        //Apply movement
        this.transform.position.x += v.x * this.speed;
        this.transform.position.y += v.y * this.speed;
        this.transform.position.z += v.z * this.speed;

        //Rotate towards the direction of movement
        var targetRotation = Math.atan2(v.x, v.z);
        this.transform.rotation.y = lerp(this.transform.rotation.y,targetRotation,.12);
    }

    remove = function(){
        this.transform.dispose();
    }
}
// #endregion

// #region BABYLON init
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

var engine = new BABYLON.Engine(canvas);
var scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color3(0.8, 0.8, 0.8);
var camera = new BABYLON.ArcRotateCamera("camera", 0, Math.PI * .25, 15, new BABYLON.Vector3(0, 0, 0), scene);
camera.attachControl(canvas, true);
var light = new BABYLON.PointLight("light", new BABYLON.Vector3(10, 10, 0), scene);
light.intensity = .1;
var floor = BABYLON.Mesh.CreatePlane("plane", 40, scene);
floor.rotation.x = Math.PI * .5;
var floorMaterial = new BABYLON.StandardMaterial("material", scene);
floorMaterial.emissiveColor = new BABYLON.Color3(.62, 0.38, 0.16);
floor.material = floorMaterial;

var host = new Player("host");
host.addModel("characterMedium.obj","survivorFemaleA.png");

window.addEventListener("resize", function(){
    engine.resize();
});
// #endregion

// #region Keyboard events
var inputMap ={};
scene.actionManager = new BABYLON.ActionManager(scene);
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {								
    inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
}));
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {								
    inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
}));
// #endregion

// #region Render loop
var renderLoop = function () {
    camera.setTarget(host.transform.position);
    scene.render();

    var forward = camera.getTarget().subtract(camera.position);
    forward.y = 0;
    forward.normalize();
    var move = BABYLON.Vector3.Zero();

    if(inputMap["w"]){
        move.x += forward.x;
        move.z += forward.z
    }
    if(inputMap["s"]){
        move.x -= forward.x;
        move.z -= forward.z
    }
    if(inputMap["a"]){
        move.x -= forward.z;
        move.z += forward.x
    }
    if(inputMap["d"]){
        move.x += forward.z;
        move.z -= forward.x
    }
    if(move.length() > 0){
        host.move(move);
        socket.emit('move', host.transform.position, host.transform.rotation.y);
    }
};
engine.runRenderLoop(renderLoop);
// #endregion

// #region Netcode!

var activePlayers = [];

const socket = io('/'); // Create our socket
socket.emit('join-room', host.transform.position, host.transform.rotation);
socket.on('user-connected', (userId, pos, rot) => { // If a new user connect
    var player = new Player(userId);
    player.addModel("characterMedium.obj", "zombieC.png");
    player.transform.position = pos;
    player.transform.rotation.y = rot;
    activePlayers.push({id:userId, object:player});
    console.log("New user " + userId + ", joined");
});

socket.on('move', (userId, position, rotation) => {
    var player = activePlayers.find(p => p.id == userId).object;
    player.transform.position = position;
    player.transform.rotation.y = rotation;
    console.log(rotation);
    console.log(player.transform.rotation);
});

socket.on('user-disconnected', userId => { // If a new user connect
    console.log("User " + userId + ", left");
    activePlayers.find(p => p.id = userId).object.remove();
    activePlayers = activePlayers.filter(p => p.id != userId);
});
// #endregion

// #region Helpers!
function lerp(A, B, t) {
    return A + (B - A) * t;
}
// #endregion