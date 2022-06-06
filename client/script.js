const canvas = document.createElement("canvas");
document.body.appendChild(canvas);


var engine = new BABYLON.Engine(canvas);
var scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color3(0.8, 0.8, 0.8);
var camera = new BABYLON.ArcRotateCamera("camera", 0, Math.PI * .25, 15, new BABYLON.Vector3(0, 0, 0), scene);
camera.attachControl(canvas, true);
var light = new BABYLON.PointLight("light", new BABYLON.Vector3(10, 10, 0), scene);
light.intensity = .5;
var floor = BABYLON.Mesh.CreatePlane("plane", 40, scene);
floor.rotation.x = Math.PI * .5;
var floorMaterial = new BABYLON.StandardMaterial("material", scene);
floorMaterial.emissiveColor = new BABYLON.Color3(.62, 0.38, 0.16);
floor.material = floorMaterial;

var host = new BABYLON.Mesh("host", scene);

BABYLON.SceneLoader.ImportMeshAsync("", "/character/Model/", "characterMedium.obj").then((result) => {
    var character = result.meshes[0];
    character.parent = host;
    character.scaling = new BABYLON.Vector3(.01,.01,.01);
    character.rotation.y = -Math.PI * .5;

    var characterMat = new BABYLON.StandardMaterial("charMat", scene);
    characterMat.emissiveTexture = new BABYLON.Texture("/character/Skins/survivorFemaleA.png", scene);
    character.material = characterMat;
});

window.addEventListener("resize", function(){
    engine.resize();
});


//Player variables
var speed = .15;


// Keyboard events
var inputMap ={};
scene.actionManager = new BABYLON.ActionManager(scene);
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {								
    inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
}));
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {								
    inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
}));

var renderLoop = function () {
    camera.setTarget(host.position);
    scene.render();
    var moved = false;

    var forward = camera.getTarget().subtract(camera.position);
    forward.y = 0;
    forward.normalize();

    if(inputMap["w"]){
        host.position.x += forward.x * speed;
        host.position.z += forward.z * speed;
        moved = true;
    }
    if(inputMap["s"]){
        host.position.x -= forward.x * speed;
        host.position.z -= forward.z * speed;
        moved = true;
    }
    if(inputMap["a"]){
        host.position.x -= forward.z * speed;
        host.position.z += forward.x * speed;
        moved = true;
    }
    if(inputMap["d"]){
        host.position.x += forward.z * speed;
        host.position.z -= forward.x * speed;
        moved = true;
    }
    if(moved){
        var targetRotation = Math.atan2(forward.x, forward.z) + Math.PI * .5;
        host.rotation.y = lerp(host.rotation.y,targetRotation,.12);
        socket.emit('move', host.position);
    }
};
engine.runRenderLoop(renderLoop);

//Netcode!

var activePlayers = [];

const socket = io('/'); // Create our socket
socket.emit('join-room', host.position);
socket.on('user-connected', (userId, pos) => { // If a new user connect
    console.log("New user " + userId + ", joined");
    var player = BABYLON.Mesh.CreateBox("box", 2, scene);
    player.position = pos;
    activePlayers.push({id:userId, object:player})
});

socket.on('move', (userId, position) => {
    activePlayers.find(p => p.id == userId).object.position = position;
});

socket.on('user-disconnected', userId => { // If a new user connect
    console.log("User " + userId + ", left");
    activePlayers.find(p => p.id = userId).object.dispose();
    activePlayers = activePlayers.filter(p => p.id != userId);
});



//Helpers!
function lerp(A, B, t) {
    return A + (B - A) * t;
}