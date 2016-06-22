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

  init();
  animate();

  function glitchFace() {
    if (face) {
      var duration = 800 + Math.random() * 3200;

      var lastGlitchResetTo = {};
      for (var key in lastGlitchTo) {
        lastGlitchResetTo[key] = 0.0;
      }
      tweenFace(lastGlitchResetTo, duration);

      var to = {};
      var number = Math.floor(Math.random() * 5) + 5;
      for (var i = 0; i < number; i++) {
        var idx = Math.floor(Math.random() * 101);
        while (lastGlitchTo[idx] !== undefined) {
          idx = Math.floor(Math.random() * 101);
        }

        to[idx] = Math.random() * 0.2 + 0.8;
      }

      tweenFace(to, duration);

      lastGlitchTo = to;

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
      }
    }
  }

  document.onclick = glitchFace;

  function init () {
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 500;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 1, 15000);

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

      face = new THREE.Mesh(geometry, material);
      face.scale.set(1.5, 1.5, 1.5);
      face.position.set(0, -245, 400);
      point.target = face;
      scene.add(face);

      if (loadHair) {
        loader.load(modelsBase + 'hair.json', function (geometry) {
          var hairTexture = THREE.ImageUtils.loadTexture(modelsBase + 'business_prof_Hair_Diffuse.png');
          var material = new THREE.MeshBasicMaterial({ map: hairTexture });

          var hair = new THREE.Mesh(geometry, material);
          hair.scale.set(100, 100, 100);
          face.add(hair);
        });
      }

      if (loadEyes) {
        loader.load(modelsBase + 'eyes.json', function (geometry) {
          var material = new THREE.MeshBasicMaterial({ map: bodyTexture });

          var eyes = new THREE.Mesh(geometry, material);
          eyes.scale.set(100, 100, 100);
          face.add(eyes);
        });
      }
    });

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0x222222);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.sortObjects = false;
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);
  }

  function onWindowResize () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate () {
    requestAnimationFrame(animate);
    render();
  }

  function render () {
    TWEEN.update();

    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
})();
