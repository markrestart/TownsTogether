const canvas = document.createElement("canvas");
document.body.appendChild(canvas);


var engine = new BABYLON.Engine(canvas);
var scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color3(0.8, 0.8, 0.8);
var camera = new BABYLON.ArcRotateCamera("camera", 0, Math.PI * .25, 15, new BABYLON.Vector3(0, 0, 0), scene);
camera.attachControl(canvas, true);
var light = new BABYLON.PointLight("light", new BABYLON.Vector3(10, 10, 0), scene);
light.intensity = .5;

var box = BABYLON.Mesh.CreateBox("box", 2, scene);
var floor = BABYLON.Mesh.CreatePlane("plane", 40, scene);
floor.rotation.x = Math.PI * .5;
box.position.y = 1;

var boxMaterial = new BABYLON.StandardMaterial("material", scene);
boxMaterial.emissiveColor = new BABYLON.Color3(0, 0.58, 0.86);
var floorMaterial = new BABYLON.StandardMaterial("material2", scene);
floorMaterial.emissiveColor = new BABYLON.Color3(.62, 0.38, 0.16);
box.material = boxMaterial;
floor.material = floorMaterial;

//Player variables
var speed = .05;


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
    camera.setTarget(box.position);
    scene.render();
    var moved = false;

    if(inputMap["w"]){
        box.position.x -= speed;
        moved = true;
    }
    if(inputMap["s"]){
        box.position.x += speed;
        moved = true;
    }
    if(inputMap["a"]){
        box.position.z -= speed;
        moved = true;
    }
    if(inputMap["d"]){
        box.position.z += speed;
        moved = true;
    }
    if(moved){
        socket.emit('move', box.position);
    }
};
engine.runRenderLoop(renderLoop);

//Netcode!

var activePlayers = [];

const socket = io('/'); // Create our socket
socket.emit('join-room', box.position);
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