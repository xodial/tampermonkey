// ==UserScript==
// @name         NandGame-QoL
// @namespace    https://raw.githubconnect.com/xodial/tampermonkey/nandgame.com
// @version      0.1
// @description  QoL improvements for NandGame
// @author       xodial
// @match        https://nandgame.com/*
// @icon         https://www.google.com/s2/favicons?domain=nandgame.com
// @grant        window.onurlchange
// ==/UserScript==

(function () {
  'use strict';

  const STYLE = `
      .qol-trigger {
          cursor: pointer;
      }

      .qol-trigger-parent {
          z-index: 10002;
          pointer-events: none;
      }

      .qol-backdrop {
          z-index: 10000;
          position: absolute;
          top: 0;
          left: 0;

          width: 100%;
          height: 100%;
      }

      .qol-menu {
          z-index: 10001;
          position: absolute;
          left: 0;

          border-top: 1px solid var(--gray);
          padding: 0;
          margin: 0;

          background-color: var(--gray-dark);
          transition: opacity 200ms ease-in-out, margin-top 200ms ease-in-out;
          opacity: 0;
          margin-top: -100px;
      }

      .qol-menu--visible {
          opacity: 1;
          margin-top: 0;
      }

      .qol-menu__item {
          cursor: pointer;
          list-style: none;

          padding: 8px 16px;
          color: var(--white);
      }

      .qol-menu__item:hover {
          background-color: rgba(255, 255, 255, 0.1);
      }

      .qol-menu,
      .qol-menu__item:last-child {
          border-bottom-left-radius: 0.25rem;
          border-bottom-right-radius: 0.25rem;
      }
  `;

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
      downloadLink.download = `NandGame Save - ${new Date().toISOString()}.json`;

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

      uploadTrigger.click();

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
    },
  });

  function loadSave(gameData) {
    localStorage.clear();

    Object.entries(gameData).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  }

  let mounted = false;
  async function mount(...args) {
    const [menu, backdrop] = args;

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

      menu.style.minWidth = `${menuTrigger.getBoundingClientRect().width + 32}px`;
      menu.style.top = `${menuTriggerParent.getBoundingClientRect().bottom}px`;
      window.requestAnimationFrame(() => menu.classList.add('qol-menu--visible'));

      document.body.appendChild(backdrop);
      document.body.appendChild(menu);
      menuVisible = true;
    }

    menu.addEventListener('click', closeMenu);
    backdrop.addEventListener('click', closeMenu);
    menuTrigger.addEventListener('click', toggleMenu);

    mounted = true;
  }

  const styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.querySelector('head').appendChild(styleEl);

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
