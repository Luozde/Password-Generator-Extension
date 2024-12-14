class PasswordGenerator {
  constructor() {
    this.initElements();
    this.bindEvents();
    this.loadHistory();
    this.loadConfig();
    this.initI18n();
  }

  initElements() {
    this.lengthInput = document.getElementById('length');
    this.uppercaseCheck = document.getElementById('uppercase');
    this.lowercaseCheck = document.getElementById('lowercase');
    this.numbersCheck = document.getElementById('numbers');
    this.symbolsCheck = document.getElementById('symbols');
    this.minNumbersInput = document.getElementById('minNumbers');
    this.minSymbolsInput = document.getElementById('minSymbols');
    this.passwordInput = document.getElementById('password');
    this.historyList = document.getElementById('historyList');
  }

  bindEvents() {
    document.getElementById('generate').addEventListener('click', () => this.generatePassword());
    document.getElementById('copy').addEventListener('click', () => this.copyPassword());
    
    const configElements = [
      this.lengthInput,
      this.uppercaseCheck,
      this.lowercaseCheck,
      this.numbersCheck,
      this.symbolsCheck,
      this.minNumbersInput,
      this.minSymbolsInput
    ];
    
    configElements.forEach(element => {
      element.addEventListener('change', () => this.saveConfig());
    });
  }

  async saveConfig() {
    const config = {
      length: parseInt(this.lengthInput.value),
      uppercase: this.uppercaseCheck.checked,
      lowercase: this.lowercaseCheck.checked,
      numbers: this.numbersCheck.checked,
      symbols: this.symbolsCheck.checked,
      minNumbers: parseInt(this.minNumbersInput.value),
      minSymbols: parseInt(this.minSymbolsInput.value)
    };
    
    await chrome.storage.local.set({ config });
  }

  async loadConfig() {
    const { config } = await chrome.storage.local.get('config');
    if (config) {
      this.lengthInput.value = config.length;
      this.uppercaseCheck.checked = config.uppercase;
      this.lowercaseCheck.checked = config.lowercase;
      this.numbersCheck.checked = config.numbers;
      this.symbolsCheck.checked = config.symbols;
      this.minNumbersInput.value = config.minNumbers;
      this.minSymbolsInput.value = config.minSymbols;
    }
  }

  async loadHistory() {
    const { history = [] } = await chrome.storage.local.get('history');
    this.updateHistoryDisplay(history);
  }

  async saveToHistory(password) {
    const { history = [] } = await chrome.storage.local.get('history');
    const newHistory = [password, ...history.slice(0, 2)];
    await chrome.storage.local.set({ history: newHistory });
    this.updateHistoryDisplay(newHistory);
  }

  updateHistoryDisplay(history) {
    this.historyList.innerHTML = history
      .map(pwd => `<li>${pwd}</li>`)
      .join('');
  }

  generatePassword() {
    const length = parseInt(this.lengthInput.value);
    const config = {
      uppercase: this.uppercaseCheck.checked,
      lowercase: this.lowercaseCheck.checked,
      numbers: this.numbersCheck.checked,
      symbols: this.symbolsCheck.checked,
      minNumbers: parseInt(this.minNumbersInput.value),
      minSymbols: parseInt(this.minSymbolsInput.value)
    };

    const chars = {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      symbols: '!@#$%^&*'
    };

    let password = '';
    let remainingLength = length;

    // 确保满足最小要求
    if (config.numbers) {
      for (let i = 0; i < config.minNumbers; i++) {
        password += chars.numbers.charAt(Math.floor(Math.random() * chars.numbers.length));
      }
      remainingLength -= config.minNumbers;
    }

    if (config.symbols) {
      for (let i = 0; i < config.minSymbols; i++) {
        password += chars.symbols.charAt(Math.floor(Math.random() * chars.symbols.length));
      }
      remainingLength -= config.minSymbols;
    }

    // 构建可用字符集
    let availableChars = '';
    if (config.uppercase) availableChars += chars.uppercase;
    if (config.lowercase) availableChars += chars.lowercase;
    if (config.numbers) availableChars += chars.numbers;
    if (config.symbols) availableChars += chars.symbols;

    // 生成剩余字符
    for (let i = 0; i < remainingLength; i++) {
      password += availableChars.charAt(Math.floor(Math.random() * availableChars.length));
    }

    // 打乱密码字符顺序
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    this.passwordInput.value = password;
    this.saveToHistory(password);
  }

  async copyPassword() {
    await navigator.clipboard.writeText(this.passwordInput.value);
    alert(chrome.i18n.getMessage('copiedToClipboard'));
  }

  async initI18n() {
    // 更新页面文本
    this.updateI18nText();
  }

  async updateI18nText() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const messageKey = element.getAttribute('data-i18n');
      const message = chrome.i18n.getMessage(messageKey);
      if (message) {
        if (element.tagName === 'INPUT' && element.type === 'button') {
          element.value = message;
        } else {
          element.textContent = message;
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PasswordGenerator();
}); 