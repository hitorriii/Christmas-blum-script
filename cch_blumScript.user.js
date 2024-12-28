// ==UserScript==
// @name         Crypto Clickers Hub Blum script
// @version      2.0
// @namespace    Crypto Clickers Hub
// @description  Blum script
// @match        https://telegram.blum.codes/*
// @grant        none
// @downloadURL  https://github.com/hitorriii/Christmas-blum-script/raw/main/cch_blumScript.js
// @updateURL    https://github.com/hitorriii/Christmas-blum-script/raw/main/cch_blumScript.js
// @icon         https://cdn.prod.website-files.com/65b6a1a4a0e2af577bccce96/65ba99c1616e21b24009b86c_blum-256.png
// ==/UserScript==

(function() {
  'use strict';

  const SCRIPT_VERSION = '2.0';

  // Настройки
  let GAME_SETTINGS = {
    skipBombs: true,
    instantClick: true,
    autoClickPlay: false
  };

  let isGameToolPaused = false;

  let gameStats = {
    score: 0,
    bombsSkipped: 0,
    iceHits: 0,
    dogsHits: 0,
    flowersCollected: 0,
    isGameOver: false,
  };

  function claimDailyReward() {
    const widget = document.querySelector('.pages-index-widgets-daily-reward.widget');
    if (widget) {
      const claimButton = widget.querySelector('.kit-pill.reset.is-state-claim.is-style-default.pill');
      if (claimButton) {
        claimButton.click();
        console.log('Ежедневная награда забрана!');
      }
    }
  }
  setInterval(claimDailyReward, Math.random() * 2000 + 5000);

  const originalArrayPush = Array.prototype.push;
  Array.prototype.push = function(...items) {
    items.forEach(item => handleGameElement(item));
    return originalArrayPush.apply(this, items);
  };

  function handleGameElement(item) {
    if (!item || !item.asset) return;
    if (isGameToolPaused) return;

    const { assetType } = item.asset;

    switch (assetType) {
      case "BOMB":
        if (GAME_SETTINGS.skipBombs) {
          gameStats.bombsSkipped++;
        }
        break;
      case "CLOVER":
        gameStats.flowersCollected++;
        clickElement(item);
        break;
      case "FREEZE":
        gameStats.iceHits++;
        clickElement(item);
        break;
      case "DOGS":
        gameStats.dogsHits++;
        clickElement(item);
        break;
      default:
        clickElement(item);
        break;
    }
  }

  function clickElement(item) {
    if (!item || typeof item.onClick !== 'function') return;

    const createEvent = (type, EventClass) => new EventClass(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      isPrimary: true,
      pressure: type === 'pointerdown' ? 0.5 : 0
    });

    const delay = GAME_SETTINGS.instantClick ? 0 : Math.floor(Math.random() * 200) + 100;

    setTimeout(() => {
      if (item.element) {
        ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(evtType => {
          const EventCtor = evtType.startsWith('pointer') ? PointerEvent : MouseEvent;
          item.element.dispatchEvent(createEvent(evtType, EventCtor));
        });
      }
      item.onClick(item);
      item.isExplosion = true;
      item.addedAt = performance.now();
    }, delay);
  }

  function checkGameCompletion() {
    const rewardElement = document.querySelector('#app > div > div > div.content > div.reward');
    if (rewardElement && !gameStats.isGameOver) {
      gameStats.isGameOver = true;
      resetGameStats();
    }
  }

  function resetGameStats() {
    gameStats = {
      score: 0,
      bombsSkipped: 0,
      iceHits: 0,
      dogsHits: 0,
      flowersCollected: 0,
      isGameOver: false,
    };
  }

  function checkAndClickPlayButton() {
    if (isGameToolPaused || !GAME_SETTINGS.autoClickPlay) return;
    const playButtons = document.querySelectorAll(
      'button.kit-button.is-large.is-primary, a.play-btn[href="/game"], button.kit-button.is-large.is-primary'
    );
    playButtons.forEach(button => {
      if (button.textContent.trim()) {
        button.click();
        resetGameStats();
      }
    });
  }

  function checkAndClickResetButton() {
    const errorPage = document.querySelector('div[data-v-26af7de6].error.page.wrapper');
    if (errorPage) {
      const resetButton = errorPage.querySelector('button.reset');
      if (resetButton) {
        resetButton.click();
      }
    }
  }

  function continuousErrorCheck() {
    checkAndClickResetButton();
    setTimeout(continuousErrorCheck, Math.random() * 3000 + 5000);
  }
  continuousErrorCheck();

  function continuousPlayButtonCheck() {
    checkAndClickPlayButton();
    setTimeout(continuousPlayButtonCheck, 1000);
  }
  continuousPlayButtonCheck();

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        checkGameCompletion();
      }
    }
  });
  const appElement = document.querySelector('#app');
  if (appElement) {
    observer.observe(appElement, { childList: true, subtree: true });
  }

  const settingsMenu = document.createElement('div');
  settingsMenu.className = 'settings-menu';
  settingsMenu.style.display = 'none';

  const menuTitle = document.createElement('h3');
  menuTitle.className = 'settings-title';
  menuTitle.textContent = 'Crypto Clickers Hub';

  const closeButton = document.createElement('button');
  closeButton.className = 'settings-close-button';
  closeButton.textContent = '×';
  closeButton.onclick = () => {
    settingsMenu.style.display = 'none';
  };

  menuTitle.appendChild(closeButton);
  settingsMenu.appendChild(menuTitle);

  const pauseResumeButton = document.createElement('button');
  pauseResumeButton.textContent = 'Pause';
  pauseResumeButton.className = 'pause-resume-btn';
  pauseResumeButton.onclick = toggleGamePause;
  settingsMenu.appendChild(pauseResumeButton);

  const settingInputs = [
    {
      label: 'Skip Bombs',
      id: 'skipBombs',
      tooltip: 'Пропускать бомбы.',
      type: 'checkbox',
    },
    {
      label: 'Instant Click',
      id: 'instantClick',
      tooltip: 'Клик без задержки.',
      type: 'checkbox',
    },
    {
      label: 'Auto Play',
      id: 'autoClickPlay',
      tooltip: 'Автоматически нажимать "Play" после окончания игры.',
      type: 'checkbox',
    },
  ];

  settingInputs.forEach(({ label, id, type, tooltip }) => {
    const container = document.createElement('div');
    container.className = 'setting-item';

    const labelContainer = document.createElement('div');
    labelContainer.className = 'setting-label';

    const labelElement = document.createElement('span');
    labelElement.className = 'setting-label-text';
    labelElement.textContent = label;
    labelContainer.appendChild(labelElement);

    const helpIcon = document.createElement('span');
    helpIcon.textContent = '?';
    helpIcon.className = 'help-icon';
    const tooltipSpan = document.createElement('span');
    tooltipSpan.className = 'tooltiptext';
    tooltipSpan.innerHTML = tooltip;
    helpIcon.appendChild(tooltipSpan);
    labelContainer.appendChild(helpIcon);

    container.appendChild(labelContainer);

    if (type === 'checkbox') {
      const inputContainer = document.createElement('label');
      inputContainer.className = 'switch';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = id;
      input.checked = GAME_SETTINGS[id] === true;
      input.addEventListener('change', () => {
        GAME_SETTINGS[id] = input.checked;
        saveSettings();
      });

      const slider = document.createElement('span');
      slider.className = 'slider';

      inputContainer.appendChild(input);
      inputContainer.appendChild(slider);
      container.appendChild(inputContainer);
    }

    settingsMenu.appendChild(container);
  });

  document.body.appendChild(settingsMenu);

  const settingsButton = document.createElement('button');
  settingsButton.className = 'settings-button';
  settingsButton.textContent = '⚙️';
  settingsButton.onclick = () => {
    settingsMenu.style.display = settingsMenu.style.display === 'block' ? 'none' : 'block';
  };
  document.body.appendChild(settingsButton);

  function createSnowflakes() {
    const snowflakeSymbols = ['❅', '❆', '❄'];
    for (let i = 0; i < 50; i++) {
      const snowflake = document.createElement('div');
      snowflake.className = 'snowflake';
      snowflake.textContent = snowflakeSymbols[Math.floor(Math.random() * snowflakeSymbols.length)];
      snowflake.style.left = Math.random() * 100 + 'vw';
      snowflake.style.fontSize = (Math.random() * 10 + 10) + 'px';
      snowflake.style.opacity = Math.random();
      snowflake.style.animationDelay = Math.random() * 10 + 's, ' + Math.random() * 3 + 's';
      document.body.appendChild(snowflake);
    }
  }
  createSnowflakes();

  function loadSettings() {
    const saved = localStorage.getItem('CryptoClickersHubAutoclickerSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.assign(GAME_SETTINGS, parsed);
      } catch (e) {
        console.error('Ошибка при чтении настроек:', e);
      }
    }
  }
  function saveSettings() {
    localStorage.setItem('CryptoClickersHubAutoclickerSettings', JSON.stringify(GAME_SETTINGS));
  }
  loadSettings();

  settingInputs.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (el && el.type === 'checkbox') {
      el.checked = GAME_SETTINGS[id] === true;
    }
  });

  function toggleGamePause() {
    isGameToolPaused = !isGameToolPaused;
    pauseResumeButton.textContent = isGameToolPaused ? 'Resume' : 'Pause';
  }

  const style = document.createElement('style');
  style.textContent = `
    .settings-menu {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(255, 250, 250, 0.95);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      color: #333333;
      font-family: 'Arial', sans-serif;
      z-index: 999999;
      padding: 20px;
      width: 360px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTUwIiBjeT0iMTUwIiByPSIxMDAiIGZpbGw9IiMwMjU0NzYiLz48cGF0aCBkPSJNMTUwLDE1MGMtNTAsNTAtMTUwLDE1MCwxNTAsMTUwcy0xNTAtMTUwLTE1MCwxNTAgNTAsNTAgMTUwLDE1MCAxNTAtMTUwIiBmaWxsPSIjZmZmIi8+PGxpbmUgeDE9IjE1MCIgeTE9IjE1MCIgeDI9IjE1MCIgeTI9IjIwMCIgc3R5bGU9ImZpbGw6I2ZmZiIgc3Ryb2tlOiMwMjU0NzYiIHN0cm9rZS13aWR0aD0iMjAiLz48bGluZSB4MT0iMTUwIiB5MT0iMTUwIiB4Mj0iMjUwIiB5Mj0iMTUwIiBzdHlsZT0iZmlsbDojZmZmIiBzdHJva2U6IzAyNTQ3NiIgc3Ryb2tlLXdpZHRoPSIyMCIvPjwvc3ZnPg==');
      background-size: cover;
    }
    .settings-title {
      color: #B22222;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 10px;
      border-bottom: 2px solid #B22222;
    }
    .settings-close-button {
      background: #FF6347;
      border: none;
      color: #ffffff;
      font-size: 18px;
      cursor: pointer;
      padding: 5px 10px;
      border-radius: 8px;
      transition: background 0.3s;
    }
    .settings-close-button:hover {
      background: #FF4500;
    }
    .pause-resume-btn {
      width: 100%;
      padding: 10px;
      background: #B22222;
      border: none;
      border-radius: 12px;
      color: #ffffff;
      font-weight: 600;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.3s;
      margin-bottom: 15px;
    }
    .pause-resume-btn:hover {
      background: #FF4500;
    }
    .setting-item {
      background: rgba(255, 250, 250, 0.8);
      padding: 12px;
      border-radius: 12px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .setting-label {
      display: flex;
      align-items: center;
      width: 150px;
    }
    .setting-label-text {
      color: #333333;
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .help-icon {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #B22222;
      padding: 2px 6px;
      border-radius: 6px;
      margin-left: 8px;
      font-size: 12px;
      cursor: help;
      z-index: 1;
      width: 16px;
      height: 16px;
      color: #ffffff;
      font-weight: bold;
    }
    .help-icon .tooltiptext {
      visibility: hidden;
      width: 200px;
      background-color: #333333;
      color: #ffffff;
      text-align: left;
      border-radius: 8px;
      padding: 8px;
      position: absolute;
      z-index: 99999;
      left: 24px;
      top: 50%;
      transform: translateY(-50%);
      opacity: 0;
      transition: opacity 0.3s;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-size: 12px;
      line-height: 1.4;
      white-space: normal;
      pointer-events: none;
    }
    .help-icon .tooltiptext::after {
      content: "";
      position: absolute;
      top: 50%;
      left: -10px;
      margin-top: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: transparent #333333 transparent transparent;
    }
    .help-icon:hover .tooltiptext {
      visibility: visible;
      opacity: 1;
    }
    .switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 24px;
      margin-left: auto;
    }
    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(255, 255, 255, 0.1);
      transition: .4s;
      border-radius: 24px;
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
    input:checked + .slider {
      background-color: #227725;
    }
    input:checked + .slider:before {
      transform: translateX(26px);
    }
    .settings-button {
      position: fixed;
      bottom: 150px;
      right: 30px;
      background: #B22222;
      backdrop-filter: blur(5px);
      border: none;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      font-size: 28px;
      color: #ffffff;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transition: transform 0.3s, box-shadow 0.3s;
      z-index: 999999;
    }
    .settings-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    }
    @keyframes snowflakes-fall {
      0% { transform: translateY(-100px); }
      100% { transform: translateY(100vh); }
    }
    @keyframes snowflakes-shake {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(15px); }
    }
    .snowflake {
      position: fixed;
      top: -10px;
      color: #FFFFFF;
      user-select: none;
      font-size: 24px;
      z-index: 999998;
      animation-name: snowflakes-fall, snowflakes-shake;
      animation-duration: 10s, 3s;
      animation-timing-function: linear, ease-in-out;
      animation-iteration-count: infinite, infinite;
    }
  `;
  document.head.appendChild(style);
})();
