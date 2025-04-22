document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);
canvas.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});
canvas.addEventListener("mousedown", shoot);

// Wall placement logic
window.walls = window.walls || [];
let placingWall = false;

// Listen for wall purchase
if (typeof ownedWeapons !== 'undefined') {
    const shopMenu = document.getElementById('shopMenu');
    if (shopMenu) {
        shopMenu.addEventListener('click', function(e) {
            if (e.target && e.target.classList.contains('weapon-option') && e.target.getAttribute('data-type') === 'wall') {
                placingWall = true;
                shopMenu.style.display = 'none';
            }
        });
    }
}

canvas.addEventListener('mousedown', function(e) {
    if (placingWall) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        // Place wall as a rectangle (40x12)
        walls.push({ x: x - 20, y: y - 6, w: 40, h: 12 });
        placingWall = false;
    }
});