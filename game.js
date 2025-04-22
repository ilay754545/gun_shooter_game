// GUN Shooter Game
// Version: 1.0.0
// A top-down shooter game with multiple weapons, bosses, robots, and visual effects.
// Developed by Ilay
// Enjoy and have fun!

window.canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Sound initialization
const shootSound = new Audio('sounds/shoot.mp3');
const hitSound = new Audio('sounds/hit.mp3');
const playerHitSound = new Audio('sounds/player_hit.mp3');
const music = new Audio('sounds/music.mp3');
music.loop = true;
music.volume = 0.5;

function startMusicOnce() {
    music.play();
    window.removeEventListener('mousedown', startMusicOnce);
    window.removeEventListener('keydown', startMusicOnce);
}
window.addEventListener('mousedown', startMusicOnce);
window.addEventListener('keydown', startMusicOnce);

window.player = { x: 400, y: 300, size: 20, speed: 4, lives: 3 };
window.bullets = [];
window.enemies = [];
window.bosses = [];
window.robots = [];

// Visual effects arrays
let swordEffects = [];
let enemyHitEffects = [];
let muzzleFlashes = [];

// Safe zone properties
const safeZone = {
    x: 60,
    y: 60,
    size: 180, // Increased size for bigger safe zone
    activeTime: 5000, // ms
    timer: 0,
    isActive: false
};
let lastSafeZoneEntry = 0;
let isInSafeZone = false;

// Support multiple safe zones
window.safeZones = [safeZone];

// Ensure robots are spawned at game start if any are owned
if (typeof ownedRobots !== 'undefined') {
    spawnOwnedRobots();
}

window.score = 0;
window.weaponType = "basic";
window.gameOver = false;
window.keys = {};
window.mouse = { x: 0, y: 0 };

let showEndScreen = false;

function showEnd() {
    showEndScreen = true;
    document.getElementById('endScreen').style.display = 'flex';
}

document.getElementById('endRestartBtn').onclick = function() {
    showEndScreen = false;
    document.getElementById('endScreen').style.display = 'none';
    resetGame();
};

function spawnOwnedRobots() {
    const now = Date.now();
    robots = [];
    if (window.ownedRobots && window.ownedRobots['basic-robot']) {
        robots.push({
            type: 'basic-robot',
            x: player.x + 40,
            y: player.y + 40,
            cooldown: 0,
            spawnTime: now,
            lifetime: 45000 // 45 seconds
        });
    }
    if (window.ownedRobots && window.ownedRobots['rapid-robot']) {
        robots.push({
            type: 'rapid-robot',
            x: player.x - 40,
            y: player.y - 40,
            cooldown: 0,
            spawnTime: now,
            lifetime: 90000 // 90 seconds
        });
    }
    if (window.ownedRobots && window.ownedRobots['sniper-robot']) {
        robots.push({
            type: 'sniper-robot',
            x: player.x + 60,
            y: player.y - 60,
            cooldown: 0,
            spawnTime: now,
            lifetime: 120000 // 120 seconds
        });
    }
    if (window.ownedRobots && window.ownedRobots['shotgun-robot']) {
        robots.push({
            type: 'shotgun-robot',
            x: player.x - 60,
            y: player.y + 60,
            cooldown: 0,
            spawnTime: now,
            lifetime: 60000 // 60 seconds
        });
    }
    if (window.ownedRobots && window.ownedRobots['mini-robot']) {
        robots.push({
            type: 'mini-robot',
            x: player.x + 20,
            y: player.y + 60,
            cooldown: 0,
            spawnTime: now,
            lifetime: 30000 // 30 seconds
        });
    }
    if (window.ownedRobots && window.ownedRobots['scout-robot']) {
        robots.push({
            type: 'scout-robot',
            x: player.x - 20,
            y: player.y - 60,
            cooldown: 0,
            spawnTime: now,
            lifetime: 40000 // 40 seconds
        });
    }
}

// Call this after shop purchase
if (window.ownedRobots) spawnOwnedRobots();

let gameStarted = false;

function startGame() {
    document.getElementById('welcomeScreen').style.display = 'none';
    gameStarted = true;
    loop();
}

document.getElementById('welcomeScreen').addEventListener('click', startGame);

function resetGame() {
    // Reset player
    player.x = 400;
    player.y = 300;
    player.lives = 3;
    // Reset game state
    score = 0;
    bullets = [];
    enemies = [];
    bosses = [];
    robots = [];
    gameOver = false;
    weaponType = 'basic';
    if (window.ownedRobots) spawnOwnedRobots();
    document.getElementById('respawnBtn').style.display = 'none';
    loop();
}

document.getElementById('respawnBtn').onclick = resetGame;

// Responsive canvas for mobile
function resizeCanvas() {
    let w = window.innerWidth, h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Show mobile controls if on mobile
function isMobile() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}
if (isMobile()) {
    document.getElementById('mobileControls').style.display = 'flex';
}

// Mobile joystick and shoot button logic
let joystickActive = false, joystickStart = {x:0, y:0};
let moveDir = {x:0, y:0};
const joystick = document.getElementById('joystick');
joystick.addEventListener('touchstart', e => {
    joystickActive = true;
    joystickStart = {x: e.touches[0].clientX, y: e.touches[0].clientY};
});
joystick.addEventListener('touchmove', e => {
    if (!joystickActive) return;
    const dx = e.touches[0].clientX - joystickStart.x;
    const dy = e.touches[0].clientY - joystickStart.y;
    moveDir.x = dx; moveDir.y = dy;
});
joystick.addEventListener('touchend', e => {
    joystickActive = false;
    moveDir = {x:0, y:0};
});
document.getElementById('shootBtn').addEventListener('touchstart', e => {
    shoot();
});

let lastFrameTime = performance.now();

function loop() {
    if (!gameStarted) return;
    const now = performance.now();
    const delta = Math.min((now - lastFrameTime) / 16.6667, 2); // 1 = 60fps, clamp to avoid spikes
    lastFrameTime = now;
    update(delta);
    draw();
    requestAnimationFrame(loop);
}

function update(delta = 1) {
  if (gameOver) return;

  if (keys["w"]) player.y -= player.speed * delta;
  if (keys["s"]) player.y += player.speed * delta;
  if (keys["a"]) player.x -= player.speed * delta;
  if (keys["d"]) player.x += player.speed * delta;

  // Clamp player position to stay within the visible screen
  player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));

  // Mobile movement
  if (isMobile() && (Math.abs(moveDir.x) > 10 || Math.abs(moveDir.y) > 10)) {
      const len = Math.hypot(moveDir.x, moveDir.y);
      player.x += (moveDir.x/len) * player.speed * delta;
      player.y += (moveDir.y/len) * player.speed * delta;
  }

  if (score > 0 && score % 2000 === 0 && !window.bossSpawned) {
    spawnBoss();
    window.bossSpawned = true;
  } else if (score % 2000 !== 0) {
    window.bossSpawned = false;
  }

  bullets.forEach(b => {
    b.x += b.dx * delta;
    b.y += b.dy * delta;
  });

  // Update muzzle flashes
  muzzleFlashes = muzzleFlashes.filter(flash => Date.now() - flash.time < 80);

  // Safe zone logic
  const px = player.x, py = player.y;
  let inAnyZone = false;
  window.safeZones.forEach(sz => {
    if (px > sz.x && px < sz.x + sz.size && py > sz.y && py < sz.y + sz.size) {
      sz.isActive = true;
      inAnyZone = true;
    } else {
      sz.isActive = false;
    }
  });
  isInSafeZone = inAnyZone;

  enemies.forEach((e, ei) => {
    // Calculate next position
    const angle = Math.atan2(player.y - e.y, player.x - e.x);
    const nextX = e.x + Math.cos(angle) * e.speed * delta;
    const nextY = e.y + Math.sin(angle) * e.speed * delta;
    // Check if next position would be inside the safe zone
    const inSafe = nextX > safeZone.x && nextX < safeZone.x + safeZone.size && nextY > safeZone.y && nextY < safeZone.y + safeZone.size;
    // Check wall collision (line)
    let collidesWall = false;
    if (window.walls) {
      for (const wall of window.walls) {
        if (circleLineCollides(nextX, nextY, e.size, wall.x1, wall.y1, wall.x2, wall.y2)) {
          collidesWall = true;
          break;
        }
      }
    }
    if (!inSafe && !collidesWall) {
      e.x = nextX;
      e.y = nextY;
    }

    const dist = Math.hypot(player.x - e.x, player.y - e.y);
    if (dist < player.size + e.size) {
      if (!(isInSafeZone && safeZone.isActive)) {
        enemies.splice(ei, 1);
        player.lives -= 1;
        playerHitSound.play();
        if (player.lives <= 0) gameOver = true;
      }
    }
  });

  bosses.forEach((boss, bi) => {
    // Calculate next position
    const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
    const nextX = boss.x + Math.cos(angle) * boss.speed * delta;
    const nextY = boss.y + Math.sin(angle) * boss.speed * delta;
    // Check if next position would be inside any safe zone
    let inSafe = false;
    if (window.safeZones) {
      for (const sz of window.safeZones) {
        if (nextX > sz.x && nextX < sz.x + sz.size && nextY > sz.y && nextY < sz.y + sz.size) {
          inSafe = true;
          break;
        }
      }
    }
    if (!inSafe) {
      boss.x = nextX;
      boss.y = nextY;
    }
    boss.pattern(boss, delta);

    const dist = Math.hypot(player.x - boss.x, player.y - boss.y);
    if (dist < player.size + boss.size) {
      if (!(isInSafeZone && safeZone.isActive)) {
        player.lives--;
        playerHitSound.play();
        if (player.lives <= 0) gameOver = true;
      }
    }
  });

  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      const dist = Math.hypot(b.x - e.x, b.y - e.y);
      if (dist < e.size + b.size) {
        if (b.bounces && b.bounces > 0) {
          // Reflect bullet direction
          const nx = (b.x - e.x) / dist;
          const ny = (b.y - e.y) / dist;
          const dot = b.dx * nx + b.dy * ny;
          b.dx = b.dx - 2 * dot * nx;
          b.dy = b.dy - 2 * dot * ny;
          b.bounces--;
          e.hp -= 1;
          hitSound.play();
          enemyHitEffects.push({ x: e.x, y: e.y, time: Date.now() });
          if (e.hp <= 0) {
            enemies.splice(ei, 1);
            score += 100;
          } else {
            e.hitFlash = Date.now();
          }
        } else {
          bullets.splice(bi, 1);
          let dmg = 1;
          if (weaponType === "fast") dmg = 0.5;
          if (weaponType === "power") dmg = 2;
          e.hp -= dmg;
          hitSound.play();
          enemyHitEffects.push({ x: e.x, y: e.y, time: Date.now() });
          if (e.hp <= 0) {
            enemies.splice(ei, 1);
            score += 100;
          } else {
            e.hitFlash = Date.now();
          }
        }
      }
    });

    bosses.forEach((boss, bi) => {
      const dist = Math.hypot(b.x - boss.x, b.y - boss.y);
      if (dist < boss.size + b.size) {
        bullets.splice(bi, 1);
        let dmg = 1;
        if (weaponType === "fast") dmg = 0.5;
        if (weaponType === "power") dmg = 2;
        boss.hp -= dmg;
        hitSound.play();
        if (boss.hp <= 0) {
          bosses.splice(bi, 1);
          score += boss.scoreValue;
        }
      }
    });
  });

  // Bounce bouncer bullets off walls
  bullets.forEach((b, bi) => {
    if (b.bounces && b.bounces > 0) {
      let bounced = false;
      if (b.x - b.size < 0 || b.x + b.size > canvas.width) {
        b.dx *= -1;
        b.bounces--;
        bounced = true;
      }
      if (b.y - b.size < 0 || b.y + b.size > canvas.height) {
        b.dy *= -1;
        b.bounces--;
        bounced = true;
      }
      if (b.bounces <= 0) bullets.splice(bi, 1);
    }
  });

  // Remove bouncer bullets if out of bounces or out of bounds
  bullets = bullets.filter(b => {
    if (b.bounces !== undefined) {
      return b.bounces > 0 && b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height;
    }
    return b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height;
  });

  // Update robots
  robots.forEach(robot => {
    // Follow player
    const dx = player.x - robot.x;
    const dy = player.y - robot.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 50) {
        robot.x += dx / dist * 2 * delta;
        robot.y += dy / dist * 2 * delta;
    }
    // Shoot at nearest enemy
    if (robot.cooldown > 0) robot.cooldown--;
    let target = null, minDist = Infinity;
    enemies.forEach(e => {
        const d = Math.hypot(e.x - robot.x, e.y - robot.y);
        if (d < minDist) {
            minDist = d;
            target = e;
        }
    });
    if (target && robot.cooldown === 0) {
        const angle = Math.atan2(target.y - robot.y, target.x - robot.x);
        // Add muzzle flash for robot
        muzzleFlashes.push({ x: robot.x, y: robot.y, angle, time: Date.now(), color: 'yellow', size: 18 });
        if (robot.type === 'mini-robot') {
            bullets.push({ x: robot.x, y: robot.y, dx: Math.cos(angle) * 5, dy: Math.sin(angle) * 5, size: 3 });
            robot.cooldown = 50;
        } else if (robot.type === 'scout-robot') {
            bullets.push({ x: robot.x, y: robot.y, dx: Math.cos(angle) * 10, dy: Math.sin(angle) * 10, size: 4 });
            robot.cooldown = 25;
        } else if (robot.type === 'rapid-robot') {
            let speed = 14, size = 3;
            bullets.push({ x: robot.x, y: robot.y, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed, size });
            robot.cooldown = 10;
        } else if (robot.type === 'sniper-robot') {
            let speed = 20, size = 8;
            bullets.push({ x: robot.x, y: robot.y, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed, size });
            robot.cooldown = 60;
        } else if (robot.type === 'shotgun-robot') {
            for (let i = -2; i <= 2; i++) {
                const spreadAngle = angle + i * 0.18;
                bullets.push({ x: robot.x, y: robot.y, dx: Math.cos(spreadAngle) * 7, dy: Math.sin(spreadAngle) * 7, size: 5 });
            }
            robot.cooldown = 40;
        } else {
            // basic-robot
            let speed = 8, size = 5;
            bullets.push({ x: robot.x, y: robot.y, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed, size });
            robot.cooldown = 30;
        }
    }
  });

  // Remove robots after their individual lifetime
  const now = Date.now();
  robots = robots.filter(robot => now - robot.spawnTime < robot.lifetime);

  // Update sword effects
  swordEffects = swordEffects.filter(e => Date.now() - e.time < 120);

  // Update enemy hit effects
  enemyHitEffects = enemyHitEffects.filter(e => Date.now() - e.time < 100);

  // Check for boss defeat and show end screen
  if (bosses.length === 0 && window.bossSpawned && !showEndScreen) {
      showEnd();
      window.bossSpawned = false;
  }
}

// Wall placement as lines
window.walls = window.walls || [];
window.placingWall = false;
window.wallStart = null;

// Listen for wall purchase
if (typeof ownedWeapons !== 'undefined') {
    const shopMenu = document.getElementById('shopMenu');
    if (shopMenu) {
        shopMenu.addEventListener('click', function(e) {
            if (e.target && e.target.classList.contains('weapon-option') && e.target.getAttribute('data-type') === 'wall') {
                window.placingWall = true;
                window.wallStart = null;
                shopMenu.style.display = 'none';
            }
        });
    }
}

canvas.addEventListener('mousedown', function(e) {
    if (window.placingWall) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (!window.wallStart) {
            window.wallStart = { x, y };
        } else {
            // Store wall as a line
            window.walls.push({ x1: window.wallStart.x, y1: window.wallStart.y, x2: x, y2: y });
            // Add a new safe zone at the midpoint of the wall
            const mx = (window.wallStart.x + x) / 2;
            const my = (window.wallStart.y + y) / 2;
            window.safeZones.push({
                x: mx - 90, // 180x180 size like main safe zone
                y: my - 90,
                size: 180,
                isActive: false
            });
            window.placingWall = false;
            window.wallStart = null;
        }
        return;
    }
    // Add shooting event for player
    if (gameOver || !gameStarted) return;
    // Calculate angle
    const angle = Math.atan2(window.mouse.y - player.y, window.mouse.x - player.x);
    // Add muzzle flash for player
    muzzleFlashes.push({ x: player.x, y: player.y, angle, time: Date.now(), color: 'white', size: 22 });
});

// Helper: check if a circle (enemy) crosses a wall line
function circleLineCollides(cx, cy, r, x1, y1, x2, y2) {
    // Closest point on line segment to circle center
    const dx = x2 - x1, dy = y2 - y1;
    const l2 = dx*dx + dy*dy;
    let t = ((cx - x1) * dx + (cy - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    const px = x1 + t * dx, py = y1 + t * dy;
    const dist = Math.hypot(cx - px, cy - py);
    return dist < r + 6; // 6 is wall thickness/2
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Gradient background
  const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGradient.addColorStop(0, '#1a1a2e');
  bgGradient.addColorStop(1, '#16213e');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw muzzle flashes
  muzzleFlashes.forEach(flash => {
    ctx.save();
    ctx.globalAlpha = 0.7 - 0.7 * ((Date.now() - flash.time) / 80);
    ctx.translate(flash.x, flash.y);
    ctx.rotate(flash.angle);
    ctx.shadowColor = flash.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = flash.color;
    ctx.beginPath();
    ctx.ellipse(18, 0, flash.size, flash.size / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Draw sword effects
  swordEffects.forEach(e => {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, e.angle - e.arc / 2, e.angle + e.arc / 2);
    ctx.stroke();
    ctx.restore();
  });

  // Draw laser effects
  if (window.laserEffects) {
      window.laserEffects = window.laserEffects.filter(e => Date.now() - e.time < 120);
      window.laserEffects.forEach(e => {
          ctx.save();
          ctx.globalAlpha = 0.5;
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = e.width;
          ctx.beginPath();
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(e.x + Math.cos(e.angle) * e.length, e.y + Math.sin(e.angle) * e.length);
          ctx.stroke();
          ctx.restore();
      });
  }

  // Draw shadow under player
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + player.size * 0.7, player.size * 1.1, player.size * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Draw player with detailed design
  ctx.save();
  // Glow
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 18;
  // Gradient body
  const grad = ctx.createRadialGradient(player.x, player.y, player.size * 0.3, player.x, player.y, player.size);
  grad.addColorStop(0, '#fff');
  grad.addColorStop(0.7, '#4ecdc4');
  grad.addColorStop(1, '#20639b');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fill();
  // Border
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#173f5f';
  ctx.stroke();
  // Face (eyes)
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(player.x - player.size * 0.35, player.y - player.size * 0.2, player.size * 0.13, 0, Math.PI * 2);
  ctx.arc(player.x + player.size * 0.35, player.y - player.size * 0.2, player.size * 0.13, 0, Math.PI * 2);
  ctx.fill();
  // Mouth
  ctx.beginPath();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.arc(player.x, player.y + player.size * 0.18, player.size * 0.32, 0, Math.PI);
  ctx.stroke();
  // Hand and gun
  const handLen = player.size + 8;
  const handAngle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  const handX = player.x + Math.cos(handAngle) * handLen;
  const handY = player.y + Math.sin(handAngle) * handLen;
  // Hand (small circle)
  ctx.fillStyle = '#ffe0b2';
  ctx.beginPath();
  ctx.arc(handX, handY, player.size * 0.23, 0, Math.PI * 2);
  ctx.fill();
  // Gun (varies by weaponType)
  ctx.save();
  ctx.translate(handX, handY);
  ctx.rotate(handAngle);
  if (weaponType === 'uzi') {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, -player.size * 0.13, player.size * 1.0, player.size * 0.26);
    ctx.fillStyle = '#0ff';
    ctx.fillRect(player.size * 0.7, -player.size * 0.09, player.size * 0.3, player.size * 0.18);
    ctx.fillStyle = '#888';
    ctx.fillRect(player.size * 0.2, -player.size * 0.18, player.size * 0.2, player.size * 0.36);
  } else if (weaponType === 'bazooka') {
    ctx.fillStyle = '#444';
    ctx.fillRect(0, -player.size * 0.18, player.size * 1.5, player.size * 0.36);
    ctx.fillStyle = '#a00';
    ctx.beginPath();
    ctx.arc(player.size * 1.5, 0, player.size * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.fillRect(player.size * 0.5, -player.size * 0.09, player.size * 0.3, player.size * 0.18);
  } else if (weaponType === 'plasma') {
    ctx.fillStyle = '#0ff';
    ctx.fillRect(0, -player.size * 0.13, player.size * 1.1, player.size * 0.26);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(player.size * 1.1, 0, player.size * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0ff';
    ctx.fillRect(player.size * 0.7, -player.size * 0.09, player.size * 0.3, player.size * 0.18);
  } else if (weaponType === 'revolver') {
    ctx.fillStyle = '#888';
    ctx.fillRect(0, -player.size * 0.13, player.size * 0.8, player.size * 0.26);
    ctx.fillStyle = '#222';
    ctx.fillRect(player.size * 0.6, -player.size * 0.09, player.size * 0.25, player.size * 0.18);
    ctx.fillStyle = '#b97a56';
    ctx.fillRect(-player.size * 0.18, -player.size * 0.09, player.size * 0.18, player.size * 0.18);
  } else if (weaponType === 'bouncer') {
    ctx.fillStyle = '#00e6e6';
    ctx.fillRect(0, -player.size * 0.13, player.size * 1.1, player.size * 0.26);
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.size * 0.8, -player.size * 0.09, player.size * 0.4, player.size * 0.18);
  } else if (weaponType === 'laser') {
    ctx.fillStyle = '#0ff';
    ctx.fillRect(0, -player.size * 0.18, player.size * 1.3, player.size * 0.36);
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.size * 1.1, -player.size * 0.09, player.size * 0.2, player.size * 0.18);
  } else if (weaponType === 'shotgun') {
    ctx.fillStyle = '#964B00';
    ctx.fillRect(0, -player.size * 0.18, player.size * 1.2, player.size * 0.36);
    ctx.fillStyle = '#222';
    ctx.fillRect(player.size * 0.9, -player.size * 0.09, player.size * 0.3, player.size * 0.18);
  } else if (weaponType === 'sniper') {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, -player.size * 0.09, player.size * 1.5, player.size * 0.18);
    ctx.fillStyle = '#0ff';
    ctx.fillRect(player.size * 1.2, -player.size * 0.05, player.size * 0.3, player.size * 0.1);
  } else if (weaponType === 'sword') {
    ctx.fillStyle = '#ccc';
    ctx.fillRect(0, -player.size * 0.06, player.size * 1.3, player.size * 0.12);
    ctx.fillStyle = '#b97a56';
    ctx.fillRect(-player.size * 0.18, -player.size * 0.13, player.size * 0.18, player.size * 0.26);
  } else if (weaponType === 'flamethrower') {
    ctx.fillStyle = '#ff9800';
    ctx.fillRect(0, -player.size * 0.18, player.size * 1.2, player.size * 0.36);
    ctx.fillStyle = '#fff176';
    ctx.fillRect(player.size * 0.9, -player.size * 0.09, player.size * 0.4, player.size * 0.18);
    ctx.beginPath();
    ctx.arc(player.size * 1.2, 0, player.size * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = '#ff5722';
    ctx.fill();
  } else if (weaponType === 'minigun') {
    ctx.fillStyle = '#888';
    ctx.fillRect(0, -player.size * 0.13, player.size * 1.3, player.size * 0.26);
    ctx.fillStyle = '#222';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(player.size * (0.7 + i * 0.18), -player.size * 0.09, player.size * 0.12, player.size * 0.18);
    }
  } else if (weaponType === 'railgun') {
    ctx.fillStyle = '#607d8b';
    ctx.fillRect(0, -player.size * 0.09, player.size * 1.6, player.size * 0.18);
    ctx.fillStyle = '#00e6e6';
    ctx.fillRect(player.size * 1.3, -player.size * 0.05, player.size * 0.3, player.size * 0.1);
  } else if (weaponType === 'blaster') {
    ctx.fillStyle = '#ab47bc';
    ctx.fillRect(0, -player.size * 0.13, player.size * 1.1, player.size * 0.26);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(player.size * 1.1, 0, player.size * 0.18, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Default/basic/fast/power/spread/rapid
    ctx.fillStyle = '#444';
    ctx.fillRect(0, -player.size * 0.13, player.size * 1.1, player.size * 0.26);
    ctx.fillStyle = '#222';
    ctx.fillRect(player.size * 0.8, -player.size * 0.09, player.size * 0.4, player.size * 0.18);
  }
  ctx.restore();
  ctx.restore();

  // Draw bullets with glow
  bullets.forEach(b => {
    ctx.save();
    if (b.bounces !== undefined) {
      // Bouncer bullet: glowing blue circle
      ctx.shadowColor = '#00e6e6';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#00e6e6';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size + 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Regular bullet
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 12;
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  enemies.forEach(e => {
    ctx.fillStyle = "lime";
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
    ctx.fill();

    // Draw hit effect
    if (e.hitFlash && Date.now() - e.hitFlash < 100) {
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size + 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = "green";
    ctx.fillRect(e.x - 20, e.y - e.size - 10, (e.hp / 3) * 40, 5);
    ctx.strokeStyle = "white";
    ctx.strokeRect(e.x - 20, e.y - e.size - 10, 40, 5);
  });

  bosses.forEach(boss => {
    ctx.save();
    ctx.shadowColor = boss.color;
    ctx.shadowBlur = 24;
    ctx.fillStyle = boss.color;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, boss.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "red";
    const healthWidth = 100;
    const healthHeight = 10;
    ctx.fillRect(boss.x - healthWidth / 2, boss.y - boss.size - 20, (boss.hp / boss.maxHp) * healthWidth, healthHeight);
    ctx.strokeStyle = "white";
    ctx.strokeRect(boss.x - healthWidth / 2, boss.y - boss.size - 20, healthWidth, healthHeight);
  });

  // Draw shadow under robots
  robots.forEach(robot => {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(robot.x, robot.y + 12, 15, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  // Draw robots with glow
  robots.forEach(robot => {
    ctx.save();
    let color = 'orange';
    if (robot.type === 'rapid-robot') color = 'cyan';
    if (robot.type === 'sniper-robot') color = 'purple';
    if (robot.type === 'shotgun-robot') color = 'brown';
    if (robot.type === 'mini-robot') color = 'pink';
    if (robot.type === 'scout-robot') color = 'yellow';
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(robot.x, robot.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Draw all safe zones
  window.safeZones.forEach(sz => {
    ctx.save();
    ctx.globalAlpha = sz.isActive ? 0.4 : 0.15;
    ctx.fillStyle = sz.isActive ? '#00ffcc' : '#888';
    ctx.fillRect(sz.x, sz.y, sz.size, sz.size);
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2;
    ctx.strokeRect(sz.x, sz.y, sz.size, sz.size);
    ctx.restore();
  });

  // Draw enemy hit effects
  enemyHitEffects.forEach(eff => {
    const age = Date.now() - eff.time;
    if (age < 100) {
      ctx.save();
      ctx.globalAlpha = 0.7 - 0.7 * (age / 100);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(eff.x, eff.y, 28 * (1 + age / 100), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  });

  // Draw walls as thick lines
  if (window.walls) {
    window.walls.forEach(wall => {
      ctx.save();
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.moveTo(wall.x1, wall.y1);
      ctx.lineTo(wall.x2, wall.y2);
      ctx.stroke();
      ctx.restore();
    });
  }

  // Draw bullet trails
  if (!window.bulletTrails) window.bulletTrails = [];
  bullets.forEach(b => {
    window.bulletTrails.push({ x: b.x, y: b.y, color: b.bounces !== undefined ? '#00e6e6' : 'red', time: Date.now() });
  });
  window.bulletTrails = window.bulletTrails.filter(pt => Date.now() - pt.time < 180);
  window.bulletTrails.forEach(pt => {
    ctx.save();
    ctx.globalAlpha = 0.25 - 0.25 * ((Date.now() - pt.time) / 180);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Draw pulsing boss glow
  bosses.forEach(boss => {
    ctx.save();
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 200);
    ctx.shadowColor = boss.color;
    ctx.shadowBlur = 44 * pulse;
    ctx.globalAlpha = 0.18 * pulse;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, boss.size * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Draw animated background grid
  const gridSpacing = 60;
  const gridOffset = (Date.now() / 20) % gridSpacing;
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = '#fff';
  for (let x = -gridSpacing + gridOffset; x < canvas.width; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = -gridSpacing + gridOffset; y < canvas.height; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("נקודות: " + Math.floor(score), 10, 30);
  ctx.fillText("חיים: " + player.lives, 10, 60);
  ctx.fillText("רובה: " + weaponType, 10, 90);

  if (showEndScreen) {
      document.getElementById('endScreen').style.display = 'flex';
      return;
  }

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "50px Arial";
    ctx.fillText("GAME OVER", 250, 300);
    document.getElementById('respawnBtn').style.display = 'block';
  } else {
    document.getElementById('respawnBtn').style.display = 'none';
  }
}

// Make all safe zones bigger
window.safeZones.forEach(sz => { sz.size = 260; sz.x = sz.x - 40; sz.y = sz.y - 40; });