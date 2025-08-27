// Flappy-like game (simple, single-file logic)
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const W = canvas.width, H = canvas.height;

// Load images
const assets = {};
let assetsToLoad = 3;
function loadImage(name, src){
  const img = new Image();
  img.src = src;
  img.onload = () => { assets[name]=img; if(--assetsToLoad===0) init(); };
  img.onerror = () => { console.error('Failed to load', src); if(--assetsToLoad===0) init(); };
}
loadImage('bg','assets/background.png');
loadImage('bird','assets/bird.png');
loadImage('pipe','assets/pipe.png');

// Game variables
let frames=0, pipes=[], score=0, best=0;
let running=false, gameOver=false, started=false;

const bird = {
  x: 80,
  y: H/2,
  w: 34,
  h: 24,
  vy: 0,
  gravity: 0.55,
  jump: -9,
  rotation: 0
};

const pipeGap = 150;
const pipeWidth = 52;
const pipeSpeed = 2.2;
const spawnInterval = 90; // frames

// UI
const overlay = document.getElementById('overlay');
const message = document.getElementById('message');
const scoreDisplay = document.getElementById('scoreDisplay');
message.addEventListener('click', handleClick);

// Input
window.addEventListener('mousedown', handleClick);
window.addEventListener('touchstart', (e)=>{ e.preventDefault(); handleClick(); }, {passive:false});
window.addEventListener('keydown', (e)=>{ if(e.code==='Space') handleClick(); });

function handleClick(){
  if(!started){ // start game
    started=true;
    running=true;
    gameOver=false;
    score=0;
    pipes=[];
    frames=0;
    resetBird();
    overlay.classList.add('hidden');
    return;
  }
  if(gameOver){ // restart
    started=true;
    running=true;
    gameOver=false;
    score=0;
    pipes=[];
    frames=0;
    resetBird();
    overlay.classList.add('hidden');
    return;
  }
  // flap
  bird.vy = bird.jump;
}

function resetBird(){
  bird.x = 80;
  bird.y = H/2;
  bird.vy = 0;
  bird.rotation = 0;
}

// Game init after assets loaded
function init(){
  // scale bird size from image if available
  if(assets.bird){
    bird.w = Math.max(24, Math.min(48, assets.bird.width));
    bird.h = Math.max(18, Math.min(36, assets.bird.height));
  }
  loop();
}

// Create a pipe pair
function spawnPipe(){
  const minY = 80;
  const maxY = H - 80 - pipeGap;
  const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
  pipes.push({
    x: W + 10,
    top: y,
    passed: false
  });
}

// Collision detection
function collides(bx,by,bw,bh, rx,ry,rw,rh){
  return bx < rx + rw && bx + bw > rx && by < ry + rh && by + bh > ry;
}

function update(){
  if(!running) return;
  frames++;

  // Bird physics
  bird.vy += bird.gravity;
  bird.y += bird.vy;
  bird.rotation = Math.max(-25, Math.min(90, bird.vy * 3));

  // Spawn pipes
  if(frames % spawnInterval === 0){
    spawnPipe();
  }

  // Move pipes
  for(let i=pipes.length-1;i>=0;i--){
    const p = pipes[i];
    p.x -= pipeSpeed;

    // scoring
    if(!p.passed && p.x + pipeWidth < bird.x){
      score++;
      p.passed = true;
    }

    // remove offscreen
    if(p.x + pipeWidth < -50) pipes.splice(i,1);
  }

  // Collisions with pipes or floor/ceiling
  if(bird.y + bird.h > H - 10 || bird.y < 0){
    endGame();
  }
  for(const p of pipes){
    // top pipe rectangle
    const topRect = {x:p.x, y:0, w:pipeWidth, h:p.top};
    const bottomRect = {x:p.x, y:p.top + pipeGap, w:pipeWidth, h: H - (p.top + pipeGap)};
    if(collides(bird.x, bird.y, bird.w, bird.h, topRect.x, topRect.y, topRect.w, topRect.h) ||
       collides(bird.x, bird.y, bird.w, bird.h, bottomRect.x, bottomRect.y, bottomRect.w, bottomRect.h)){
      endGame();
    }
  }
}

function endGame(){
  running=false;
  gameOver=true;
  started=false;
  overlay.classList.remove('hidden');
  message.textContent = 'Game Over - Click to Restart';
  best = Math.max(best, score);
}

// Draw functions
function drawBackground(){
  if(assets.bg){
    // draw tiled background to fill canvas
    const img = assets.bg;
    const pattern = ctx.createPattern(img, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0,0,W,H);
  } else {
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0,0,W,H);
  }
}

function drawPipes(){
  for(const p of pipes){
    // top pipe
    if(assets.pipe){
      // draw pipe image stretched
      // top piece
      ctx.drawImage(assets.pipe, p.x, p.top - assets.pipe.height, pipeWidth, assets.pipe.height);
      // body top
      ctx.drawImage(assets.pipe, p.x, 0, pipeWidth, p.top);
      // bottom
      ctx.drawImage(assets.pipe, p.x, p.top + pipeGap, pipeWidth, assets.pipe.height);
      // body bottom
      ctx.drawImage(assets.pipe, p.x, p.top + pipeGap, pipeWidth, H - (p.top + pipeGap));
    } else {
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(p.x, 0, pipeWidth, p.top);
      ctx.fillRect(p.x, p.top + pipeGap, pipeWidth, H - (p.top + pipeGap));
    }
  }
}

function drawBird(){
  ctx.save();
  ctx.translate(bird.x + bird.w/2, bird.y + bird.h/2);
  ctx.rotate(bird.rotation * Math.PI / 180);
  if(assets.bird){
    ctx.drawImage(assets.bird, -bird.w/2, -bird.h/2, bird.w, bird.h);
  } else {
    ctx.fillStyle = '#ffdd57';
    ctx.fillRect(-bird.w/2, -bird.h/2, bird.w, bird.h);
  }
  ctx.restore();
}

function drawUI(){
  scoreDisplay.textContent = 'Score: ' + score + (best ? ' | Best: '+best : '');
}

function render(){
  // clear
  ctx.clearRect(0,0,W,H);
  drawBackground();
  drawPipes();
  drawBird();
  drawUI();
  if(!started && !gameOver){
    // show start message
    overlay.classList.remove('hidden');
    message.textContent = 'Click to Start';
  }
}

function loop(){
  update();
  render();
  requestAnimationFrame(loop);
}
