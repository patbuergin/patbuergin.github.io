const themes = ['theme-minimal', 'theme-pigeon', 'theme-vortex'];
const body = document.body;
const toggleBtn = document.getElementById('theme-toggle');
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let currentTheme = '';
let animationFrameId;
let entities = [];
let mouse = { x: null, y: null };
let dpr = 1;

let lastWidth = 0;

// Initialize Canvas Size
function resizeCanvas(force = false) {
    // On mobile, scrolling hides/shows the address bar, changing innerHeight.
    // To prevent jitter and constant rebuilding, we only resize if the width changes (e.g. orientation change).
    if (force || Math.abs(window.innerWidth - lastWidth) > 10) {
        lastWidth = window.innerWidth;
        
        dpr = window.devicePixelRatio || 1;
        // Use innerWidth/innerHeight for pixel mapping, but scale context for High DPI
        let width = window.innerWidth;
        let height = window.innerHeight;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        
        initEntities(width, height);
    }
}

window.addEventListener('resize', () => resizeCanvas(false));

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
});
window.addEventListener('touchstart', (e) => {
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
}, { passive: true });
window.addEventListener('touchmove', (e) => {
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
}, { passive: true });
window.addEventListener('touchend', () => {
    mouse.x = null;
    mouse.y = null;
});

// Set random initial theme
function init() {
    currentTheme = themes[Math.floor(Math.random() * themes.length)];
    body.classList.add(currentTheme);
    resizeCanvas(true); // Force initial canvas setup
}

function setTheme(themeName) {
    if (currentTheme) {
        body.classList.remove(currentTheme);
    }
    currentTheme = themeName;
    body.classList.add(currentTheme);
    initEntities(window.innerWidth, window.innerHeight);
}

toggleBtn.addEventListener('click', () => {
    let currentIndex = themes.indexOf(currentTheme);
    let nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
});

// --- Canvas Entities & Effects ---

class VortexParticle {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.reset(true);
    }
    reset(randomizePosition = false) {
        this.x = randomizePosition ? Math.random() * this.w : (Math.random() > 0.5 ? -100 : this.w + 100);
        this.y = randomizePosition ? Math.random() * this.h : (Math.random() > 0.5 ? -100 : this.h + 100);
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
        this.baseSize = Math.random() * 1.5 + 0.5;
        this.color = `hsla(${190 + Math.random() * 60}, 100%, 70%, ${Math.random() * 0.5 + 0.2})`;
        
        // Assign each particle a unique base orbit
        let minOrbit = Math.min(this.w, this.h) * 0.25; 
        let maxOrbit = Math.max(this.w, this.h) * 0.6; 
        this.targetOrbit = minOrbit + (Math.random() * (maxOrbit - minOrbit));
        
        // Organic Wobble parameters to break perfectly circular orbits
        this.wobblePhase = Math.random() * Math.PI * 2;
        this.wobbleSpeed = (Math.random() * 0.01) - 0.005; // Slow rotation of the shape
        this.lobes = Math.floor(Math.random() * 3) + 2; // 2 to 4 lobes (creates elliptical or trefoil shapes)
        this.wobbleAmplitude = Math.random() * 60 + 20; // 20px to 80px variance
    }
    update() {
        let cx = this.w / 2;
        let cy = this.h / 2;
        let mdx = cx - this.x;
        let mdy = cy - this.y;
        let mDist = Math.sqrt(mdx*mdx + mdy*mdy);
        
        let influenceRadius = Math.max(this.w, this.h) * 1.5; 
        
        if (mDist > 10) {
            let force = Math.max(0, influenceRadius - mDist) / influenceRadius;
            let angle = Math.atan2(mdy, mdx);
            
            // Tangential swirl
            this.vx += Math.cos(angle + Math.PI/2) * force * 0.4;
            this.vy += Math.sin(angle + Math.PI/2) * force * 0.4;
            
            // Calculate dynamic, non-circular orbit based on angle and time
            this.wobblePhase += this.wobbleSpeed;
            let currentOrbit = this.targetOrbit + Math.sin(angle * this.lobes + this.wobblePhase) * this.wobbleAmplitude;
            
            // Radial force to pull into their dynamic shape
            let radialDiff = (mDist - currentOrbit) / currentOrbit;
            let radialForce = Math.max(-0.8, Math.min(0.8, radialDiff));
            
            this.vx += Math.cos(angle) * radialForce * force * 0.6;
            this.vy += Math.sin(angle) * radialForce * force * 0.6;
        }
        
        // Increased organic noise so it feels like fluid/smoke rather than rigid dots
        this.vx += (Math.random() - 0.5) * 0.3;
        this.vy += (Math.random() - 0.5) * 0.3;
        
        this.vx *= 0.95;
        this.vy *= 0.95;
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Reset particles that somehow drift into the void
        if (this.x < -300 || this.x > this.w + 300 || this.y < -300 || this.y > this.h + 300) {
            this.reset(false);
        }
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.baseSize, 0, Math.PI * 2);
        ctx.fill();
    }
}

class EmojiEntity {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.x = Math.random() * this.w;
        this.y = Math.random() * this.h;
        this.size = Math.random() * 30 + 20;
        this.vx = (Math.random() - 0.5) * 1.5; // Slightly slower for smoother feel
        this.vy = (Math.random() - 0.5) * 1.5;
        this.emojis = ['🕊️', '🍞', '🥖', '🐦'];
        this.emoji = this.emojis[Math.floor(Math.random() * this.emojis.length)];
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 1.5;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.font = `${this.size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", EmojiSymbols, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 0);
        ctx.restore();
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;

        if (this.x < -this.size) this.x = this.w + this.size;
        if (this.x > this.w + this.size) this.x = -this.size;
        if (this.y < -this.size) this.y = this.h + this.size;
        if (this.y > this.h + this.size) this.y = -this.size;
    }
}

function initEntities(w, h) {
    entities = [];
    if (currentTheme === 'theme-vortex') {
        let numberOfParticles = Math.min((w * h) / 4000, 800);
        for (let i = 0; i < numberOfParticles; i++) {
            entities.push(new VortexParticle(w, h));
        }
    } else if (currentTheme === 'theme-pigeon') {
        let numberOfEmojis = (w * h) / 30000;
        for (let i = 0; i < numberOfEmojis; i++) {
            entities.push(new EmojiEntity(w, h));
        }
    }
}

let lastTime = 0;
function animate(time) {
    // We can use a delta time to smooth out framerate drops, but standard requestAnimationFrame is usually fine.
    let w = window.innerWidth;
    let h = window.innerHeight;
    
    if (currentTheme === 'theme-vortex') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(5, 5, 16, 0.15)'; 
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, w, h);
    }
    
    for (let i = 0; i < entities.length; i++) {
        entities[i].update();
        entities[i].draw();
    }

    animationFrameId = requestAnimationFrame(animate);
}

init();
animationFrameId = requestAnimationFrame(animate);
