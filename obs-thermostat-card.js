/*!
 * Obs Thermostat Card for Home Assistant
 * Carte thermostat (entité `climate`) inspirée de spencersmb/honeywell-smb-card.
 */

const CARD_VERSION = "1.0.0";

const MODE_ICONS = {
  heat: "mdi:fire",
  heat_cool: "mdi:autorenew",
  auto: "mdi:autorenew",
  cool: "mdi:snowflake",
  dry: "mdi:water-percent",
  fan_only: "mdi:fan",
  off: "mdi:power",
};
const MODE_ORDER = ["heat", "heat_cool", "auto", "cool", "dry", "fan_only", "off"];
const MODE_COLORS = {
  heat: "#e8958a",
  cool: "#6fb1f0",
  heat_cool: "#e6b450",
  auto: "#e6b450",
  dry: "#e6b450",
  fan_only: "#7fcfc4",
  off: "#9e9e9e",
};
const MODE_TILE_BG = {
  heat: "#48322f",
  cool: "#2b3b4c",
  heat_cool: "#463d29",
  auto: "#463d29",
  dry: "#463d29",
  fan_only: "#27403d",
  off: "#333333",
};

const I18N = {
  en: {
    current: "Current Temp",
    mode: "Mode",
    presets: "Presets",
    heat: "HEAT TO",
    cool: "COOL TO",
    set: "SET TO",
    settings: "Settings",
    notfound: "Entity not found",
    actions: { heating: "Heating", cooling: "Cooling", idle: "Idle", off: "Off", drying: "Drying", fan: "Fan", defrosting: "Defrosting" },
  },
  fr: {
    current: "Température actuelle",
    mode: "Mode",
    presets: "Préréglages",
    heat: "CHAUFFER À",
    cool: "REFROIDIR À",
    set: "RÉGLER À",
    settings: "Réglages",
    notfound: "Entité introuvable",
    actions: { heating: "Chauffe", cooling: "Refroidissement", idle: "Inactif", off: "Éteint", drying: "Déshumidification", fan: "Ventilation", defrosting: "Dégivrage" },
  },
};

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const fmtTemp = (v) => {
  if (v === null || v === undefined || isNaN(v)) return "--";
  const n = Math.round(Number(v) * 10) / 10;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
};

const STYLE = `
  :host { display: block; }
  ha-card {
    container-type: inline-size;
    padding: 20px;
    background: var(--htc-card-bg, var(--ha-card-background, var(--card-background-color, #1c1c1c)));
    color: var(--primary-text-color, #fff);
    border-radius: var(--ha-card-border-radius, 24px);
    box-sizing: border-box;
    font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif);
    --htc-tile: var(--htc-tile-bg, var(--secondary-background-color, #2a2a2a));
    --htc-muted: var(--secondary-text-color, #8a8a8a);
    --htc-accent: #e8958a;
    --htc-accent-bg: #48322f;
  }
  .header { display: flex; justify-content: space-between; align-items: flex-start; }
  .title { font-size: 22px; font-weight: 500; line-height: 1.2; }
  .subtitle { font-size: 16px; font-weight: 500; color: var(--htc-muted); margin-top: 4px; }
  .gear {
    background: none; border: none; color: var(--htc-muted); cursor: pointer;
    padding: 4px; border-radius: 50%; --mdc-icon-size: 28px; display: flex;
  }
  .gear:hover { color: var(--primary-text-color); }

  .top { display: flex; align-items: center; gap: 4cqw; margin-top: 14px; }
  .current {
    position: relative; flex: 0 0 36%; aspect-ratio: 1.8 / 1;
    border-radius: 22px; background: var(--htc-accent-bg);
    display: flex; align-items: center; justify-content: center;
    color: var(--htc-accent); transition: background .3s, color .3s;
  }
  .current .num { font-size: 15cqw; font-weight: 400; line-height: 1; letter-spacing: -0.02em; }
  .current .unit { position: absolute; top: 10px; right: 14px; font-size: 3.8cqw; font-weight: 500; }

  .targets { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 0; }
  .target { display: flex; flex-direction: column; align-items: center; width: 100%; }
  .target .label { font-size: 3.8cqw; font-weight: 500; letter-spacing: 0.03em; color: var(--htc-accent); }
  .target .row { display: flex; align-items: center; justify-content: center; gap: 3cqw; width: 100%; }
  .target .val { font-size: 10cqw; font-weight: 500; line-height: 1.1; min-width: 14cqw; text-align: center; }
  .round {
    flex: 0 0 auto; width: 15cqw; height: 15cqw; max-width: 80px; max-height: 80px;
    border-radius: 50%; border: none; background: var(--htc-tile);
    color: var(--primary-text-color); font-size: 7cqw; line-height: 1; cursor: pointer;
    display: flex; align-items: center; justify-content: center; --mdc-icon-size: 5cqw;
    transition: filter .15s, transform .1s;
  }
  .round:hover { filter: brightness(1.25); }
  .round:active { transform: scale(0.94); }
  .round:disabled { opacity: .35; cursor: default; }
  .targets.dual .val { font-size: 6.5cqw; min-width: 10cqw; }
  .targets.dual .round { width: 9cqw; height: 9cqw; font-size: 5cqw; }
  .targets.dual .label { font-size: 3cqw; }
  .status { font-size: 4cqw; font-weight: 500; color: var(--htc-muted); }

  .section-title { font-size: 4.2cqw; font-weight: 500; color: var(--htc-muted); margin: 20px 0 10px; }
  .modes { display: grid; gap: 12px; }
  .mode {
    height: 14cqw; max-height: 74px; min-height: 52px; border: none; border-radius: 18px;
    background: var(--htc-tile); color: var(--primary-text-color); cursor: pointer;
    display: flex; align-items: center; justify-content: center; --mdc-icon-size: 7cqw;
    transition: filter .15s, background .2s;
  }
  .mode ha-icon { --mdc-icon-size: clamp(26px, 7cqw, 40px); }
  .mode:hover { filter: brightness(1.25); }
  .mode.active { color: var(--c); background: var(--bg); }

  .preset-wrap { position: relative; }
  select.preset {
    width: 100%; box-sizing: border-box; appearance: none; -webkit-appearance: none;
    border: none; border-radius: 18px; background: var(--htc-tile);
    color: var(--primary-text-color); font-size: 5cqw; font-weight: 500; font-family: inherit;
    padding: 0 60px 0 20px; height: 13cqw; min-height: 50px; max-height: 68px; cursor: pointer;
  }
  select.preset:focus { outline: 2px solid var(--htc-accent); }
  .preset-wrap::after {
    content: ""; position: absolute; right: 24px; top: 50%; margin-top: -4px; pointer-events: none;
    border-left: 12px solid transparent; border-right: 12px solid transparent; border-top: 11px solid var(--htc-muted);
  }
  .error { padding: 16px; color: var(--error-color, #db4437); }
  [hidden] { display: none !important; }
`;

class ObsThermostatCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._pending = {};
    this._built = false;
    this._cache = {};
  }

  static getConfigElement() {
    return document.createElement("obs-thermostat-card-editor");
  }

  static getStubConfig(hass) {
    const entity = hass && Object.keys(hass.states).find((id) => id.startsWith("climate."));
    return { entity: entity || "climate.thermostat" };
  }

  setConfig(config) {
    if (!config || !config.entity) throw new Error("Veuillez définir une entité `entity` (climate.xxx).");
    this._config = { show_presets: true, show_settings: true, show_modes: true, ...config };
    this._build();
    this._update();
  }

  set hass(hass) {
    this._hass = hass;
    this._update();
  }

  getCardSize() {
    return 6;
  }

  getGridOptions() {
    return { columns: 12, rows: 6, min_columns: 6, min_rows: 5 };
  }

  get _t() {
    const lang = ((this._hass && this._hass.language) || "en").slice(0, 2);
    return I18N[lang] || I18N.en;
  }

  _build() {
    this.shadowRoot.innerHTML = `
      <style>${STYLE}</style>
      <ha-card>
        <div class="error" hidden></div>
        <div class="content">
          <div class="header">
            <div>
              <div class="title"></div>
              <div class="subtitle"></div>
            </div>
            <button class="gear" data-act="more-info" aria-label="Settings"><ha-icon icon="mdi:cog"></ha-icon></button>
          </div>
          <div class="top">
            <div class="current"><span class="num"></span><span class="unit"></span></div>
            <div class="targets"></div>
          </div>
          <div class="modes-block">
            <div class="section-title mode-title"></div>
            <div class="modes"></div>
          </div>
          <div class="presets-block">
            <div class="section-title preset-title"></div>
            <div class="preset-wrap"><select class="preset"></select></div>
          </div>
        </div>
      </ha-card>`;
    const r = this.shadowRoot;
    this._els = {
      error: r.querySelector(".error"),
      content: r.querySelector(".content"),
      title: r.querySelector(".title"),
      subtitle: r.querySelector(".subtitle"),
      gear: r.querySelector(".gear"),
      card: r.querySelector("ha-card"),
      current: r.querySelector(".current"),
      num: r.querySelector(".num"),
      unit: r.querySelector(".unit"),
      targets: r.querySelector(".targets"),
      modesBlock: r.querySelector(".modes-block"),
      modeTitle: r.querySelector(".mode-title"),
      modes: r.querySelector(".modes"),
      presetsBlock: r.querySelector(".presets-block"),
      presetTitle: r.querySelector(".preset-title"),
      preset: r.querySelector("select.preset"),
    };
    r.addEventListener("click", (e) => this._onClick(e));
    this._els.preset.addEventListener("change", (e) => {
      this._hass.callService("climate", "set_preset_mode", {
        entity_id: this._config.entity,
        preset_mode: e.target.value,
      });
    });
    this._cache = {};
    this._built = true;
  }

  _onClick(e) {
    const el = e.target.closest("[data-act],[data-mode]");
    if (!el) return;
    if (el.dataset.mode) {
      this._hass.callService("climate", "set_hvac_mode", {
        entity_id: this._config.entity,
        hvac_mode: el.dataset.mode,
      });
      return;
    }
    if (el.dataset.act === "more-info") {
      this.dispatchEvent(
        new CustomEvent("hass-more-info", {
          bubbles: true,
          composed: true,
          detail: { entityId: this._config.entity },
        })
      );
    } else if (el.dataset.act === "inc" || el.dataset.act === "dec") {
      this._step(el.dataset.key, el.dataset.act === "inc" ? 1 : -1);
    }
  }

  // --- données ---------------------------------------------------------

  get _stateObj() {
    return this._hass && this._hass.states[this._config.entity];
  }

  _stepSize(a, unit) {
    if (this._config.step) return Number(this._config.step);
    if (a.target_temp_step) return Number(a.target_temp_step);
    return unit === "°F" ? 1 : 0.5;
  }

  _val(key) {
    const s = this._stateObj;
    if (this._pending[key] !== undefined) return this._pending[key];
    return s ? s.attributes[key] : undefined;
  }

  _isDual(s) {
    const a = s.attributes;
    return a.target_temp_low != null && a.target_temp_high != null && (s.state === "heat_cool" || a.temperature == null);
  }

  _step(key, dir) {
    const s = this._stateObj;
    if (!s) return;
    const a = s.attributes;
    const unit = this._hass.config.unit_system.temperature;
    const step = this._stepSize(a, unit);
    let v = this._val(key);
    if (v == null) return;
    v = Number(((Math.round(v / step) * step) + dir * step).toFixed(2));
    const min = a.min_temp != null ? a.min_temp : -Infinity;
    const max = a.max_temp != null ? a.max_temp : Infinity;
    v = Math.min(max, Math.max(min, v));
    if (key === "target_temp_low") v = Math.min(v, this._val("target_temp_high") - step);
    if (key === "target_temp_high") v = Math.max(v, this._val("target_temp_low") + step);
    this._pending[key] = v;
    this._renderTargets(s);
    clearTimeout(this._sendTimer);
    this._sendTimer = setTimeout(() => this._send(), 900);
  }

  _send() {
    const s = this._stateObj;
    if (!s) return;
    const data = { entity_id: this._config.entity };
    if (this._isDual(s)) {
      data.target_temp_low = this._val("target_temp_low");
      data.target_temp_high = this._val("target_temp_high");
    } else {
      data.temperature = this._val("temperature");
    }
    this._hass.callService("climate", "set_temperature", data);
    clearTimeout(this._clearTimer);
    this._clearTimer = setTimeout(() => {
      this._pending = {};
      this._update();
    }, 5000);
  }

  // --- rendu -----------------------------------------------------------

  _setText(el, key, value) {
    if (this._cache[key] !== value) {
      el.textContent = value;
      this._cache[key] = value;
    }
  }

  _setHtml(el, key, html) {
    if (this._cache[key] !== html) {
      el.innerHTML = html;
      this._cache[key] = html;
    }
  }

  _update() {
    if (!this._built || !this._hass) return;
    const E = this._els;
    const t = this._t;
    const s = this._stateObj;
    if (!s) {
      E.error.hidden = false;
      E.content.hidden = true;
      E.error.textContent = `${t.notfound}: ${this._config.entity}`;
      return;
    }
    E.error.hidden = true;
    E.content.hidden = false;

    const a = s.attributes;
    const unit = this._hass.config.unit_system.temperature;
    const mode = s.state;

    // Synchronise les valeurs en attente avec l'état réel
    for (const k of Object.keys(this._pending)) {
      if (a[k] === this._pending[k]) delete this._pending[k];
    }

    // En-tête
    this._setText(E.title, "title", this._config.name || a.friendly_name || this._config.entity);
    this._setText(E.subtitle, "subtitle", t.current);
    E.gear.hidden = !this._config.show_settings;

    // Couleurs selon le mode
    const color = MODE_COLORS[mode] || MODE_COLORS.heat;
    const bg = MODE_TILE_BG[mode] || MODE_TILE_BG.heat;
    E.card.style.setProperty("--htc-accent", color);
    E.card.style.setProperty("--htc-accent-bg", bg);

    // Température actuelle
    this._setText(E.num, "cur", fmtTemp(a.current_temperature));
    this._setText(E.unit, "unit", unit);

    this._renderTargets(s);
    this._renderModes(s);
    this._renderPresets(s);
  }

  _actionLabel(s) {
    const t = this._t;
    const action = s.attributes.hvac_action;
    if (!action) return s.state === "off" ? t.actions.off : "";
    try {
      if (this._hass.formatEntityAttributeValue) {
        return this._hass.formatEntityAttributeValue(s, "hvac_action");
      }
    } catch (e) { /* ignore */ }
    return t.actions[action] || action;
  }

  _renderTargets(s) {
    const t = this._t;
    const a = s.attributes;
    const mode = s.state;
    const off = mode === "off" || mode === "unavailable" || mode === "unknown";
    const dual = !off && this._isDual(s);
    let targets;
    if (dual) {
      targets = [
        { key: "target_temp_low", label: t.heat },
        { key: "target_temp_high", label: t.cool },
      ];
    } else {
      const label = mode === "cool" ? t.cool : mode === "heat" ? t.heat : t.set;
      targets = [{ key: "temperature", label }];
    }
    const html =
      targets
        .map((tg) => {
          const v = off ? null : this._val(tg.key);
          const dis = off || v == null ? "disabled" : "";
          return `<div class="target">
            <div class="label">${esc(tg.label)}</div>
            <div class="row">
              <button class="round" data-act="dec" data-key="${tg.key}" ${dis} aria-label="-">&minus;</button>
              <div class="val">${fmtTemp(v)}</div>
              <button class="round" data-act="inc" data-key="${tg.key}" ${dis} aria-label="+">+</button>
            </div>
          </div>`;
        })
        .join("") + `<div class="status">${esc(this._actionLabel(s))}</div>`;
    this._els.targets.classList.toggle("dual", dual);
    this._setHtml(this._els.targets, "targets", html);
  }

  _renderModes(s) {
    const E = this._els;
    E.modesBlock.hidden = !this._config.show_modes;
    if (!this._config.show_modes) return;
    this._setText(E.modeTitle, "modeTitle", this._t.mode);
    const supported = s.attributes.hvac_modes || [];
    const known = MODE_ORDER.filter((m) => supported.includes(m));
    const unknown = supported.filter((m) => !MODE_ORDER.includes(m));
    const modes = this._config.modes ? this._config.modes.filter((m) => supported.includes(m)) : [...known, ...unknown];
    E.modes.style.gridTemplateColumns = `repeat(${Math.max(modes.length, 1)}, 1fr)`;
    const html = modes
      .map((m) => {
        const active = s.state === m;
        const icon = MODE_ICONS[m] || "mdi:thermostat";
        let label = m;
        try {
          label = this._hass.localize(`component.climate.entity_component._.state.${m}`) || m;
        } catch (e) { /* ignore */ }
        return `<button class="mode ${active ? "active" : ""}" data-mode="${esc(m)}" title="${esc(label)}"
          style="--c:${MODE_COLORS[m] || "#e8958a"};--bg:${MODE_TILE_BG[m] || "#48322f"}"><ha-icon icon="${icon}"></ha-icon></button>`;
      })
      .join("");
    this._setHtml(E.modes, "modes", html);
  }

  _presetLabel(s, p) {
    try {
      if (this._hass.formatEntityAttributeValue) {
        const v = this._hass.formatEntityAttributeValue(s, "preset_mode", p);
        if (v) return v;
      }
    } catch (e) { /* ignore */ }
    const txt = String(p).replace(/_/g, " ");
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  }

  _renderPresets(s) {
    const E = this._els;
    const presets = s.attributes.preset_modes || [];
    const show = this._config.show_presets && presets.length > 0;
    E.presetsBlock.hidden = !show;
    if (!show) return;
    this._setText(E.presetTitle, "presetTitle", this._t.presets);
    const current = s.attributes.preset_mode;
    const html = presets
      .map((p) => `<option value="${esc(p)}">${esc(this._presetLabel(s, p))}</option>`)
      .join("");
    this._setHtml(E.preset, "presets", html);
    if (this.shadowRoot.activeElement !== E.preset) E.preset.value = current || presets[0];
  }
}

// --- Éditeur visuel ------------------------------------------------------

const EDITOR_SCHEMA = [
  { name: "entity", required: true, selector: { entity: { domain: "climate" } } },
  { name: "name", selector: { text: {} } },
  { name: "step", selector: { number: { min: 0.1, max: 5, step: 0.1, mode: "box" } } },
  { name: "show_modes", selector: { boolean: {} } },
  { name: "show_presets", selector: { boolean: {} } },
  { name: "show_settings", selector: { boolean: {} } },
];

const EDITOR_LABELS = {
  entity: "Entité (climate)",
  name: "Nom (optionnel)",
  step: "Pas de température (optionnel)",
  show_modes: "Afficher les modes",
  show_presets: "Afficher les préréglages",
  show_settings: "Afficher l'icône réglages",
};

class ObsThermostatCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
  }

  _render() {
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => EDITOR_LABELS[s.name] || s.name;
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        this._config = ev.detail.value;
        this.dispatchEvent(
          new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })
        );
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = EDITOR_SCHEMA;
    this._form.data = { show_modes: true, show_presets: true, show_settings: true, ...this._config };
  }
}

customElements.define("obs-thermostat-card", ObsThermostatCard);
customElements.define("obs-thermostat-card-editor", ObsThermostatCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "obs-thermostat-card",
  name: "Obs Thermostat Card",
  description: "Carte thermostat avec consigne +/-, modes et préréglages.",
  preview: true,
});

console.info(
  `%c OBS-THERMOSTAT-CARD %c v${CARD_VERSION} `,
  "color:#fff;background:#e8958a;font-weight:700",
  "color:#e8958a;background:#333"
);
