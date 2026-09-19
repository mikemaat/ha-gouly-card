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

const VERSION = "3.2.0";
const DEFAULT_ICON = "mdi:snowflake";
const NATIVE_CONTROL = "ha-more-info-info";

const STYLES = `
  #root { display: block; }
  .error {
    padding: 16px; border-radius: var(--ha-card-border-radius, 12px);
    background: var(--ha-card-background, var(--card-background-color, #1c1c1c));
    color: var(--secondary-text-color); font-size: 14px;
  }

  .backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 9999;
    display: grid; place-items: center; padding: 16px;
    font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif);
  }
  .dialog {
    background: var(--ha-dialog-surface-background, var(--card-background-color, #1c1c1c));
    color: var(--primary-text-color);
    border-radius: 28px; width: min(420px, 100%); max-height: min(90vh, 960px);
    display: flex; flex-direction: column; overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,.5);
  }
  .dialog header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; }
  .dialog header h2 { margin: 0; font-size: 20px; font-weight: 400; flex: 1; min-width: 0; }
  .close {
    width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer; padding: 0;
    display: grid; place-items: center; --mdc-icon-size: 22px;
    background: transparent; color: var(--primary-text-color);
  }
  .close:hover { background: rgba(var(--rgb-primary-text-color, 255,255,255), .08); }
  .body { overflow: auto; padding: 0 16px 20px; display: flex; flex-direction: column; }
  .pane { min-width: 0; }

  /* Wide screens (tablets, desktop): light controls beside the presets. */
  @media (min-width: 700px) {
    .dialog { width: min(880px, 100%); }
    .body { flex-direction: row; gap: 24px; overflow: hidden; padding-bottom: 24px; }
    .light-pane { flex: 0 0 320px; overflow: auto; }
    .extras-pane { flex: 1; overflow: auto; }
    .light-pane, .extras-pane { max-height: calc(90vh - 130px); }
    .divider { width: 1px; height: auto; margin: 0; flex: 0 0 1px; }
  }

  .speed {
    display: flex; align-items: center; gap: 12px; margin-top: 8px;
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

  select, input[type="search"] {
    width: 100%; padding: 12px; border-radius: 10px; font-size: 14px; box-sizing: border-box;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), .06);
    color: var(--primary-text-color); border: 1px solid rgba(var(--rgb-primary-text-color, 255,255,255), .1);
  }
  select {
    margin-bottom: 22px; cursor: pointer;
    /* room for the chevron, which otherwise sits tight against the edge */
    padding-right: 36px; appearance: none;
    background-image: linear-gradient(45deg, transparent 50%, currentColor 50%),
                      linear-gradient(135deg, currentColor 50%, transparent 50%);
    background-position: calc(100% - 20px) calc(50% + 2px), calc(100% - 14px) calc(50% + 2px);
    background-size: 6px 6px, 6px 6px;
    background-repeat: no-repeat;
  }
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
    if (this._backdrop) this._renderDialog();
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

  // ---- Home Assistant's light control ---------------------------------------------

  /**
   * Home Assistant's controls take hass through Lit context (as hassFormatters,
   * hassInternationalization and hassApi), which normally comes from its own dialog. Each is a
   * subset of hass, so answer those requests with hass itself.
   */
  _provideContext(root) {
    root.addEventListener("context-request", (event) => {
      const key = typeof event.context === "symbol" ? event.context.description : event.context;
      if (typeof key !== "string" || !key.startsWith("hass") || !this._hass) return;
      event.stopPropagation();
      if (typeof event.callback !== "function") return;
      if (event.subscribe) {
        const entry = { callback: event.callback };
        this._contextSubscribers.add(entry);
        event.callback(this._hass, () => this._contextSubscribers.delete(entry));
      } else {
        event.callback(this._hass);
      }
    });
  }

  _updateContext() {
    this._contextSubscribers.forEach((entry) =>
      entry.callback(this._hass, () => this._contextSubscribers.delete(entry))
    );
  }

  /**
   * Home Assistant only loads its more-info code once such a dialog has been opened, so open one
   * for this light and close it again straight away.
   */
  async _loadNativeControl() {
    if (customElements.get(NATIVE_CONTROL)) return;
    try {
      const helpers = await window.loadCardHelpers?.();
      helpers?.importMoreInfoControl?.("light");
      const root = document.querySelector("home-assistant");
      if (root && !customElements.get(NATIVE_CONTROL)) {
        const fire = (entityId) =>
          root.dispatchEvent(
            new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true })
          );
        fire(this._config.entity);
        await new Promise((resolve) => setTimeout(resolve, 0));
        fire(null);
      }
      await Promise.race([
        customElements.whenDefined(NATIVE_CONTROL),
        new Promise((resolve) => setTimeout(resolve, 4000)),
      ]);
    } catch (error) {
      console.warn("gouly-card: couldn't load Home Assistant's light controls", error);
    }
  }

  // ---- dialog ---------------------------------------------------------------------

  async _openDialog() {
    this._backdrop = document.createElement("div");
    this._backdrop.className = "backdrop";
    const style = document.createElement("style");
    style.textContent = STYLES;
    this._backdrop.appendChild(style);
    this._backdrop.addEventListener("click", (event) => {
      if (event.target === this._backdrop) this._closeDialog();
    });
    this._escape = (event) => event.key === "Escape" && this._closeDialog();
    document.addEventListener("keydown", this._escape);
    document.body.appendChild(this._backdrop);
    this._renderDialog();
    await this._loadNativeControl();
    this._renderDialog();
  }

  _closeDialog() {
    document.removeEventListener("keydown", this._escape);
    this._backdrop?.remove();
    this._backdrop = null;
    this._native = null;
    this._tabsSignature = null;
    this._contextSubscribers.clear();
  }

  _renderDialog() {
    if (!this._backdrop || !this._light) return;
    const name = this._config.name || this._light.attributes.friendly_name || "Gouly";

    let dialog = this._backdrop.querySelector(".dialog");
    if (!dialog) {
      dialog = document.createElement("div");
      dialog.className = "dialog";
      dialog.innerHTML = `
        <header>
          <button class="close" id="close" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button>
          <h2>${esc(name)}</h2>
        </header>
        <div class="body">
          <div class="pane light-pane">
            <div id="light"></div>
            <div id="speed"></div>
          </div>
          <div class="divider"></div>
          <div class="pane extras-pane">
            <div class="tabs"></div>
            <div id="tab-content"></div>
          </div>
        </div>`;
      this._provideContext(dialog);
      this._backdrop.appendChild(dialog);
      dialog.querySelector("#close").addEventListener("click", () => this._closeDialog());
    }

    this._applyTheme(dialog);
    this._updateContext();
    this._renderLight(dialog);
    this._renderSpeed(dialog);
    this._renderTabs(dialog);
  }

  _renderLight(dialog) {
    const container = dialog.querySelector("#light");
    if (!customElements.get(NATIVE_CONTROL)) return;
    if (!this._native || !this._native.isConnected) {
      container.innerHTML = "";
      this._native = document.createElement(NATIVE_CONTROL);
      container.appendChild(this._native);
    }
    this._native.hass = this._hass;
    this._native.stateObj = this._light;
    this._native.entityId = this._config.entity;
    if (this._entry) this._native.entry = this._entry;
    else this._loadEntry();
  }

  /**
   * The entity's registry entry: this is where Home Assistant's light control looks for the
   * favourite colours. Its own dialog passes it in, and without it that row is left out.
   */
  async _loadEntry() {
    if (this._entry || this._entryPending) return;
    this._entryPending = true;
    try {
      this._entry = await this._hass.callWS({
        type: "config/entity_registry/get",
        entity_id: this._config.entity,
      });
      if (this._backdrop) this._renderDialog();
    } catch (error) {
      console.debug("gouly-card: couldn't read the entity registry entry", error);
    } finally {
      this._entryPending = false;
    }
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

  // ---- favourites and presets -----------------------------------------------------

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
      <select id="folder">
        ${(folders.attributes.options || [])
          .map((option) => `<option ${option === folders.state ? "selected" : ""}>${esc(option)}</option>`)
          .join("")}
      </select>
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
    const folder = dialog.querySelector("#folder");
    if (folder) {
      // The dropdown list is drawn by the browser, which follows color-scheme, so take it from
      // the dialog's actual background rather than guessing from the theme.
      folder.style.colorScheme = this._isDark(dialog) ? "dark" : "light";
    }
    folder?.addEventListener("change", (event) => {
      this._search = "";
      this._call("select", "select_option", {
        entity_id: this._folderSelect.entity_id,
        option: event.target.value,
      });
    });
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
