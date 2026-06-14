// Web Audio API Sci-Fi Sound Synthesizer & Canvas Confetti Generator

let audioCtx = null;
let soundEnabled = false;

// Initialize Audio Context on user gesture
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function initSoundState() {
    const saved = localStorage.getItem('soundEnabled');
    soundEnabled = saved === 'true';
    updateSoundIcon();
}

function toggleSound() {
    initAudio();
    soundEnabled = !soundEnabled;
    localStorage.setItem('soundEnabled', soundEnabled);
    updateSoundIcon();
    
    if (soundEnabled) {
        // Play a pleasant double chime to confirm sound is ON
        playBeep(523.25, 'sine', 0.08); // C5
        setTimeout(() => {
            playBeep(659.25, 'sine', 0.08); // E5
        }, 80);
        showToast("เปิดใช้งานเสียงเอฟเฟกต์แล้ว", "info");
    } else {
        showToast("ปิดเสียงเอฟเฟกต์แล้ว", "info");
    }
}

function updateSoundIcon() {
    const icon = document.getElementById('soundToggleIcon');
    const btn = document.getElementById('soundToggleBtn');
    if (icon) {
        if (soundEnabled) {
            icon.className = 'fas fa-volume-up';
            if (btn) btn.setAttribute('data-tooltip', 'ปิดเสียงเอฟเฟกต์');
        } else {
            icon.className = 'fas fa-volume-mute';
            if (btn) btn.setAttribute('data-tooltip', 'เปิดเสียงเอฟเฟกต์');
        }
    }
}

// Low tick for menu hovers
function playTick() {
    if (!soundEnabled) return;
    try {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.frequency.setValueAtTime(180, audioCtx.currentTime);
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.04);
    } catch (e) {
        console.warn("Audio failed to play", e);
    }
}

// Tech beep for button clicks
function playBeep(freq = 600, type = 'sine', duration = 0.08) {
    if (!soundEnabled) return;
    try {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.type = type;
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        console.warn("Audio failed to play", e);
    }
}

// Success chime for task completion / AI recommendations loaded
function playSuccess() {
    if (!soundEnabled) return;
    try {
        initAudio();
        const now = audioCtx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);
            osc.type = 'triangle';
            gain.gain.setValueAtTime(0.0, now + idx * 0.07);
            gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.07 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.3);
            
            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.35);
        });
    } catch (e) {
        console.warn("Audio failed to play", e);
    }
}

// Notification chime for incoming chatbot messages
function playNotification() {
    if (!soundEnabled) return;
    try {
        initAudio();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.frequency.setValueAtTime(440.00, now); // A4
        osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.15); // A5
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.3);
    } catch (e) {
        console.warn("Audio failed to play", e);
    }
}

// Canvas Confetti Celebration
function triggerConfetti() {
    const canvas = document.createElement('canvas');
    canvas.className = 'confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '9999';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Theme colors: gold, yellow, orange, green, blue, pink
    const colors = ['#D4A017', '#FFA500', '#FF4500', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63'];
    const particles = [];
    
    for (let i = 0; i < 100; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: -20 - Math.random() * 80,
            size: 6 + Math.random() * 8,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedY: 2 + Math.random() * 4,
            speedX: -1.5 + Math.random() * 3,
            rotation: Math.random() * 360,
            rotationSpeed: -2 + Math.random() * 4,
            opacity: 1
        });
    }
    
    let animationId;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;
        
        particles.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += p.rotationSpeed;
            if (p.y > canvas.height - 20) {
                p.opacity -= 0.02;
            }
            if (p.opacity > 0) {
                active = true;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            }
        });
        
        if (active) {
            animationId = requestAnimationFrame(animate);
        } else {
            cancelAnimationFrame(animationId);
            canvas.remove();
        }
    }
    
    animate();
}

document.addEventListener('DOMContentLoaded', () => {
    initSoundState();
});

// ===== 1. ANIMATED COUNTER =====
function animateCounters() {
    const counters = document.querySelectorAll('.kpi-value[data-target]');
    counters.forEach(counter => {
        const target = parseFloat(counter.getAttribute('data-target'));
        const decimals = parseInt(counter.getAttribute('data-decimals')) || 0;
        const suffix = counter.getAttribute('data-suffix') || '';
        const duration = 1500; // ms
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-out cubic formula
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = easeProgress * target;
            
            counter.innerText = currentValue.toFixed(decimals) + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                counter.innerText = target.toFixed(decimals) + suffix;
            }
        }
        
        requestAnimationFrame(update);
    });
}

// ===== 2. 3D TILT CARDS =====
function initTiltCards() {
    const cards = document.querySelectorAll('.kpi-card');
    cards.forEach(card => {
        // Add glare overlay dynamically if not already present
        if (!card.querySelector('.kpi-card-glare')) {
            const glare = document.createElement('div');
            glare.className = 'kpi-card-glare';
            card.appendChild(glare);
        }
        
        const glare = card.querySelector('.kpi-card-glare');
        
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position inside card
            const y = e.clientY - rect.top;  // y position inside card
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calculate tilt angle (max 15 degrees for clear 3D perspective)
            const rotateY = ((x - centerX) / centerX) * 15;
            const rotateX = -((y - centerY) / centerY) * 15;
            
            // Disable transition for real-time cursor tracking
            card.style.transition = 'none';
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
            
            // Position glare
            if (glare) {
                glare.style.opacity = '1';
                glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 80%)`;
                if (document.body.classList.contains('dark-theme')) {
                    glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(212, 160, 23, 0.25) 0%, rgba(255,255,255,0) 80%)`;
                }
            }
        });
        
        card.addEventListener('mouseleave', () => {
            // Restore smooth transition when leaving
            card.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s, border-color 0.3s';
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
            if (glare) {
                glare.style.opacity = '0';
            }
        });
    });
}

// ===== 3. INTERACTIVE PARTICLE TRAIL =====
let lastSparkleTime = 0;
function initParticleTrail() {
    const dashboard = document.getElementById('dashboard');
    if (!dashboard) return;
    
    dashboard.addEventListener('mousemove', e => {
        const now = performance.now();
        // Throttle sparkle creation (max 1 every 20ms)
        if (now - lastSparkleTime < 20) return;
        lastSparkleTime = now;
        
        // Spawn sparkle particle
        const particle = document.createElement('div');
        particle.className = 'sparkle-particle';
        
        // Position relative to document/page
        particle.style.left = `${e.pageX}px`;
        particle.style.top = `${e.pageY}px`;
        
        // Random offset for movement
        const randomX = (Math.random() - 0.5) * 60;
        const randomY = (Math.random() - 0.5) * 60 - 30; // lean upwards
        particle.style.setProperty('--tx', `${randomX}px`);
        particle.style.setProperty('--ty', `${randomY}px`);
        
        document.body.appendChild(particle);
        
        // Auto clean up
        setTimeout(() => {
            particle.remove();
        }, 800);
    });
}

// ===== 4. SVG PROGRESS RINGS =====
function initProgressRings() {
    const bars = document.querySelectorAll('.kpi-ring-bar');
    bars.forEach(bar => {
        const val = parseFloat(bar.getAttribute('data-value')) || 0;
        const radius = bar.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        
        // Set up SVG stroke properties
        bar.style.strokeDasharray = `${circumference}`;
        bar.style.strokeDashoffset = `${circumference}`;
        
        // Force reflow
        bar.getBoundingClientRect();
        
        // Animate offset to actual progress
        const offset = circumference - (val / 100) * circumference;
        bar.style.strokeDashoffset = offset;
    });
}
