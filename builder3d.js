(function(){
  document.addEventListener('DOMContentLoaded', init);
  function init(){
    var mount = document.getElementById('builder3d');
    if(!mount || typeof THREE === 'undefined') return;

    mount.innerHTML =
      '<canvas id="b3dCanvas"></canvas>' +
      '<div class="b3d-hint" id="b3dHint">Tap a building to select it</div>';
    var afterCanvas = document.createElement('div');
    afterCanvas.innerHTML =
      '<div class="b3d-slots" id="b3dSlots"></div>' +
      '<div class="b3d-title" id="b3dTitle"></div>' +
      '<div class="b3d-swatches" id="b3dSwatches"></div>';
    mount.parentNode.insertBefore(afterCanvas, mount.nextSibling);

    var canvas = document.getElementById('b3dCanvas');
    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a1220, 6, 20);
    var camera = new THREE.PerspectiveCamera(42, canvas.clientWidth/canvas.clientHeight || 1, 0.1, 100);
    var renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true, alpha:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    function fit(){
      var w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w,h,false);
      camera.aspect = w/h;
      camera.updateProjectionMatrix();
    }

    scene.add(new THREE.AmbientLight(0x2a3a5a,0.75));
    var key = new THREE.DirectionalLight(0xcfe4ff,1.2); key.position.set(4,9,5); scene.add(key);
    var rim = new THREE.DirectionalLight(0x3B82F6,1.0); rim.position.set(-6,4,-3); scene.add(rim);

    function skyMesh(){
      var c=document.createElement('canvas'); c.width=8; c.height=64;
      var ctx=c.getContext('2d');
      var g=ctx.createLinearGradient(0,0,0,64);
      g.addColorStop(0,'#16233f'); g.addColorStop(1,'#050a16');
      ctx.fillStyle=g; ctx.fillRect(0,0,8,64);
      var tex=new THREE.CanvasTexture(c);
      return new THREE.Mesh(new THREE.SphereGeometry(30,16,16), new THREE.MeshBasicMaterial({map:tex, side:THREE.BackSide}));
    }
    scene.add(skyMesh());

    var pmrem = new THREE.PMREMGenerator(renderer);
    var envScene = new THREE.Scene(); envScene.background = new THREE.Color(0x16233f);
    try { scene.environment = pmrem.fromScene(envScene, 0.04).texture; } catch(e){}

    function noiseTex(size, base, variance){
      var c=document.createElement('canvas'); c.width=c.height=size;
      var ctx=c.getContext('2d');
      var img=ctx.createImageData(size,size);
      for(var i=0;i<img.data.length;i+=4){
        var n = base + (Math.random()-0.5)*variance;
        img.data[i]=n; img.data[i+1]=n; img.data[i+2]=n; img.data[i+3]=255;
      }
      ctx.putImageData(img,0,0);
      var tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      return tex;
    }
    function asphaltTex(){
      var size=256; var c=document.createElement('canvas'); c.width=c.height=size;
      var ctx=c.getContext('2d');
      for(var y=0;y<size;y+=2) for(var x=0;x<size;x+=2){
        var n = 26 + Math.random()*10;
        ctx.fillStyle='rgb('+n+','+n+','+(n+2)+')';
        ctx.fillRect(x,y,2,2);
      }
      var tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4,4);
      return tex;
    }
    var concreteTex = noiseTex(128,150,26); concreteTex.repeat.set(3,3);
    var groundTex = asphaltTex();

    var floor = new THREE.Mesh(new THREE.PlaneGeometry(40,40), new THREE.MeshStandardMaterial({map:groundTex, roughness:0.95}));
    floor.rotation.x=-Math.PI/2; floor.position.y=-0.006; scene.add(floor);

    function shadowDisc(r){
      var c=document.createElement('canvas'); c.width=64; c.height=64;
      var ctx=c.getContext('2d');
      var g=ctx.createRadialGradient(32,32,0,32,32,32);
      g.addColorStop(0,'rgba(0,0,0,0.5)'); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g; ctx.fillRect(0,0,64,64);
      var tex=new THREE.CanvasTexture(c);
      var m=new THREE.Mesh(new THREE.PlaneGeometry(r,r), new THREE.MeshBasicMaterial({map:tex, transparent:true}));
      m.rotation.x=-Math.PI/2; m.position.y=0.011;
      return m;
    }

    function windowGrid(w,h,z,cols,rows,lit){
      var g=new THREE.Group();
      var mLit = new THREE.MeshStandardMaterial({color:0x9fd4ff, emissive:0x3B82F6, emissiveIntensity:0.5, roughness:0.15, metalness:0.6});
      var mDim = new THREE.MeshStandardMaterial({color:0x1a2740, emissive:0x14203a, emissiveIntensity:0.15, roughness:0.2, metalness:0.5});
      var padX=w/cols, padY=h/rows, ww=padX*0.62, wh=padY*0.55;
      for(var c=0;c<cols;c++) for(var r=0;r<rows;r++){
        var isLit = lit===false ? false : Math.random()>0.3;
        var win = new THREE.Mesh(new THREE.BoxGeometry(ww,wh,0.03), isLit?mLit:mDim);
        win.position.set(-w/2+padX*(c+0.5), padY*(r+0.55), z);
        g.add(win);
      }
      return g;
    }
    var trimMat = new THREE.MeshStandardMaterial({color:0x3B82F6, emissive:0x1c3f7a, emissiveIntensity:0.7, roughness:0.25, metalness:0.5});
    var concreteMat = new THREE.MeshStandardMaterial({map:concreteTex, color:0xbfc2c0, roughness:0.85});

    function makeOffice(){
      var g=new THREE.Group(); var w=1.7,d=1.3,h=4.2,floors=8,floorH=h/floors;
      var glass = new THREE.MeshPhysicalMaterial({color:0x16233f, roughness:0.08, metalness:0.15, transparent:true, opacity:0.94, clearcoat:0.4, envMapIntensity:1.4});
      var body = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), glass); body.position.y=h/2; g.add(body);
      g.add(windowGrid(w,h,d/2+0.02,4,floors));
      for(var fl=1; fl<floors; fl++){
        var band = new THREE.Mesh(new THREE.BoxGeometry(w+0.02,0.02,d+0.02), trimMat);
        band.position.y = fl*floorH; g.add(band);
      }
      var cap = new THREE.Mesh(new THREE.BoxGeometry(w*1.06,0.08,d*1.06), trimMat); cap.position.y=h+0.04; g.add(cap);
      var base = new THREE.Mesh(new THREE.BoxGeometry(w*1.2,0.3,d*1.2), concreteMat); base.position.y=0.15; g.add(base);
      var door = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.4,0.03), new THREE.MeshStandardMaterial({color:0x9fd4ff, emissive:0x3B82F6, emissiveIntensity:0.4})); door.position.set(0,0.2,d/2+0.02); g.add(door);
      g.add(shadowDisc(3.2));
      g.userData.body = body; g.userData.trim = [cap,base];
      g.userData.extent = {w:w*1.7,h:h,d:d*1.7};
      return g;
    }
    function makeWarehouse(){
      var g=new THREE.Group(); var w=3.2,d=2.2,h=1.1;
      var body = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), concreteMat); body.position.y=h/2; g.add(body);
      var dm = trimMat;
      for(var i=0;i<4;i++){var dock=new THREE.Mesh(new THREE.BoxGeometry(0.45,0.4,0.03),dm);dock.position.set(-w/2+(i+0.5)*(w/4),0.3,d/2+0.02);g.add(dock);}
      var stripe = new THREE.Mesh(new THREE.BoxGeometry(w*1.02,0.06,0.1), trimMat); stripe.position.set(0,h*0.85,d/2+0.02); g.add(stripe);
      g.add(shadowDisc(3.0));
      g.userData.body = body; g.userData.trim=[stripe];
      g.userData.extent = {w:w*1.3,h:h,d:d*1.7};
      return g;
    }
    function makeRetail(){
      var g=new THREE.Group(); var w=2.9,d=1.5,h=1.0;
      var glass = new THREE.MeshPhysicalMaterial({color:0x16233f, roughness:0.1, metalness:0.1, transparent:true, opacity:0.92});
      var body = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), glass); body.position.y=h/2; g.add(body);
      var canopy = new THREE.Mesh(new THREE.BoxGeometry(w*1.02,0.06,0.32), trimMat); canopy.position.set(0,h*0.7,d/2+0.16); g.add(canopy);
      g.add(windowGrid(w*0.95,h*0.55,d/2+0.02,6,1));
      g.add(shadowDisc(3.4));
      g.userData.body = body; g.userData.trim=[canopy];
      g.userData.extent = {w:w*1.7,h:h,d:d*2.3};
      return g;
    }
    function makeLand(){
      var g=new THREE.Group();
      var plot = new THREE.Mesh(new THREE.PlaneGeometry(2.8,2.2), new THREE.MeshStandardMaterial({color:0x14243f, roughness:0.9}));
      plot.rotation.x=-Math.PI/2; plot.position.y=0.01; g.add(plot);
      for(var i=0;i<4;i++){
        var post=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.32,8), trimMat);
        post.position.set((i%2===0?-1:1)*1.35,0.16,(i<2?-1:1)*1.05);
        g.add(post);
      }
      g.add(shadowDisc(3.0));
      g.userData.body = plot; g.userData.trim=[];
      g.userData.extent = {w:3.4,h:0.5,d:2.8};
      return g;
    }

    var TYPE_LABELS = {office:'Office', warehouse:'Industrial / Warehouse', retail:'Retail', land:'Land'};
    var buildings = [
      {key:'office', label:'Office', make:makeOffice, x:-6},
      {key:'warehouse', label:'Warehouse', make:makeWarehouse, x:-2},
      {key:'retail', label:'Shopping center', make:makeRetail, x:2.5},
      {key:'land', label:'Land', make:makeLand, x:6}
    ];
    buildings.forEach(function(b){ b.group=b.make(); b.group.position.x=b.x; scene.add(b.group); });

    var ro = new ResizeObserver(function(){ fit(); });
    ro.observe(mount);
    fit();

    var camTarget = new THREE.Vector3(0,1,0);
    camera.position.set(0,4.6,11.5);
    camera.lookAt(camTarget);

    var selected=null, animState=null;
    var hint = document.getElementById('b3dHint');

    function raycastSelect(clientX, clientY){
      var rect = canvas.getBoundingClientRect();
      var mouse = new THREE.Vector2(((clientX-rect.left)/rect.width)*2-1, -((clientY-rect.top)/rect.height)*2+1);
      var ray = new THREE.Raycaster(); ray.setFromCamera(mouse, camera);
      var meshes=[];
      buildings.forEach(function(b){ b.group.traverse(function(o){ if(o.isMesh){ o.userData.parentKey=b.key; meshes.push(o);} }); });
      var hits = ray.intersectObjects(meshes);
      return hits.length ? hits[0].object.userData.parentKey : null;
    }
    canvas.addEventListener('click', function(e){
      if(selected) return;
      var key = raycastSelect(e.clientX, e.clientY);
      if(key) selectBuilding(key);
    });

    var hfType = document.getElementById('hf_property_type');
    var hfBudget = document.getElementById('hf_budget');

    function selectBuilding(key){
      selected = buildings.filter(function(b){return b.key===key;})[0];
      hint.style.display='none';
      if(hfType) hfType.value = TYPE_LABELS[key] || '';
      var extent = selected.group.userData.extent;
      var toPos = new THREE.Vector3(selected.x+extent.w*0.55, extent.h*1.05+1, extent.d*0.85+1);
      var toTarget = new THREE.Vector3(selected.x, extent.h*0.35, 0);
      animState = {toPos:toPos, fromPos:camera.position.clone(), toTarget:toTarget, fromTarget:camTarget.clone(), dur:900, startTime:performance.now()};
      buildings.forEach(function(b){ if(b.key!==key) b.fadeOut=true; });
      showCustomizer();
    }

    var slotsEl = document.getElementById('b3dSlots');
    var titleEl = document.getElementById('b3dTitle');
    var swatchEl = document.getElementById('b3dSwatches');
    var sizeOptions=[{v:'small',l:'Under 5,000 SF'},{v:'med',l:'5,000-25,000 SF'},{v:'large',l:'25,000+ SF'}];
    var budgetOptions=[{v:'Under $250,000',l:'Under $250K'},{v:'$500,000-$1M',l:'$500K-$1M'},{v:'$3M-$5M',l:'$3M-$5M+'}];
    var sizeMul={small:0.72,med:1,large:1.35};
    var finishColors={'Under $250,000':0x9a9a92,'$500,000-$1M':0x3B82F6,'$3M-$5M':0xeef1f2};
    var custom={size:null,budget:null};

    function applySize(){
      if(!selected) return;
      var s = sizeMul[custom.size] || 1;
      selected.group.scale.set(s,s,s);
    }
    function applyBudget(){
      if(!selected || !custom.budget) return;
      if(hfBudget) hfBudget.value = custom.budget;
      var color = finishColors[custom.budget];
      if(selected.group.userData.body && selected.group.userData.body.material && selected.group.userData.body.material.color){
        selected.group.userData.body.material.color.setHex(color);
      }
    }
    function noteSize(){
      var notes = document.querySelector('textarea[name="additional_notes"]');
      if(!notes || !custom.size) return;
      var label = (sizeOptions.filter(function(o){return o.v===custom.size;})[0]||{}).l;
      var marker = 'Approx size selected: ';
      var lines = notes.value.split('\n').filter(function(l){ return l.indexOf(marker)!==0; });
      lines.push(marker+label);
      notes.value = lines.join('\n').trim();
    }

    function renderSlots(){
      var typeVal = hfType ? hfType.value : '';
      var budgetLabel = custom.budget ? (budgetOptions.filter(function(o){return o.v===custom.budget;})[0]||{}).l : '';
      var sizeLabel = custom.size ? (sizeOptions.filter(function(o){return o.v===custom.size;})[0]||{}).l : '';
      slotsEl.innerHTML =
        '<span class="b3d-slot'+(typeVal?' filled':'')+'">'+(typeVal||'Type')+'</span>' +
        '<span class="b3d-slot'+(custom.size?' filled':'')+'">'+(sizeLabel||'Size')+'</span>' +
        '<span class="b3d-slot'+(custom.budget?' filled':'')+'">'+(budgetLabel||'Budget')+'</span>';
    }

    function showCustomizer(){
      titleEl.textContent = 'Customize your ' + selected.label;
      swatchEl.innerHTML =
        '<div style="grid-column:1/-1;font-size:12px;color:#93C5FD;margin-bottom:2px">Size</div>' +
        sizeOptions.map(function(o){return '<div class="b3d-swatch'+(custom.size===o.v?' sel':'')+'" data-g="size" data-v="'+o.v+'">'+o.l+'</div>';}).join('') +
        '<div style="grid-column:1/-1;font-size:12px;color:#93C5FD;margin:6px 0 2px">Budget</div>' +
        budgetOptions.map(function(o){return '<div class="b3d-swatch'+(custom.budget===o.v?' sel':'')+'" data-g="budget" data-v="'+o.v+'">'+o.l+'</div>';}).join('');
      swatchEl.querySelectorAll('.b3d-swatch').forEach(function(el){
        el.addEventListener('click', function(){
          var group = el.getAttribute('data-g'), val = el.getAttribute('data-v');
          custom[group] = val;
          if(group==='size'){ applySize(); noteSize(); }
          if(group==='budget'){ applyBudget(); }
          renderSlots();
          showCustomizer();
        });
      });
      renderSlots();
    }

    function animate(now){
      requestAnimationFrame(animate);
      if(animState){
        var t=Math.min(1,(now-animState.startTime)/animState.dur);
        var ease=1-Math.pow(1-t,3);
        camera.position.lerpVectors(animState.fromPos, animState.toPos, ease);
        camTarget.lerpVectors(animState.fromTarget, animState.toTarget, ease);
        camera.lookAt(camTarget);
        if(t>=1) animState=null;
      }
      buildings.forEach(function(b){
        if(b.fadeOut){
          b.group.traverse(function(o){ if(o.isMesh){ o.material.transparent=true; o.material.opacity=Math.max(0.05,(o.material.opacity===undefined?1:o.material.opacity)-0.045); } });
        } else if(!selected){
          b.group.rotation.y += 0.003;
        }
      });
      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);
  }
})();
