const ENEMY_TYPES = [
    { name: 'normal', size: 20, speed: 1.2, hp: 3, color: 'lime' },
    { name: 'fast', size: 15, speed: 2.5, hp: 1, color: 'yellow' },
    { name: 'tank', size: 30, speed: 0.7, hp: 8, color: 'red' },
    { name: 'zigzag', size: 18, speed: 1.5, hp: 2, color: 'cyan' }
];

function shoot() {
    if (gameOver) return;
    shootSound.play();
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    let speed = 7, size = 5;
    // Add muzzle flash effect for all shooting types except sword/laser
    if (weaponType !== "sword" && weaponType !== "laser") {
        if (typeof window.muzzleFlashes === 'undefined') window.muzzleFlashes = [];
        window.muzzleFlashes.push({ x: player.x, y: player.y, angle, time: Date.now(), color: 'white', size: 22 });
    }
    if (weaponType === "fast") speed = 12;
    if (weaponType === "power") size = 10;
    if (weaponType === "shotgun") {
        // Shoots 5 bullets in a spread
        for (let i = -2; i <= 2; i++) {
            const spreadAngle = angle + i * 0.15;
            bullets.push({
                x: player.x,
                y: player.y,
                dx: Math.cos(spreadAngle) * 7,
                dy: Math.sin(spreadAngle) * 7,
                size: 5
            });
        }
        return;
    }
    if (weaponType === "sniper") {
        // Shoots a single, fast, large bullet
        bullets.push({
            x: player.x,
            y: player.y,
            dx: Math.cos(angle) * 18,
            dy: Math.sin(angle) * 18,
            size: 8
        });
        return;
    }
    if (weaponType === "spread") {
        // Shoots 3 bullets in a small spread
        for (let i = -1; i <= 1; i++) {
            const spreadAngle = angle + i * 0.10;
            bullets.push({
                x: player.x,
                y: player.y,
                dx: Math.cos(spreadAngle) * 9,
                dy: Math.sin(spreadAngle) * 9,
                size: 5
            });
        }
        return;
    }
    if (weaponType === "rapid") {
        // Shoots a small, fast bullet
        bullets.push({
            x: player.x,
            y: player.y,
            dx: Math.cos(angle) * 15,
            dy: Math.sin(angle) * 15,
            size: 3
        });
        return;
    }
    if (weaponType === "sword") {
        // Sword: short range, high damage, wide arc
        const swordRange = 60;
        const swordArc = Math.PI / 2; // 90 degrees
        let hit = false;
        enemies.forEach((e, ei) => {
            const dist = Math.hypot(e.x - player.x, e.y - player.y);
            const angleToEnemy = Math.atan2(e.y - player.y, e.x - player.x);
            const playerAngle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
            let diff = Math.abs(angleToEnemy - playerAngle);
            if (diff > Math.PI) diff = 2 * Math.PI - diff;
            if (dist < swordRange && diff < swordArc / 2) {
                e.hp -= 5; // High damage
                hitSound.play();
                hit = true;
                if (e.hp <= 0) {
                    enemies.splice(ei, 1);
                    score += 100;
                }
            }
        });
        if (!hit) {
            // Optionally play a miss sound
        }
        return;
    }
    if (weaponType === "laser") {
        // Laser: giant beam, damages all enemies in a line
        const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
        const laserLength = 900;
        const laserWidth = 32;
        // Add visual effect
        if (typeof window.laserEffects === 'undefined') window.laserEffects = [];
        window.laserEffects.push({
            x: player.x,
            y: player.y,
            angle: angle,
            length: laserLength,
            width: laserWidth,
            time: Date.now()
        });
        // Damage all enemies in the laser path
        enemies.forEach((e, ei) => {
            // Project enemy position onto laser line
            const dx = e.x - player.x;
            const dy = e.y - player.y;
            const proj = dx * Math.cos(angle) + dy * Math.sin(angle);
            const perp = Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle));
            if (proj > 0 && proj < laserLength && perp < laserWidth / 2 + e.size) {
                e.hp -= 8;
                hitSound.play();
                e.hitFlash = Date.now();
                if (e.hp <= 0) {
                    enemies.splice(ei, 1);
                    score += 100;
                }
            }
        });
        // Optionally damage bosses too
        bosses.forEach((boss, bi) => {
            const dx = boss.x - player.x;
            const dy = boss.y - player.y;
            const proj = dx * Math.cos(angle) + dy * Math.sin(angle);
            const perp = Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle));
            if (proj > 0 && proj < laserLength && perp < laserWidth / 2 + boss.size) {
                boss.hp -= 8;
                hitSound.play();
                if (boss.hp <= 0) {
                    bosses.splice(bi, 1);
                    score += boss.scoreValue;
                }
            }
        });
        return;
    }
    if (weaponType === "bouncer") {
        bullets.push({
            x: player.x,
            y: player.y,
            dx: Math.cos(angle) * 8,
            dy: Math.sin(angle) * 8,
            size: 6,
            bounces: 3 // Number of allowed bounces
        });
        return;
    }
    // Default/basic/fast/power
    bullets.push({
        x: player.x,
        y: player.y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        size: size
    });
}

function spawnEnemy() {
    if (gameOver) return;
    const type = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
    const x = Math.random() * canvas.width;
    const y = Math.random() < 0.5 ? 0 : canvas.height;
    const enemy = {
        x,
        y,
        size: type.size,
        speed: type.speed,
        hp: type.hp,
        color: type.color,
        name: type.name,
        zigzagAngle: 0
    };
    enemies.push(enemy);
}
setInterval(spawnEnemy, 2000);

// In game.js update() (for zigzag):
// enemies.forEach((e, ei) => {
//     if (e.name === 'zigzag') {
//         e.zigzagAngle += 0.2;
//         const angle = Math.atan2(player.y - e.y, player.x - e.x) + Math.sin(e.zigzagAngle) * 0.7;
//         e.x += Math.cos(angle) * e.speed;
//         e.y += Math.sin(angle) * e.speed;
//     } else {
//         const angle = Math.atan2(player.y - e.y, player.x - e.x);
//         e.x += Math.cos(angle) * e.speed;
//         e.y += Math.sin(angle) * e.speed;
//     }
//     // ...existing code...
// });