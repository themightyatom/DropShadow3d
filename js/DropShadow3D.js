

var DropShadow3D = (function () {


    var canvas = null;
    var ctx;
    var shadowTarget;
    var shadowMachineCreated = false
    var shadowCam;
    var shadowRenderer = null;
    var resolution = 256;
    var blurAmount = 4;
    var shadowAlpha = 1;
    var perimeter = 0.2;
    var _yjig = 0;
    var objectsToShadow = [];
    var creating = false;
    var blackMaterial = new THREE.MeshBasicMaterial({ color: 0xCCCCCC });




    return {
        addToShadowQueue: function (target, length, width) {
            var obj = { target: target, length: length, width: width };
            objectsToShadow.push(obj);
            // start generation when first or single item added
            if (objectsToShadow.length == 1) this.checkQueue();
        },
        checkQueue() {
            console.log("CHECKING QUEUE", objectsToShadow);
            if (!creating && objectsToShadow.length > 0) {
                var item = objectsToShadow.shift();
                DropShadow3D.makeShadow(item);
            }

        },
        createDropShadow: function (target, length, width) {
            this.addToShadowQueue(target, length, width);

        },
        makeShadow: function (item) {
            var target = item.target;
            var length = item.length;
            var width = item.width;

            creating = true;
            console.log("Creating Drop Shadow");
            // var targetParent = target.parent;

            var cloneObj = target.clone(true);
            // cloneObj.quaternion.setFromAxisAngle(YAXIS, 0);


            //make all materials black
            cloneObj.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.material = blackMaterial;
                }
            });


            //render camera from above
            var left = -(length + perimeter) / 2;
            var right = (length + perimeter) / 2;
            var top = (width + perimeter) / 2;
            var bottom = -(width + perimeter) / 2;
            shadowCam = new THREE.OrthographicCamera(left, right, top, bottom, 0, 10);

            shadowCam.position.x = target.position.x;
            shadowCam.position.z = target.position.z;
            shadowCam.position.y = 2;
            shadowCam.lookAt(target.position.x, 0, target.position.z);

            //Calculate ratio
            if (length >= width) {
                var resL = resolution;
                var resW = resolution * (width / length);
            } else {
                var resW = resolution;
                var resL = resolution * (length / width);
            }



            if (shadowRenderer == null) {

                shadowRenderer = new THREE.WebGLRenderer({ alpha: true });

                shadowRenderer.setPixelRatio(1);

                var shadContainer = document.getElementById("shadowDiv");
                shadowRenderer.domElement.id = "shad3d";
                shadContainer.appendChild(shadowRenderer.domElement);
                shadowScene = new THREE.Scene();
                // shadowScene.background = new THREE.Color(0xFFFFFF);
                shadowScene.background = new THREE.Color(0xFFFFFF);;
            }
            shadowRenderer.setSize(resL, resW);

            //Move target to shadowScene for rendering
            //shadowScene.add(target);
            shadowScene.add(cloneObj);

            // shadowScene.add(shadowCam);

            const renderTarget = new THREE.WebGLRenderTarget(resolution, resolution);
            shadowRenderer.setRenderTarget(renderTarget);
            shadowRenderer.preserveDrawingBuffer = true;
            shadowRenderer.render(shadowScene, shadowCam);
            shadowRenderer.setRenderTarget(null);

            var superLongURI = shadowRenderer.domElement.toDataURL("image/png");
            //ImageSaver.download_data_uri(superLongURI, 'filename');

            shadowRenderer.preserveDrawingBuffer = false;


            //take screenshot to canvas
            if (canvas == null) {
                canvas = document.createElement("canvas");
                $('#shadowDiv').append(canvas);
                canvas.id = "shadowCanvas";
                ctx = canvas.getContext("2d");
            }

            $('#previewImg').attr('src', superLongURI);
            canvas.width = resL;
            canvas.height = resW;
            //var img = document.getElementById("previewImg");
            var ctx = canvas.getContext("2d");
            var imgObj = new Image;
            var scope = this;
            imgObj.onload = function () {
                ctx.clearRect(0, 0, resolution, resolution);
                //ctx.drawImage(img, 0, 0); // Or at whatever offset you like
                ctx.filter = 'blur(' + blurAmount + 'px)';
                ctx.drawImage(imgObj, 0, 0, resL, resW);
                // stackBlurCanvasRGBA('shadowCanvas', 0, 0, resolution, resolution, 16);


                var targetCanvas = document.getElementById('shadowCanvas');
                var texture = new THREE.Texture(targetCanvas);
                texture.needsUpdate = true;
                //var mat = new THREE.MeshBasicMaterial({ map: texture, color: 0xFFFFFF, transparent: true, opacity: shadowAlpha });
                //mat.blending = THREE.MultiplyBlending;

                var mat = new THREE.MeshBasicMaterial({ map: texture, color: 0xFFFFFF, transparent: true, opacity: shadowAlpha });
                mat.blending = THREE.MultiplyBlending;

                //mat = new THREE.MeshBasicMaterial();

                console.log("MATERIAL", mat);
                // mat.needsUpdate = true;
                var shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(length + perimeter, width + perimeter), mat);


                shadowPlane.rotation.x = -(Math.PI / 2);

                //add to target

                //add extra layer to accomodate objects with gravity, that compare parent.parent id
                var shadow = new THREE.Object3D();
                shadow.name = "shadow";

                target.parent.add(shadow);
                //scene.add(shadow);
                shadow.add(shadowPlane);
                shadow.position.y = _yjig;
                console.log("YJIG", _yjig);
                _yjig += 0.0001;
                if (_yjig > 0.002) _yjig = 0;

                // WHEN IN USE FOR SEVERAL MODELS, REMOVE THE OLD MODEL EACH TIME! 
                //shadowScene.remove(cloneObj); //Omitted for demo purposes
                shadowRenderer.render(shadowScene, shadowCam);
                creating = false;
                scope.delayCreation();
                console.log("GENERATED SHADOW", shadowPlane);

            };
            imgObj.src = superLongURI;
        },
        delayCreation: function () {
            setTimeout(DropShadow3D.checkQueue, 200);

        }


    }
})();