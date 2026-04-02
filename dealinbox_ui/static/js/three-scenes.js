(function (global) {
  function sceneContext(containerId, options) {
    var host = document.getElementById(containerId || 'three-bg');
    if (!host || !global.THREE) return null;

    var width = host.clientWidth || window.innerWidth;
    var height = host.clientHeight || window.innerHeight;
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera((options && options.fov) || 52, width / height, 0.1, 1000);
    camera.position.set(0, 0, (options && options.cameraZ) || 8);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.setSize(width, height);
    renderer.domElement.style.opacity = '0';
    renderer.domElement.style.transition = 'opacity 1.2s ease';
    host.innerHTML = '';
    host.appendChild(renderer.domElement);
    requestAnimationFrame(function () { renderer.domElement.style.opacity = '1'; });

    var clock = new THREE.Clock();
    var mouse = { x: 0, y: 0 };
    var running = true;
    var disposables = [];

    function addDisposable(item) { disposables.push(item); return item; }
    function onMouseMove(e) {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    }
    document.addEventListener('mousemove', onMouseMove);

    function onResize() {
      var w = host.clientWidth || window.innerWidth;
      var h = host.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);

    function dispose() {
      if (!running) return;
      running = false;
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousemove', onMouseMove);
      disposables.forEach(function (d) {
        if (d && d.geometry) d.geometry.dispose();
        if (d && d.material) {
          if (Array.isArray(d.material)) d.material.forEach(function (m) { m.dispose(); });
          else d.material.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    }
    window.addEventListener('beforeunload', dispose);

    return {
      host: host, scene: scene, camera: camera, renderer: renderer, clock: clock,
      mouse: mouse, running: function () { return running; }, dispose: dispose,
      addDisposable: addDisposable
    };
  }

  function particles(count, spread, color, size) {
    var geometry = new THREE.BufferGeometry();
    var points = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      points[i * 3] = (Math.random() - 0.5) * spread;
      points[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.6;
      points[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(points, 3));
    return new THREE.Points(geometry, new THREE.PointsMaterial({ color: color, size: size, transparent: true, opacity: 0.65 }));
  }

  function initDealCosmos() {
    var ctx = sceneContext('three-bg', { cameraZ: 10, fov: 50 });
    if (!ctx) return;
    var scene = ctx.scene; var camera = ctx.camera;

    scene.add(new THREE.AmbientLight(0x997035, 0.7));
    var light = new THREE.PointLight(0xf0b429, 1.8, 50);
    light.position.set(0, 0, 5);
    scene.add(light);

    var center = new THREE.Mesh(new THREE.SphereGeometry(1.1, 48, 48), new THREE.MeshStandardMaterial({ color: 0xd39a25, metalness: 0.86, roughness: 0.22 }));
    scene.add(ctx.addDisposable(center));

    var deals = ['Mamaearth ₹25K · Negotiating', 'boAt ₹45K · New', 'Nykaa ₹18K · Closed', 'Myntra ₹35K · Reviewing', 'Noise ₹40K · New', 'CRED ₹55K · Negotiating', 'Sugar ₹22K · Accepted', 'Ather ₹28K · Reviewing'];
    var cards = [];
    for (var i = 0; i < deals.length; i++) {
      var c = document.createElement('canvas'); c.width = 512; c.height = 128;
      var x = c.getContext('2d');
      x.fillStyle = '#101424'; x.fillRect(0,0,c.width,c.height);
      x.strokeStyle = i % 2 ? '#f0b429' : '#6b8cff'; x.lineWidth = 5; x.strokeRect(6,6,c.width-12,c.height-12);
      x.fillStyle = '#f0f0ff'; x.font = '700 34px DM Sans'; x.fillText(deals[i], 22, 74);
      var tex = new THREE.CanvasTexture(c);
      var mesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.05), new THREE.MeshStandardMaterial({ map: tex, emissive: 0x181f33, emissiveIntensity: 0.45 }));
      mesh.userData = { angle: (i / deals.length) * Math.PI * 2, radius: 3 + (i % 3) * 0.8, speed: 0.2 + i * 0.03 };
      scene.add(ctx.addDisposable(mesh));
      cards.push(mesh);
    }

    var particleCount = window.innerWidth < 768 ? 900 : 3000;
    var stars = particles(particleCount, 70, 0x8aa3db, 0.05);
    scene.add(ctx.addDisposable(stars));

    (function animate() {
      if (!ctx.running()) return;
      var dt = ctx.clock.getDelta();
      var t = ctx.clock.elapsedTime;
      center.rotation.y += dt * 0.35;
      center.rotation.x += dt * 0.06;
      cards.forEach(function (card) {
        card.userData.angle += dt * card.userData.speed;
        card.position.x = Math.cos(card.userData.angle) * card.userData.radius;
        card.position.z = Math.sin(card.userData.angle) * card.userData.radius;
        card.position.y = Math.sin(t + card.userData.angle) * 0.5;
        card.lookAt(center.position);
      });
      stars.rotation.y += dt * 0.02;
      camera.position.x += (ctx.mouse.x * 0.25 - camera.position.x) * 0.04;
      camera.position.y += (ctx.mouse.y * 0.25 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
      ctx.renderer.render(scene, camera);
      requestAnimationFrame(animate);
    })();
  }

  function initPipelineGalaxy(data) {
    var ctx = sceneContext('pipeline-canvas', { cameraZ: 9, fov: 42 }); if (!ctx) return;
    var counts = data || {};
    var rows = [
      { k: 'new', c: 0x6b8cff }, { k: 'reviewing', c: 0xf0b429 }, { k: 'accepted', c: 0x10e09a }, { k: 'negotiating', c: 0x8e6bff }
    ];
    rows.forEach(function (row, idx) {
      var n = Math.max(10, Math.min(220, (counts[row.k] || 15) * 8));
      var g = new THREE.BufferGeometry();
      var p = new Float32Array(n * 3);
      for (var i = 0; i < n; i++) {
        p[i * 3] = Math.random() * 16 - 8;
        p[i * 3 + 1] = idx * 0.7 - 1.2 + (Math.random() - 0.5) * 0.2;
        p[i * 3 + 2] = (Math.random() - 0.5) * 2;
      }
      g.setAttribute('position', new THREE.BufferAttribute(p, 3));
      var points = new THREE.Points(g, new THREE.PointsMaterial({ color: row.c, size: 0.06, transparent: true, opacity: 0.82 }));
      points.userData = { arr: p, speed: 1 + idx * 0.3 };
      ctx.scene.add(ctx.addDisposable(points));
    });
    ctx.scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    (function animate() {
      if (!ctx.running()) return;
      var dt = ctx.clock.getDelta();
      ctx.scene.children.forEach(function (obj) {
        if (obj.type === 'Points' && obj.userData.arr) {
          var arr = obj.userData.arr;
          for (var i = 0; i < arr.length; i += 3) {
            arr[i] += dt * (obj.userData.speed * 2.2);
            if (arr[i] > 8) arr[i] = -8;
          }
          obj.geometry.attributes.position.needsUpdate = true;
        }
      });
      ctx.renderer.render(ctx.scene, ctx.camera);
      requestAnimationFrame(animate);
    })();
  }

  function initGridLines() { var ctx = sceneContext('three-bg', { cameraZ: 13, fov: 48 }); if (!ctx) return;
    var mat = new THREE.LineBasicMaterial({ color: 0xf0b429, transparent: true, opacity: 0.17 });
    for (var i = -20; i <= 20; i++) {
      var gx = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i, -10, 0), new THREE.Vector3(i, 10, 0)]);
      var gy = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-20, i * 0.5, 0), new THREE.Vector3(20, i * 0.5, 0)]);
      ctx.scene.add(ctx.addDisposable(new THREE.Line(gx, mat)));
      ctx.scene.add(ctx.addDisposable(new THREE.Line(gy, mat)));
    }
    (function animate(){ if(!ctx.running())return; var t=ctx.clock.elapsedTime; ctx.scene.rotation.x = Math.sin(t*0.3)*0.05; ctx.renderer.render(ctx.scene, ctx.camera); requestAnimationFrame(animate); })();
  }

  function initHelixSignal() { var ctx=sceneContext('brand-signal-canvas',{cameraZ:6,fov:45}); if(!ctx)return;
    var mat1=new THREE.MeshBasicMaterial({color:0xf0b429}); var mat2=new THREE.MeshBasicMaterial({color:0x6b8cff});
    for(var i=0;i<40;i++){ var a=i*0.4; var y=(i-20)*0.08;
      var m1=new THREE.Mesh(new THREE.SphereGeometry(0.05,12,12),mat1); m1.position.set(Math.cos(a)*1,y,Math.sin(a)*1);
      var m2=new THREE.Mesh(new THREE.SphereGeometry(0.05,12,12),mat2); m2.position.set(Math.cos(a+Math.PI)*1,y,Math.sin(a+Math.PI)*1);
      ctx.scene.add(ctx.addDisposable(m1)); ctx.scene.add(ctx.addDisposable(m2)); }
    ctx.scene.add(new THREE.AmbientLight(0xffffff,1));
    (function animate(){ if(!ctx.running())return; var dt=ctx.clock.getDelta(); ctx.scene.rotation.y += dt*0.5; ctx.renderer.render(ctx.scene,ctx.camera); requestAnimationFrame(animate);})();
  }

  function initDataUniverse(data){ var ctx=sceneContext('analytics-canvas',{cameraZ:16,fov:52}); if(!ctx)return; ctx.scene.add(new THREE.AmbientLight(0xffffff,0.7));
    for(var i=0;i<16;i++){ var g=(i%2)?new THREE.IcosahedronGeometry(0.4,0):new THREE.OctahedronGeometry(0.46,0); var m=new THREE.MeshBasicMaterial({color:0x6b8cff,wireframe:true,transparent:true,opacity:0.22});
      var mesh=new THREE.Mesh(g,m); mesh.position.set((Math.random()-0.5)*14,(Math.random()-0.5)*7,(Math.random()-0.5)*4); mesh.userData={seed:Math.random()*Math.PI*2}; ctx.scene.add(ctx.addDisposable(mesh)); }
    var bars=(data&&data.monthly)||[12,16,10,18,20,22];
    bars.forEach(function(v,i){ var geom=new THREE.BoxGeometry(0.8,0.1,0.8); var mat=new THREE.MeshStandardMaterial({color:0xf0b429,metalness:0.5,roughness:0.3});
      var b=new THREE.Mesh(geom,mat); b.position.set(-4+i*1.6,-2.4,0); b.userData={target:Math.max(0.2,v*0.12)}; ctx.scene.add(ctx.addDisposable(b)); });
    (function animate(){ if(!ctx.running())return; var dt=ctx.clock.getDelta(); ctx.scene.children.forEach(function(o){ if(o.userData&&o.userData.target){ o.scale.y += (o.userData.target-o.scale.y)*0.06; o.position.y = -2.4 + o.scale.y*0.5; } else if(o.type==='Mesh'&&o.material&&o.material.wireframe){ o.rotation.x += dt*0.08; o.rotation.y += dt*0.12; }});
      ctx.renderer.render(ctx.scene,ctx.camera); requestAnimationFrame(animate);})(); }

  function initGoldRush(){ var ctx=sceneContext('three-bg',{cameraZ:10,fov:50}); if(!ctx)return; ctx.scene.add(new THREE.AmbientLight(0xf0b429,0.9));
    var crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.2,0),new THREE.MeshBasicMaterial({color:0xf0b429,wireframe:true,transparent:true,opacity:0.7})); ctx.scene.add(ctx.addDisposable(crown));
    var n=window.innerWidth<768?350:1100; var g=new THREE.BufferGeometry(); var arr=new Float32Array(n*3); for(var i=0;i<n;i++){arr[i*3]=0;arr[i*3+1]=0;arr[i*3+2]=0;} g.setAttribute('position',new THREE.BufferAttribute(arr,3));
    var p=new THREE.Points(g,new THREE.PointsMaterial({color:0xffd166,size:0.06,transparent:true,opacity:0.75})); p.userData={arr:arr,vel:new Float32Array(n*3),ttl:new Float32Array(n)};
    for(var j=0;j<n;j++){ reset(j); } function reset(i){ var a=Math.random()*Math.PI*2; var s=Math.random()*0.03+0.01; p.userData.vel[i*3]=Math.cos(a)*s; p.userData.vel[i*3+1]=Math.random()*0.06; p.userData.vel[i*3+2]=Math.sin(a)*s; p.userData.ttl[i]=Math.random()*1.2+0.3;}
    ctx.scene.add(ctx.addDisposable(p));
    (function animate(){ if(!ctx.running())return; var dt=ctx.clock.getDelta(); crown.rotation.y+=dt*0.4; var A=p.userData.arr,V=p.userData.vel,T=p.userData.ttl;
      for(var i=0;i<n;i++){ T[i]-=dt; if(T[i]<=0){ A[i*3]=A[i*3+1]=A[i*3+2]=0; reset(i);} A[i*3]+=V[i*3]*60*dt; A[i*3+1]+=V[i*3+1]*60*dt; A[i*3+2]+=V[i*3+2]*60*dt; V[i*3+1]-=0.0006; }
      p.geometry.attributes.position.needsUpdate=true; ctx.renderer.render(ctx.scene,ctx.camera); requestAnimationFrame(animate);})(); }

  function initCreatorAura(){ var ctx=sceneContext('three-bg',{cameraZ:8,fov:48}); if(!ctx)return; var sph=new THREE.Mesh(new THREE.SphereGeometry(1.4,48,48),new THREE.MeshBasicMaterial({color:0xf0b429,transparent:true,opacity:0.25})); ctx.scene.add(ctx.addDisposable(sph));
    var emb=particles(window.innerWidth<768?300:900,20,0xffd166,0.04); ctx.scene.add(ctx.addDisposable(emb));
    (function animate(){ if(!ctx.running())return; var t=ctx.clock.elapsedTime; sph.scale.setScalar(1+Math.sin(t*2)*0.08); emb.rotation.y+=0.002; emb.position.y=Math.sin(t*0.7)*0.1; ctx.renderer.render(ctx.scene,ctx.camera); requestAnimationFrame(animate);})(); }

  function initSignalTracker(){ var ctx=sceneContext('three-bg',{cameraZ:8,fov:48}); if(!ctx)return; ctx.scene.add(new THREE.AmbientLight(0xf0b429,0.7));
    var rings=[]; for(var i=0;i<6;i++){ var r=new THREE.Mesh(new THREE.RingGeometry(0.7+i*0.35,0.74+i*0.35,64),new THREE.MeshBasicMaterial({color:0xf0b429,transparent:true,opacity:0.4-i*0.05,side:THREE.DoubleSide})); r.rotation.x=-Math.PI/2; rings.push(r); ctx.scene.add(ctx.addDisposable(r)); }
    (function animate(){ if(!ctx.running())return; var t=ctx.clock.elapsedTime; rings.forEach(function(r,idx){ var s=1+((t*0.6+idx*0.2)%1.5); r.scale.setScalar(s); r.material.opacity=Math.max(0,0.45-s*0.25); }); ctx.renderer.render(ctx.scene,ctx.camera); requestAnimationFrame(animate);})(); }

  global.DealScenes = {
    initDealCosmos:initDealCosmos,
    initPipelineGalaxy:initPipelineGalaxy,
    initGridLines:initGridLines,
    initHelixSignal:initHelixSignal,
    initDataUniverse:initDataUniverse,
    initGoldRush:initGoldRush,
    initCreatorAura:initCreatorAura,
    initSignalTracker:initSignalTracker
  };
})(window);
