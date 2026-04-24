// Purrfect Kittens - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Lightbox functionality
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.close-btn');
    const kittenCards = document.querySelectorAll('.kitten-card');

    kittenCards.forEach(card => {
        card.addEventListener('click', function() {
            const img = this.querySelector('img');
            const name = this.querySelector('h3').textContent;
            lightboxImg.src = img.src.replace('w=400', 'w=800');
            lightboxCaption.textContent = `Meet ${name}! 🐱`;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) closeLightbox();
    });

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Keyboard support for lightbox
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeLightbox();
            closeModal();
        }
    });

    // Filter functionality
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Filter cards
            const filter = this.getAttribute('data-filter');
            kittenCards.forEach(card => {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.classList.remove('hidden');
                    card.style.animation = 'fadeIn 0.5s';
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });

    // Modal functionality
    const modal = document.getElementById('modal');
    const modalClose = document.querySelector('.modal-close');
    const modalTitle = document.getElementById('modal-title');
    const adoptionForm = document.getElementById('adoption-form');

    window.showForm = function(type) {
        const titles = {
            'application': 'Adoption Application',
            'visit': 'Schedule a Visit',
            'homecheck': 'Home Check Information'
        };
        modalTitle.textContent = titles[type] || 'Adoption';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Form submission
    adoptionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const btn = this.querySelector('.submit-btn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Sent!';
        btn.style.background = '#4ecdc4';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
            adoptionForm.reset();
            closeModal();
            alert('Thank you for your interest! We\'ll be in touch soon! 🐱');
        }, 1500);
    });

    // Smooth scroll for navigation
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

    // Add animation styles dynamically
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    // Navbar scroll effect
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
        } else {
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
        }
        
        lastScroll = currentScroll;
    });

    console.log('🐱 Purrfect Kittens website loaded!');
});
