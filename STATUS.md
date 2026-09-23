# Weather Observatory 0.1.0 acceptance

September 22, 2026. Independently built and installed in NeroNook. No host implementation changes. Native module and bundled worker are both running from the installed plugin package; no source checkout, development server, system Node or other desktop app is required at runtime.

## Verified

- Four native tests pass: missing/boolean/numeric values, unit conversions, place bounds/timezone, source-time formatting, weather-code handling and distant marine grid cells.
- Six reused-adapter tests pass: 429 cooldown/no replay with stale retention, Retry-After, coordinate validation, NOAA interval totals, MET fallback gaps/six-hour rain, tide UTC/nearby-station boundaries and actual satellite observations.
- SDK handshake, 16:9 dashboard and one-line status pass; unsupported action returns failed. Test mode suppresses Location requests.
- Release build and development signatures (app plus bundled Node helper) verify. Install/update completed through NeroNook's package review. The plugin returns to Running and is enabled on both displays.
- Public-provider smoke test returned all eight feeds for a fixed Honolulu test point: NOAA/NWS weather (156 hourly periods), marine (168 periods), modeled air quality, point alerts, radar, satellite history, cyclones and tide predictions. This did not set the user's location.
- Installed automatic Core Location resolved this Mac to Redmond, WA with America/Los_Angeles timezone. All eight feeds were received for that location. Native current forecast shows NOAA/NWS 17.78°C / 64°F, mostly sunny, with its own forecast-valid time; fetched age is separate.
- Native hourly and daily views inspected; changing to Celsius produced 18°C and converted chart readings. Celsius persisted across the reviewed package update and process restart, alongside automatic location; restored Fahrenheit afterward.
- OpenStreetMap tiles rendered around the selected location. Radar completed loading with an actual observation timestamp (5:10 PM); infrared completed loading with an actual observation timestamp (4:00 PM). Provider attribution remains visible. These are narrow visual/source checks, not a guarantee of global coverage or all historical frame availability.
- Marine view retains null wave/period/swell values for this point rather than fabricating them; it reports the selected model cell's distance. NOAA Seattle Elliott Bay high/low tide predictions populated independently.
- Nook module selection and the original 16:9 Now dashboard were visually inspected with Redmond 64°F, live metrics, source and single status line. The standalone header label wrap was fixed.
- The recovered Observatory source checkout remains clean and the published website was not changed.

## Remaining acceptance and release work

- Travel-driven location changes, denial/revocation, physical sleep/wake, disconnected cold launch and sustained background resource profiling need further live checks. Location is rechecked every 30 minutes; it is not continuous precise tracking.
- Cached readings and provider failures are exercised in tests; a real prolonged outage has not been simulated on the installed app. Map errors are separate from feed metadata availability. Alerts and cyclone coverage retain source limitations.
- Google WeatherNext, Earth Engine and Google basemap access remain unconnected. The website's private credentials are not transferred. 3D atmosphere, tracking extras, combined map playback and additional native metric controls remain later slices.
- This is an Apple Silicon development package, not notarized, commercially licensed with every provider, or publicly released. No claim of full website parity.
