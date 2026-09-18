/**
 * Gouly Card - a compact row for a Gouly lighting controller that opens a dialog with
 * colour, brightness, effects, presets and favourites.
 *
 * Works with the entities created by the ha-gouly integration:
 *   light.*                     the light
 *   select.*_preset_folder      preset folder
 *   select.*_preset             preset in that folder
 *   number.*_effect_speed       effect speed
 *   button.*_add_preset_to_favourites
 *
 * Only `entity` is required; the others are found from the same device.
 */

const VERSION = "0.1.0";

const SWATCHES = [
  ["Red", [255, 0, 0, 0]],
  ["Orange", [255, 80, 0, 0]],
  ["Yellow", [255, 190, 0, 0]],
  ["Green", [0, 255, 0, 0]],
  ["Cyan", [0, 190, 255, 0]],
  ["Blue", [0, 0, 255, 0]],
  ["Purple", [150, 0, 255, 0]],
  ["Pink", [255, 0, 130, 0]],
  ["White", [255, 255, 255, 0]],
  ["Warm white", [0, 0, 0, 255]],
];

const STYLES = `
  :host { display: block; }
  .row {
    display: flex; align-items: center; gap: 12px;
    background: var(--ha-card-background, var(--card-background-color, #1c1c1c));
    border-radius: var(--ha-card-border-radius, 12px);
    border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, transparent);
    box-shadow: var(--ha-card-box-shadow, none);
    padding: 12px; cursor: pointer;
  }
  .icon {
    width: 40px; height: 40px; border-radius: 50%; flex: 0 0 40px;
    display: grid; place-items: center;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), 0.05);
    color: var(--state-icon-color, #9e9e9e);
  }
  .icon.on { background: rgba(255, 193, 7, 0.2); color: var(--state-light-active-color, #ffc107); }
  .titles { flex: 1; min-width: 0; }
  .name { font-size: 15px; color: var(--primary-text-color); }
  .state { font-size: 13px; color: var(--secondary-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .toggle {
    width: 44px; height: 26px; border-radius: 13px; border: none; cursor: pointer;
    background: var(--switch-unchecked-track-color, #666); position: relative; flex: 0 0 auto;
  }
  .toggle.on { background: var(--primary-color, #03a9f4); }
  .toggle::after {
    content: ""; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px;
    border-radius: 50%; background: #fff; transition: transform .15s;
  }
  .toggle.on::after { transform: translateX(18px); }

  .backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 9999;
    display: grid; place-items: center; padding: 16px;
  }
  .dialog {
    background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color);
    border-radius: 16px; width: min(560px, 100%); max-height: min(85vh, 900px);
    display: flex; flex-direction: column; overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,.5);
  }
  .dialog header { display: flex; align-items: center; gap: 8px; padding: 16px; }
  .dialog header h2 { margin: 0; font-size: 18px; font-weight: 500; flex: 1; }
  .close { background: none; border: none; color: inherit; font-size: 22px; cursor: pointer; padding: 4px 8px; }
  .body { overflow: auto; padding: 0 16px 16px; }
  .section { margin-bottom: 18px; }
  .section h3 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: var(--secondary-text-color); }
  .controls { display: flex; align-items: center; gap: 12px; }
  input[type="range"] { flex: 1; accent-color: var(--primary-color, #03a9f4); }
  .value { width: 46px; text-align: right; font-variant-numeric: tabular-nums; color: var(--secondary-text-color); }
  .swatches { display: flex; flex-wrap: wrap; gap: 10px; }
  .swatch { width: 34px; height: 34px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; }
  .swatch.selected { border-color: var(--primary-color, #03a9f4); }
  .tabs { display: flex; gap: 4px; padding: 0 16px 12px; }
  .tab {
    flex: 1; padding: 8px; border-radius: 10px; border: none; cursor: pointer; font-size: 13px;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), .06); color: var(--primary-text-color);
  }
  .tab.active { background: var(--primary-color, #03a9f4); color: var(--text-primary-color, #fff); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
  .chip {
    padding: 10px; border-radius: 10px; border: none; cursor: pointer; text-align: left; font-size: 13px;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), .06); color: var(--primary-text-color);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .chip.active { background: var(--primary-color, #03a9f4); color: var(--text-primary-color, #fff); }
  select, input[type="search"] {
    width: 100%; padding: 10px; border-radius: 10px; font-size: 14px; box-sizing: border-box;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), .06);
    color: var(--primary-text-color); border: 1px solid rgba(var(--rgb-primary-text-color, 255,255,255), .1);
  }
  .actions { display: flex; gap: 8px; margin-top: 8px; }
  .button {
    padding: 10px 14px; border-radius: 10px; border: none; cursor: pointer; font-size: 13px;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), .06); color: var(--primary-text-color);
  }
  .button.primary { background: var(--primary-color, #03a9f4); color: var(--text-primary-color, #fff); }
  .button:disabled { opacity: .5; cursor: default; }
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

class GoulyCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._tab = "favourites";
    this._search = "";
    this._dialogOpen = false;
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
    this._render();
  }

  // ---- entities -------------------------------------------------------------------

  get _light() {
    return this._hass?.states[this._config.entity];
  }

  /** Find this light's sibling entities (same device), or use explicit config. */
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
  get _favouriteButton() { return this._sibling("button", "add_preset_to_favourites"); }

  _call(domain, service, data) {
    this._hass.callService(domain, service, data);
  }

  // ---- rendering ------------------------------------------------------------------

  _render() {
    if (!this._config || !this._hass) return;
    const light = this._light;
    const root = this.shadowRoot.getElementById("root");
    if (!root) return;
    if (!light) {
      root.innerHTML = `<div class="row"><div class="titles"><div class="name">${esc(this._config.entity)}</div><div class="state">Entity not found</div></div></div>`;
      return;
    }
    const on = light.state === "on";
    const name = this._config.name || light.attributes.friendly_name || "Gouly";
    const detail = on
      ? [light.attributes.effect, light.attributes.brightness ? `${Math.round((light.attributes.brightness / 255) * 100)}%` : null]
          .filter(Boolean)
          .join(" · ") || "On"
      : "Off";

    root.innerHTML = `
      <div class="row" id="row">
        <div class="icon ${on ? "on" : ""}">${on ? "☀" : "☾"}</div>
        <div class="titles"><div class="name">${esc(name)}</div><div class="state">${esc(detail)}</div></div>
        <button class="toggle ${on ? "on" : ""}" id="toggle" aria-label="Toggle"></button>
      </div>`;
    root.querySelector("#row").addEventListener("click", (event) => {
      if (event.target.id !== "toggle") this._openDialog();
    });
    root.querySelector("#toggle").addEventListener("click", (event) => {
      event.stopPropagation();
      this._call("light", "toggle", { entity_id: this._config.entity });
    });
    if (this._dialogOpen) this._renderDialog();
  }

  _openDialog() {
    this._dialogOpen = true;
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
  }

  _closeDialog() {
    this._dialogOpen = false;
    document.removeEventListener("keydown", this._escape);
    this._backdrop?.remove();
    this._backdrop = null;
  }

  _renderDialog() {
    if (!this._backdrop) return;
    const light = this._light;
    const name = this._config.name || light.attributes.friendly_name || "Gouly";
    const on = light.state === "on";
    const brightness = Math.round(((light.attributes.brightness || 0) / 255) * 100);
    const effects = light.attributes.effect_list || [];
    const favourites = effects.filter(isPreset);
    const plainEffects = effects.filter((effect) => !isPreset(effect));
    const speed = this._speed;
    const folders = this._folderSelect;
    const presets = this._presetSelect;

    const existing = this._backdrop.querySelector(".dialog");
    const scroll = existing ? existing.querySelector(".body")?.scrollTop : 0;

    const dialog = document.createElement("div");
    dialog.className = "dialog";
    dialog.innerHTML = `
      <header>
        <h2>${esc(name)}</h2>
        <button class="close" id="close" aria-label="Close">✕</button>
      </header>
      <div class="tabs">
        ${["favourites", "effects", "presets"]
          .map(
            (tab) =>
              `<button class="tab ${this._tab === tab ? "active" : ""}" data-tab="${tab}">${
                { favourites: "Favourites", effects: "Effects", presets: "Browse presets" }[tab]
              }</button>`
          )
          .join("")}
      </div>
      <div class="body">
        <div class="section">
          <h3>Light</h3>
          <div class="controls">
            <button class="button ${on ? "primary" : ""}" id="power">${on ? "On" : "Off"}</button>
            <input type="range" id="brightness" min="1" max="100" value="${brightness || 1}" ${on ? "" : "disabled"}>
            <span class="value">${on ? `${brightness}%` : "—"}</span>
          </div>
          <div class="swatches" style="margin-top:12px">
            ${SWATCHES.map(
              ([label, rgbw]) =>
                `<button class="swatch" title="${esc(label)}" data-rgbw="${rgbw.join(",")}" style="background: rgb(${rgbw[0]},${rgbw[1]},${rgbw[2]}); ${
                  rgbw[3] ? "background: #ffd9a0;" : ""
                }"></button>`
            ).join("")}
          </div>
        </div>
        <div class="section" id="tab-content"></div>
      </div>`;

    const content = dialog.querySelector("#tab-content");
    if (this._tab === "favourites") {
      content.innerHTML = `<h3>Favourites</h3>${
        favourites.length
          ? `<div class="grid">${favourites
              .map(
                (effect) =>
                  `<button class="chip ${light.attributes.effect === effect ? "active" : ""}" data-effect="${esc(effect)}">${esc(effect)}</button>`
              )
              .join("")}</div>`
          : `<div class="empty">No favourites yet. Use <b>Browse presets</b>, pick one, then press <b>Add to favourites</b>.</div>`
      }`;
    } else if (this._tab === "effects") {
      const filtered = plainEffects.filter((effect) => effect.toLowerCase().includes(this._search.toLowerCase()));
      content.innerHTML = `
        <h3>Effects</h3>
        <input type="search" id="search" placeholder="Search ${plainEffects.length} effects" value="${esc(this._search)}">
        ${
          speed
            ? `<div class="controls" style="margin-top:10px">
                 <span class="value" style="width:auto">Speed</span>
                 <input type="range" id="speed" min="1" max="255" value="${esc(speed.state)}">
                 <span class="value">${esc(speed.state)}</span>
               </div>`
            : ""
        }
        <div class="grid" style="margin-top:10px">${filtered
          .map(
            (effect) =>
              `<button class="chip ${light.attributes.effect === effect ? "active" : ""}" data-effect="${esc(effect)}">${esc(effect)}</button>`
          )
          .join("")}</div>`;
    } else {
      const options = presets?.attributes.options || [];
      const filtered = options.filter((option) => option.toLowerCase().includes(this._search.toLowerCase()));
      content.innerHTML = `
        <h3>Browse presets</h3>
        ${
          folders
            ? `<select id="folder">${(folders.attributes.options || [])
                .map((option) => `<option ${option === folders.state ? "selected" : ""}>${esc(option)}</option>`)
                .join("")}</select>`
            : `<div class="empty">No preset library installed. Upload gouly_presets.json in the integration's Configure screen.</div>`
        }
        ${folders ? `<input type="search" id="search" style="margin-top:8px" placeholder="Search ${options.length} presets in this folder" value="${esc(this._search)}">` : ""}
        <div class="grid" style="margin-top:10px">${filtered
          .map(
            (option) =>
              `<button class="chip ${presets?.state === option ? "active" : ""}" data-preset="${esc(option)}">${esc(option)}</button>`
          )
          .join("")}</div>
        ${
          this._favouriteButton
            ? `<div class="actions"><button class="button" id="favourite" ${
                presets?.state && presets.state !== "unknown" ? "" : "disabled"
              }>☆ Add &quot;${esc(presets?.state || "…")}&quot; to favourites</button></div>`
            : ""
        }`;
    }

    if (existing) existing.replaceWith(dialog);
    else this._backdrop.appendChild(dialog);
    if (scroll) dialog.querySelector(".body").scrollTop = scroll;

    // ---- wiring
    dialog.querySelector("#close").addEventListener("click", () => this._closeDialog());
    dialog.querySelectorAll(".tab").forEach((tab) =>
      tab.addEventListener("click", () => {
        this._tab = tab.dataset.tab;
        this._search = "";
        this._renderDialog();
      })
    );
    dialog.querySelector("#power").addEventListener("click", () =>
      this._call("light", "toggle", { entity_id: this._config.entity })
    );
    const brightnessInput = dialog.querySelector("#brightness");
    brightnessInput?.addEventListener("change", (event) =>
      this._call("light", "turn_on", {
        entity_id: this._config.entity,
        brightness_pct: Number(event.target.value),
      })
    );
    dialog.querySelectorAll(".swatch").forEach((swatch) =>
      swatch.addEventListener("click", () =>
        this._call("light", "turn_on", {
          entity_id: this._config.entity,
          rgbw_color: swatch.dataset.rgbw.split(",").map(Number),
        })
      )
    );
    dialog.querySelectorAll("[data-effect]").forEach((chip) =>
      chip.addEventListener("click", () =>
        this._call("light", "turn_on", { entity_id: this._config.entity, effect: chip.dataset.effect })
      )
    );
    dialog.querySelectorAll("[data-preset]").forEach((chip) =>
      chip.addEventListener("click", () =>
        this._call("select", "select_option", { entity_id: presets.entity_id, option: chip.dataset.preset })
      )
    );
    dialog.querySelector("#folder")?.addEventListener("change", (event) => {
      this._search = "";
      this._call("select", "select_option", { entity_id: folders.entity_id, option: event.target.value });
    });
    dialog.querySelector("#speed")?.addEventListener("change", (event) =>
      this._call("number", "set_value", { entity_id: speed.entity_id, value: Number(event.target.value) })
    );
    dialog.querySelector("#favourite")?.addEventListener("click", () =>
      this._call("button", "press", { entity_id: this._favouriteButton.entity_id })
    );
    const search = dialog.querySelector("#search");
    if (search) {
      search.addEventListener("input", (event) => {
        this._search = event.target.value;
        this._renderDialog();
        this._backdrop.querySelector("#search")?.focus();
      });
    }
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
