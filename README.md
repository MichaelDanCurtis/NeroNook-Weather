# Weather Observatory for NeroNook

Independent native macOS module. A 16:9 overview, forecast and marine stage fits NeroNook's per-display selector; a native Observatory window provides hourly charts, daily forecasts, marine conditions, tides, official alerts, source health and interactive maps.

**Default location follows this Mac.** Core Location asks for macOS permission; no assumed city's weather is fetched while initial permission/location is unresolved. Coordinates are rounded to three decimal places before weather requests. Location is rechecked every 30 minutes, with immediate manual retry. Place search and presets provide a manual override. Location, timezone and Fahrenheit/Celsius preferences belong to the plugin and persist across updates.

## Independence and provenance

NeroNook 0.12.0+ supplies the existing generic SDK, presentation and lifecycle. No weather implementation is added to the host. No other installed desktop app, system Node/Python, local web server, website login, browser session or other plugin is required.

The original source was recovered from the owner's Weather Observatory Sites project into `/Volumes/Main External/Development/Weather-Observatory-Source`, commit `7f2416ebab5f2c0647f597c6a2d49d038eed8ea5`. Selected adapters and normalization logic are retained under `Worker/observatory`: weather/NOAA/MET fallback, marine, air, point alerts, place search, radar, satellite history, cyclones and tides. The published website and its access policy were not changed. Native views and the bundled map are new module-specific surfaces. This release does not duplicate every website feature.

A private child process runs the bundled JavaScript adapters through newline-delimited messages. It uses no listening port. Its Node 22.23.0 executable ships inside `Contents/Helpers`; the Swift plugin owns process shutdown. The native wrapper constrains provider hosts, redirects, timeouts, response size and pending requests. Site/Google credentials and environment variables are never imported. Worker environment is deliberately minimal.

## Data and behavior

- NOAA/NWS forecast first for US points, with Open-Meteo and MET Norway fallbacks. Forecast values are labeled as estimates; validity and model issue times differ from fetch time.
- Temperature, wind and rain charts for up to 48 samples; seven-day outlook; unknown measurements stay missing.
- Open-Meteo Marine waves/swell/period, offshore model-cell distance, and NOAA nearby tide predictions relative to MLLW. Coarse ocean forecasts are distinct from land weather.
- CAMS via Open-Meteo US AQI, NWS point alerts and NOAA NHC/CPHC cyclone inventory. Missing/failed alerts never imply an all-clear.
- Bundled Leaflet with OpenStreetMap basemap, RainViewer radar history, NOAA infrared history and cyclone markers. Actual advertised observation timestamps are selected. Imagery is loaded only in the map window and is torn down when its window closes or its tab changes. No bulk tile downloading.
- Adapter request caching, deduplication and provider Retry-After cooldown are reused. Failed refreshes keep previous data with explicit errors; recent cached values can be shown while reconnecting. Public feeds refresh on a five-minute cycle while visible; individual source caches enforce their own longer TTLs.
- Read-only shared SDK `read_status` and a status channel. No weather-triggered device actions or safety/route recommendations.

## Build

Apple Silicon, macOS 14+, full Xcode/Swift 6; development uses Node/npm. Run `npm ci`, `bash scripts/prepare-runtime.sh`, `swift test`, `Runtime/node --experimental-strip-types --test Worker/tests/feeds.test.mjs`, and `bash scripts/package.sh`. Set `NERONOOK_SIGNING_IDENTITY` to a stable signing identity. The runtime helper downloads a pinned official Node archive and checks its SHA-256. Runtime and generated build artifacts are ignored by Git.

Install `build/Weather Observatory.app` through NeroNook Settings → Modules. Grant Location access for Weather Observatory when prompted. Tests can use `--protocol-test` to suppress location requests. `scripts/check-live.py` checks public feeds for a fixed Honolulu fixture without changing app settings. `scripts/test-protocol.py` verifies SDK presentation and rejection of unsupported actions.

## Release boundaries

Google WeatherNext, Earth Engine and Google basemap credentials need a separately authorized plugin-owned connection. Those layers remain unconnected. Tracking extras, 3D atmosphere, tide-station override, combined animated map layers and additional chart fields are not included in 0.1.0. The module is development-signed, not notarized or published. Distribution requires reviewing provider commercial-use terms, quota handling and supported platforms; Open-Meteo's free endpoint is not an implied commercial license. The included Node and Leaflet licenses are shipped with the app. Attribution remains visible.

Sources: [NOAA API](https://www.weather.gov/documentation/services-web-api), [Open-Meteo](https://open-meteo.com/), [MET Norway](https://api.met.no/), [RainViewer](https://www.rainviewer.com/api/weather-maps-api.html), [NOAA tides](https://api.tidesandcurrents.noaa.gov/api/prod/), [Node](https://nodejs.org/), [Leaflet](https://leafletjs.com/). See STATUS.md for exact live acceptance.
