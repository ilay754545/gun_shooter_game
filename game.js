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
    x: 100,
    y: 100,
    size: 60,
    activeTime: 5000, // ms
    timer: 0,
    isActive: false
};
let lastSafeZoneEntry = 0;
let isInSafeZone = false;

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

function update() {
  if (gameOver) return;

  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

  if (score > 0 && score % 2000 === 0 && !window.bossSpawned) {
    spawnBoss();
    window.bossSpawned = true;
  } else if (score % 2000 !== 0) {
    window.bossSpawned = false;
  }

  bullets.forEach(b => {
    b.x += b.dx;
    b.y += b.dy;
  });

  // Update muzzle flashes
  muzzleFlashes = muzzleFlashes.filter(flash => Date.now() - flash.time < 80);

  // Safe zone logic
  const px = player.x, py = player.y;
  const inZone = px > safeZone.x && px < safeZone.x + safeZone.size && py > safeZone.y && py < safeZone.y + safeZone.size;
  if (inZone) {
      if (!isInSafeZone) {
          // Just entered
          lastSafeZoneEntry = Date.now();
          safeZone.timer = 0;
      }
      safeZone.timer = Date.now() - lastSafeZoneEntry;
      isInSafeZone = true;
      safeZone.isActive = safeZone.timer < safeZone.activeTime;
  } else {
      isInSafeZone = false;
      safeZone.timer = 0;
      safeZone.isActive = false;
  }

  enemies.forEach((e, ei) => {
    const angle = Math.atan2(player.y - e.y, player.x - e.x);
    e.x += Math.cos(angle) * e.speed;
    e.y += Math.sin(angle) * e.speed;

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
    boss.pattern(boss);

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
        robot.x += dx / dist * 2;
        robot.y += dy / dist * 2;
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

// Add shooting event for player
window.addEventListener('mousedown', function(e) {
    if (gameOver || !gameStarted) return;
    // Calculate angle
    const angle = Math.atan2(window.mouse.y - player.y, window.mouse.x - player.x);
    // Add muzzle flash for player
    muzzleFlashes.push({ x: player.x, y: player.y, angle, time: Date.now(), color: 'white', size: 22 });
});

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

  // Draw safe zone
  ctx.save();
  ctx.globalAlpha = safeZone.isActive ? 0.4 : 0.15;
  ctx.fillStyle = safeZone.isActive ? '#00ffcc' : '#888';
  ctx.fillRect(safeZone.x, safeZone.y, safeZone.size, safeZone.size);
  ctx.strokeStyle = '#00ffcc';
  ctx.lineWidth = 2;
  ctx.strokeRect(safeZone.x, safeZone.y, safeZone.size, safeZone.size);
  ctx.restore();
  // Draw safe zone timer if inside
  if (isInSafeZone) {
      ctx.save();
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.fillText('Safe: ' + Math.max(0, ((safeZone.activeTime - safeZone.timer) / 1000).toFixed(1)) + 's', safeZone.x, safeZone.y - 8);
      ctx.restore();
  }

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

function loop() {
    if (!gameStarted) return;
    update();
    draw();
    requestAnimationFrame(loop);
}