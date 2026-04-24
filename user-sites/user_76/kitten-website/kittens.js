// Kitten World - Interactive Gallery and Effects

// Kitten image sources (using placekitten and other reliable sources)
const kittenImages = [
    'https://placekitten.com/400/300',
    'https://placekitten.com/401/301',
    'https://placekitten.com/402/302',
    'https://placekitten.com/403/303',
    'https://placekitten.com/404/304',
    'https://placekitten.com/405/305',
    'https://placekitten.com/406/306',
    'https://placekitten.com/407/307',
    'https://placekitten.com/408/308',
    'https://placekitten.com/409/309',
    'https://placekitten.com/410/310',
    'https://placekitten.com/411/311'
];

let currentImageIndex = 0;
const imagesPerLoad = 6;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadGalleryImages();
    setupEventListeners();
    setupSmoothScroll();
});

// Load gallery images
function loadGalleryImages() {
    const gallery = document.getElementById('gallery-grid');
    const endIndex = Math.min(currentImageIndex + imagesPerLoad, kittenImages.length);
    
    for (let i = currentImageIndex; i < endIndex; i++) {
        const item = createGalleryItem(kittenImages[i], i);
        gallery.appendChild(item);
    }
    
    currentImageIndex = endIndex;
    
    // Hide load more button if all images loaded
    if (currentImageIndex >= kittenImages.length) {
        document.getElementById('load-more').style.display = 'none';
    }
}

// Create gallery item element
function createGalleryItem(src, index) {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.onclick = () => openModal(src, `Adorable Kitten #${index + 1}`);
    
    // Create placeholder while loading
    const placeholder = document.createElement('div');
    placeholder.className = 'gallery-placeholder';
    placeholder.innerHTML = `
        <div class="placeholder-emoji">🐱</div>
        <span>Loading kitten...</span>
    `;
    item.appendChild(placeholder);
    
    // Load image
    const img = new Image();
    img.onload = function() {
        placeholder.remove();
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        item.appendChild(img);
    };
    img.onerror = function() {
        placeholder.innerHTML = `
            <div class="placeholder-emoji">😺</div>
            <span>Kitten is napping!</span>
        `;
    };
    img.src = src;
    
    return item;
}

// Setup event listeners
function setupEventListeners() {
    // Load more button
    document.getElementById('load-more').addEventListener('click', loadGalleryImages);
    
    // Modal close button
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    
    // Close modal on outside click
    document.getElementById('image-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Open image modal
function openModal(src, caption) {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const modalCaption = document.getElementById('modal-caption');
    
    modal.style.display = 'block';
    modalImg.src = src;
    modalCaption.textContent = caption;
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

// Close image modal
function closeModal() {
    const modal = document.getElementById('image-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Scroll to gallery section
function scrollToGallery() {
    document.getElementById('gallery').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

// Setup smooth scroll for navigation links
function setupSmoothScroll() {
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
}

// Add some fun interactive effects
document.addEventListener('mousemove', function(e) {
    // Subtle parallax effect on hero section
    const hero = document.querySelector('.hero');
    if (hero && window.scrollY < window.innerHeight) {
        const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
        const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
        
        const emoji = document.querySelector('.kitten-emoji');
        if (emoji) {
            emoji.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }
    }
});

// Fact cards animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe fact cards for scroll animation
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.fact-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});

console.log('🐱 Kitten World loaded! Welcome to the cuteness.');
