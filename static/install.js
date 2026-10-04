// Capture install readiness before the app hydrates, and retain it across navigation.
window.roseInstall = { prompt: null, installed: false };
window.addEventListener('beforeinstallprompt', event => {
 event.preventDefault();
 window.roseInstall.prompt = event;
 window.dispatchEvent(new Event('rose-install-state'));
});
window.addEventListener('appinstalled', () => {
 window.roseInstall.prompt = null;
 window.roseInstall.installed = true;
 window.dispatchEvent(new Event('rose-install-state'));
});
