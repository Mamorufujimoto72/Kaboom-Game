kaboom({
    global: true,
    fullscreen: true,
    debug: true,
    width: window.innerWidth,
    height: window.innerHeight,
    stretch: true,
    letterbox: true
});

setBackground(0, 0, 0);

// Calculate scaling factors based on a reference resolution (1920x1080)
const REF_WIDTH = 1920;
const REF_HEIGHT = 1080;
const scaleX = () => width() / REF_WIDTH;
const scaleY = () => height() / REF_HEIGHT;
const scaleFactor = () => Math.min(scaleX(), scaleY());

loadRoot("./");
loadSprite("Btile", "BlackTile1.png");
loadSprite("Bltile", "BlueTile1.png");
loadSprite("Ptile", "PurpleTile1.png");
loadSprite("Gtile", "GreenTile1.png");
loadSprite("Track", "Track.png");
loadSound("bgM", "BackgroundMusic.mp3");
loadSound("hit", "HitSound.wav");

// Start Scene
scene("start", () => {
    // Title
    add([
        text("Rhythm Game", { 
            size: 64 * scaleFactor(),
        }),
        pos(width() / 2, height() / 2 - 100 * scaleFactor()),
        anchor("center"),
        color(255, 255, 255)
    ]);
    
    // Instructions
    add([
        text("Press any key to start | ESC to stop", { 
            size: 32 * scaleFactor(),
        }),
        pos(width() / 2, height() / 2 + 50 * scaleFactor()),
        anchor("center"),
        color(200, 200, 200)
    ]);
    
    // Key bindings info
    add([
        text("Controls: A | S | K | L", { 
            size: 24 * scaleFactor(),
        }),
        pos(width() / 2, height() / 2 + 150 * scaleFactor()),
        anchor("center"),
        color(150, 150, 150)
    ]);
    
    // Wait for any key press to start the game
    onKeyPress(() => {
        go("main");
    });
});

// Main Game Scene
scene("main", () => {
    const BASE_SPEED = 900 * scaleFactor();
    const MAX_SPEED = 1400 * scaleFactor();
    const HIT_HEIGHT = height() / 2 + 340 * scaleFactor();
    const DESTROY_HEIGHT = height() + 80 * scaleFactor();
    const COOLDOWN_TIME = 0;
    const STREAK_TIMEOUT = 1.5;
    
    const bm = play("bgM", {
        volume: 0.8,
        loop: true
    });
    
    let currentSpeed = BASE_SPEED;
    const SPEED_INCREASE_INTERVAL = 5;
    const SPEED_INCREMENT = 50 * scaleFactor();
    let speedTimer = 0;
    
    const HIT_WINDOW_BEFORE = 100 * scaleFactor();
    const HIT_WINDOW_AFTER = 150 * scaleFactor();
    
    const keyCooldowns = {
        a: 0,
        s: 0,
        k: 0,
        l: 0
    };

    // Score Label
    const scoreLabel = add([
        text("Score: 0", { 
            size: 32 * scaleFactor(),
        }),
        pos(24 * scaleFactor(), 24 * scaleFactor()),
        {
            value: 0,
        },
    ]);
    
    // Streak Label
    const streakLabel = add([
        text("Streak: 0", { 
            size: 28 * scaleFactor(),
        }),
        pos(24 * scaleFactor(), 64 * scaleFactor()),
        {
            value: 0,
            timer: 0,
        },
    ]);
    
    // Speed Label
    const speedLabel = add([
        text("Speed: " + Math.round(currentSpeed), { 
            size: 24 * scaleFactor(),
        }),
        pos(24 * scaleFactor(), 104 * scaleFactor())
    ]);
    
    // Hit zone visual indicator
    add([ 
        rect(width(), HIT_WINDOW_BEFORE + HIT_WINDOW_AFTER),
        pos(0, HIT_HEIGHT - HIT_WINDOW_BEFORE),
        color(255, 255, 255),
        opacity(0.1),
        z(99)
    ]);
    
    // Center line
    add([ 
        rect(width(), 2 * scaleFactor()),
        pos(0, HIT_HEIGHT),
        color(255, 255, 255),
        opacity(0.5),
        z(100)
    ]);
    
    // Track background
    add([ 
        "Track",
        sprite("Track"),
        anchor("bot"),
        pos(width() / 2, height()),
        scale(11 * scaleFactor())
    ]);

    // Tile spawn positions (scaled to resolution)
    const spawnPositions = [
        width() * 0.4050,  // ~779 in 1920x1080
        width() * 0.4714,  // ~905
        width() * 0.5341,  // ~1025
        width() * 0.5979   // ~1146
    ];

    function getSpawnQuantity() {
        const minQuantity = 1;
        const maxQuantity = 0.2;
        const speedRatio = (currentSpeed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED);
        return maxQuantity - (speedRatio * (maxQuantity - minQuantity));
    }

    loop(getSpawnQuantity(), () => {
        const Color = ["Btile", "Bltile", "Gtile", "Ptile"];
        const x = choose(spawnPositions);
        add([
            sprite(choose(Color)),
            pos(x, 0),
            anchor("bot"),
            scale(2.36 * scaleFactor()),
            "obj",
            "Btile",
            {
                hit: false
            }
        ]);
    });

    onUpdate("obj", (o) => {
        o.move(0, currentSpeed);
        if (o.pos.y > DESTROY_HEIGHT) {
            destroy(o);
        }
    });

    onUpdate(() => {
        for (const key in keyCooldowns) {
            if (keyCooldowns[key] > 0) {
                keyCooldowns[key] -= dt();
            }
        }
        
        if (streakLabel.value > 0) {
            streakLabel.timer += dt();
            if (streakLabel.timer > STREAK_TIMEOUT) {
                streakLabel.value = 0;
                streakLabel.text = "Streak: 0";
                streakLabel.timer = 0;
                streakLabel.color = rgb(255, 255, 255);
            }
        }
        
        speedTimer += dt();
        if (speedTimer >= SPEED_INCREASE_INTERVAL && currentSpeed < MAX_SPEED) {
            currentSpeed = Math.min(currentSpeed + SPEED_INCREMENT, MAX_SPEED);
            speedLabel.text = "Speed: " + Math.round(currentSpeed);
            speedTimer = 0;
        }
    });

    function tryHitTile(key, xPos) {
        let hitSuccessful = false;
        
        if (keyCooldowns[key] <= 0) {
            const tile = get("Btile").find(t => 
                Math.abs(t.pos.x - xPos) < 10 * scaleFactor() && 
                t.pos.y >= HIT_HEIGHT - HIT_WINDOW_BEFORE &&
                t.pos.y <= HIT_HEIGHT + HIT_WINDOW_AFTER &&
                !t.hit
            );
            
            if (tile) {
                tile.hit = true;
                destroy(tile);
                const ht = play("hit",{
                    volume: 0.5
                })
                
                scoreLabel.value++;
                scoreLabel.text = "Score: " + scoreLabel.value;
                
                streakLabel.value++;
                streakLabel.text = "Streak: " + streakLabel.value;
                streakLabel.timer = 0;
                
                if (streakLabel.value > 3) {
                    streakLabel.color = rgb(
                        Math.min(255, 100 + streakLabel.value * 10),
                        Math.min(255, 200 - streakLabel.value * 5),
                        Math.min(255, 100 - streakLabel.value * 2)
                    );
                }
                
                keyCooldowns[key] = COOLDOWN_TIME;
                hitSuccessful = true;
            }
        }
        
        if (!hitSuccessful) {
            scoreLabel.value = Math.max(0, scoreLabel.value - 1);
            scoreLabel.text = "Score: " + scoreLabel.value;
            
            streakLabel.value = 0;
            streakLabel.text = "Streak: 0";
            streakLabel.color = rgb(255, 255, 255);
            
            keyCooldowns[key] = COOLDOWN_TIME;
        }
    }

    // Bind keys to scaled positions
    onKeyPress("a", () => tryHitTile("a", spawnPositions[0]));
    onKeyPress("s", () => tryHitTile("s", spawnPositions[1]));
    onKeyPress("k", () => tryHitTile("k", spawnPositions[2]));
    onKeyPress("l", () => tryHitTile("l", spawnPositions[3]));
    
    // Return to start screen
    onKeyPress("escape", () => {
        bm.stop()
        go("start");
    });
});

// Start the game with the start scene
go("start");
