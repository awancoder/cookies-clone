// =============================================
// Cookies Clone — Landing Page Scripts
// =============================================

document.addEventListener("DOMContentLoaded", () => {
  initNavbar()
  initMobileMenu()
  initScrollAnimations()
  initCountUp()
})

// --- Navbar scroll effect ---
function initNavbar() {
  const navbar = document.getElementById("navbar")
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 40)
  })
}

// --- Mobile menu toggle ---
function initMobileMenu() {
  const toggle = document.getElementById("navbar-toggle")
  const menu = document.getElementById("mobile-menu")

  toggle.addEventListener("click", () => {
    toggle.classList.toggle("active")
    menu.classList.toggle("open")
  })

  // Close on link click
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("open")
      toggle.classList.remove("active")
    })
  })
}

// --- Scroll animations ---
function initScrollAnimations() {
  const elements = document.querySelectorAll("[data-animate]")

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.delay || "0")
          setTimeout(() => {
            entry.target.classList.add("visible")
          }, delay)
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  )

  elements.forEach((el) => observer.observe(el))
}

// --- Count up animation ---
function initCountUp() {
  const counters = document.querySelectorAll("[data-count]")

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target
          const target = parseInt(el.dataset.count)
          animateCount(el, target)
          observer.unobserve(el)
        }
      })
    },
    { threshold: 0.5 }
  )

  counters.forEach((el) => observer.observe(el))
}

function animateCount(el, target) {
  const duration = 1200
  const start = performance.now()

  function update(now) {
    const progress = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
    el.textContent = Math.round(eased * target)

    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }

  requestAnimationFrame(update)
}
