<template>
  <section class="auth-callback">
    <div class="callback-card">
      <h2>Authenticating…</h2>
      <p>
        The OAuth callback will finalize admin access here. Once wired, this page will close automatically
        and redirect you back to your previous destination.
      </p>
      <RouterLink to="/admin" class="callback-link">Return to admin</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.auth-callback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-gray-100);
  padding: 2rem;
}

.callback-card {
  max-width: 460px;
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: center;
}

.callback-card h2 {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-gray-900);
}

.callback-card p {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
  line-height: 1.6;
}

.callback-link {
  align-self: center;
  font-size: var(--text-sm);
  color: var(--color-white);
  background: var(--color-black);
  border-radius: var(--radius-md);
  padding: 0.65rem 1.25rem;
  transition: background-color var(--transition-base);
}

.callback-link:hover,
.callback-link:focus-visible {
  background-color: var(--color-gray-900);
}
</style>
