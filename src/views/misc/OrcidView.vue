<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/AuthStore.js'

const authStore = useAuthStore()
const orcidLoginUrl = ref(null)

onMounted(async () => {
  orcidLoginUrl.value = await authStore.getOrcidLoginUrl()
})
</script>

<template>
  <div class="orcid-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">
          <img
            src="/ORCIDiD_iconvector.svg"
            alt="ORCID logo"
            class="hero-icon"
          />
        </div>
        <h1 class="hero-title">ORCID &amp; MorphoBank</h1>
        <p class="hero-subtitle">
          Connect your unique researcher identity with your morphological research
        </p>
        <a :href="orcidLoginUrl" class="hero-cta">
          <img src="/ORCIDiD_iconvector.svg" alt="" class="cta-icon" />
          Sign in with ORCID
        </a>
      </div>
    </section>

    <!-- What is ORCID -->
    <section class="content-section">
      <div class="section-inner">
        <h2 class="section-heading">What is ORCID?</h2>
        <div class="section-line"></div>
        <div class="two-col">
          <div class="col-text">
            <p>
              <strong>ORCID (Open Researcher and Contributor ID)</strong> provides
              a persistent, unique digital identifier that distinguishes you from
              every other researcher. It is free to register and use.
            </p>
            <p>
              Your ORCID iD stays with you throughout your career, connecting you
              reliably to your publications, datasets, peer reviews, and other
              scholarly contributions &mdash; even if you change your name,
              institution, or field of study.
            </p>
            <p>
              ORCID is widely adopted by publishers, funders, and research
              institutions worldwide.
              <a
                href="https://orcid.org"
                target="_blank"
                rel="noopener noreferrer"
              >Learn more at orcid.org</a>
            </p>
          </div>
          <div class="col-visual">
            <div class="stat-card">
              <span class="stat-number">20M+</span>
              <span class="stat-label">Researchers registered</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">1,300+</span>
              <span class="stat-label">Member organizations</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">Free</span>
              <span class="stat-label">To register &amp; use</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Why ORCID with MorphoBank -->
    <section class="content-section alt-bg">
      <div class="section-inner">
        <h2 class="section-heading">Why use ORCID with MorphoBank?</h2>
        <div class="section-line"></div>
        <div class="benefits-grid">
          <div class="benefit-card">
            <div class="benefit-icon">
              <i class="fa-solid fa-fingerprint"></i>
            </div>
            <h3>Unique Attribution</h3>
            <p>
              Ensure your morphological matrices and phylogenetic analyses are
              always correctly attributed to you, regardless of name changes or
              shared names with other researchers.
            </p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon">
              <i class="fa-solid fa-arrow-right-arrow-left"></i>
            </div>
            <h3>Automatic Sync</h3>
            <p>
              When you publish a project on MorphoBank, it can be automatically
              added to your ORCID record &mdash; keeping your scholarly profile
              up to date without extra effort.
            </p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon">
              <i class="fa-solid fa-right-to-bracket"></i>
            </div>
            <h3>Effortless Sign In</h3>
            <p>
              Use your ORCID iD to sign in to MorphoBank with one click. No
              additional password to remember &mdash; your ORCID credentials work
              seamlessly.
            </p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon">
              <i class="fa-solid fa-diagram-project"></i>
            </div>
            <h3>Research Visibility</h3>
            <p>
              Your published projects on MorphoBank become more discoverable and
              integrated within larger research networks through ORCID's global
              infrastructure.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="content-section">
      <div class="section-inner">
        <h2 class="section-heading">How it works</h2>
        <div class="section-line"></div>
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>Create or connect your ORCID iD</h3>
              <p>
                If you don't have an ORCID iD yet, you can create one for free.
                If you already have one, simply sign in to link it with your
                MorphoBank account.
              </p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>Grant write permission</h3>
              <p>
                Optionally grant MorphoBank write access to your ORCID record.
                This allows us to automatically add your published projects to
                your ORCID profile.
              </p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>Publish &amp; sync</h3>
              <p>
                When you publish a project on MorphoBank, it gets added to your
                ORCID record automatically. You remain in full control and can
                opt out at any time from your profile settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="section-inner">
        <h2 class="cta-title">Ready to connect your ORCID?</h2>
        <p class="cta-text">
          Link your ORCID iD to MorphoBank today and keep your research
          record connected.
        </p>
        <div class="cta-buttons">
          <a :href="orcidLoginUrl" class="btn-orcid-cta">
            <img src="/ORCIDiD_iconvector.svg" alt="" class="cta-icon" />
            Sign in with ORCID
          </a>
          <a
            href="https://orcid.org/register"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-register"
          >
            Create an ORCID iD
          </a>
        </div>
        <p class="cta-footnote">
          Already have an account?
          <router-link to="/users/myprofile">Link ORCID from your profile</router-link>
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ── Variables ── */
.orcid-page {
  --orcid-green: #A6CE39;
  --orcid-green-dark: #89ab1f;
  --orcid-green-light: #f3f9e4;
  --mb-text: #333;
  --mb-text-light: #5a6370;
  --mb-bg-alt: #f8f9fa;
  --mb-border: #e2e5e9;
}

/* ── Hero ── */
.hero {
  background: linear-gradient(145deg, #f8f9fa 0%, var(--orcid-green-light) 50%, #f8f9fa 100%);
  padding: 64px 24px 56px;
  text-align: center;
  border-bottom: 3px solid var(--orcid-green);
}

.hero-inner {
  max-width: 640px;
  margin: 0 auto;
}

.hero-badge {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--orcid-green);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  box-shadow: 0 4px 16px rgba(166, 206, 57, 0.35);
}

.hero-icon {
  width: 40px;
  height: 40px;
}

.hero-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--mb-text);
  margin: 0 0 12px;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-size: 1.125rem;
  color: var(--mb-text-light);
  margin: 0 0 32px;
  line-height: 1.5;
}

.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  background: var(--orcid-green);
  color: #fff;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 6px;
  text-decoration: none;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.hero-cta:hover {
  background: var(--orcid-green-dark);
  box-shadow: 0 4px 12px rgba(166, 206, 57, 0.4);
}

.cta-icon {
  width: 28px;
  height: 28px;
  background: #fff;
  border-radius: 50%;
  padding: 2px;
}

/* ── Content sections ── */
.content-section {
  padding: 56px 24px;
}

.content-section.alt-bg {
  background: var(--mb-bg-alt);
}

.section-inner {
  max-width: 880px;
  margin: 0 auto;
}

.section-heading {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--mb-text);
  margin: 0 0 8px;
}

.section-line {
  width: 48px;
  height: 3px;
  background: var(--orcid-green);
  border-radius: 2px;
  margin-bottom: 32px;
}

/* ── Two-column layout ── */
.two-col {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 48px;
  align-items: start;
}

.col-text p {
  color: var(--mb-text-light);
  line-height: 1.7;
  margin: 0 0 16px;
  font-size: 1rem;
}

.col-text a {
  color: var(--orcid-green-dark);
  font-weight: 500;
  text-decoration: none;
}

.col-text a:hover {
  text-decoration: underline;
}

.stat-card {
  background: #fff;
  border: 1px solid var(--mb-border);
  border-left: 3px solid var(--orcid-green);
  border-radius: 6px;
  padding: 16px 20px;
  margin-bottom: 12px;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--orcid-green-dark);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--mb-text-light);
}

/* ── Benefits grid ── */
.benefits-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.benefit-card {
  background: #fff;
  border: 1px solid var(--mb-border);
  border-radius: 8px;
  padding: 28px 24px;
  transition: box-shadow 0.2s ease;
}

.benefit-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.benefit-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--orcid-green-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: var(--orcid-green-dark);
  font-size: 1.2rem;
}

.benefit-card h3 {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--mb-text);
  margin: 0 0 8px;
}

.benefit-card p {
  color: var(--mb-text-light);
  line-height: 1.6;
  margin: 0;
  font-size: 0.925rem;
}

/* ── Steps ── */
.steps {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.step {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--orcid-green);
  color: #fff;
  font-weight: 700;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-content h3 {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--mb-text);
  margin: 0 0 6px;
}

.step-content p {
  color: var(--mb-text-light);
  line-height: 1.6;
  margin: 0;
  font-size: 0.95rem;
}

/* ── CTA section ── */
.cta-section {
  background: linear-gradient(145deg, var(--orcid-green-light) 0%, #f8f9fa 100%);
  padding: 56px 24px;
  text-align: center;
  border-top: 1px solid var(--mb-border);
}

.cta-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--mb-text);
  margin: 0 0 12px;
}

.cta-text {
  color: var(--mb-text-light);
  font-size: 1.05rem;
  margin: 0 0 28px;
  line-height: 1.5;
}

.cta-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.btn-orcid-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  background: var(--orcid-green);
  color: #fff;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 6px;
  text-decoration: none;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.btn-orcid-cta:hover {
  background: var(--orcid-green-dark);
  box-shadow: 0 4px 12px rgba(166, 206, 57, 0.4);
}

.btn-register {
  display: inline-flex;
  align-items: center;
  padding: 14px 28px;
  background: #fff;
  color: var(--orcid-green-dark);
  font-weight: 600;
  font-size: 1rem;
  border: 2px solid var(--orcid-green);
  border-radius: 6px;
  text-decoration: none;
  transition: background 0.2s ease;
}

.btn-register:hover {
  background: var(--orcid-green-light);
}

.cta-footnote {
  margin-top: 20px;
  font-size: 0.9rem;
  color: var(--mb-text-light);
}

.cta-footnote a {
  color: var(--theme-orange, #F17B17);
  text-decoration: none;
  font-weight: 500;
}

.cta-footnote a:hover {
  text-decoration: underline;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .hero-title {
    font-size: 1.6rem;
  }

  .two-col {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .col-visual {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
  }

  .benefits-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .col-visual {
    grid-template-columns: 1fr;
  }

  .hero {
    padding: 48px 20px 40px;
  }

  .content-section {
    padding: 40px 20px;
  }
}
</style>
