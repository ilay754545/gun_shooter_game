const weaponPrices = {
    basic: 0,
    fast: 300,
    power: 500,
    shotgun: 700,
    sniper: 900,
    spread: 600,
    rapid: 800,
    sword: 400,
    laser: 1200,
    bouncer: 1000,
    uzi: 1100,
    bazooka: 1500,
    plasma: 1800,
    revolver: 950
};

const robotPrices = {
    'basic-robot': 1000,
    'rapid-robot': 2000,
    'sniper-robot': 2500,
    'shotgun-robot': 2200,
    'mini-robot': 500,
    'scout-robot': 750
};

const ownedWeapons = { basic: true };
const ownedRobots = {};
window.ownedRobots = ownedRobots;

function updateRobotShopHighlights() {
    document.querySelectorAll('.robot-option').forEach(option => {
        const type = option.getAttribute('data-type');
        if (ownedRobots[type]) {
            option.classList.add('owned-robot');
            option.style.pointerEvents = 'none';
            option.style.opacity = '0.5';
        } else {
            option.classList.remove('owned-robot');
            option.style.pointerEvents = '';
            option.style.opacity = '';
        }
    });
}

if (typeof updateRobotShopHighlights === 'undefined') window.updateRobotShopHighlights = updateRobotShopHighlights;

document.getElementById("shopBtn").onclick = () => {
  document.getElementById("shopMenu").style.display = "block";
};

document.getElementById("robotsShopBtn").onclick = () => {
  document.getElementById("robotsShopMenu").style.display = "block";
  updateRobotShopHighlights();
};

document.querySelectorAll(".weapon-option").forEach(option => {
    option.onclick = function() {
        const type = option.getAttribute('data-type');
        const msg = document.getElementById('shopMessage');
        msg.textContent = '';
        if (ownedWeapons[type]) {
            weaponType = type;
            document.getElementById('shopMenu').style.display = 'none';
            return;
        }
        if (score >= weaponPrices[type]) {
            score -= weaponPrices[type];
            ownedWeapons[type] = true;
            weaponType = type;
            document.getElementById('shopMenu').style.display = 'none';
        } else {
            msg.textContent = 'אין לך מספיק נקודות!';
        }
    };
});

document.querySelectorAll('.robot-option').forEach(option => {
    const type = option.getAttribute('data-type');
    if (ownedRobots[type]) {
        option.classList.add('owned-robot');
        option.style.pointerEvents = 'none';
        option.style.opacity = '0.5';
    } else {
        option.classList.remove('owned-robot');
        option.style.pointerEvents = '';
        option.style.opacity = '';
    }
    option.onclick = function() {
        if (ownedRobots[type]) return;
        const msg = document.getElementById('shopMessage');
        msg.textContent = '';
        if (ownedRobots[type]) {
            msg.textContent = 'כבר רכשת רובוט זה!';
            return;
        }
        if (score >= robotPrices[type]) {
            score -= robotPrices[type];
            ownedRobots[type] = true;
            window.ownedRobots = ownedRobots;
            msg.textContent = 'רכשת רובוט!';
            if (typeof spawnOwnedRobots === 'function') spawnOwnedRobots();
            updateRobotShopHighlights();
        } else {
            msg.textContent = 'אין לך מספיק נקודות!';
        }
    };
});

document.querySelectorAll('#robotsShopMenu .robot-option').forEach(option => {
    const type = option.getAttribute('data-type');
    if (ownedRobots[type]) {
        option.classList.add('owned-robot');
        option.style.pointerEvents = 'none';
        option.style.opacity = '0.5';
    } else {
        option.classList.remove('owned-robot');
        option.style.pointerEvents = '';
        option.style.opacity = '';
    }
    option.onclick = function() {
        if (ownedRobots[type]) return;
        const msg = document.getElementById('robotsShopMessage');
        msg.textContent = '';
        if (ownedRobots[type]) {
            msg.textContent = 'כבר רכשת רובוט זה!';
            return;
        }
        if (score >= robotPrices[type]) {
            score -= robotPrices[type];
            ownedRobots[type] = true;
            window.ownedRobots = ownedRobots;
            msg.textContent = 'רכשת רובוט!';
            if (typeof spawnOwnedRobots === 'function') spawnOwnedRobots();
            updateRobotShopHighlights();
        } else {
            msg.textContent = 'אין לך מספיק נקודות!';
        }
    };
});

const shopMenu = document.getElementById('shopMenu');
if (shopMenu) {
    shopMenu.addEventListener('transitionend', function() {
        if (typeof spawnOwnedRobots === 'function') spawnOwnedRobots();
    });
}