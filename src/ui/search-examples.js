export function setupSearchExamples() {
  document.querySelectorAll('[data-example-input]').forEach(button => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.exampleInput);
      input.value = button.dataset.exampleValue;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus({ preventScroll: true });
    });
  });
}
