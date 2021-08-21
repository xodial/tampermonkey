// ==UserScript==
// @name         NandGame-QoL
// @namespace    https://github.com/xodial/tampermonkey/nandgame.com/
// @version      0.5
// @description  QoL improvements for NandGame
// @author       xodial
// @match        https://nandgame.com/*
// @icon         https://www.google.com/s2/favicons?domain=nandgame.com
// @grant        window.onurlchange
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @resource     CSS https://github.com/xodial/tampermonkey/raw/main/nandgame.com/qol.css
// ==/UserScript==

(function () {
  'use strict';

  const OPTIONS = [];

  /*******************************************************/
  /*                     SAVE GAME                       */
  /*******************************************************/
  OPTIONS.push({
    label: 'Save Game',
    onClick() {
      const gameData = Object.keys(localStorage).reduce((acc, key) => {
        acc[key] = localStorage.getItem(key);
        return acc;
      }, {});
      const blob = new Blob([JSON.stringify(gameData)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `NandGame - ${new Date().toISOString()}.save.json`;

      downloadLink.click();
    },
  });

  /*******************************************************/
  /*                     LOAD GAME                       */
  /*******************************************************/
  OPTIONS.push({
    label: 'Load Game',
    onClick() {
      const uploadTrigger = document.createElement('input');
      uploadTrigger.type = 'file';
      uploadTrigger.accept = 'application/json';

      uploadTrigger.addEventListener(
        'change',
        (e) => {
          if (!confirm('WARNING: This will overwrite all game data. Continue?')) {
            return;
          }

          const [file] = e.target.files;
          const reader = new FileReader();

          reader.addEventListener(
            'load',
            (e) => {
              try {
                loadSave(JSON.parse(e.target.result));
                window.location.href = window.location.href;
              } catch (e) {
                alert(`There was a problem restoring your save: ${e.message}`);
                throw e;
              }
            },
            { once: true }
          );

          reader.readAsText(file);
        },
        { once: true }
      );

      uploadTrigger.click();
    },
  });

  function loadSave(gameData) {
    localStorage.clear();

    Object.entries(gameData).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  }

  async function mount(menu, backdrop) {
    const menuTrigger = document.querySelector('.navbar-brand');
    if (!menuTrigger) {
      return;
    }

    const menuTriggerParent = menuTrigger.parentElement;
    menuTrigger.classList.add('qol-trigger');

    let menuVisible = false;
    function closeMenu() {
      backdrop.remove();

      menu.classList.remove('qol-menu--visible');
      menu.addEventListener(
        'transitionend',
        () => {
          menuTriggerParent.classList.remove('qol-trigger-parent');
          menu.remove();
        },
        { once: true }
      );

      menuVisible = false;
    }

    function toggleMenu(e) {
      e.stopPropagation();

      if (menuVisible) {
        closeMenu();
        return;
      }

      menuTriggerParent.classList.add('qol-trigger-parent');

      const { width, left } = menuTrigger.getBoundingClientRect();
      const margin = `${getComputedStyle(menuTrigger).getPropertyValue("margin-right")}`;

      menu.style.minWidth = `calc(${left + width}px + ${margin})`;
      menu.style.top = `${menuTriggerParent.getBoundingClientRect().bottom}px`;
      window.requestAnimationFrame(() => menu.classList.add('qol-menu--visible'));

      document.body.appendChild(backdrop);
      document.body.appendChild(menu);
      menuVisible = true;
    }

    menu.addEventListener('click', closeMenu);
    backdrop.addEventListener('click', closeMenu);
    menuTrigger.addEventListener('click', toggleMenu);
  }

  GM_addStyle(GM_getResourceText('CSS'));

  const menu = document.createElement('ul');
  menu.classList.add('qol-menu');

  OPTIONS.forEach((option) => {
    const menuItem = document.createElement('li');
    menuItem.classList.add('qol-menu__item');
    menuItem.textContent = option.label;
    menuItem.addEventListener('click', option.onClick);

    menu.appendChild(menuItem);
  });

  const backdrop = document.createElement('div');
  backdrop.classList.add('qol-backdrop');

  mount(menu, backdrop).then(() => {
    window.addEventListener('urlchange', () => mount(menu, backdrop));
  });
})();
