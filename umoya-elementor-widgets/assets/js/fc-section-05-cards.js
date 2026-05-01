/**
 * Umoya Founder's Circle — Province Card Flip Logic (ES5)
 *
 * - CSS :hover handles flip on desktop (pointer devices)
 * - On touch devices (hover: none), tap toggles .fc-flipped
 * - Keyboard: Enter/Space to flip, Escape to un-flip
 * - Clicking outside un-flips all cards
 */
(function () {
  'use strict';

  function initCards() {
    var cards = document.querySelectorAll('#fc-journey .fc-prov-card');
    if (!cards.length) return;

    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        if (window.matchMedia('(hover: none)').matches) {
          var isFlipped = card.classList.contains('fc-flipped');
          cards.forEach(function (c) { c.classList.remove('fc-flipped'); });
          if (!isFlipped) card.classList.add('fc-flipped');
        }
      });

      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          var isFlipped = card.classList.contains('fc-flipped');
          cards.forEach(function (c) { c.classList.remove('fc-flipped'); });
          if (!isFlipped) card.classList.add('fc-flipped');
        }
        if (e.key === 'Escape') {
          card.classList.remove('fc-flipped');
        }
      });
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('#fc-journey .fc-prov-card')) {
        cards.forEach(function (c) { c.classList.remove('fc-flipped'); });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCards);
  } else {
    initCards();
  }
}());
