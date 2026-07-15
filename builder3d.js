(function(){
  document.addEventListener('DOMContentLoaded', init);
  function init(){
    var hero = document.getElementById('hero3d');
    var canvas = document.getElementById('b3dCanvas');
    if(!hero || !canvas || typeof THREE === 'undefined') return;

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a1220, 7, 24);
    var camera = new THREE.PerspectiveCamera(42, hero.clientWidth/hero.clientHeight || 1, 0.1, 100);
    var renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true, alpha:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    function fit(){
      var w = hero.clientWidth, h = hero.clientHeight;
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
      tex.repeat.set(6,6);
      return tex;
    }
    var concreteTex = noiseTex(128,150,26); concreteTex.repeat.set(3,3);
    var groundTex = asphaltTex();

    var floor = new THREE.Mesh(new THREE.PlaneGeometry(60,60), new THREE.MeshStandardMaterial({map:groundTex, roughness:0.95}));
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
    function windowGrid(w,h,z,cols,rows){
      var g=new THREE.Group();
      var mLit = new THREE.MeshStandardMaterial({color:0x9fd4ff, emissive:0x3B82F6, emissiveIntensity:0.5, roughness:0.15, metalness:0.6});
      var mDim = new THREE.MeshStandardMaterial({color:0x1a2740, emissive:0x14203a, emissiveIntensity:0.15, roughness:0.2, metalness:0.5});
      var padX=w/cols, padY=h/rows, ww=padX*0.62, wh=padY*0.55;
      for(var c=0;c<cols;c++) for(var r=0;r<rows;r++){
        var isLit = Math.random()>0.3;
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
      g.userData.body = body; g.userData.topY = h+0.55;
      g.userData.extent = {w:w*1.7,h:h,d:d*1.7};
      return g;
    }
    function makeWarehouse(){
      var g=new THREE.Group(); var w=3.2,d=2.2,h=1.1;
      var body = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), concreteMat); body.position.y=h/2; g.add(body);
      for(var i=0;i<4;i++){var dock=new THREE.Mesh(new THREE.BoxGeometry(0.45,0.4,0.03),trimMat);dock.position.set(-w/2+(i+0.5)*(w/4),0.3,d/2+0.02);g.add(dock);}
      var stripe = new THREE.Mesh(new THREE.BoxGeometry(w*1.02,0.06,0.1), trimMat); stripe.position.set(0,h*0.85,d/2+0.02); g.add(stripe);
      g.add(shadowDisc(3.0));
      g.userData.body = body; g.userData.topY = h+0.5;
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
      g.userData.body = body; g.userData.topY = h+0.5;
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
      g.userData.body = plot; g.userData.topY = 0.6;
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
    buildings.forEach(function(b){
      b.group=b.make(); b.group.position.x=b.x; scene.add(b.group);
      var el = document.createElement('div');
      el.className='b3d-label';
      el.textContent = b.label;
      hero.appendChild(el);
      b.labelEl = el;
    });

    var ro = new ResizeObserver(function(){ fit(); });
    ro.observe(hero);
    fit();

    var camTarget = new THREE.Vector3(0,1,0);
    camera.position.set(0,4.8,12.5);
    camera.lookAt(camTarget);

    var selected=null, animState=null, phase='goal';
    var hf_goal = document.getElementById('hf_property_goal');
    var hf_type = document.getElementById('hf_property_type');
    var hf_budget = document.getElementById('hf_budget');
    var introEl = document.getElementById('hero3dIntro');
    var slotsEl = document.getElementById('b3dSlots');
    var titleEl = document.getElementById('b3dTitle');
    var swatchEl = document.getElementById('b3dSwatches');

    var goalOptions = [
      {v:'Buy Commercial Property', l:'Buy'},
      {v:'Lease Commercial Space', l:'Lease'},
      {v:'SBA Owner-User Purchase', l:'SBA purchase'},
      {v:'Investment Property', l:'Invest'}
    ];
    var sizeOptions=[{v:'small',l:'Under 5,000 SF'},{v:'med',l:'5,000-25,000 SF'},{v:'large',l:'25,000+ SF'}];
    var budgetOptions=[{v:'Under $250,000',l:'Under $250K'},{v:'$500,000-$1M',l:'$500K-$1M'},{v:'$3M-$5M',l:'$3M-$5M+'}];
    var sizeMul={small:0.72,med:1,large:1.35};
    var finishColors={'Under $250,000':0x9a9a92,'$500,000-$1M':0x3B82F6,'$3M-$5M':0xeef1f2};
    var custom={goal:null,size:null,budget:null};

    function renderSlots(){
      slotsEl.innerHTML =
        '<span class="b3d-slot'+(custom.goal?' filled':'')+'">'+((goalOptions.filter(function(o){return o.v===custom.goal;})[0]||{}).l||'Goal')+'</span>' +
        '<span class="b3d-slot'+(selected?' filled':'')+'">'+(selected?selected.label:'Type')+'</span>' +
        '<span class="b3d-slot'+(custom.size?' filled':'')+'">'+((sizeOptions.filter(function(o){return o.v===custom.size;})[0]||{}).l||'Size')+'</span>' +
        '<span class="b3d-slot'+(custom.budget?' filled':'')+'">'+((budgetOptions.filter(function(o){return o.v===custom.budget;})[0]||{}).l||'Budget')+'</span>';
    }

    var hintEl = document.createElement('div');
    hintEl.className='b3d-hint';
    hintEl.textContent='Tap a building to select it';
    hintEl.style.display='none';
    hero.appendChild(hintEl);

    function showGoalStep(){
      titleEl.textContent = 'What are you looking to do?';
      swatchEl.innerHTML = goalOptions.map(function(o){
        return '<div class="b3d-swatch'+(custom.goal===o.v?' sel':'')+'" data-v="'+o.v+'">'+o.l+'</div>';
      }).join('');
      swatchEl.querySelectorAll('.b3d-swatch').forEach(function(el){
        el.addEventListener('click', function(){
          custom.goal = el.getAttribute('data-v');
          if(hf_goal) hf_goal.value = custom.goal;
          renderSlots();
          phase='pick';
          introEl.style.opacity='0';
          hintEl.style.display='block';
          titleEl.textContent=''; swatchEl.innerHTML='';
        });
      });
    }

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
      if(phase!=='pick') return;
      var k = raycastSelect(e.clientX, e.clientY);
      if(k) selectBuilding(k);
    });

    function selectBuilding(k){
      selected = buildings.filter(function(b){return b.key===k;})[0];
      hintEl.style.display='none';
      if(hf_type) hf_type.value = TYPE_LABELS[k] || '';
      var extent = selected.group.userData.extent;
      var toPos = new THREE.Vector3(selected.x+extent.w*0.55, extent.h*1.05+1, extent.d*0.85+1);
      var toTarget = new THREE.Vector3(selected.x, extent.h*0.35, 0);
      animState = {toPos:toPos, fromPos:camera.position.clone(), toTarget:toTarget, fromTarget:camTarget.clone(), dur:900, startTime:performance.now()};
      buildings.forEach(function(b){ if(b.key!==k){ b.fadeOut=true; b.labelEl.style.opacity='0'; } });
      phase='customize';
      renderSlots();
      showCustomizer();
    }

    function applySize(){
      if(!selected) return;
      var s = sizeMul[custom.size] || 1;
      selected.group.scale.set(s,s,s);
    }
    function applyBudget(){
      if(!selected || !custom.budget) return;
      if(hf_budget) hf_budget.value = custom.budget;
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

    function showCustomizer(){
      titleEl.textContent = 'Customize your ' + selected.label;
      swatchEl.innerHTML =
        '<div style="grid-column:1/-1;font-size:12px;color:#93C5FD;margin-bottom:2px">Size</div>' +
        sizeOptions.map(function(o){return '<div class="b3d-swatch'+(custom.size===o.v?' sel':'')+'" data-g="size" data-v="'+o.v+'">'+o.l+'</div>';}).join('') +
        '<div style="grid-column:1/-1;font-size:12px;color:#93C5FD;margin:6px 0 2px">Budget</div>' +
        budgetOptions.map(function(o){return '<div class="b3d-swatch'+(custom.budget===o.v?' sel':'')+'" data-g="budget" data-v="'+o.v+'">'+o.l+'</div>';}).join('') +
        (custom.size && custom.budget ? '<div style="grid-column:1/-1"><button type="button" class="b3d-continue" id="b3dContinue">Continue to request &#8594;</button></div>' : '');
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
      var cont = document.getElementById('b3dContinue');
      if(cont) cont.addEventListener('click', function(){
        var target = document.getElementById('intake');
        if(target) target.scrollIntoView({behavior:'smooth'});
      });
      renderSlots();
    }

    function updateLabels(){
      buildings.forEach(function(b){
        if(b.fadeOut) return;
        var pos = new THREE.Vector3(b.x, b.group.userData.topY, 0);
        pos.project(camera);
        var x = (pos.x*0.5+0.5)*hero.clientWidth;
        var y = (-pos.y*0.5+0.5)*hero.clientHeight;
        b.labelEl.style.left = x+'px';
        b.labelEl.style.top = y+'px';
        b.labelEl.style.opacity = pos.z < 1 ? '1' : '0';
      });
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
      updateLabels();
      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);

    renderSlots();
    showGoalStep();
  }
})();
