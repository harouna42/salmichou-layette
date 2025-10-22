try {
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('/sw.js')
      .catch(() => console.log('SW registration skipped'));
  }
} catch (error) {
  console.log('SW not supported in this environment');
}