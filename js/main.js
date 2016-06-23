(function() {
  /// Note to self:
  /// THREE JS exporter settings for hair and eyes:
  /// Uncheck apply modifiers, Uncheck Face Materials and Skinning, Uncheck Textures
  /// For body:
  /// Check Blend Shapes, still haven't figured out the best way to do textures but normal maps we can also apply manually so ~_~

  var camera, scene, renderer;

  var face;
  var modelsBase = 'models/prof/';
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

  init();
  animate();

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

    var point = new THREE.PointLight(0xffffff);
    point.position.set(100, 0, 500);
    scene.add(point);

    var ambient = new THREE.AmbientLight(0xffffff);
    scene.add(ambient);

    var loader = new THREE.JSONLoader();
    loader.load(modelsBase + 'face.json', function (geometry, materials) {
      var bodyTexture = THREE.ImageUtils.loadTexture(modelsBase + 'business_prof_Body_Diffuse.png');

      materials[0].map = bodyTexture;
      materials.forEach(function(material) {
        material.transparent = false;
        material.morphTargets = true;
      });

      var material = new THREE.MultiMaterial(materials);

      // This would center y rotation but at bad other costs (namely the morphs don't work lol)...
      // geometry.translate(0, -165.3, 0);
      face = new THREE.Mesh(geometry, material);
      face.scale.set(1.5, 1.5, 1.5);
      face.position.set(0, -248, 420);
      point.target = face;
      scene.add(face);

      if (loadHair) {
        loader.load(modelsBase + 'hair.json', function (geometry) {
          var hairTexture = THREE.ImageUtils.loadTexture(modelsBase + 'business_prof_Hair_Diffuse.png');
          var material = new THREE.MeshBasicMaterial({ map: hairTexture });

          // geometry.translate(0, -1.653, 0);
          var hair = new THREE.Mesh(geometry, material);
          hair.scale.set(100, 100, 100);
          face.add(hair);
        });
      }

      if (loadEyes) {
        loader.load(modelsBase + 'eyes.json', function (geometry) {
          var material = new THREE.MeshBasicMaterial({ map: bodyTexture });

          // geometry.translate(0, -1.653, 0);
          var eyes = new THREE.Mesh(geometry, material);
          eyes.scale.set(100, 100, 100);
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
      face.rotation.x = (mouseY / windowHalfY) * Math.PI * 0.0015;
    }

    camera.lookAt(scene.position);

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
    return 'media/breath' + (Math.floor(Math.random() * 10) + 1) + '.mp3';
  }
})();
