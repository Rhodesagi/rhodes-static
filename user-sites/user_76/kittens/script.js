// Kitten World - Interactive Features

// Lightbox functionality
function openLightbox(emoji, name) {
  const lightbox = document.getElementById('lightbox');
  const content = document.getElementById('lightbox-content');
  const caption = document.getElementById('lightbox-caption');
  
  content.textContent = emoji;
  caption.textContent = name;
  lightbox.classList.add('active');
  
  // Prevent scrolling while lightbox is open
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  lightbox.classList.remove('active');
  
  // Re-enable scrolling
  document.body.style.overflow = '';
}

// Close lightbox when clicking outside the content
document.addEventListener('click', function(e) {
  const lightbox = document.getElementById('lightbox');
  if (e.target === lightbox) {
    closeLightbox();
  }
});

// Close lightbox with Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeLightbox();
  }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Add hover effect to cards with slight tilt
const cards = document.querySelectorAll('.kitten-card, .gallery-item');
cards.forEach(card => {
  card.addEventListener('mousemove', function(e) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
  });
  
  card.addEventListener('mouseleave', function() {
    card.style.transform = '';
  });
});

// Console easter egg
console.log('%c 🐱 Welcome to Kitten World! 🐱 ', 'font-size: 24px; background: linear-gradient(135deg, #ffb6c1, #ff69b4); color: white; padding: 10px 20px; border-radius: 10px;');
console.log('%cYou found the secret console message! Have a purr-fect day! 🐾', 'font-size: 14px; color: #ff69b4;');
