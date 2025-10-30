<template>
  <section class="prompt-editor">
    <header class="editor-header">
      <div>
        <h2>New prompt</h2>
        <p>Draft a new prompt template. Fields are placeholders until the API is ready.</p>
      </div>
      <RouterLink to="/admin/prompts" class="back-link">Back to list</RouterLink>
    </header>

    <form class="editor-form" @submit.prevent="handleSubmit">
      <div class="form-grid">
        <label class="form-field">
          <span>Title</span>
          <input type="text" placeholder="e.g. Product launch teaser" disabled />
        </label>
        <label class="form-field">
          <span>Category</span>
          <input type="text" placeholder="Select category" disabled />
        </label>
        <label class="form-field form-field--full">
          <span>Description</span>
          <textarea rows="3" placeholder="Short summary for the library" disabled></textarea>
        </label>
        <label class="form-field form-field--full">
          <span>Prompt body</span>
          <textarea rows="8" placeholder="Prompt instructions will be entered here" disabled></textarea>
        </label>
        <label class="form-field form-field--full">
          <span>Tags</span>
          <input type="text" placeholder="comma, separated" disabled />
        </label>
      </div>
      <div class="form-actions">
        <button type="button" class="secondary">Save draft</button>
        <button type="submit" class="primary" disabled>Publish</button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
function handleSubmit() {
  console.info('[admin] Prompt creation submission is pending implementation.')
}
</script>

<style scoped>
.prompt-editor {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.editor-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.editor-header h2 {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-gray-900);
}

.editor-header p {
  color: var(--color-gray-500);
  margin-top: 0.5rem;
}

.back-link {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  padding: 0.45rem 0.9rem;
  transition: background-color var(--transition-base);
}

.back-link:hover,
.back-link:focus-visible {
  background-color: var(--color-gray-100);
}

.editor-form {
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field span {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-gray-700);
}

input,
textarea {
  width: 100%;
  padding: 0.75rem 0.85rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-200);
  background-color: var(--color-gray-50);
  color: var(--color-gray-500);
  font-size: var(--text-sm);
  resize: vertical;
}

input:disabled,
textarea:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-end;
}

.primary,
.secondary {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  border: 1px solid var(--color-gray-900);
  transition: background-color var(--transition-base), color var(--transition-base);
}

.primary {
  background-color: var(--color-black);
  color: var(--color-white);
}

.primary:hover,
.primary:focus-visible {
  background-color: var(--color-gray-900);
}

.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondary {
  background-color: var(--color-white);
  color: var(--color-gray-900);
}

.secondary:hover,
.secondary:focus-visible {
  background-color: var(--color-gray-100);
}

@media (max-width: 720px) {
  .editor-form {
    padding: 1.5rem;
  }
}
</style>
