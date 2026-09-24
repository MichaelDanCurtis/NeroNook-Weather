# Weather Observatory for NeroNook

Independent native macOS module, version 0.2.0. Forecast / Map / Coast share a custom widescreen interface inside the Nook and in the larger independent window. Explore hourly weather, daily details, observed radar/infrared history, regional forecast wind and nearby tides. Location, units, source health and full alerts are behind the gear.

**Default location follows this Mac.** Core Location asks for macOS permission; no assumed city's weather is fetched while initial permission/location is unresolved. Coordinates are rounded to three decimal places before weather requests. Location is rechecked every 30 minutes, with immediate manual retry. Place search and presets provide a manual override. Location, timezone and Fahrenheit/Celsius preferences belong to the plugin and persist across updates.

## Independence and provenance

NeroNook 0.25.0 supplies the generic custom-view raster interface. Older hosts retain the 16:9 diagram fallback and independent-window action. The vendored SDK is a source snapshot, not a dependency on the host checkout. No weather implementation is added to the host. No other installed desktop app, system Node/Python, local web server, website login, browser session or other plugin is required.

The original source was recovered from the owner's Weather Observatory Sites project into `/Volumes/Main External/Development/Weather-Observatory-Source`, commit `7f2416ebab5f2c0647f597c6a2d49d038eed8ea5`. Selected adapters and normalization logic are retained under `Worker/observatory`: weather/NOAA/MET fallback, marine, air, point alerts, place search, radar, satellite history, cyclones and tides. The published website and its access policy were not changed. Native views and the bundled map are new module-specific surfaces. This release does not duplicate every website feature.

A private child process runs the bundled JavaScript adapters through newline-delimited messages. It uses no listening port. Its Node 22.23.0 executable ships inside `Contents/Helpers`; the Swift plugin owns process shutdown. The native wrapper constrains provider hosts, redirects, timeouts, response size and pending requests. Site/Google credentials and environment variables are never imported. Worker environment is deliberately minimal.

## Data and behavior

- NOAA/NWS forecast first for US points, with Open-Meteo and MET Norway fallbacks. Forecast values are labeled as estimates; validity and model issue times differ from fetch time.
- Temperature, wind and rain probability for the next 24 hours, with pointer/keyboard scrubbing and a seven-day outlook. Daily details show only supplied values; unknown measurements stay missing.
- Open-Meteo Marine waves/swell/period, offshore model-cell distance, and NOAA nearby tide predictions relative to MLLW. Coarse ocean forecasts are distinct from land weather.
- CAMS via Open-Meteo US AQI, NWS point alerts and NOAA NHC/CPHC cyclone inventory. Missing/failed alerts never imply an all-clear.
- Bundled Leaflet with a subdued OpenStreetMap basemap, RainViewer radar/coverage and NOAA infrared history. Play, pause, scrub and return to the latest advertised frame. The time uses the selected location timezone; radar time identifies a composite frame, not every source scan. Layers load independently; missing tiles never imply an all-clear.
- On-demand 25-point regional Open-Meteo 10 m wind forecast, covering a four-degree region with 13 hourly frames. Arrows point downwind; selecting a sample shows speed, direction and valid time. This is a sampled regional model, not a continuous/global wind field. Polar points above 80 degrees are explicitly unsupported.
- Map imagery passes through `view-resources-v1` as bounded raster bytes. Native URLSession owns fixed-provider requests, HTTP cache, response bounds and cooldown. No map code or provider URLs enter the host. Leaving Map or closing its native window stops the view. No bulk downloading or offline map download feature.
- Adapter request caching, deduplication and provider Retry-After cooldown are reused. Failed refreshes keep previous data with explicit errors; recent cached values can be shown while reconnecting. Public feeds refresh on a five-minute cycle while visible; individual source caches enforce their own longer TTLs.
- Read-only shared SDK `read_status` and a status channel. No weather-triggered device actions or safety/route recommendations.

## Build

Apple Silicon, macOS 14+, full Xcode/Swift 6; development uses Node/npm. Run `npm ci`, `bash scripts/prepare-runtime.sh`, `swift test`, `Runtime/node --experimental-strip-types --test Worker/tests/feeds.test.mjs`, and `bash scripts/package.sh`. Set `NERONOOK_SIGNING_IDENTITY` to a stable signing identity. The runtime helper downloads a pinned official Node archive and checks its SHA-256. Runtime and generated build artifacts are ignored by Git.

Install `build/Weather Observatory.app` through NeroNook Settings → Modules. Grant Location access for Weather Observatory when prompted. Tests can use `--protocol-test` to suppress location requests. `scripts/check-live.py` checks public feeds for a fixed Honolulu fixture without changing app settings. `scripts/test-protocol.py` verifies SDK presentation and rejection of unsupported actions.

## Release boundaries

Google WeatherNext, Earth Engine and Google basemap credentials need a separately authorized plugin-owned connection. Those layers remain unconnected. Tracking extras, 3D atmosphere, tide-station override, combined animated layers and global atmospheric fields are not included in 0.2.0. Windy is a design reference, not a bundled or licensed API dependency; earth.nullschool assets and service have not been copied. The module is development-signed, not notarized or published. Distribution requires reviewing provider commercial-use terms, quota handling and supported platforms; Open-Meteo's free endpoint is not an implied commercial license. The included Node and Leaflet licenses are shipped with the app. Attribution remains visible.

Sources: [NOAA API](https://www.weather.gov/documentation/services-web-api), [Open-Meteo](https://open-meteo.com/), [MET Norway](https://api.met.no/), [RainViewer](https://www.rainviewer.com/api/weather-maps-api.html), [NOAA tides](https://api.tidesandcurrents.noaa.gov/api/prod/), [Node](https://nodejs.org/), [Leaflet](https://leafletjs.com/). See STATUS.md for exact live acceptance.

Provider notes checked September 24: [RainViewer color scheme and zoom limits](https://www.rainviewer.com/api/weather-maps-api.html), [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/), [Windy licensing](https://api.windy.com/map-forecast/pricing). The module identifies its native HTTP requests and uses an HTTP-aware cache. Production provider selection remains a release gate.
