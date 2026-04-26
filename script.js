const themes = ['theme-minimal', 'theme-pigeon', 'theme-vortex'];
const body = document.body;
const toggleBtn = document.getElementById('theme-toggle');
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let currentTheme = '';
let animationFrameId;
let entities = [];
let mouse = { x: null, y: null };

let lastWidth = window.innerWidth;
let lastHeight = window.innerHeight;

// Initialize Canvas Size
function resizeCanvas() {
    // On mobile, scrolling hides/shows the address bar triggering resize. 
    // We only want to rebuild the canvas if the dimensions change significantly (e.g. orientation change).
    if (Math.abs(window.innerWidth - lastWidth) > 50 || Math.abs(window.innerHeight - lastHeight) > 100 || entities.length === 0) {
        lastWidth = window.innerWidth;
        lastHeight = window.innerHeight;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initEntities();
    }
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});
window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
});
window.addEventListener('touchstart', (e) => {
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
});
window.addEventListener('touchmove', (e) => {
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
});
window.addEventListener('touchend', () => {
    mouse.x = null;
    mouse.y = null;
});

// Set random initial theme
function init() {
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    setTheme(randomTheme);
    resizeCanvas();
}

function setTheme(themeName) {
    if (currentTheme) {
        body.classList.remove(currentTheme);
    }
    currentTheme = themeName;
    body.classList.add(currentTheme);
    initEntities();
}

toggleBtn.addEventListener('click', () => {
    let currentIndex = themes.indexOf(currentTheme);
    let nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
});

// --- Canvas Entities & Effects ---

class VortexParticle {
    constructor() {
        this.reset(true);
    }
    reset(randomizePosition = false) {
        this.x = randomizePosition ? Math.random() * canvas.width : (Math.random() > 0.5 ? 0 : canvas.width);
        this.y = randomizePosition ? Math.random() * canvas.height : (Math.random() > 0.5 ? 0 : canvas.height);
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.baseSize = Math.random() * 1.5 + 0.5;
        // Cyan to deep blue/purple hues
        this.color = `hsla(${190 + Math.random() * 60}, 100%, 70%, ${Math.random() * 0.5 + 0.2})`;
    }
    update() {
        let cx = canvas.width / 2;
        let cy = canvas.height / 2;
        let dx = cx - this.x;
        let dy = cy - this.y;
        let distCenter = Math.sqrt(dx*dx + dy*dy);
        
        // Gentle gravitational pull to center to keep them from all flying away
        if (distCenter > 100) {
            this.vx += (dx / distCenter) * 0.02;
            this.vy += (dy / distCenter) * 0.02;
        }

        // Mouse interaction: Vortex Gravity Well
        if (mouse.x !== null && mouse.y !== null) {
            let mdx = mouse.x - this.x;
            let mdy = mouse.y - this.y;
            let mDist = Math.sqrt(mdx*mdx + mdy*mdy);
            let influenceRadius = 350;
            
            if (mDist < influenceRadius) {
                let force = Math.pow((influenceRadius - mDist) / influenceRadius, 2);
                let angle = Math.atan2(mdy, mdx);
                
                // Swirl tangential velocity
                this.vx += Math.cos(angle + Math.PI/2) * force * 1.5;
                this.vy += Math.sin(angle + Math.PI/2) * force * 1.5;
                
                // Slight pull inwards
                this.vx += (mdx / mDist) * force * 0.5;
                this.vy += (mdy / mDist) * force * 0.5;
            }
        }
        
        // Friction to prevent infinite acceleration
        this.vx *= 0.98;
        this.vy *= 0.98;
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Reset if they drift entirely off-screen
        if (this.x < -100 || this.x > canvas.width + 100 || this.y < -100 || this.y > canvas.height + 100) {
            this.reset(true);
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
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 30 + 20; // 20-50px
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.emojis = ['🕊️', '🍞', '🥖', '🐦'];
        this.emoji = this.emojis[Math.floor(Math.random() * this.emojis.length)];
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 2;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        // Robust cross-platform emoji font stack
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

        if (this.x < -this.size) this.x = canvas.width + this.size;
        if (this.x > canvas.width + this.size) this.x = -this.size;
        if (this.y < -this.size) this.y = canvas.height + this.size;
        if (this.y > canvas.height + this.size) this.y = -this.size;
    }
}

function initEntities() {
    entities = [];
    if (currentTheme === 'theme-vortex') {
        // High density for flow field effect
        let numberOfParticles = Math.min((canvas.width * canvas.height) / 4000, 800);
        for (let i = 0; i < numberOfParticles; i++) {
            entities.push(new VortexParticle());
        }
    } else if (currentTheme === 'theme-pigeon') {
        let numberOfEmojis = (canvas.width * canvas.height) / 30000;
        for (let i = 0; i < numberOfEmojis; i++) {
            entities.push(new EmojiEntity());
        }
    }
}

function animate() {
    if (currentTheme === 'theme-vortex') {
        // Trail effect
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(5, 5, 16, 0.15)'; // matches --bg-color #050510
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'lighter';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    for (let i = 0; i < entities.length; i++) {
        entities[i].update();
        entities[i].draw();
    }

    animationFrameId = requestAnimationFrame(animate);
}

init();
animate();
