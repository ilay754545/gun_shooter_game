const BOSS_TYPES = {
    TANK: {
        hp: 1000,
        size: 40,
        speed: 0.8,
        color: "#ff4400",
        scoreValue: 1000,
        pattern: (boss) => {
            const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
            boss.x += Math.cos(angle) * boss.speed;
            boss.y += Math.sin(angle) * boss.speed;
        }
    },
    DASHER: {
        hp: 30,
        size: 35,
        speed: 0.5,
        dashSpeed: 8,
        color: "#ff00ff",
        scoreValue: 800,
        pattern: (boss) => {
            boss.dashTimer = boss.dashTimer || 0;
            boss.dashTimer++;
            
            if (boss.dashTimer > 120) {
                const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
                boss.x += Math.cos(angle) * boss.dashSpeed;
                boss.y += Math.sin(angle) * boss.dashSpeed;
                if (boss.dashTimer > 150) boss.dashTimer = 0;
            } else {
                const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
                boss.x += Math.cos(angle) * boss.speed;
                boss.y += Math.sin(angle) * boss.speed;
            }
        }
    },
    LASER: {
        hp: 400,
        size: 38,
        speed: 1.1,
        color: "#00e6e6",
        scoreValue: 1200,
        laserCooldown: 0,
        pattern: (boss) => {
            // Move toward player
            const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
            boss.x += Math.cos(angle) * boss.speed;
            boss.y += Math.sin(angle) * boss.speed;
            // Fire laser every 100 frames
            boss.laserCooldown = boss.laserCooldown || 0;
            boss.laserCooldown++;
            if (boss.laserCooldown > 100) {
                if (typeof window.laserEffects === 'undefined') window.laserEffects = [];
                window.laserEffects.push({
                    x: boss.x,
                    y: boss.y,
                    angle: angle,
                    length: 600,
                    width: 24,
                    time: Date.now(),
                    bossLaser: true
                });
                // Optionally damage player if in line
                const dx = player.x - boss.x;
                const dy = player.y - boss.y;
                const proj = dx * Math.cos(angle) + dy * Math.sin(angle);
                const perp = Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle));
                if (proj > 0 && proj < 600 && perp < 24 / 2 + player.size) {
                    player.lives--;
                    playerHitSound.play();
                    if (player.lives <= 0) gameOver = true;
                }
                boss.laserCooldown = 0;
            }
        }
    }
};

function spawnBoss() {
    const bossTypes = Object.keys(BOSS_TYPES);
    const selectedType = bossTypes[Math.floor(Math.random() * bossTypes.length)];
    const bossData = BOSS_TYPES[selectedType];
    
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(side) {
        case 0: x = 0; y = Math.random() * canvas.height; break;
        case 1: x = canvas.width; y = Math.random() * canvas.height; break;
        case 2: x = Math.random() * canvas.width; y = 0; break;
        case 3: x = Math.random() * canvas.width; y = canvas.height; break;
    }
    
    const boss = {
        x, y,
        type: selectedType,
        hp: bossData.hp,
        maxHp: bossData.hp,
        size: bossData.size,
        speed: bossData.speed,
        color: bossData.color,
        scoreValue: bossData.scoreValue,
        pattern: bossData.pattern
    };
    
    bosses.push(boss);
}