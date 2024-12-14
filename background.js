let currentLanguage = chrome.i18n.getUILanguage();

// 初始化时加载语言设置
chrome.runtime.onInstalled.addListener(async () => {
  const { language } = await chrome.storage.local.get('language');
  if (language) {
    currentLanguage = language;
  }
  updateContextMenu();
});

// 更新右键菜单的函数
function updateContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'generatePassword',
      title: chrome.i18n.getMessage('generatePasswordContextMenu'),
      contexts: ['all']
    });
  });
}

// 监听语言变更消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'updateLanguage') {
    currentLanguage = message.language;
    updateContextMenu();
    sendResponse({ success: true });
  }
  return true;
});

// 创建离屏文档的函数
async function createOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['CLIPBOARD'],
    justification: 'Write text to clipboard'
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'generatePassword') {
    const { history = [] } = await chrome.storage.local.get('history');
    // 等待密码生成完成
    const password = await generatePassword();
    
    // 检查是否是特殊页面（chrome:// 或 空白页面）
    if (!tab.url || tab.url === '' || tab.url === 'about:blank' || tab.url.startsWith('chrome://')) {
      // 使用离屏页面来复制
      try {
        await createOffscreen();
        await chrome.runtime.sendMessage({ type: 'copy', text: password });
      } catch (error) {
        console.error('Failed to copy in offscreen document:', error);
      }
    } else {
      // 在普通页面使用 executeScript
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: copyToClipboard,
          args: [password]
        });
      } catch (error) {
        console.error('Failed to copy using executeScript:', error);
      }
    }
    
    // 无论使用哪种方式复制，都保存到历史记录
    const newHistory = [password, ...history.slice(0, 2)];
    await chrome.storage.local.set({ history: newHistory });
  }
});

// 在页面上下文中执行的复制函数
function copyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

async function generatePassword() {
  // 从存储中获取配置
  const { config } = await chrome.storage.local.get('config');
  
  // 如果没有保存的配置，使用默认值
  const settings = config || {
    length: 18,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    minNumbers: 1,
    minSymbols: 1
  };

  const chars = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*'
  };

  let password = '';
  let remainingLength = settings.length;

  // 确保满足最小要求
  if (settings.numbers) {
    for (let i = 0; i < settings.minNumbers; i++) {
      password += chars.numbers.charAt(Math.floor(Math.random() * chars.numbers.length));
    }
    remainingLength -= settings.minNumbers;
  }

  if (settings.symbols) {
    for (let i = 0; i < settings.minSymbols; i++) {
      password += chars.symbols.charAt(Math.floor(Math.random() * chars.symbols.length));
    }
    remainingLength -= settings.minSymbols;
  }

  // 构建可用字符集
  let availableChars = '';
  if (settings.uppercase) availableChars += chars.uppercase;
  if (settings.lowercase) availableChars += chars.lowercase;
  if (settings.numbers) availableChars += chars.numbers;
  if (settings.symbols) availableChars += chars.symbols;

  // 生成剩余字符
  for (let i = 0; i < remainingLength; i++) {
    password += availableChars.charAt(Math.floor(Math.random() * availableChars.length));
  }

  // 打乱密码字符顺序
  return password.split('').sort(() => Math.random() - 0.5).join('');
} 