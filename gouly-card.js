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

const VERSION = "0.3.0";

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

const TABS = { favourites: "Favourites", effects: "Effects", presets: "Browse presets" };

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
    width: 40px; height: 40px; border-radius: 50%; flex: 0 0 40px;
    display: grid; place-items: center; font-size: 18px;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), 0.05);
    color: var(--state-icon-color, #9e9e9e);
  }
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
    font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif);
  }
  .dialog {
    background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color);
    border-radius: 16px; width: min(560px, 100%); max-height: min(85vh, 900px);
    display: flex; flex-direction: column; overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,.5);
  }
  .dialog header { display: flex; align-items: center; gap: 8px; padding: 16px; }
  .dialog header h2 { margin: 0; font-size: 18px; font-weight: 500; flex: 1; }
  .close { background: none; border: none; color: inherit; font-size: 22px; cursor: pointer; padding: 4px 8px; line-height: 1; }
  .body { overflow: auto; padding: 0 16px 16px; }
  .section { margin-bottom: 18px; }
  .section h3 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: var(--secondary-text-color); }

  /* Brightness slider, in the style of Home Assistant's own light controls. */
  .light-row { display: flex; align-items: stretch; gap: 8px; }
  .power {
    width: 56px; border-radius: 14px; border: none; cursor: pointer; font-size: 20px;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), .06); color: var(--primary-text-color);
  }
  .power.on { background: var(--light-color, #ffc107); color: #2b2b2b; }
  .slider {
    flex: 1; position: relative; height: 56px; border-radius: 14px; cursor: pointer;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), .06);
    overflow: hidden; touch-action: none; user-select: none;
  }
  .slider .fill { position: absolute; inset: 0 auto 0 0; background: var(--light-color, #ffc107); opacity: .9; }
  .slider .label {
    position: absolute; inset: 0; display: flex; align-items: center; padding: 0 14px;
    font-size: 15px; color: var(--primary-text-color); mix-blend-mode: difference; pointer-events: none;
  }
  .slider.off .fill { width: 0 !important; }

  .swatches { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
  .swatch { width: 34px; height: 34px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; padding: 0; }
  .swatch.selected { border-color: var(--primary-text-color); }
  .tabs { display: flex; gap: 4px; padding: 0 16px 12px; }
  .tab {
    flex: 1; padding: 8px; border-radius: 10px; border: none; cursor: pointer; font-size: 13px;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), .06); color: var(--primary-text-color);
  }
  .tab.active { background: var(--primary-color, #03a9f4); color: var(--text-primary-color, #fff); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; margin-top: 10px; }
  .chip {
    padding: 10px; border-radius: 10px; border: none; cursor: pointer; text-align: left; font-size: 13px;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), .06); color: var(--primary-text-color);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .chip.active { background: var(--primary-color, #03a9f4); color: var(--text-primary-color, #fff); }
  .chip-row { display: flex; align-items: stretch; gap: 2px; }
  .chip-row .chip { flex: 1; border-radius: 10px 0 0 10px; min-width: 0; }
  .star, .move {
    border: none; cursor: pointer; font-size: 15px; padding: 0 10px;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), .06); color: var(--secondary-text-color);
  }
  .star { border-radius: 0 10px 10px 0; }
  .star.on { color: #ffc107; }
  .move { border-radius: 0; font-size: 13px; }
  .move:disabled { opacity: .3; cursor: default; }
  .move.first { border-radius: 0; }
  .hint { color: var(--secondary-text-color); font-size: 12px; margin-top: 8px; }
  .crumbs { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .crumbs .folder { flex: 1; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  input[type="search"] {
    width: 100%; padding: 10px; border-radius: 10px; font-size: 14px; box-sizing: border-box;
    background: rgba(var(--rgb-primary-text-color, 255,255,255), .06);
    color: var(--primary-text-color); border: 1px solid rgba(var(--rgb-primary-text-color, 255,255,255), .1);
  }
  input[type="search"]::placeholder { color: var(--secondary-text-color); }
  input[type="range"] { flex: 1; accent-color: var(--primary-color, #03a9f4); }
  .controls { display: flex; align-items: center; gap: 12px; margin-top: 10px; }
  .value { min-width: 46px; text-align: right; font-variant-numeric: tabular-nums; color: var(--secondary-text-color); }
  .actions { display: flex; gap: 8px; margin-top: 12px; }
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

/** The light's current colour as an "r,g,b" string, or null when it has none. */
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

class GoulyCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._tab = "favourites";
    this._search = "";
    this._folderBrowse = false; // showing the folder list rather than its presets
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

  _call(domain, service, data) {
    this._hass.callService(domain, service, data);
  }

  // ---- the dashboard row ----------------------------------------------------------

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
    const detail = on ? [light.attributes.effect, percent ? `${percent}%` : null].filter(Boolean).join(" · ") || "On" : "Off";
    const colour = on ? lightColour(light) : null;

    root.innerHTML = `
      <div class="row" id="row">
        <div class="icon" id="icon" style="${
          colour ? `background: rgba(${colour}, .25); color: rgb(${colour});` : ""
        }">${on ? "☀" : "☾"}</div>
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
  }

  // ---- dialog ---------------------------------------------------------------------

  _openDialog() {
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
    document.removeEventListener("keydown", this._escape);
    this._backdrop?.remove();
    this._backdrop = null;
  }

  _renderDialog() {
    if (!this._backdrop || !this._light) return;
    const light = this._light;
    const on = light.state === "on";
    const percent = Math.round(((light.attributes.brightness || 0) / 255) * 100);
    const colour = lightColour(light) || "255,193,7";
    const name = this._config.name || light.attributes.friendly_name || "Gouly";

    const previous = this._backdrop.querySelector(".dialog");
    const scroll = previous?.querySelector(".body")?.scrollTop || 0;
    // Keep what the user is typing: this runs again on every state update.
    const active = previous?.querySelector("input[type=search]");
    const caret = active && active === document.activeElement ? [active.selectionStart, active.selectionEnd] : null;

    const dialog = document.createElement("div");
    dialog.className = "dialog";
    dialog.style.setProperty("--light-color", `rgb(${colour})`);
    dialog.innerHTML = `
      <header>
        <h2>${esc(name)}</h2>
        <button class="close" id="close" aria-label="Close">✕</button>
      </header>
      <div class="tabs">
        ${Object.entries(TABS)
          .map(([tab, label]) => `<button class="tab ${this._tab === tab ? "active" : ""}" data-tab="${tab}">${label}</button>`)
          .join("")}
      </div>
      <div class="body">
        <div class="section">
          <div class="light-row">
            <button class="power ${on ? "on" : ""}" id="power" title="${on ? "Turn off" : "Turn on"}">⏻</button>
            <div class="slider ${on ? "" : "off"}" id="slider" role="slider" aria-valuenow="${percent}">
              <div class="fill" style="width: ${on ? percent : 0}%"></div>
              <div class="label">${on ? `${percent}%` : "Off"}</div>
            </div>
          </div>
          <div class="swatches">
            ${SWATCHES.map(([label, rgbw]) => {
              const shown = rgbw[3] ? "255,214,170" : `${rgbw[0]},${rgbw[1]},${rgbw[2]}`;
              const selected = (light.attributes.rgbw_color || []).join(",") === rgbw.join(",");
              return `<button class="swatch ${selected ? "selected" : ""}" title="${esc(label)}" data-rgbw="${rgbw.join(
                ","
              )}" style="background: rgb(${shown})"></button>`;
            }).join("")}
          </div>
        </div>
        <div class="section" id="tab-content"></div>
      </div>`;

    dialog.querySelector("#tab-content").innerHTML = this._tabMarkup();

    if (previous) previous.replaceWith(dialog);
    else this._backdrop.appendChild(dialog);
    dialog.querySelector(".body").scrollTop = scroll;

    this._wire(dialog);

    if (caret) {
      const search = dialog.querySelector("input[type=search]");
      if (search) {
        search.focus();
        search.setSelectionRange(caret[0], caret[1]);
      }
    }
  }

  _tabMarkup() {
    const light = this._light;
    const effects = light.attributes.effect_list || [];

    if (this._tab === "favourites") {
      const favourites = effects.filter(isPreset);
      if (!favourites.length) {
        return `<h3>Favourites</h3><div class="empty">No favourites yet. Open <b>Browse presets</b> and tap the ☆ on a preset.</div>`;
      }
      return `
        <h3>Favourites</h3>
        <div class="grid">${favourites
          .map(
            (effect, index) => `
              <div class="chip-row">
                <button class="chip ${effect === light.attributes.effect ? "active" : ""}" data-effect="${esc(
                  effect
                )}">${esc(effect)}</button>
                <button class="move" data-move-up="${esc(effect)}" ${index === 0 ? "disabled" : ""} title="Move up">↑</button>
                <button class="move" data-move-down="${esc(effect)}" ${
                  index === favourites.length - 1 ? "disabled" : ""
                } title="Move down">↓</button>
                <button class="star on" data-unstar="${esc(effect)}" title="Remove from favourites">★</button>
              </div>`
          )
          .join("")}</div>
        <div class="hint">Tap a favourite to run it. ↑ ↓ reorder, ★ removes.</div>`;
    }

    if (this._tab === "effects") {
      const plain = effects.filter((effect) => !isPreset(effect));
      const speed = this._speed;
      const matches = plain.filter((effect) => effect.toLowerCase().includes(this._search.toLowerCase()));
      return `
        <h3>Effects</h3>
        <input type="search" id="search" placeholder="Search ${plain.length} effects" value="${esc(this._search)}">
        ${
          speed
            ? `<div class="controls">
                 <span class="value" style="text-align:left">Speed</span>
                 <input type="range" id="speed" min="1" max="255" value="${esc(speed.state)}">
                 <span class="value">${esc(speed.state)}</span>
               </div>`
            : ""
        }
        ${matches.length ? this._chips(matches, light.attributes.effect, "effect") : `<div class="empty">No effects match.</div>`}`;
    }

    // Browse presets: folder list, then that folder's presets.
    const folders = this._folderSelect;
    const presets = this._presetSelect;
    if (!folders || !presets) {
      return `<h3>Browse presets</h3><div class="empty">No preset library installed. Add <b>gouly_presets.json</b> in the integration's Configure screen.</div>`;
    }

    if (this._folderBrowse) {
      const options = folders.attributes.options || [];
      const matches = options.filter((option) => option.toLowerCase().includes(this._search.toLowerCase()));
      return `
        <h3>Preset folders</h3>
        <input type="search" id="search" placeholder="Search ${options.length} folders" value="${esc(this._search)}">
        ${matches.length ? this._chips(matches, folders.state, "folder") : `<div class="empty">No folders match.</div>`}`;
    }

    const selected = presets.state && !["unknown", "unavailable"].includes(presets.state) ? presets.state : null;
    const options = presets.attributes.options || [];
    const matches = options.filter((option) => option.toLowerCase().includes(this._search.toLowerCase()));
    const favourites = new Set((light.attributes.effect_list || []).filter(isPreset));
    return `
      <div class="crumbs">
        <div class="folder">${esc(folders.state)}</div>
        <button class="button" id="change-folder">Change folder</button>
      </div>
      <input type="search" id="search" placeholder="Search ${options.length} presets in this folder" value="${esc(
        this._search
      )}">
      ${
        matches.length
          ? `<div class="grid">${matches
              .map((option) => {
                const effect = `${folders.state} / ${option}`;
                const starred = favourites.has(effect);
                return `
                  <div class="chip-row">
                    <button class="chip ${option === selected ? "active" : ""}" data-preset="${esc(option)}">${esc(
                  option
                )}</button>
                    <button class="star ${starred ? "on" : ""}" data-${starred ? "unstar" : "star"}="${esc(
                  effect
                )}" title="${starred ? "Remove from favourites" : "Add to favourites"}">${starred ? "★" : "☆"}</button>
                  </div>`;
              })
              .join("")}</div>
             <div class="hint">Tap a preset to run it, ☆ to keep it in Favourites.</div>`
          : `<div class="empty">No presets match.</div>`
      }`;
  }

  _chips(items, current, kind) {
    return `<div class="grid">${items
      .map((item) => `<button class="chip ${item === current ? "active" : ""}" data-${kind}="${esc(item)}">${esc(item)}</button>`)
      .join("")}</div>`;
  }

  _wire(dialog) {
    dialog.querySelector("#close").addEventListener("click", () => this._closeDialog());
    dialog.querySelectorAll(".tab").forEach((tab) =>
      tab.addEventListener("click", () => {
        this._tab = tab.dataset.tab;
        this._search = "";
        this._folderBrowse = false;
        this._renderDialog();
      })
    );
    dialog.querySelector("#power").addEventListener("click", () =>
      this._call("light", "toggle", { entity_id: this._config.entity })
    );

    this._wireSlider(dialog.querySelector("#slider"));

    dialog.querySelectorAll(".swatch").forEach((swatch) =>
      swatch.addEventListener("click", () =>
        this._call("light", "turn_on", {
          entity_id: this._config.entity,
          rgbw_color: swatch.dataset.rgbw.split(",").map(Number),
        })
      )
    );
    this._wireChips(dialog);
    dialog.querySelector("#change-folder")?.addEventListener("click", () => {
      this._folderBrowse = true;
      this._search = "";
      this._renderDialog();
    });
    dialog.querySelector("#speed")?.addEventListener("change", (event) =>
      this._call("number", "set_value", { entity_id: this._speed.entity_id, value: Number(event.target.value) })
    );

    const search = dialog.querySelector("input[type=search]");
    search?.addEventListener("input", (event) => {
      this._search = event.target.value;
      // Replace just the list, so focus and caret stay put while typing.
      const content = dialog.querySelector("#tab-content");
      const list = content.querySelector(".grid, .empty");
      const markup = document.createElement("div");
      markup.innerHTML = this._tabMarkup();
      const replacement = markup.querySelector(".grid, .empty");
      if (list && replacement) {
        list.replaceWith(replacement);
        this._wireChips(dialog);
      }
    });
  }

  /** Wire the preset/effect/folder buttons; called again when the list is filtered. */
  _wireChips(dialog) {
    dialog.querySelectorAll("[data-effect]").forEach((chip) =>
      chip.addEventListener("click", () =>
        this._call("light", "turn_on", { entity_id: this._config.entity, effect: chip.dataset.effect })
      )
    );
    dialog.querySelectorAll("[data-folder]").forEach((chip) =>
      chip.addEventListener("click", () => {
        this._call("select", "select_option", {
          entity_id: this._folderSelect.entity_id,
          option: chip.dataset.folder,
        });
        this._folderBrowse = false;
        this._search = "";
        this._renderDialog();
      })
    );
    dialog.querySelectorAll("[data-preset]").forEach((chip) =>
      chip.addEventListener("click", () =>
        this._call("select", "select_option", { entity_id: this._presetSelect.entity_id, option: chip.dataset.preset })
      )
    );
    dialog.querySelectorAll("[data-star]").forEach((star) =>
      star.addEventListener("click", () =>
        this._call("gouly", "add_favourite", { entity_id: this._config.entity, preset: star.dataset.star })
      )
    );
    dialog.querySelectorAll("[data-unstar]").forEach((star) =>
      star.addEventListener("click", () =>
        this._call("gouly", "remove_favourite", { entity_id: this._config.entity, preset: star.dataset.unstar })
      )
    );
    dialog.querySelectorAll("[data-move-up]").forEach((button) =>
      button.addEventListener("click", () => this._move(button.dataset.moveUp, -1))
    );
    dialog.querySelectorAll("[data-move-down]").forEach((button) =>
      button.addEventListener("click", () => this._move(button.dataset.moveDown, 1))
    );
  }

  /** Move a favourite up or down and save the new order. */
  _move(effect, direction) {
    const favourites = (this._light.attributes.effect_list || []).filter(isPreset);
    const index = favourites.indexOf(effect);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= favourites.length) return;
    favourites.splice(target, 0, ...favourites.splice(index, 1));
    this._call("gouly", "set_favourites", { entity_id: this._config.entity, presets: favourites });
  }

  /** Home Assistant style brightness bar: click or drag anywhere on it. */
  _wireSlider(slider) {
    if (!slider) return;
    const percentFrom = (event) => {
      const box = slider.getBoundingClientRect();
      return Math.min(100, Math.max(1, Math.round(((event.clientX - box.left) / box.width) * 100)));
    };
    const preview = (percent) => {
      slider.classList.remove("off");
      slider.querySelector(".fill").style.width = `${percent}%`;
      slider.querySelector(".label").textContent = `${percent}%`;
    };
    slider.addEventListener("pointerdown", (event) => {
      this._dragging = true;
      slider.setPointerCapture(event.pointerId);
      preview(percentFrom(event));
    });
    slider.addEventListener("pointermove", (event) => {
      if (this._dragging) preview(percentFrom(event));
    });
    const finish = (event) => {
      if (!this._dragging) return;
      this._dragging = false;
      const percent = percentFrom(event);
      preview(percent);
      this._call("light", "turn_on", { entity_id: this._config.entity, brightness_pct: percent });
    };
    slider.addEventListener("pointerup", finish);
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
