chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'copy') {
    const textarea = document.createElement('textarea');
    textarea.value = message.text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    sendResponse({ success: true });
  }
}); 