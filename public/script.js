const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');
const year = document.getElementById('year');
const servicesList = document.getElementById('servicesList');
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

if (year) {
  year.textContent = new Date().getFullYear();
}

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('open');
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

async function loadServices() {
  if (!servicesList) return;

  try {
    const response = await fetch('/api/services');
    const data = await response.json();

    servicesList.innerHTML = (data.services || [])
      .map(
        (service) => `
          <article class="info-card reveal">
            <div class="icon">${service.name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase()}</div>
            <h3>${service.name}</h3>
            <p>${service.description}</p>
          </article>
        `
      )
      .join('');

    document.querySelectorAll('.reveal').forEach((element) => {
      observer.observe(element);
    });
  } catch (error) {
    servicesList.innerHTML = `
      <article class="info-card reveal">
        <div class="icon">BW</div>
        <h3>BlackWolf AI</h3>
        <p>AI assistants for support, operations, and business automation.</p>
      </article>
      <article class="info-card reveal">
        <div class="icon">DOC</div>
        <h3>BlackWolf Docs</h3>
        <p>Document digitization, PDF generation, and report automation.</p>
      </article>
      <article class="info-card reveal">
        <div class="icon">FLOW</div>
        <h3>BlackWolf Flow</h3>
        <p>Workflow automation and online forms for modern organizations.</p>
      </article>
      <article class="info-card reveal">
        <div class="icon">STU</div>
        <h3>BlackWolf Studio</h3>
        <p>Modern websites and digital products designed for growth.</p>
      </article>
      <article class="info-card reveal">
        <div class="icon">GEO</div>
        <h3>BlackWolf Geo</h3>
        <p>Mapping, location intelligence, and geospatial analytics.</p>
      </article>
    `;
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
  }
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
loadServices();

if (contactForm) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong.');
      }

      formStatus.textContent = result.message;
      formStatus.style.color = '#7ef0b3';
      contactForm.reset();
    } catch (error) {
      formStatus.textContent = error.message;
      formStatus.style.color = '#ff9bb2';
    }
  });
}
