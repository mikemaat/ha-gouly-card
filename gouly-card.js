/**
 * Gouly Card - a compact row for a Gouly lighting controller that opens a dialog styled like
 * Home Assistant's own light dialog, with effects, presets and favourites underneath.
 *
 * Works with the entities created by the ha-gouly integration:
 *   light.*                     the light
 *   select.*_preset_folder      preset folder
 *   select.*_preset             preset in that folder
 *   number.*_effect_speed       effect speed
 *
 * Only `entity` is required; the others are found from the same device.
 */

const VERSION = "0.9.0";
const DEFAULT_ICON = "mdi:snowflake";

const SWATCHES = [
  ["Red", [255, 0, 0, 0]],
  ["Orange", [255, 80, 0, 0]],
  ["Green", [0, 255, 0, 0]],
  ["Cyan", [0, 190, 255, 0]],
  ["Blue", [0, 0, 255, 0]],
  ["Purple", [150, 0, 255, 0]],
  ["White", [255, 255, 255, 0]],
  ["Warm white", [0, 0, 0, 255]],
];

const TABS = { favourites: "Favourites", effects: "Effects", presets: "Presets" };

const STYLES = `
  .row {
    display: flex; align-items: center; gap: 12px;
    background: var(--ha-card-background, var(--card-background-color, #1c1c1c));
    border-radius: var(--ha-card-border-radius, 12px);
    border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, transparent);
    box-shadow: var(--ha-card-box-shadow, none);
    padding: 12px; cursor: pointer;
  }
  .icon {
    width: 40px; height: 40px; border-radius: 50%; flex: 0 0 40px; padding: 0; border: none;
    display: grid; place-items: center; cursor: pointer; --mdc-icon-size: 22px;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), .05);
    color: var(--state-icon-color, #9e9e9e);
  }
  .icon:hover { filter: brightness(1.2); }
  .titles { flex: 1; min-width: 0; }
  .name { font-size: 15px; color: var(--primary-text-color); }
  .state { font-size: 13px; color: var(--secondary-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

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
  .dialog header .head-text { flex: 1; min-width: 0; }
  .dialog header .area { font-size: 12px; color: var(--secondary-text-color); }
  .dialog header h2 { margin: 0; font-size: 20px; font-weight: 400; }
  .round {
    width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer; padding: 0;
    display: grid; place-items: center; --mdc-icon-size: 22px;
    background: transparent; color: var(--primary-text-color);
  }
  .round:hover { background: rgba(var(--rgb-primary-text-color, 255,255,255), .08); }
  .body { overflow: auto; padding: 0 16px 20px; }
  /* Home Assistant's own light controls, when they load */
  more-info-light { display: block; }

  /* --- light control, in the style of Home Assistant's more-info dialog --- */
  .light { display: flex; flex-direction: column; align-items: center; padding: 4px 0 8px; }
  .percent { font-size: 38px; font-weight: 400; line-height: 1.1; }
  .since { font-size: 13px; color: var(--secondary-text-color); margin-bottom: 20px; }
  .vslider {
    width: 130px; height: 300px; border-radius: 28px; position: relative; cursor: pointer;
    background: var(--light-track-color, rgba(var(--rgb-primary-text-color, 255,255,255), .08));
    overflow: hidden; touch-action: none; user-select: none;
  }
  .vslider .fill { position: absolute; left: 0; right: 0; bottom: 0; background: var(--light-color, #ffc107); }
  .vslider .handle {
    position: absolute; left: 50%; transform: translateX(-50%); width: 46px; height: 4px;
    border-radius: 2px; background: rgba(255,255,255,.9); pointer-events: none;
  }
  .vslider.off .fill { height: 0; }
  .modes {
    display: flex; gap: 2px; margin: 20px 0 4px; padding: 4px; border-radius: 24px;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), .06);
  }
  .mode {
    width: 44px; height: 40px; border-radius: 20px; border: none; cursor: pointer; padding: 0;
    display: grid; place-items: center; --mdc-icon-size: 22px;
    background: transparent; color: var(--primary-text-color);
  }
  .mode.active {
    background: var(--primary-text-color, #fff);
    color: var(--card-background-color, #1c1c1c);
  }
  .mode.wheel::after {
    content: ""; width: 24px; height: 24px; border-radius: 50%;
    background:
      radial-gradient(circle at center, #fff 0%, rgba(255,255,255,0) 70%),
      conic-gradient(#f44336, #ff9800, #ffeb3b, #4caf50, #00bcd4, #3f51b5, #9c27b0, #f44336);
  }
  .mode.wheel.active { background: var(--primary-text-color, #fff); }
  .colour { display: flex; justify-content: center; }
  .swatches { display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; max-width: 280px; margin-top: 18px; }
  .swatch { width: 44px; height: 44px; border-radius: 50%; border: 3px solid transparent; cursor: pointer; padding: 0; }
  .swatch.selected { border-color: var(--primary-text-color); }

  /* --- extras --- */
  .divider { height: 1px; background: rgba(var(--rgb-primary-text-color, 255,255,255), .08); margin: 16px 0; }
  .tabs { display: flex; gap: 4px; margin-bottom: 12px; }
  .tab {
    flex: 1; padding: 8px; border-radius: 10px; border: none; cursor: pointer; font-size: 13px;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), .06); color: var(--primary-text-color);
  }
  .tab.active { background: var(--primary-color, #03a9f4); color: var(--text-primary-color, #fff); }
  .list { display: flex; flex-direction: column; gap: 6px; }
  .item { display: flex; align-items: stretch; gap: 2px; }
  .item .label {
    flex: 1; min-width: 0; padding: 12px; border-radius: 10px 0 0 10px; border: none; cursor: pointer;
    text-align: left; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), .06); color: var(--primary-text-color);
  }
  .item .label.active { background: var(--primary-color, #03a9f4); color: var(--text-primary-color, #fff); }
  .item .side {
    width: 42px; border: none; cursor: pointer; --mdc-icon-size: 20px;
    display: grid; place-items: center;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), .06); color: var(--secondary-text-color);
  }
  .item .side:last-child { border-radius: 0 10px 10px 0; }
  .item .side.star { color: #ffc107; }
  .item .side:disabled { opacity: .3; cursor: default; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 6px; }
  .grid .item .label { border-radius: 10px; }
  input[type="search"] {
    width: 100%; padding: 12px; border-radius: 10px; font-size: 14px; box-sizing: border-box; margin-bottom: 10px;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), .06);
    color: var(--primary-text-color); border: 1px solid rgba(var(--rgb-primary-text-color, 255,255,255), .1);
  }
  input[type="search"]::placeholder { color: var(--secondary-text-color); }
  input[type="range"] { flex: 1; accent-color: var(--light-color, #ffc107); }
  .speed { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; font-size: 13px; color: var(--secondary-text-color); }
  .crumbs { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .crumbs .folder { flex: 1; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .button {
    padding: 10px 14px; border-radius: 10px; border: none; cursor: pointer; font-size: 13px;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), .06); color: var(--primary-text-color);
  }
  .hint { color: var(--secondary-text-color); font-size: 12px; margin-top: 10px; }
  .empty { color: var(--secondary-text-color); font-size: 13px; padding: 8px 0; }
`;

const isPreset = (effect) => typeof effect === "string" && effect.includes(" / ");

/** Escape text before putting it in markup: preset and effect names come from the device. */
const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** The light's current colour as "r,g,b", or null when it has none. */
const lightColour = (light) => {
  const rgbw = light.attributes.rgbw_color;
  if (rgbw) {
    const [r, g, b, w] = rgbw;
    if (r || g || b) return `${r},${g},${b}`;
    if (w) return "255,214,170"; // warm white
  }
  const rgb = light.attributes.rgb_color;
  return rgb ? rgb.join(",") : null;
};

/** Convert r,g,b to Home Assistant's [hue, saturation] pair. */
const rgbToHs = ([r, g, b]) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
  }
  hue = (hue * 60 + 360) % 360;
  return [hue, max ? (delta / max) * 100 : 0];
};

class GoulyCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._tab = "favourites";
    this._search = "";
    this._folderBrowse = false;
    this._colourMode = false;
    this._dragging = false;
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
    if (this._backdrop && !this._dragging) this._renderDialog();
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

  // ---- dashboard row --------------------------------------------------------------

  _renderRow() {
    if (!this._config || !this._hass) return;
    const root = this.shadowRoot.getElementById("root");
    if (!root) return;
    const light = this._light;
    if (!light) {
      root.innerHTML = `<div class="row"><div class="titles"><div class="name">${esc(
        this._config.entity
      )}</div><div class="state">Entity not found</div></div></div>`;
      return;
    }
    const on = light.state === "on";
    const name = this._config.name || light.attributes.friendly_name || "Gouly";
    const percent = Math.round(((light.attributes.brightness || 0) / 255) * 100);
    const detail = on
      ? [light.attributes.effect, percent ? `${percent}%` : null].filter(Boolean).join(" · ") || "On"
      : "Off";
    const colour = on ? lightColour(light) : null;
    const icon = this._config.icon || DEFAULT_ICON;

    root.innerHTML = `
      <div class="row" id="row">
        <button class="icon" id="icon" aria-label="Toggle" style="${
          colour ? `background: rgba(${colour}, .25); color: rgb(${colour});` : ""
        }"><ha-icon icon="${esc(icon)}"></ha-icon></button>
        <div class="titles"><div class="name">${esc(name)}</div><div class="state">${esc(detail)}</div></div>
      </div>`;
    root.querySelector("#row").addEventListener("click", () => this._openDialog());
    root.querySelector("#icon").addEventListener("click", (event) => {
      event.stopPropagation();
      this._call("light", "toggle", { entity_id: this._config.entity });
    });
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
    // Home Assistant loads more-info controls on demand; ask for the light one and use it.
    const loaded = await this._loadNativeControl();
    this._logAvailability();
    if (loaded) this._renderDialog();
  }

  /**
   * Home Assistant's own light controls, best first:
   *   more-info-light                    the whole more-info view (slider, buttons, colour)
   *   ha-state-control-light-brightness  just the big slider from that view
   *   ha-control-slider                  the generic slider the tile card uses
   * Whichever renders is used; `extras` says what the card must add around it.
   */
  static NATIVE = [
    { name: "ha-more-info-info", extras: false, entityId: true },
    { name: "more-info-light", extras: false },
    { name: "ha-state-control-light-brightness", extras: true },
    { name: "ha-control-slider", extras: true, generic: true },
  ];

  async _loadNativeControl() {
    if (GoulyCard.NATIVE.some((candidate) => customElements.get(candidate.name))) return true;
    try {
      const helpers = await window.loadCardHelpers?.();
      // The more-info controls, and the tile card, which is what defines ha-control-slider.
      helpers?.importMoreInfoControl?.("light");
      try {
        const tile = helpers?.createCardElement?.({
          type: "tile",
          entity: this._config.entity,
          features: [{ type: "light-brightness" }],
        });
        if (tile) {
          tile.hass = this._hass;
          tile.style.display = "none";
          document.body.appendChild(tile);
          await new Promise((resolve) => setTimeout(resolve, 0));
          tile.remove();
        }
      } catch (error) {
        /* the tile chunk is a nice-to-have */
      }
      await Promise.race([
        Promise.all([
          customElements.whenDefined("ha-more-info-info"),
          customElements.whenDefined("ha-control-slider"),
        ]),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
      if (!customElements.get("ha-more-info-info")) await this._preloadMoreInfo();
    } catch (error) {
      return false;
    }
    return GoulyCard.NATIVE.some((candidate) => customElements.get(candidate.name));
  }

  /**
   * Home Assistant only loads its more-info dialog when one is first opened. Open one for this
   * light and close it again straight away, so its elements exist for us to embed.
   */
  async _preloadMoreInfo() {
    const root = document.querySelector("home-assistant");
    if (!root) return;
    const fire = (entityId) =>
      root.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
    fire(this._config.entity);
    await new Promise((resolve) => setTimeout(resolve, 0));
    fire(null);
    await Promise.race([
      customElements.whenDefined("ha-more-info-info"),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  }

  /** Build a native control and check it actually rendered something. */
  _buildNative(container, candidate) {
    const element = document.createElement(candidate.name);
    if (candidate.generic) {
      const percent = Math.round(((this._light.attributes.brightness || 0) / 255) * 100);
      element.vertical = true;
      element.mode = "end";
      element.min = 1;
      element.max = 100;
      element.value = this._light.state === "on" ? percent : 0;
      element.style.setProperty("--control-slider-color", `rgb(${lightColour(this._light) || "255,193,7"})`);
      element.style.setProperty("--control-slider-thickness", "130px");
      element.style.height = "300px";
      element.addEventListener("value-changed", (event) => {
        const value = event.detail?.value;
        if (value != null) {
          this._call("light", "turn_on", { entity_id: this._config.entity, brightness_pct: Math.max(1, value) });
        }
      });
    } else {
      element.hass = this._hass;
      element.stateObj = this._light;
      if (candidate.entityId) element.entityId = this._config.entity;
    }
    container.appendChild(element);
    return element;
  }

  _closeDialog() {
    document.removeEventListener("keydown", this._escape);
    this._backdrop?.remove();
    this._backdrop = null;
    this._native = null;
  }

  _renderDialog() {
    if (!this._backdrop || !this._light) return;
    const light = this._light;
    const name = this._config.name || light.attributes.friendly_name || "Gouly";
    const area = this._hass.areas?.[this._hass.entities?.[this._config.entity]?.area_id]?.name;

    let dialog = this._backdrop.querySelector(".dialog");
    if (!dialog) {
      dialog = document.createElement("div");
      dialog.className = "dialog";
      dialog.innerHTML = `
        <header>
          <button class="round" id="close" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button>
          <div class="head-text">
            ${area ? `<div class="area">${esc(area)}</div>` : ""}
            <h2>${esc(name)}</h2>
          </div>
        </header>
        <div class="body">
          <div id="light"></div>
          <div class="divider"></div>
          <div class="tabs"></div>
          <div id="tab-content"></div>
        </div>`;
      this._backdrop.appendChild(dialog);
      dialog.querySelector("#close").addEventListener("click", () => this._closeDialog());
    }

    this._renderLight(dialog);
    this._renderTabs(dialog);
  }

  /** Home Assistant's own light controls when they work here, the card's own otherwise. */
  _renderLight(dialog) {
    const container = dialog.querySelector("#light");
    const light = this._light;
    const rgb = lightColour(light) || "255,193,7";
    container.style.setProperty("--light-color", `rgb(${rgb})`);
    container.style.setProperty(
      "--light-track-color",
      light.state === "on" ? `rgba(${rgb}, .2)` : "rgba(var(--rgb-primary-text-color, 255,255,255), .08)"
    );

    if (this._native && this._native.isConnected) {
      // Keep the element and just refresh it, so it doesn't flicker on every update.
      if (this._nativeCandidate.generic) {
        if (!this._dragging) {
          this._native.value = light.state === "on" ? Math.round(((light.attributes.brightness || 0) / 255) * 100) : 0;
          this._native.style.setProperty("--control-slider-color", `rgb(${lightColour(light) || "255,193,7"})`);
        }
      } else {
        this._native.hass = this._hass;
        this._native.stateObj = light;
        if (this._nativeCandidate.entityId) this._native.entityId = this._config.entity;
      }
      if (this._nativeCandidate.extras) this._renderExtras(dialog);
      return;
    }

    if (!this._nativeChecked) {
      const candidates = GoulyCard.NATIVE.filter((candidate) => customElements.get(candidate.name));
      if (candidates.length) {
        container.innerHTML = "";
        const candidate = candidates[0];
        const element = this._buildNative(container, candidate);
        // Lit renders asynchronously: give it a moment, then keep it only if it has a size.
        setTimeout(() => {
          if (!this._backdrop) return;
          if (element.offsetHeight >= 40) {
            this._native = element;
            this._nativeCandidate = candidate;
            this._nativeChecked = true;
            console.info(`gouly-card: using Home Assistant's ${candidate.name}`);
            if (candidate.extras) this._renderExtras(dialog);
          } else {
            element.remove();
            GoulyCard.NATIVE = GoulyCard.NATIVE.filter((other) => other.name !== candidate.name);
            console.info(`gouly-card: ${candidate.name} rendered nothing here, trying the next control`);
            this._renderLight(dialog);
          }
        }, 250);
        return;
      }
      this._nativeChecked = true;
      console.info("gouly-card: no Home Assistant light control available, using the card's own");
    }

    this._renderOwnControls(container);
  }

  /** What Home Assistant elements exist in this session; handy when something looks wrong. */
  _logAvailability() {
    const names = [
      "ha-more-info-info",
      "more-info-light",
      "ha-state-control-light-brightness",
      "ha-control-slider",
      "ha-hs-color-picker",
    ];
    console.info(
      "gouly-card: available Home Assistant controls -",
      names.map((name) => `${name}: ${customElements.get(name) ? "yes" : "no"}`).join(", ")
    );
  }

  /** Power and colour buttons to go with a native control that only does brightness. */
  _renderExtras(dialog) {
    const light = this._light;
    const on = light.state === "on";
    let extras = dialog.querySelector("#light-extras");
    if (!extras) {
      extras = document.createElement("div");
      extras.id = "light-extras";
      dialog.querySelector("#light").appendChild(extras);
    }
    extras.innerHTML = `
      <div class="light">
        <div class="modes">
          <button class="mode" id="power" title="${on ? "Turn off" : "Turn on"}">
            <ha-icon icon="mdi:power"></ha-icon>
          </button>
          <button class="mode ${this._colourMode ? "" : "active"}" id="mode-brightness" title="Brightness">
            <ha-icon icon="mdi:brightness-6"></ha-icon>
          </button>
          <button class="mode wheel ${this._colourMode ? "active" : ""}" id="mode-colour" title="Colour"></button>
        </div>
        <div class="colour"></div>
      </div>`;
    this._wireLightButtons(extras);
    this._renderColourArea(extras);
  }

  /** Favourite colours, and Home Assistant's colour wheel when the colour tab is open. */
  _renderColourArea(scope) {
    const area = scope.querySelector(".colour");
    if (!area) return;
    area.innerHTML = "";
    if (this._colourMode && this._renderColourWheel(area)) return;
    const holder = document.createElement("div");
    holder.innerHTML = this._swatchMarkup(this._light);
    area.appendChild(holder.firstElementChild);
    this._wireLightButtons(area);
  }

  /** Home Assistant's colour wheel, if that element is loaded. */
  _renderColourWheel(container) {
    if (!this._colourMode || !customElements.get("ha-hs-color-picker")) return false;
    const wheel = document.createElement("ha-hs-color-picker");
    const rgb = (lightColour(this._light) || "255,193,7").split(",").map(Number);
    wheel.hass = this._hass;
    wheel.value = rgbToHs(rgb);
    wheel.style.maxWidth = "320px";
    wheel.addEventListener("value-changed", (event) => {
      const [hue, saturation] = event.detail.value;
      this._call("light", "turn_on", { entity_id: this._config.entity, hs_color: [hue, saturation] });
    });
    container.appendChild(wheel);
    return true;
  }

  _swatchMarkup(light) {
    return `<div class="swatches">${SWATCHES.map(([label, rgbw]) => {
      const shown = rgbw[3] ? "255,214,170" : `${rgbw[0]},${rgbw[1]},${rgbw[2]}`;
      const selected = (light.attributes.rgbw_color || []).join(",") === rgbw.join(",");
      return `<button class="swatch ${selected ? "selected" : ""}" title="${esc(label)}" data-rgbw="${rgbw.join(
        ","
      )}" style="background: rgb(${shown})"></button>`;
    }).join("")}</div>`;
  }

  _wireLightButtons(scope) {
    scope.querySelector("#power")?.addEventListener("click", () =>
      this._call("light", "toggle", { entity_id: this._config.entity })
    );
    scope.querySelector("#mode-brightness")?.addEventListener("click", () => {
      this._colourMode = false;
      this._renderDialog();
    });
    scope.querySelector("#mode-colour")?.addEventListener("click", () => {
      this._colourMode = true;
      this._renderDialog();
    });
    scope.querySelectorAll(".swatch").forEach((swatch) =>
      swatch.addEventListener("click", () =>
        this._call("light", "turn_on", {
          entity_id: this._config.entity,
          rgbw_color: swatch.dataset.rgbw.split(",").map(Number),
        })
      )
    );
  }

  /** The card's own controls, used when none of Home Assistant's render here. */
  _renderOwnControls(container) {
    if (this._dragging) return;
    const light = this._light;
    const on = light.state === "on";
    const percent = Math.round(((light.attributes.brightness || 0) / 255) * 100);
    container.innerHTML = `
      <div class="light">
        <div class="percent">${on ? `${percent}%` : "Off"}</div>
        <div class="since">${esc(this._relativeTime(light.last_changed))}</div>
        <div class="vslider ${on ? "" : "off"}" id="slider">
          <div class="fill" style="height: ${on ? percent : 0}%"></div>
          ${on ? `<div class="handle" style="bottom: calc(${percent}% - 14px)"></div>` : ""}
        </div>
        <div class="modes">
          <button class="mode" id="power" title="${on ? "Turn off" : "Turn on"}">
            <ha-icon icon="mdi:power"></ha-icon>
          </button>
          <button class="mode ${this._colourMode ? "" : "active"}" id="mode-brightness" title="Brightness">
            <ha-icon icon="mdi:brightness-6"></ha-icon>
          </button>
          <button class="mode wheel ${this._colourMode ? "active" : ""}" id="mode-colour" title="Colour"></button>
        </div>
        <div class="colour"></div>
      </div>`;
    this._wireLightButtons(container);
    this._renderColourArea(container);
    this._wireSlider(container.querySelector("#slider"));
  }

  _renderTabs(dialog) {
    const tabs = dialog.querySelector(".tabs");
    tabs.innerHTML = Object.entries(TABS)
      .map(([tab, label]) => `<button class="tab ${this._tab === tab ? "active" : ""}" data-tab="${tab}">${label}</button>`)
      .join("");
    tabs.querySelectorAll(".tab").forEach((tab) =>
      tab.addEventListener("click", () => {
        this._tab = tab.dataset.tab;
        this._search = "";
        this._folderBrowse = false;
        this._renderDialog();
      })
    );

    const content = dialog.querySelector("#tab-content");
    const active = content.querySelector("input[type=search]");
    const caret = active && active === document.activeElement ? [active.selectionStart, active.selectionEnd] : null;
    content.innerHTML = this._tabMarkup();
    this._wire(dialog);
    if (caret) {
      const search = content.querySelector("input[type=search]");
      if (search) {
        search.focus();
        search.setSelectionRange(caret[0], caret[1]);
      }
    }
  }

  _relativeTime(iso) {
    const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    let value = seconds;
    let unit = "second";
    for (const [step, nextUnit] of [[60, "minute"], [60, "hour"], [24, "day"]]) {
      if (Math.abs(value) < step) break;
      value = Math.round(value / step);
      unit = nextUnit;
    }
    try {
      return new Intl.RelativeTimeFormat(this._hass.locale?.language || "en", { numeric: "auto" }).format(-value, unit);
    } catch (error) {
      return "";
    }
  }

  // ---- tabs -----------------------------------------------------------------------

  _tabMarkup() {
    const light = this._light;
    const effects = light.attributes.effect_list || [];

    if (this._tab === "favourites") {
      const favourites = effects.filter(isPreset).sort((a, b) => a.localeCompare(b));
      if (!favourites.length) {
        return `<div class="empty">No favourites yet. Open <b>Presets</b> and tap the star on one.</div>`;
      }
      return `<div class="list">${favourites
        .map(
          (effect) => `
          <div class="item">
            <button class="label ${effect === light.attributes.effect ? "active" : ""}" data-effect="${esc(
            effect
          )}">${esc(effect)}</button>
            <button class="side star" data-unstar="${esc(effect)}" title="Remove from favourites">
              <ha-icon icon="mdi:star"></ha-icon>
            </button>
          </div>`
        )
        .join("")}</div>`;
    }

    if (this._tab === "effects") {
      const plain = effects.filter((effect) => !isPreset(effect));
      const speed = this._speed;
      const matches = plain.filter((effect) => effect.toLowerCase().includes(this._search.toLowerCase()));
      return `
        <input type="search" id="search" placeholder="Search ${plain.length} effects" value="${esc(this._search)}">
        ${
          speed
            ? `<div class="speed"><span>Speed</span>
                 <input type="range" id="speed" min="1" max="255" value="${esc(speed.state)}">
                 <span>${esc(speed.state)}</span></div>`
            : ""
        }
        ${
          matches.length
            ? `<div class="grid">${matches
                .map(
                  (effect) =>
                    `<div class="item"><button class="label ${
                      effect === light.attributes.effect ? "active" : ""
                    }" data-effect="${esc(effect)}">${esc(effect)}</button></div>`
                )
                .join("")}</div>`
            : `<div class="empty">No effects match.</div>`
        }`;
    }

    const folders = this._folderSelect;
    const presets = this._presetSelect;
    if (!folders || !presets) {
      return `<div class="empty">No preset library installed. Add <b>gouly_presets.json</b> in the integration's Configure screen.</div>`;
    }

    if (this._folderBrowse) {
      const options = folders.attributes.options || [];
      const matches = options.filter((option) => option.toLowerCase().includes(this._search.toLowerCase()));
      return `
        <input type="search" id="search" placeholder="Search ${options.length} folders" value="${esc(this._search)}">
        ${
          matches.length
            ? `<div class="grid">${matches
                .map(
                  (option) =>
                    `<div class="item"><button class="label ${
                      option === folders.state ? "active" : ""
                    }" data-folder="${esc(option)}">${esc(option)}</button></div>`
                )
                .join("")}</div>`
            : `<div class="empty">No folders match.</div>`
        }`;
    }

    const selected = presets.state && !["unknown", "unavailable"].includes(presets.state) ? presets.state : null;
    const options = presets.attributes.options || [];
    const matches = options.filter((option) => option.toLowerCase().includes(this._search.toLowerCase()));
    const favourites = new Set(effects.filter(isPreset));
    return `
      <div class="crumbs">
        <div class="folder">${esc(folders.state)}</div>
        <button class="button" id="change-folder">Change folder</button>
      </div>
      <input type="search" id="search" placeholder="Search ${options.length} presets" value="${esc(this._search)}">
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
                    <button class="side ${starred ? "star" : ""}" data-${starred ? "unstar" : "star"}="${esc(
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

  // ---- wiring ---------------------------------------------------------------------

  _wire(dialog) {
    dialog.querySelector("#change-folder")?.addEventListener("click", () => {
      this._folderBrowse = true;
      this._search = "";
      this._renderDialog();
    });
    dialog.querySelector("#speed")?.addEventListener("change", (event) =>
      this._call("number", "set_value", { entity_id: this._speed.entity_id, value: Number(event.target.value) })
    );
    this._wireItems(dialog);

    const search = dialog.querySelector("input[type=search]");
    search?.addEventListener("input", (event) => {
      this._search = event.target.value;
      // Replace just the list, so focus and caret stay put while typing.
      const content = dialog.querySelector("#tab-content");
      const list = content.querySelector(".list, .grid, .empty");
      const markup = document.createElement("div");
      markup.innerHTML = this._tabMarkup();
      const replacement = markup.querySelector(".list, .grid, .empty");
      if (list && replacement) {
        list.replaceWith(replacement);
        this._wireItems(dialog);
      }
    });
  }

  /** Buttons inside the lists; re-wired when a list is filtered. */
  _wireItems(dialog) {
    dialog.querySelectorAll("[data-effect]").forEach((item) =>
      item.addEventListener("click", () =>
        this._call("light", "turn_on", { entity_id: this._config.entity, effect: item.dataset.effect })
      )
    );
    dialog.querySelectorAll("[data-folder]").forEach((item) =>
      item.addEventListener("click", () => {
        this._call("select", "select_option", { entity_id: this._folderSelect.entity_id, option: item.dataset.folder });
        this._folderBrowse = false;
        this._search = "";
        this._renderDialog();
      })
    );
    dialog.querySelectorAll("[data-preset]").forEach((item) =>
      item.addEventListener("click", () =>
        this._call("select", "select_option", { entity_id: this._presetSelect.entity_id, option: item.dataset.preset })
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

  /** Vertical brightness slider: drag anywhere on it, like Home Assistant's. */
  _wireSlider(slider) {
    if (!slider) return;
    const percentFrom = (event) => {
      const box = slider.getBoundingClientRect();
      return Math.min(100, Math.max(1, Math.round(((box.bottom - event.clientY) / box.height) * 100)));
    };
    const preview = (percent) => {
      slider.classList.remove("off");
      slider.querySelector(".fill").style.height = `${percent}%`;
      let handle = slider.querySelector(".handle");
      if (!handle) {
        handle = document.createElement("div");
        handle.className = "handle";
        slider.appendChild(handle);
      }
      handle.style.bottom = `calc(${percent}% - 14px)`;
      const label = this._backdrop?.querySelector(".percent");
      if (label) label.textContent = `${percent}%`;
    };
    slider.addEventListener("pointerdown", (event) => {
      this._dragging = true;
      slider.setPointerCapture(event.pointerId);
      preview(percentFrom(event));
    });
    slider.addEventListener("pointermove", (event) => {
      if (this._dragging) preview(percentFrom(event));
    });
    slider.addEventListener("pointerup", (event) => {
      if (!this._dragging) return;
      this._dragging = false;
      const percent = percentFrom(event);
      preview(percent);
      this._call("light", "turn_on", { entity_id: this._config.entity, brightness_pct: percent });
    });
    slider.addEventListener("pointercancel", () => {
      this._dragging = false;
    });
  }
}

customElements.define("gouly-card", GoulyCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "gouly-card",
  name: "Gouly Light",
  description: "A Gouly light with its effects, presets and favourites behind one tap.",
  preview: false,
  documentationURL: "https://github.com/mikemaat/ha-gouly-card",
});

console.info(`%c GOULY-CARD %c ${VERSION} `, "color:#fff;background:#03a9f4;font-weight:700", "color:#03a9f4;background:#fff");
