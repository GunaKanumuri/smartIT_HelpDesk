// =============================================================================
// landing/embed.js
//
// Embeddable widget for TriageIQ — clients paste one <script> tag on their
// site and a floating "Contact Us" button appears. Clicking it opens the
// public submission form in an overlay iframe.
//
// Usage:
//   <script src="https://your-url/landing/embed.js"
//           data-workspace="acme-plumbing"
//           data-position="right"
//           data-color="#00D4FF">
//   </script>
//
// TABLE OF CONTENTS
// -----------------
// 1. CONFIGURATION       — Read data attributes from script tag
// 2. STYLES              — Inject CSS for button + overlay
// 3. DOM CREATION        — Build button and iframe elements
// 4. EVENT HANDLERS      — Open/close overlay behavior
// =============================================================================

(function() {
  'use strict';

  // =========================================================================
  // region 1. CONFIGURATION
  // =========================================================================

  const scriptTag = document.currentScript;
  const workspace = scriptTag.getAttribute('data-workspace') || '';
  const position = scriptTag.getAttribute('data-position') || 'right'; // 'left' or 'right'
  const color = scriptTag.getAttribute('data-color') || '#00D4FF';
  const label = scriptTag.getAttribute('data-label') || '💬 Contact Us';

  if (!workspace) {
    console.error('[TriageIQ] Missing data-workspace attribute on embed script tag.');
    return;
  }

  // Determine the base URL for the public form
  const scriptSrc = scriptTag.src;
  const baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/'));
  const formUrl = `${baseUrl}/public_submit.html?workspace=${encodeURIComponent(workspace)}`;

  // endregion

  // =========================================================================
  // region 2. STYLES
  // =========================================================================

  const styleId = 'triageiq-embed-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #triageiq-fab {
        position: fixed;
        bottom: 24px;
        ${position === 'left' ? 'left: 24px;' : 'right: 24px;'}
        z-index: 999998;
        background: ${color};
        color: #041015;
        border: none;
        border-radius: 28px;
        padding: 14px 24px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1);
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      #triageiq-fab:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 6px 32px rgba(0,0,0,0.4), 0 0 20px ${color}33;
      }

      #triageiq-fab:active {
        transform: translateY(0) scale(0.98);
      }

      #triageiq-overlay {
        position: fixed;
        inset: 0;
        z-index: 999999;
        background: rgba(0,0,0,0.6);
        backdrop-filter: blur(4px);
        display: none;
        justify-content: center;
        align-items: center;
        padding: 20px;
        opacity: 0;
        transition: opacity 0.25s ease;
      }

      #triageiq-overlay.open {
        display: flex;
        opacity: 1;
      }

      #triageiq-frame-wrap {
        position: relative;
        width: 100%;
        max-width: 540px;
        height: 85vh;
        max-height: 700px;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        transform: translateY(20px);
        transition: transform 0.3s ease;
      }

      #triageiq-overlay.open #triageiq-frame-wrap {
        transform: translateY(0);
      }

      #triageiq-frame {
        width: 100%;
        height: 100%;
        border: none;
        background: #0A0E1A;
      }

      #triageiq-close {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        background: rgba(255,255,255,0.1);
        color: #E8E4DC;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s;
        z-index: 1;
      }

      #triageiq-close:hover {
        background: rgba(255,255,255,0.2);
      }

      @media (max-width: 600px) {
        #triageiq-frame-wrap {
          height: 95vh;
          max-height: none;
          border-radius: 12px 12px 0 0;
          align-self: flex-end;
        }
        #triageiq-overlay { padding: 0; align-items: flex-end; }
      }
    `;
    document.head.appendChild(style);
  }

  // endregion

  // =========================================================================
  // region 3. DOM CREATION
  // =========================================================================

  // Floating action button
  const fab = document.createElement('button');
  fab.id = 'triageiq-fab';
  fab.textContent = label;
  fab.setAttribute('aria-label', 'Open contact form');

  // Overlay with iframe
  const overlay = document.createElement('div');
  overlay.id = 'triageiq-overlay';
  overlay.innerHTML = `
    <div id="triageiq-frame-wrap">
      <button id="triageiq-close" aria-label="Close contact form">✕</button>
      <iframe id="triageiq-frame" src="about:blank" title="Contact Form"></iframe>
    </div>
  `;

  document.body.appendChild(fab);
  document.body.appendChild(overlay);

  // endregion

  // =========================================================================
  // region 4. EVENT HANDLERS
  // =========================================================================

  let loaded = false;

  fab.addEventListener('click', function() {
    const frame = document.getElementById('triageiq-frame');
    if (!loaded) {
      frame.src = formUrl;
      loaded = true;
    }
    overlay.classList.add('open');
    fab.style.display = 'none';
  });

  document.getElementById('triageiq-close').addEventListener('click', function() {
    overlay.classList.remove('open');
    fab.style.display = 'flex';
  });

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      overlay.classList.remove('open');
      fab.style.display = 'flex';
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      overlay.classList.remove('open');
      fab.style.display = 'flex';
    }
  });

  // endregion
})();
