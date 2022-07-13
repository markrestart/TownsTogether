// #region Player class
class Player{
    constructor(id, name){

        this.speed = .05;

        this.transform = new BABYLON.Mesh(id, scene);

        this.model = null;

        this.isNetwork = false;
        this.lastMove = 0;

        this.rect1 = new BABYLON.GUI.Rectangle();
        this.rect1.width = "300px";
        this.rect1.height = "40px";
        this.rect1.cornerRadius = 20;
        this.rect1.color = "Orange";
        this.rect1.thickness = 4;
        this.rect1.background = "green";
        advancedTexture.addControl(this.rect1);
        this.rect1.linkWithMesh(this.transform);   
        this.rect1.linkOffsetY = -200;

        this.label = new BABYLON.GUI.TextBlock();
        this.label.text = name == "" || name == undefined ? id : name;
        this.rect1.addControl(this.label);

        if(isMenuOpen){
            advancedTexture.removeControl(rect1);
            advancedTexture.addControl(rect1);

            advancedTexture.removeControl(rect2);
            advancedTexture.addControl(rect2);

            advancedTexture.removeControl(inputText);
            advancedTexture.addControl(inputText);
        }

        document.getElementById("welcome").play();
    }

    setName = function(name){
        this.label.text = name;
    }

    addModel = function(modelFile) {
        if(this.model){this.model.dispose();}

        if(modelFile == undefined || modelFile == ""){modelFile = "Character3.glb";}

        BABYLON.SceneLoader.ImportMeshAsync("", "/character/Model/", modelFile).then((result) => {
            this.model = result.meshes[1];
            this.model.parent = this.transform;

            this.idleAnim = result.animationGroups[0];
            this.walkAnim = result.animationGroups[1];
        });
    }

    move = function(v){
        //Normalize input to ensure player object controls speed
        v.normalize();

        v = floor.PlayerMove(this.transform.position, v.x, v.z);

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
        document.getElementById("goodbye").play();
        advancedTexture.removeControl(this.rect1);
        this.transform.dispose();
    }
}
// #endregion

//region Item class
class Item{
    constructor(v, modelFile){
        this.isInWorld = true;
        this.transform = new BABYLON.Mesh("item", scene);
        this.PlaceInWorld(v);

        if(modelFile == undefined || modelFile == ""){modelFile = "default.glb";}

        BABYLON.SceneLoader.ImportMeshAsync("", "/items/", modelFile).then((result) => {
            this.model = result.meshes[1];
            this.model.parent = this.transform;
            this.model.scaling = new BABYLON.Vector3(15,15,15);
        });
    }

    PlaceInWorld = function(v){
        this.transform.position.x = v.x;
        this.transform.position.z = v.z;
    }

    PickupByPlayer = function(player){

    }
}

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

    PlayerMove = function(startPos, xMove, zMove){
        var x = xMove;
        var z = zMove;

        const collisionDist = 1.8;

        worldItems.forEach(i => {
            let distX = startPos.x + xMove - i.transform.position._x;
            let distZ = startPos.z + zMove - i.transform.position._z;
            if(distX * distX + distZ * distZ <= collisionDist * collisionDist){
                let length = Math.sqrt(distX * distX + distZ * distZ) || 1;
                let unitX = distX/length;
                let unitZ = distZ/length;
                let endX = i.transform.position._x + collisionDist * unitX;
                let endZ = i.transform.position._z + collisionDist * unitZ;

                x = endX - startPos.x;
                z = endZ - startPos.z
            }
        });

        
        activePlayers.forEach(p => {
            let distX = startPos.x + xMove - p.object.transform.position._x;
            let distZ = startPos.z + zMove - p.object.transform.position._z;
            if(distX * distX + distZ * distZ <= collisionDist * collisionDist){
                let length = Math.sqrt(distX * distX + distZ * distZ) || 1;
                let unitX = distX/length;
                let unitZ = distZ/length;
                let endX = p.object.transform.position._x + collisionDist * unitX;
                let endZ = p.object.transform.position._z + collisionDist * unitZ;

                x = endX - startPos.x;
                z = endZ - startPos.z
            }
        });

        if(startPos.x + x <= -this.size/2){
            x -= x + startPos.x + x -this.size/2;
        }
        if(startPos.x + x >= this.size/2){
            x -= x - startPos.x - x +this.size/2;
        }

        if(startPos.z + z <= -this.size/2){
            z -= z + startPos.z + z -this.size/2;
        } 
        if(startPos.z + z >= this.size/2){
            z -= z - startPos.z - z +this.size/2;
        }

        return {'x':x, 'z':z};
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

window.addEventListener("resize", function(){
    engine.resize();
});
// #endregion

// #region GUI setup
var isMenuOpen = true;
var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
var rect1 = new BABYLON.GUI.Rectangle();
rect1.height = "50%";
rect1.width = "80%;"
rect1.cornerRadius = 20;
rect1.color = "Orange";
rect1.thickness = 10;
rect1.background = "green";
rect1.zindex = -10;
rect1.top = "15%";
advancedTexture.addControl(rect1);

var rect2 = new BABYLON.GUI.Rectangle();
rect2.height = "20%";
rect2.width = "80%;"
rect2.cornerRadius = 20;
rect2.color = "Orange";
rect2.thickness = 10;
rect2.background = "green";
rect2.zindex = -10;
rect2.top = "-25%";
advancedTexture.addControl(rect2);

var text1 = new BABYLON.GUI.TextBlock();
text1.text = "Welcome to Towns Together";
text1.color = "white";
text1.fontSize = 48;
text1.top = "-40%";
text1.textWrapping = true;
rect1.addControl(text1);

var inputText = new BABYLON.GUI.InputText("input", "Enter name here");
inputText.width = 0.3;
inputText.height = "50px";
inputText.onFocusSelectAll = true;
inputText.top = "-45%";
inputText.background = "orange";
inputText.focusedBackground = "yellow";
inputText.color = "blue";
inputText.onTextChangedObservable.add(function(){
    host.setName(inputText.text);
    socket.emit('set-name', inputText.text);
});
advancedTexture.addControl(inputText);

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

var skinButton1 = BABYLON.GUI.Button.CreateSimpleButton("sOne", "1");
var skinButton2 = BABYLON.GUI.Button.CreateSimpleButton("sTwo", "2");
var skinButton3 = BABYLON.GUI.Button.CreateSimpleButton("sThree", "3");
var skinButton4 = BABYLON.GUI.Button.CreateSimpleButton("sFour", "4");
skinButton1.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
skinButton2.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
skinButton3.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
skinButton4.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
skinButton1.color = "yellow";
skinButton2.color = "yellow";
skinButton3.color = "yellow";
skinButton4.color = "yellow";
skinButton1.background = "orange";
skinButton2.background = "orange";
skinButton3.background = "orange";
skinButton4.background = "orange";

skinButton1.width = "100px";
skinButton2.width = "100px";
skinButton3.width = "100px";
skinButton4.width = "100px";
skinButton1.height = "100px";
skinButton2.height = "100px";
skinButton3.height = "100px";
skinButton4.height = "100px";

skinButton1.top = 25;
skinButton2.top = 25;
skinButton3.top = 25;
skinButton4.top = 25;
skinButton1.left = -300;
skinButton2.left = -100;
skinButton3.left = 100;
skinButton4.left = 300;

rect2.addControl(skinButton1);
rect2.addControl(skinButton2);
rect2.addControl(skinButton3);
rect2.addControl(skinButton4);

skinButton1.onPointerUpObservable.add(function(){
    host.addModel("Character.glb");
    socket.emit('change-model', "Character.glb");
})
skinButton2.onPointerUpObservable.add(function(){
    host.addModel("Character1.glb");
    socket.emit('change-model', "Character1.glb");
})
skinButton3.onPointerUpObservable.add(function(){
    host.addModel("Character2.glb");
    socket.emit('change-model', "Character2.glb");
})
skinButton4.onPointerUpObservable.add(function(){
    host.addModel("Character3.glb");
    socket.emit('change-model', "Character3.glb");
})


button.onPointerUpObservable.add(function(){
    advancedTexture.removeControl(rect1);
    advancedTexture.removeControl(rect2);
    advancedTexture.removeControl(inputText);
    advancedTexture.addControl(button2);
    isMenuOpen = false;
});
button2.onPointerUpObservable.add(function(){
    advancedTexture.addControl(rect1);
    advancedTexture.addControl(rect2);
    advancedTexture.addControl(inputText);
    advancedTexture.removeControl(button2);
    isMenuOpen = true;
});
// #endregion

// #region local Player setup
    var host = new Player("host");
    host.addModel("Character3.glb");
// #endregion

// #region Keyboard events
var inputMap ={};
scene.actionManager = new BABYLON.ActionManager(scene);
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {								
    inputMap[evt.sourceEvent.key.toLowerCase()] = evt.sourceEvent.type == "keydown";
}));
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {								
    inputMap[evt.sourceEvent.key.toLowerCase()] = evt.sourceEvent.type == "keydown";
}));

window.addEventListener("focusout",function(){
    inputMap["w"] = false;
    inputMap["a"] = false;
    inputMap["s"] = false;
    inputMap["d"] = false;
});
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

    const d = new Date();
    activePlayers.forEach(p => {
        if(p.object.model){
            if(p.object.lastMove + 100 > d.getTime()){
                p.object.idleAnim.stop();
                p.object.walkAnim.play(true);
            }else{
                p.object.walkAnim.stop();
                p.object.idleAnim.play(true);
            }
        }
    });
};
engine.runRenderLoop(renderLoop);
// #endregion

// #region room data
var activePlayers = [];
var worldItems = [];
worldItems.push(new Item({x:9,z:5}));
// #endregion

// #region Netcode!
const socket = io('/'); // Create our socket
socket.emit('join-room', host.transform.position, host.transform.rotation);
socket.on('user-connected', (userId, pos, rot, name, modelName) => { // If a new user connect
    var player = new Player(userId, name);
    player.isNetwork = true;
    player.addModel(modelName);
    player.transform.position = pos;
    player.transform.rotation.y = rot;
    activePlayers.push({id:userId, object:player});
    console.log("New user " + userId + ", joined");
});

socket.on('move', (userId, position, rotation) => {
    var player = activePlayers.find(p => p.id == userId).object;
    player.transform.position = position;
    player.transform.rotation.y = rotation;
    const d = new Date();
    player.lastMove = d.getTime();
});

socket.on('set-name', (userId, newName) =>{
    var player = activePlayers.find(p => p.id == userId).object;
    player.setName(newName);
});

socket.on('change-model', (userId, newModel) =>{
    var player = activePlayers.find(p => p.id == userId).object;
    player.addModel(newModel);
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