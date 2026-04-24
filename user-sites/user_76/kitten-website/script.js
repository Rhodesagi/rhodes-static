// Kitten Website JavaScript

// Smooth scroll to gallery
function scrollToGallery() {
    document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
}

// Lightbox functionality
function openLightbox(element) {
    const img = element.querySelector('img');
    const caption = element.querySelector('.caption');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    
    // Use a larger version of the image for the lightbox
    const largeSrc = img.src.replace('/300/300', '/600/600');
    
    lightboxImg.src = largeSrc;
    lightboxCaption.textContent = caption.textContent;
    lightbox.classList.add('active');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    
    // Re-enable body scroll
    document.body.style.overflow = 'auto';
}

// Close lightbox with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLightbox();
    }
});

// Fun facts carousel
let currentFactIndex = 0;
const totalFacts = 5;

function showFact(index) {
    // Update fact cards
    const cards = document.querySelectorAll('.fact-card');
    cards.forEach(card => card.classList.remove('active'));
    cards[index].classList.add('active');
    
    // Update buttons
    const buttons = document.querySelectorAll('.fact-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    buttons[index].classList.add('active');
    
    currentFactIndex = index;
}

// Auto-rotate facts every 5 seconds
function nextFact() {
    const nextIndex = (currentFactIndex + 1) % totalFacts;
    showFact(nextIndex);
}

// Start auto-rotation
let factInterval = setInterval(nextFact, 5000);

// Reset timer when user clicks a button
document.querySelectorAll('.fact-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        clearInterval(factInterval);
        factInterval = setInterval(nextFact, 5000);
    });
});

// Initialize first button as active
document.addEventListener('DOMContentLoaded', function() {
    const firstButton = document.querySelector('.fact-btn');
    if (firstButton) {
        firstButton.classList.add('active');
    }
});

// Add a subtle parallax effect to the hero kitten
document.addEventListener('mousemove', function(e) {
    const kitten = document.querySelector('.hero-kitten');
    if (kitten && window.innerWidth > 768) {
        const x = (window.innerWidth - e.pageX * 2) / 100;
        const y = (window.innerHeight - e.pageY * 2) / 100;
        kitten.style.transform = `rotate(${x * 0.5}deg) translate(${x}px, ${y}px)`;
    }
});

// Console easter egg
console.log('%c 🐱 Welcome to Kitten Paradise! 🐱 ', 'font-size: 20px; background: #ffb6c1; color: white; border-radius: 10px; padding: 10px;');
console.log('%c You found the secret console message! ', 'font-size: 14px; color: #ffa07a;');
console.log('%c Have a purr-fect day! 😸 ', 'font-size: 12px; color: #4a4a4a;');
