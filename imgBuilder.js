(function(){
  document.addEventListener('DOMContentLoaded', init);

  var TYPES = [
    {key:'office', label:'Office'},
    {key:'warehouse', label:'Warehouse'},
    {key:'retail', label:'Shopping center'},
    {key:'land', label:'Land'}
  ];
  var TYPE_LABELS = {office:'Office', warehouse:'Industrial / Warehouse', retail:'Retail', land:'Land'};
  var TIERS = ['economy','standard','premium'];

  function imgSrc(type, tier){ return 'images/' + type + '-' + tier + '.jpg'; }

  function init(){
    var hero = document.getElementById('hero3d');
    if(!hero) return;

    var layers = document.getElementById('heroLayers');
    var grid = document.getElementById('heroGrid');
    var introEl = document.getElementById('hero3dIntro');
    var slotsEl = document.getElementById('b3dSlots');
    var titleEl = document.getElementById('b3dTitle');
    var swatchEl = document.getElementById('b3dSwatches');
    var hf_goal = document.getElementById('hf_property_goal');
    var hf_type = document.getElementById('hf_property_type');
    var hf_budget = document.getElementById('hf_budget');

    var imgEls = {};
    TYPES.forEach(function(t){
      TIERS.forEach(function(tier){
        var img = document.createElement('img');
        img.src = imgSrc(t.key, tier);
        img.alt = t.label + ' - ' + tier;
        layers.appendChild(img);
        imgEls[t.key+'-'+tier] = img;
      });
    });

    var goalOptions = [
      {v:'Buy Commercial Property', l:'Buy'},
      {v:'Lease Commercial Space', l:'Lease'},
      {v:'SBA Owner-User Purchase', l:'SBA purchase'},
      {v:'Investment Property', l:'Invest'}
    ];
    var budgetOptions=[
      {v:'Under $250,000', l:'Economy', tier:'economy'},
      {v:'$500,000-$1M', l:'Standard', tier:'standard'},
      {v:'$3M-$5M', l:'Premium', tier:'premium'}
    ];
    var sizeOptions=[{v:'small',l:'Under 5,000 SF'},{v:'med',l:'5,000-25,000 SF'},{v:'large',l:'25,000+ SF'}];

    var state = {goal:null, type:null, tier:'economy', size:null};
    var cycleTimer = null;
    var cycleIndex = 0;
    var cycleTypes = ['office','warehouse','retail','land'];

    function startCycle(){
      stopCycle();
      showLayer(cycleTypes[cycleIndex], 'standard');
      cycleTimer = setInterval(function(){
        cycleIndex = (cycleIndex + 1) % cycleTypes.length;
        showLayer(cycleTypes[cycleIndex], 'standard');
      }, 4000);
    }
    function stopCycle(){
      if(cycleTimer){ clearInterval(cycleTimer); cycleTimer = null; }
    }

    function showLayer(type, tier){
      Object.keys(imgEls).forEach(function(k){ imgEls[k].classList.remove('active'); });
      var key = type + '-' + tier;
      if(imgEls[key]) imgEls[key].classList.add('active');
    }
    function hideAllLayers(){
      Object.keys(imgEls).forEach(function(k){ imgEls[k].classList.remove('active'); });
    }

    function renderSlots(){
      slotsEl.innerHTML =
        '<span class="b3d-slot'+(state.goal?' filled':'')+'">'+((goalOptions.filter(function(o){return o.v===state.goal;})[0]||{}).l||'Goal')+'</span>' +
        '<span class="b3d-slot'+(state.type?' filled':'')+'">'+((TYPES.filter(function(t){return t.key===state.type;})[0]||{}).label||'Type')+'</span>' +
        '<span class="b3d-slot'+(state.size?' filled':'')+'">'+((sizeOptions.filter(function(o){return o.v===state.size;})[0]||{}).l||'Size')+'</span>' +
        '<span class="b3d-slot'+(state.type?' filled':'')+'">'+((budgetOptions.filter(function(o){return o.tier===state.tier;})[0]||{}).l||'Budget')+'</span>';
    }

    function backButtonHtml(){
      return '<button type="button" class="b3d-back" id="b3dBack">&#8592; Back</button>';
    }

    function showGoalStep(){
      state.type = null;
      startCycle();
      grid.classList.remove('show');
      introEl.style.opacity = '1';
      titleEl.textContent = 'What are you looking to do?';
      swatchEl.innerHTML = goalOptions.map(function(o){
        return '<div class="b3d-swatch'+(state.goal===o.v?' sel':'')+'" data-v="'+o.v+'">'+o.l+'</div>';
      }).join('');
      swatchEl.querySelectorAll('.b3d-swatch').forEach(function(el){
        el.addEventListener('click', function(){
          state.goal = el.getAttribute('data-v');
          if(hf_goal) hf_goal.value = state.goal;
          renderSlots();
          introEl.style.opacity = '0';
          showTypeGrid();
        });
      });
      renderSlots();
    }

    function showTypeGrid(){
      state.type = null;
      stopCycle();
      titleEl.innerHTML = backButtonHtml();
      swatchEl.innerHTML = '';
      document.getElementById('b3dBack').addEventListener('click', showGoalStep);
      grid.innerHTML = TYPES.map(function(t){
        return '<div class="hero-thumb" data-k="'+t.key+'"><img src="'+imgSrc(t.key,'economy')+'" alt="'+t.label+'"><div class="hero-thumb-label">'+t.label+'</div></div>';
      }).join('');
      grid.classList.add('show');
      grid.querySelectorAll('.hero-thumb').forEach(function(el){
        el.addEventListener('click', function(){
          var k = el.getAttribute('data-k');
          zoomIntoType(el, k);
        });
      });
      renderSlots();
    }

    function zoomIntoType(thumbEl, k){
      var thumbImg = thumbEl.querySelector('img');
      var rect = thumbImg.getBoundingClientRect();
      var heroRect = hero.getBoundingClientRect();

      var clone = thumbImg.cloneNode(true);
      clone.style.position = 'absolute';
      clone.style.left = (rect.left - heroRect.left) + 'px';
      clone.style.top = (rect.top - heroRect.top) + 'px';
      clone.style.width = rect.width + 'px';
      clone.style.height = rect.height + 'px';
      clone.style.objectFit = 'cover';
      clone.style.objectPosition = 'center 30%';
      clone.style.borderRadius = '12px';
      clone.style.zIndex = '5';
      clone.style.transition = 'left 700ms cubic-bezier(.2,.7,.2,1), top 700ms cubic-bezier(.2,.7,.2,1), width 700ms cubic-bezier(.2,.7,.2,1), height 700ms cubic-bezier(.2,.7,.2,1), border-radius 700ms ease, filter 700ms ease';
      clone.style.filter = 'brightness(0.85)';
      hero.appendChild(clone);

      grid.classList.remove('show');

      requestAnimationFrame(function(){
        clone.style.left = '0px';
        clone.style.top = '0px';
        clone.style.width = heroRect.width + 'px';
        clone.style.height = heroRect.height + 'px';
        clone.style.borderRadius = '0px';
        clone.style.filter = 'brightness(0.75)';
      });

      setTimeout(function(){
        selectType(k);
        setTimeout(function(){ clone.remove(); }, 60);
      }, 700);
    }

    function selectType(k){
      state.type = k;
      state.tier = 'economy';
      if(hf_type) hf_type.value = TYPE_LABELS[k] || '';
      showLayer(k, 'economy');
      renderSlots();
      showCustomizer();
    }

    function applyBudget(tier){
      state.tier = tier;
      var budgetVal = (budgetOptions.filter(function(o){return o.tier===tier;})[0]||{}).v;
      if(hf_budget) hf_budget.value = budgetVal || '';
      showLayer(state.type, tier);
    }

    function noteSize(){
      var notes = document.querySelector('textarea[name="additional_notes"]');
      if(!notes || !state.size) return;
      var label = (sizeOptions.filter(function(o){return o.v===state.size;})[0]||{}).l;
      var marker = 'Approx size selected: ';
      var lines = notes.value.split('\n').filter(function(l){ return l.indexOf(marker)!==0; });
      lines.push(marker+label);
      notes.value = lines.join('\n').trim();
    }

    function showCustomizer(){
      var typeLabel = (TYPES.filter(function(t){return t.key===state.type;})[0]||{}).label;
      titleEl.innerHTML = backButtonHtml() + '<div>Customize your ' + typeLabel + '</div>';
      document.getElementById('b3dBack').addEventListener('click', showTypeGrid);
      swatchEl.innerHTML =
        '<div style="grid-column:1/-1;font-size:12px;color:#93C5FD;margin-bottom:2px">Size</div>' +
        sizeOptions.map(function(o){return '<div class="b3d-swatch'+(state.size===o.v?' sel':'')+'" data-g="size" data-v="'+o.v+'">'+o.l+'</div>';}).join('') +
        '<div style="grid-column:1/-1;font-size:12px;color:#93C5FD;margin:6px 0 2px">Budget</div>' +
        budgetOptions.map(function(o){return '<div class="b3d-swatch'+(state.tier===o.tier?' sel':'')+'" data-g="budget" data-v="'+o.tier+'">'+o.l+'</div>';}).join('') +
        (state.size ? '<div style="grid-column:1/-1"><button type="button" class="b3d-continue" id="b3dContinue">Continue to request &#8594;</button></div>' : '');
      swatchEl.querySelectorAll('.b3d-swatch').forEach(function(el){
        el.addEventListener('click', function(){
          var group = el.getAttribute('data-g'), val = el.getAttribute('data-v');
          if(group==='size'){ state.size = val; noteSize(); }
          if(group==='budget'){ applyBudget(val); }
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

    renderSlots();
    showGoalStep();
  }
})();

