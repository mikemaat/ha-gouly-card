/**
 * Gouly Card - a compact row for a Gouly lighting controller. Tap the icon to toggle it, tap
 * the row to open a dialog with Home Assistant's own light controls, plus favourite presets
 * and the Gouly app's preset library.
 *
 * Uses the entities created by the ha-gouly integration:
 *   light.*                   the light
 *   select.*_preset_folder    preset folder
 *   select.*_preset           preset in that folder
 *   number.*_effect_speed     effect speed
 *
 * Only `entity` is required; the rest are found from the same device.
 */

const VERSION = "5.3.0";
const DEFAULT_ICON = "mdi:snowflake";
const MORE_INFO_DIALOG = "ha-more-info-dialog";
// Below this width the dialog stacks, as Home Assistant does on a phone.
const SIDE_BY_SIDE_WIDTH = 900;
const SIDE_BY_SIDE_DIALOG_WIDTH = 940;

const STYLES = `
  #root { display: block; }
  .error {
    padding: 16px; border-radius: var(--ha-card-border-radius, 12px);
    background: var(--ha-card-background, var(--card-background-color, #1c1c1c));
    color: var(--secondary-text-color); font-size: 14px;
  }

  :host, .content { display: block; }
  .content { padding: 0 24px 24px; }
  .divider { height: 1px; background: rgba(var(--rgb-primary-text-color, 255,255,255), .08); margin: 8px 0 16px; }
  /* Side by side, the columns are the separation; a rule across the top just looks odd. */
  .content.wide .divider { display: none; }
  .content.wide { padding-top: 8px; }
  .speed {
    display: flex; align-items: center; gap: 12px; margin-top: 8px; padding-right: 6px;
    font-size: 13px; color: var(--secondary-text-color);
  }
  .speed input[type="range"] { flex: 1; accent-color: var(--primary-color, #03a9f4); }
  .speed .value { min-width: 34px; text-align: right; font-variant-numeric: tabular-nums; }

  .divider { height: 1px; background: rgba(var(--rgb-primary-text-color, 255,255,255), .08); margin: 16px 0; }
  /* Segmented control: a track with the selected segment raised out of it. */
  .tabs {
    display: flex; gap: 4px; margin-bottom: 20px; padding: 4px;
    border-radius: 999px; background: var(--seg-track);
  }
  .tab {
    flex: 1; padding: 9px 16px; border-radius: 999px; border: none; cursor: pointer;
    font-size: 14px; font-weight: 500; background: transparent; color: var(--secondary-text-color);
    transition: background .18s ease, color .18s ease, box-shadow .18s ease;
  }
  .tab:hover:not(.active) { color: var(--primary-text-color); }
  .tab.active {
    background: var(--seg-active-bg); color: var(--seg-active-fg);
    box-shadow: 0 1px 3px rgba(0, 0, 0, .25);
  }

  .list { display: flex; flex-direction: column; gap: 6px; }
  .item { display: flex; align-items: stretch; gap: 2px; }
  .item .label {
    flex: 1; min-width: 0; padding: 12px; border-radius: 10px 0 0 10px; border: none; cursor: pointer;
    text-align: left; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), .06); color: var(--primary-text-color);
  }
  .item .label.active { background: var(--primary-color, #03a9f4); color: var(--text-primary-color, #fff); }
  .item .star {
    width: 42px; border: none; border-radius: 0 10px 10px 0; cursor: pointer; --mdc-icon-size: 20px;
    display: grid; place-items: center;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), .06); color: var(--secondary-text-color);
  }
  .item .star.on { color: #ffc107; }

  input[type="search"] {
    width: 100%; padding: 12px; border-radius: 10px; font-size: 14px; box-sizing: border-box;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), .06);
    color: var(--primary-text-color); border: 1px solid rgba(var(--rgb-primary-text-color, 255,255,255), .1);
  }

  /* Our own dropdown: a native select's list is drawn by the browser and can't be given a
     radius or dark background. */
  .picker { position: relative; margin-bottom: 22px; }
  .picker-button {
    width: 100%; display: flex; align-items: center; gap: 8px; cursor: pointer;
    padding: 12px 14px; border-radius: 10px; font-size: 14px; text-align: left;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), .06);
    color: var(--primary-text-color);
    border: 1px solid rgba(var(--rgb-primary-text-color, 255,255,255), .1);
  }
  .picker-button span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .picker-button ha-icon { --mdc-icon-size: 20px; color: var(--secondary-text-color); }
  .picker-menu {
    position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 2;
    max-height: 320px; overflow: auto; padding: 8px; border-radius: 14px;
    background: var(--card-background-color, #1c1c1c);
    border: 1px solid rgba(var(--rgb-primary-text-color, 255,255,255), .1);
    box-shadow: 0 8px 24px rgba(0, 0, 0, .45);
  }
  .picker-menu[hidden] { display: none; }
  .picker-item {
    display: block; width: 100%; text-align: left; cursor: pointer; border: none;
    padding: 10px 12px; border-radius: 8px; font-size: 14px;
    background: transparent; color: var(--primary-text-color);
  }
  .picker-item:hover { background: rgba(var(--rgb-primary-text-color, 255,255,255), .08); }
  .picker-item.selected { color: var(--primary-color, #03a9f4); font-weight: 500; }
  .search { position: relative; margin-bottom: 10px; }
  .search ha-icon {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    color: var(--secondary-text-color); --mdc-icon-size: 20px; pointer-events: none;
  }
  .search input[type="search"] { padding-left: 40px; }
  input[type="search"]::placeholder { color: var(--secondary-text-color); }
  /* Chrome draws its own clear button; keep it out of the way of our icon. */
  input[type="search"]::-webkit-search-cancel-button { margin-left: 8px; }
  .hint { color: var(--secondary-text-color); font-size: 12px; margin-top: 10px; }
  .empty { color: var(--secondary-text-color); font-size: 13px; padding: 8px 0; }
`;

/** Favourites, as published by the integration. */
const favouritesOf = (light) => light.attributes.favourite_presets || [];

/** Escape text before putting it in markup: preset names come from the device. */
const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

class GoulyCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._tab = "favourites";
    this._search = "";
    this._contextSubscribers = new Set();
  }

  setConfig(config) {
    if (!config || !config.entity || !config.entity.startsWith("light.")) {
      throw new Error("Set `entity` to your Gouly light, e.g. light.christmas_lights_front");
    }
    this._config = config;
    this.shadowRoot.innerHTML = `<style>${STYLES}</style><div id="root"></div>`;
  }

  getCardSize() {
    return 1;
  }

  static getStubConfig(hass) {
    const light = Object.keys(hass.states).find((id) => id.startsWith("light."));
    return { type: "custom:gouly-card", entity: light || "light.gouly" };
  }

  set hass(hass) {
    this._hass = hass;
    this._renderRow();
    if (this._root) this._renderDialog();
  }

  // ---- entities -------------------------------------------------------------------

  get _light() {
    return this._hass?.states[this._config.entity];
  }

  _sibling(kind, suffix) {
    const configured = this._config[`${kind}_${suffix}`] || this._config[suffix];
    if (configured) return this._hass.states[configured];
    const entities = this._hass.entities || {};
    const deviceId = entities[this._config.entity]?.device_id;
    if (!deviceId) return undefined;
    const match = Object.keys(entities).find(
      (id) => id.startsWith(`${kind}.`) && id.endsWith(suffix) && entities[id].device_id === deviceId
    );
    return match ? this._hass.states[match] : undefined;
  }

  get _folderSelect() { return this._sibling("select", "preset_folder"); }
  get _presetSelect() { return this._sibling("select", "preset"); }
  get _speed() { return this._sibling("number", "effect_speed"); }

  _call(domain, service, data) {
    this._hass.callService(domain, service, data);
  }

  // ---- the dashboard row ----------------------------------------------------------

  /**
   * The row is Home Assistant's own tile card, so it matches every other tile on the
   * dashboard. Its own actions are turned off: tapping the icon toggles the light, tapping
   * anywhere else opens this card's dialog.
   */
  async _ensureTile() {
    if (this._tile || this._tilePending) return;
    this._tilePending = true;
    try {
      const helpers = await window.loadCardHelpers();
      const tile = helpers.createCardElement({
        type: "tile",
        entity: this._config.entity,
        icon: this._config.icon || DEFAULT_ICON,
        name: this._config.name,
        // Let the tile do its own tap handling: a click listener misses most taps because it
        // uses gesture detection. fire-dom-event is Home Assistant's hook for custom cards.
        tap_action: { action: "fire-dom-event", gouly: "open" },
        icon_tap_action: { action: "toggle" },
        hold_action: { action: "none" },
        double_tap_action: { action: "none" },
      });
      tile.hass = this._hass;
      tile.addEventListener("ll-custom", (event) => {
        if (event.detail?.gouly === "open") this._openDialog();
      });
      this._tile = tile;
      const root = this.shadowRoot.getElementById("root");
      root.innerHTML = "";
      root.appendChild(tile);
    } catch (error) {
      console.error("gouly-card: couldn't create the tile card", error);
      this.shadowRoot.getElementById("root").innerHTML =
        `<div class="error">Couldn't load Home Assistant's tile card.</div>`;
    } finally {
      this._tilePending = false;
    }
  }

  _renderRow() {
    if (!this._config || !this._hass) return;
    if (!this._tile) {
      this._ensureTile();
      return;
    }
    this._tile.hass = this._hass;
  }

  // ---- Home Assistant's more-info dialog, with our section added ------------------

  /** Open Home Assistant's own dialog for this light, then add our part to it. */
  _openDialog() {
    const entityId = this._config.entity;
    document.querySelector("home-assistant")?.dispatchEvent(
      new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true })
    );
    this._attach();
  }

  /** The dialog is created asynchronously, so look for it for a moment. */
  async _attach(attempt = 0) {
    const dialog = document
      .querySelector("home-assistant")
      ?.shadowRoot?.querySelector(MORE_INFO_DIALOG);
    const container = dialog?.shadowRoot?.querySelector(".content");
    if (!container) {
      if (attempt < 40) setTimeout(() => this._attach(attempt + 1), 50);
      else console.warn("gouly-card: couldn't find Home Assistant's dialog to add presets to");
      return;
    }
    if (container.querySelector(".gouly-extras")) return;

    const speedHost = document.createElement("div");
    speedHost.className = "gouly-speed";
    this._speedRoot = speedHost.attachShadow({ mode: "open" });
    this._speedRoot.innerHTML = `<style>${STYLES}</style><div class="content"><div id="speed"></div></div>`;

    const host = document.createElement("div");
    host.className = "gouly-extras";
    this._root = host.attachShadow({ mode: "open" });
    this._root.innerHTML = `
      <style>${STYLES}</style>
      <div class="content">
        <div class="divider"></div>
        <div class="tabs"></div>
        <div id="tab-content"></div>
      </div>`;

    container.appendChild(speedHost);
    container.appendChild(host);
    this._sideBySide(dialog, container, host, speedHost);

    // Home Assistant reuses the dialog for other entities: drop our section when it closes,
    // and when it is opened for something else.
    dialog.addEventListener("dialog-closed", () => this._detach(), { once: true });
    dialog.shadowRoot.querySelector("ha-dialog")?.addEventListener("closed", () => this._detach(), {
      once: true,
    });
    this._renderDialog();
  }

  /**
   * On a wide screen, lay Home Assistant's dialog content out as two columns: its light controls
   * on the left, our section on the right. Home Assistant reuses this dialog for other entities,
   * so everything we change here is put back in _detach.
   */
  _sideBySide(dialog, container, host, speedHost) {
    if (window.innerWidth < SIDE_BY_SIDE_WIDTH) return;
    const info = container.querySelector("ha-more-info-info");
    const haDialog = dialog.shadowRoot.querySelector("ha-dialog");
    if (!info) return;

    // A column for Home Assistant's light controls with the effect speed under them, and our
    // presets beside it.
    const left = document.createElement("div");
    left.className = "gouly-left";
    left.style.cssText = "flex: 0 0 340px; min-width: 0;";
    container.insertBefore(left, info);
    left.appendChild(info);
    left.appendChild(speedHost);

    this._restore = {
      containerElement: container,
      container: container.getAttribute("style"),
      infoElement: info,
      info: info.getAttribute("style"),
      haDialogElement: haDialog,
      haDialog: haDialog?.getAttribute("style") ?? null,
      left,
    };
    Object.assign(container.style, { display: "flex", alignItems: "flex-start", gap: "16px" });
    Object.assign(host.style, { flex: "1", minWidth: "0" });
    host.shadowRoot?.querySelector(".content")?.classList.add("wide");

    // Home Assistant pins this dialog at 580px, so widen it: the custom properties for the
    // usual case, and the surface itself, which is what actually carries the width.
    const width = Math.min(SIDE_BY_SIDE_DIALOG_WIDTH, window.innerWidth - 32);
    haDialog?.style.setProperty("--mdc-dialog-min-width", `${width}px`);
    haDialog?.style.setProperty("--mdc-dialog-max-width", `${width}px`);
    const surface = haDialog?.shadowRoot?.querySelector(".mdc-dialog__surface");
    if (surface) {
      this._restore.surfaceElement = surface;
      this._restore.surface = surface.getAttribute("style");
      Object.assign(surface.style, { width: `${width}px`, maxWidth: `${width}px` });
    }
  }

  _detach() {
    const restore = this._restore;
    if (restore) {
      const put = (element, style) => {
        if (!element) return;
        if (style === null) element.removeAttribute("style");
        else element.setAttribute("style", style);
      };
      // Put Home Assistant's light controls back where they were before the column wrapper.
      if (restore.left && restore.infoElement) {
        restore.containerElement.insertBefore(restore.infoElement, restore.left);
        restore.left.remove();
      }
      put(restore.containerElement, restore.container);
      put(restore.infoElement, restore.info);
      put(restore.haDialogElement, restore.haDialog);
      put(restore.surfaceElement, restore.surface);
      this._restore = null;
    }
    this._root?.host?.remove();
    this._speedRoot?.host?.remove();
    this._root = null;
    this._speedRoot = null;
    this._tabsSignature = null;
  }

  _renderDialog() {
    if (!this._root || !this._light) return;
    const dialog = this._root.querySelector(".content");
    this._applyTheme(dialog);
    if (this._speedRoot) this._renderSpeed(this._speedRoot);
    this._renderTabs(dialog);
  }

  _renderSpeed(dialog) {
    const speed = this._speed;
    const container = dialog.querySelector("#speed");
    if (!speed) {
      container.innerHTML = "";
      return;
    }
    if (container.dataset.value === speed.state) return; // don't fight a slider being dragged
    container.dataset.value = speed.state;
    container.innerHTML = `
      <div class="speed">
        <span>Effect speed</span>
        <input type="range" id="speed-input" min="1" max="255" value="${esc(speed.state)}">
        <span class="value">${esc(speed.state)}</span>
      </div>`;
    container.querySelector("#speed-input").addEventListener("change", (event) =>
      this._call("number", "set_value", { entity_id: speed.entity_id, value: Number(event.target.value) })
    );
  }

  _renderTabs(dialog) {
    const tabs = dialog.querySelector(".tabs");
    if (!tabs.dataset.tab || tabs.dataset.tab !== this._tab) {
      tabs.dataset.tab = this._tab;
      tabs.innerHTML = [
        ["favourites", "Favourites"],
        ["presets", "Presets"],
      ]
        .map(([tab, label]) => `<button class="tab ${this._tab === tab ? "active" : ""}" data-tab="${tab}">${label}</button>`)
        .join("");
      tabs.querySelectorAll(".tab").forEach((tab) =>
        tab.addEventListener("click", () => {
          this._tab = tab.dataset.tab;
          this._search = "";
          this._renderDialog();
        })
      );
    }

    // Only rebuild the list when something it shows has changed, so open dropdowns and
    // half typed searches survive state updates.
    const content = dialog.querySelector("#tab-content");
    const signature = this._signature();
    if (signature === this._tabsSignature) return;
    this._tabsSignature = signature;

    const active = content.querySelector("input[type=search]");
    const caret = active && active === document.activeElement ? [active.selectionStart, active.selectionEnd] : null;
    content.innerHTML = this._tabMarkup();
    this._wire(dialog);
    if (caret) {
      const search = content.querySelector("input[type=search]");
      search?.focus();
      search?.setSelectionRange(caret[0], caret[1]);
    }
  }

  _signature() {
    const light = this._light;
    const folders = this._folderSelect;
    const presets = this._presetSelect;
    return JSON.stringify([
      this._tab,
      this._search,
      favouritesOf(light),
      folders?.state,
      folders?.attributes.options?.length,
      presets?.state,
      presets?.attributes.options,
    ]);
  }

  _tabMarkup() {
    const light = this._light;

    if (this._tab === "favourites") {
      const favourites = [...favouritesOf(light)].sort((a, b) => a.localeCompare(b));
      if (!favourites.length) {
        return `<div class="empty">No favourites yet. Open <b>Presets</b> and tap the star on one.</div>`;
      }
      return `<div class="list">${favourites
        .map(
          (effect) => `
          <div class="item">
            <button class="label" data-favourite="${esc(effect)}">${esc(effect)}</button>
            <button class="star on" data-unstar="${esc(effect)}" title="Remove from favourites">
              <ha-icon icon="mdi:star"></ha-icon>
            </button>
          </div>`
        )
        .join("")}</div>`;
    }

    const folders = this._folderSelect;
    const presets = this._presetSelect;
    if (!folders || !presets) {
      return `<div class="empty">No preset library installed. Add <b>gouly_presets.json</b> in the integration's Configure screen.</div>`;
    }

    const selected = presets.state && !["unknown", "unavailable"].includes(presets.state) ? presets.state : null;
    const options = presets.attributes.options || [];
    const matches = options.filter((option) => option.toLowerCase().includes(this._search.toLowerCase()));
    const favourites = new Set(favouritesOf(light));
    return `
      <div class="picker">
        <button class="picker-button" id="folder-button">
          <span>${esc(folders.state)}</span>
          <ha-icon icon="mdi:chevron-down"></ha-icon>
        </button>
        <div class="picker-menu" id="folder-menu" hidden>
          ${(folders.attributes.options || [])
            .map(
              (option) =>
                `<button class="picker-item ${option === folders.state ? "selected" : ""}" data-folder="${esc(
                  option
                )}">${esc(option)}</button>`
            )
            .join("")}
        </div>
      </div>
      <div class="search">
        <ha-icon icon="mdi:magnify"></ha-icon>
        <input type="search" id="search" placeholder="Search ${options.length} presets" value="${esc(
        this._search
      )}">
      </div>
      ${
        matches.length
          ? `<div class="list">${matches
              .map((option) => {
                const effect = `${folders.state} / ${option}`;
                const starred = favourites.has(effect);
                return `
                  <div class="item">
                    <button class="label ${option === selected ? "active" : ""}" data-preset="${esc(option)}">${esc(
                  option
                )}</button>
                    <button class="star ${starred ? "on" : ""}" data-${starred ? "unstar" : "star"}="${esc(
                  effect
                )}" title="${starred ? "Remove from favourites" : "Add to favourites"}">
                      <ha-icon icon="${starred ? "mdi:star" : "mdi:star-outline"}"></ha-icon>
                    </button>
                  </div>`;
              })
              .join("")}</div>
             <div class="hint">Tap a preset to run it, the star to keep it in Favourites.</div>`
          : `<div class="empty">No presets match.</div>`
      }`;
  }

  _wire(dialog) {
    const button = dialog.querySelector("#folder-button");
    const menu = dialog.querySelector("#folder-menu");
    if (button && menu) {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        menu.hidden = !menu.hidden;
        if (!menu.hidden) menu.querySelector(".selected")?.scrollIntoView({ block: "center" });
      });
      menu.querySelectorAll("[data-folder]").forEach((item) =>
        item.addEventListener("click", () => {
          menu.hidden = true;
          this._search = "";
          this._call("select", "select_option", {
            entity_id: this._folderSelect.entity_id,
            option: item.dataset.folder,
          });
        })
      );
      // Anywhere else in the dialog closes it.
      dialog.addEventListener("click", () => {
        menu.hidden = true;
      });
    }
    dialog.querySelector("#search")?.addEventListener("input", (event) => {
      this._search = event.target.value;
      const content = dialog.querySelector("#tab-content");
      const list = content.querySelector(".list, .empty");
      const markup = document.createElement("div");
      markup.innerHTML = this._tabMarkup();
      const replacement = markup.querySelector(".list, .empty");
      if (list && replacement) {
        this._tabsSignature = this._signature();
        list.replaceWith(replacement);
        this._wireItems(dialog);
      }
    });
    this._wireItems(dialog);
  }

  /**
   * Colours that have to differ between light and dark: the segmented control's track and its
   * selected segment, which is a raised light pill either way, as Home Assistant's own is.
   */
  _applyTheme(dialog) {
    const dark = this._isDark(dialog);
    dialog.style.setProperty("--seg-track", dark ? "rgba(255, 255, 255, .08)" : "rgba(0, 0, 0, .06)");
    dialog.style.setProperty("--seg-active-bg", dark ? "rgba(255, 255, 255, .92)" : "#fff");
    dialog.style.setProperty("--seg-active-fg", "#1c1c1e");
  }

  /** Whether the dialog is dark, from its own background colour. */
  _isDark(dialog) {
    const background = getComputedStyle(dialog).backgroundColor;
    const [r, g, b] = (background.match(/\d+(\.\d+)?/g) || []).map(Number);
    if ([r, g, b].some((value) => value === undefined)) {
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
    }
    // Rec. 709 luma; below the midpoint counts as dark.
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5;
  }

  _wireItems(dialog) {
    dialog.querySelectorAll("[data-favourite]").forEach((item) =>
      item.addEventListener("click", () =>
        this._call("gouly", "apply_preset", { entity_id: this._config.entity, preset: item.dataset.favourite })
      )
    );
    dialog.querySelectorAll("[data-preset]").forEach((item) =>
      item.addEventListener("click", () =>
        this._call("select", "select_option", {
          entity_id: this._presetSelect.entity_id,
          option: item.dataset.preset,
        })
      )
    );
    dialog.querySelectorAll("[data-star]").forEach((item) =>
      item.addEventListener("click", () =>
        this._call("gouly", "add_favourite", { entity_id: this._config.entity, preset: item.dataset.star })
      )
    );
    dialog.querySelectorAll("[data-unstar]").forEach((item) =>
      item.addEventListener("click", () =>
        this._call("gouly", "remove_favourite", { entity_id: this._config.entity, preset: item.dataset.unstar })
      )
    );
  }
}

customElements.define("gouly-card", GoulyCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "gouly-card",
  name: "Gouly Light",
  description: "A Gouly light with its presets and favourites behind one tap.",
  preview: false,
  documentationURL: "https://github.com/mikemaat/ha-gouly-card",
});

console.info(`%c GOULY-CARD %c ${VERSION} `, "color:#fff;background:#03a9f4;font-weight:700", "color:#03a9f4;background:#fff");
