// #region Player class
class Player{
    constructor(name){

        this.speed = .05;

        this.transform = new BABYLON.Mesh(name, scene);

        this.model = null;
    }

    addModel = function(modelFile, textureFile) {
        BABYLON.SceneLoader.ImportMeshAsync("", "/character/Model/", modelFile).then((result) => {
            this.model = result.meshes[1];
            this.model.parent = this.transform;

            //var characterMat = new BABYLON.StandardMaterial("charMat", scene);
            //characterMat.diffuseTexture = new BABYLON.Texture("/character/Skins/" + textureFile, scene);
            //this.model.material = characterMat;

            this.model.material = scene.getMaterialByName("skin"+textureFile);

            this.idleAnim = scene.getAnimationGroupByName("idle");
            this.walkAnim = scene.getAnimationGroupByName("walk");
        });
    }

    move = function(v){
        //Normalize input to ensure player object controls speed
        v.normalize();

        //Apply movement
        if(this.transform.position.x + v.x * this.speed > -floor.size/2 +1 && this.transform.position.x + v.x * this.speed < floor.size/2 -1){
            this.transform.position.x += v.x * this.speed;
        }

        if(this.transform.position.z + v.z * this.speed > -floor.size/2 +1 && this.transform.position.z + v.z * this.speed < floor.size/2 -1){
            this.transform.position.z += v.z * this.speed;
        }

        //Rotate towards the direction of movement
        var targetRotation = Math.atan2(v.x, v.z);
        if(targetRotation - this.transform.rotation.y >= Math.PI){
            targetRotation -= 2 * Math.PI;
        }
        if(this.transform.rotation.y - targetRotation >= Math.PI){
            targetRotation += 2 * Math.PI;
        }
        this.transform.rotation.y = lerp(this.transform.rotation.y,targetRotation,.12);
        while(this.transform.rotation.y < 0){this.transform.rotation.y += 2 * Math.PI;}
        while(this.transform.rotation.y > 2* Math.PI){this.transform.rotation.y -= 2 * Math.PI;}

        this.idleAnim.stop();
        this.walkAnim.play(true);
    }

    remove = function(){
        this.transform.dispose();
    }
}
// #endregion

// #region Floor class
class Floor{
    constructor(size){
        this.size = size;
        this.mesh = BABYLON.Mesh.CreatePlane("plane", size, scene);
        this.mesh.rotation.x = Math.PI * .5;
        var floorMaterial = new BABYLON.StandardMaterial("material", scene);
        floorMaterial.diffuseColor = new BABYLON.Color3(.62, 0.38, 0.16);
        this.mesh.material = floorMaterial;
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
camera.lowerRadiusLimit = 4;
camera.upperRadiusLimit = 50;
camera.upperBetaLimit = Math.PI/2;
camera.inputs.attached.pointers.buttons =[0,1];
var light = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 1, 0), scene);
light.intensity = .8;
var floor = new Floor(40);

// Enable animation blending for all animations
scene.animationPropertiesOverride = new BABYLON.AnimationPropertiesOverride();
scene.animationPropertiesOverride.enableBlending = true;
scene.animationPropertiesOverride.blendingSpeed = 0.08;
scene.animationPropertiesOverride.loopMode = 1;

var host = new Player("host");
host.addModel("Character2.glb","01");

window.addEventListener("resize", function(){
    engine.resize();
});
// #endregion

// #region GUI setup
var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
var rect1 = new BABYLON.GUI.Rectangle();
rect1.height = "80%";
rect1.width = "80%;"
rect1.cornerRadius = 20;
rect1.color = "Orange";
rect1.thickness = 10;
rect1.background = "green";
advancedTexture.addControl(rect1);

var text1 = new BABYLON.GUI.TextBlock();
text1.text = "Welcome to Towns Together";
text1.color = "white";
text1.fontSize = 48;
text1.top = "-40%";
text1.textWrapping = true;
rect1.addControl(text1);

var text2 = new BABYLON.GUI.TextBlock();
text2.text = "Towns Together is an online social space. It is currently in development with big plans for the future.\n\nControls:\nClick and drag with the mouse to move your view. Use WASD to move around.\n\nCurrent version: Pre First Look";
text2.color = "white";
text2.fontSize = 16;
text2.textWrapping = true;
rect1.addControl(text2);

var button = BABYLON.GUI.Button.CreateSimpleButton("close", "X");
button.height = "40px";
button.width = "40px;"
button.color = "white";
button.background = "red";
button.cornerRadius = 15;
button.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
button.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
button.top = 20;
button.left = -20;
rect1.addControl(button);  

var button2 = BABYLON.GUI.Button.CreateSimpleButton("open", "?");
button2.height = "30px";
button2.width = "30px;"
button2.color = "white";
button2.background = "green";
button2.cornerRadius = 15;
button2.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
button2.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
button2.top = 20;
button2.left = -20; 

button.onPointerUpObservable.add(function(){
    advancedTexture.removeControl(rect1);
    advancedTexture.addControl(button2);
});
button2.onPointerUpObservable.add(function(){
    advancedTexture.addControl(rect1);
    advancedTexture.removeControl(button2);
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
    camera.setTarget(host.transform.position.add(BABYLON.Vector3.Up().multiplyByFloats(0,3,0)));
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
    }else if(host.idleAnim){
        host.walkAnim.stop();
        host.idleAnim.play(true);
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
    player.addModel("Character2.glb","01");
    player.transform.position = pos;
    player.transform.rotation.y = rot;
    activePlayers.push({id:userId, object:player});
    console.log("New user " + userId + ", joined");
});

socket.on('move', (userId, position, rotation) => {
    var player = activePlayers.find(p => p.id == userId).object;
    player.transform.position = position;
    player.transform.rotation.y = rotation;
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