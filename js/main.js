(function() {
  /// Note to self:
  /// THREE JS exporter settings for hair and eyes:
  /// Uncheck apply modifiers, Uncheck Face Materials and Skinning, Uncheck Textures
  /// For body:
  /// Check Blend Shapes, still haven't figured out the best way to do textures but normal maps we can also apply manually so ~_~

  var models = {
    prof: {
      base: 'models/prof/',
      texturePrefix: 'business_prof_',
      facePosition: [0, -248, 420],
      eyePosition: [0, 0, 0],
      hairPosition: [0, 0, 0]
    },
    stefani: {
      base: 'models/Stefani/',
      texturePrefix: 'Stefani_',
      facePosition: [0, -460, 360],
      noHair: true,
      eyePosition: [0.74, -0.42, 2.52],
      hairPosition: [0.64, 0, 3]
    },
    beanie: {
      base: 'models/Beanie/',
      texturePrefix: 'beanie_woman_',
      facePosition: [0, -225, 420],
      eyePosition: [0, 0, 0.75],
      hairPosition: [0, 0, 1]
    },
    douglas: {
      base: 'models/Douglas/',
      texturePrefix: 'Douglas_',
      facePosition: [0, -250, 420],
      eyePosition: [-0.3, -0.3, -7],
      noHair: true
    },
    jacket: {
      base: 'models/Jacket/',
      texturePrefix: 'jacket_',
      facePosition: [0, -218, 420],
      eyePosition: [0, 0, 1.25],
      hairPosition: [0, 1, 0]
    }
  };
  var textures = {
    hair: 'Hair_Diffuse.png',
    body: 'Body_Diffuse.png',
    hairNormal: 'Hair_Normal.png',
    bodyNormal: 'Body_Normal.png'
  };
  var modelNames = ['prof', 'stefani', 'beanie', 'douglas', 'jacket'];
  var modelName = modelNames[Math.floor(Math.random() * modelNames.length)];
  var model = models[modelName];

  var camera, scene, renderer;

  var face;
  var modelsBase = 'models/Stefani/';
  var modelsPrefix = 'Stefani_'
  var loadHair = true;
  var loadEyes = true;

  var lastGlitchTo = {};
  var lastGlitchTime = null;
  var lastGlitchTween = null;
  var glitchBooster = 0.25;

  var isWebGL = true;
  var canRotate = true;
  var mouseX = 0, mouseY = 0;
  var windowHalfX = window.innerWidth / 2, windowHalfY = window.innerHeight / 2;

  var loadingIndicator = document.querySelector('.loading-indicator');
  loadingIndicator._degrees = 0;
  setTimeout(rotateLoadingIndicator, 1);
  loadingIndicator._interval = setInterval(rotateLoadingIndicator, 3000);
  function rotateLoadingIndicator() {
    loadingIndicator._degrees += 360;
    loadingIndicator.style.transform = loadingIndicator.style.webkitTransform = loadingIndicator.style.mozTransform = 'rotate(' + loadingIndicator._degrees + 'deg)';
  }
  function stopLoading(delay) {
    clearInterval(loadingIndicator._interval);

    setTimeout(function() {
      loadingIndicator.classList.add('transparent');
    }, delay);
  }

  var audioMap = {
    click: makeAudio('media/click.mp3', 1),
    breath: makeAudio()
  };

  document.querySelector('.big-button').onclick = function() {
    glitchFace();

    playAudio(audioMap.click);

    audioMap.breath.src = randomBreathSrc();
    playAudio(audioMap.breath);
  };

  document.addEventListener('mousemove', onDocumentMouseMove, false);
  document.addEventListener('keypress', onDocumentKeypress, false);

  var freezeButton = document.querySelector('.freeze-instruction');
  freezeButton.onclick = toggleRotation;

  var saveButton = document.querySelector('.save-instruction');
  saveButton.onclick = makeScreenshot;

  setTimeout(function() {
    init();
    animate();
  }, 1);

  function glitchFace() {
    if (!face) return;
    if (lastGlitchTime && new Date() - lastGlitchTime <= 50) return;

    if (lastGlitchTween) {
      lastGlitchTween.stop();
      lastGlitchTween = null;
    }

    var duration = 400 + Math.random() * 4000;

    var lastGlitchResetTo = {};
    for (var key in lastGlitchTo) {
      lastGlitchResetTo[key] = 0.0;
    }
    tweenFace(lastGlitchResetTo, duration);

    var to = {};
    var number = Math.floor(Math.random() * 6) + 3;
    for (var i = 0; i < number; i++) {
      var idx = randomMorphIndex();
      while (lastGlitchTo[idx] !== undefined) {
        idx = randomMorphIndex();
      }

      to[idx] = Math.random() * glitchBooster + 1.0;
    }

    lastGlitchTween = tweenFace(to, duration, function() {
      lastGlitchTween = null;
    });

    lastGlitchTo = to;
    glitchBooster = Math.min(glitchBooster + 0.1, 4.69);
    lastGlitchTime = new Date();

    function tweenFace (to, duration, callback) {
      var easings = [
        TWEEN.Easing.Linear.None,
        TWEEN.Easing.Quadratic.In, TWEEN.Easing.Quadratic.Out, TWEEN.Easing.Quadratic.InOut,
        //TWEEN.Easing.Cubic.In, TWEEN.Easing.Cubic.Out, TWEEN.Easing.Cubic.InOut,
        //TWEEN.Easing.Exponential.In, TWEEN.Easing.Exponential.Out, TWEEN.Easing.Exponential.InOut
      ];
      var easing = easings[Math.floor(Math.random() * easings.length)];

      var tween = new TWEEN.Tween(face.morphTargetInfluences)
        .to(to, duration)
        .easing(easing);

      if (callback) {
        tween.onComplete(callback);
      }

      tween.start();

      return tween;
    }

    function randomMorphIndex () {
      return Math.floor(Math.random() * 101);
    }
  }

  function init () {
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 500;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 1, 15000);
    window.scene = scene;

    var point = new THREE.PointLight(0xffffff, 0.5);
    point.position.set(100, 0, 500);
    scene.add(point);

    var ambient = new THREE.AmbientLight(0xffffff);
    scene.add(ambient);

    var loader = new THREE.JSONLoader();
    loader.load(model.base + 'face.json', function (geometry, materials) {
      stopLoading(800);

      var bodyTexture = THREE.ImageUtils.loadTexture(model.base + model.texturePrefix + textures.body);
      var bodyNormal = THREE.ImageUtils.loadTexture(model.base + model.texturePrefix + textures.bodyNormal);

      materials[0].map = bodyTexture;

      if (!materials[0].normalMap) {
        materials[0].normalMap = bodyNormal;
      }

      materials.forEach(function(material) {
        material.morphTargets = true;

        new TWEEN.Tween(material).to({ opacity: 1 }, 1600).onComplete(function() { material.transparent = false; }).start();
      });

      var material = new THREE.MultiMaterial(materials);

      // This would center y rotation but at bad other costs (namely the morphs don't work lol)...
      // geometry.translate(0, -165.3, 0);
      face = new THREE.Mesh(geometry, material);
      face.scale.set(1.5, 1.5, 1.5);
      face.position.set(model.facePosition[0], model.facePosition[1], model.facePosition[2]);
      point.target = face;
      scene.add(face);

      if (loadHair && !model.noHair) {
        loader.load(model.base + 'hair.json', function (geometry) {
          var hairTexture = THREE.ImageUtils.loadTexture(model.base + model.texturePrefix + textures.hair);
          var hairNormal = THREE.ImageUtils.loadTexture(model.base + model.texturePrefix + textures.hairNormal);
          var material = new THREE.MeshPhongMaterial({ map: hairTexture, normalMap: hairNormal });

          // geometry.translate(0, -1.653, 0);
          var hair = new THREE.Mesh(geometry, material);
          hair.scale.set(100, 100, 100);
          hair.position.set(model.hairPosition[0], model.hairPosition[1], model.hairPosition[2]);
          face.add(hair);
        });
      }

      if (loadEyes) {
        loader.load(model.base + 'eyes.json', function (geometry) {
          var material = new THREE.MeshPhongMaterial({ map: bodyTexture, normalMap: bodyNormal });

          // geometry.translate(0, -1.653, 0);
          var eyes = new THREE.Mesh(geometry, material);
          eyes.scale.set(100, 100, 100);
          eyes.position.set(model.eyePosition[0], model.eyePosition[1], model.eyePosition[2]);
          face.add(eyes);
        });
      }
    });

    try {
      renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
    } catch (err) {
      isWebGL = false;
      renderer = new THREE.CanvasRenderer({});
    }

    renderer.setClearColor(0xfefefe);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.sortObjects = false;
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);
  }

  function onWindowResize () {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onDocumentMouseMove (event) {
    mouseX = ( event.clientX - windowHalfX );
    mouseY = ( event.clientY - windowHalfY ) * 2;
  }

  function onDocumentKeypress (event) {
    switch (event.keyCode) {
      case 115:
        makeScreenshot();
        break;

      case 102:
        toggleRotation();
        break;
    }
  }

  function makeScreenshot () {
    if (!renderer) return;
    var screenshot = renderer.domElement.toDataURL();
    window.open(screenshot, '_blank');
  }

  function toggleRotation () {
    canRotate = !canRotate;
    freezeButton.textContent = (canRotate ? 'Freeze me' : 'Unfreeze me') + ' ("f")';
  }

  function animate () {
    requestAnimationFrame(animate);
    render();
  }

  function render () {
    TWEEN.update();

    if (face && canRotate) {
      face.rotation.y = (mouseX / windowHalfX) * Math.PI * 0.1;
      camera.rotation.x = (mouseY / windowHalfY) * Math.PI * 0.003;
    }

    renderer.render(scene, camera);
  }

  function makeAudio (src, volume) {
    var audio = document.createElement('audio');
    audio.preload = true;
    audio.volume = volume !== undefined ? volume : 0.25;
    if (src) {
      audio.src = src;
    }
    return audio;
  }

  function playAudio (audio) {
    audio.currentTime = 0;
    audio.play();
  }

  function randomBreathSrc () {
    return 'media/breath' + (Math.floor(Math.random() * 15) + 1) + '.mp3';
  }
})();
