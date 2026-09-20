# Gouly Card

A Lovelace card for the [ha-gouly](https://github.com/mikemaat/ha-gouly) integration: one compact
row on your dashboard, with colour, brightness, effects, presets and favourites behind a single tap.

The integration is what talks to your lights, and it works on its own - Home Assistant's own light
dialog, an effect list and a preset selector all come with it. This card exists because picking
from 2,600 presets through a dropdown is miserable. It's optional, and nothing you build on the
integration depends on it.

> Not affiliated with or endorsed by Gouly.

![The card's layout: a row on the dashboard, and the dialog it opens](layout.png)

*Illustration of the layout.*

## What it does

The row is Home Assistant's own tile card, so it matches the rest of your dashboard. Tapping the
icon toggles the light; tapping the rest opens **Home Assistant's own more-info dialog** - the same
one every other light gives you, with its header, history, settings, light controls and favourite
colours - and this card adds to it:

- **Effect speed**, beside the light controls
- **Favourites**: your favourite presets as one-tap buttons, sorted alphabetically
- **Presets**: the Gouly app's library, with a folder menu, a search box, and a star on each preset
  to add or remove it from favourites

From 900px wide the dialog is laid out in two columns and widened to 750px; narrower than that, and
on a phone, it stacks. Everything the card changes about the dialog is put back when it closes,
since Home Assistant reuses that dialog for every entity.

It drives the entities the integration already creates, so there's nothing extra to configure.

## Install

First install the [ha-gouly](https://github.com/mikemaat/ha-gouly) integration and add your lights.
This card shows the entities that integration creates, so on its own it has nothing to show.
Version **0.7.0 or newer** is recommended: older versions reload the whole integration whenever you
star a preset.

**With HACS**

1. HACS → ⋮ → **Custom repositories** → add `https://github.com/mikemaat/ha-gouly-card`, type **Dashboard**.
2. Search for **Gouly Card**, download it, and reload your browser.

**Manually**

1. Copy `gouly-card.js` into your Home Assistant `config/www` folder.
2. Settings → Dashboards → ⋮ → **Resources** → add `/local/gouly-card.js` as a **JavaScript module**.
3. Reload your browser.

## Use

Add a **Manual** card:

```yaml
type: custom:gouly-card
entity: light.christmas_lights_front
```

`entity` is the only required option. The card finds the preset, effect speed and favourite
entities from the same device.

| Option | Default | What it does |
|---|---|---|
| `entity` | required | The Gouly light |
| `name` | the light's name | Title shown on the row and dialog |
| `icon` | `mdi:snowflake` | Icon on the row; tap it to toggle the light |
| `select_preset_folder` | found automatically | Preset folder select entity |
| `select_preset` | found automatically | Preset select entity |
| `number_effect_speed` | found automatically | Effect speed number entity |

## License

[MIT](LICENSE)
