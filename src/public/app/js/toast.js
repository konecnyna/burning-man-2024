let toastTimeout;


async function showToast(message, toastLength = 3000) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');

  toastMessage.textContent = message;

  // Clear any existing timeouts
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  // Reset classes to trigger reflow
  toast.classList.remove('opacity-0', 'opacity-100', 'hidden');
  void toast.offsetWidth;  // Force a reflow to restart the animation

  // Fade in
  toast.classList.add('opacity-100');

  await new Promise((resolve) => {
    toastTimeout = setTimeout(async () => {
      // Fade out
      toast.classList.remove('opacity-100');
      toast.classList.add('opacity-0');
      await sleep(1000); // Wait for the fade-out transition to complete
      toast.classList.add('hidden'); // Hide the toast after fade-out
      resolve();
    }, toastLength);
  });
}