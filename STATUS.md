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

## September 24 · Weather Observatory 0.2.0

Implemented a shared custom Forecast / Map / Coast surface using host 0.25.0's generic `view-resources-v1`. All weather networking and the bundled worker remain in this independent package. Older hosts retain the diagram fallback. No website, browser session, other desktop application or host source checkout is needed at runtime.

- Seven WeatherCore tests pass: existing conversion/location checks plus resource path/frame bounds, missing values, past-hour filtering and payload limits. Seven adapter tests pass, including regional grid/dateline/polar bounds and wind time alignment/missing samples. Both legacy and modern protocol checks pass; undeclared/stale/traversal resources and unsupported actions are rejected.
- Host's 67 tests pass, including raster validation, source/session binding, cancellation and late responses. The resource renderer queues bursts rather than rejecting normal multi-view tile loads. These are generic SDK checks, not weather-provider availability tests.
- The independently signed package was installed through NeroNook's review flow. Saved automatic location, Fahrenheit, timezone and display placement were retained. Location resolved to Redmond; live NWS weather, CAMS AQI, NOAA Seattle Elliott Bay tides and regional Open-Meteo wind samples populated. Wave readings at this inland point remain unavailable and explicitly labeled.
- Native and compact Forecast were visually inspected. The initial compact text collision was corrected. Hourly rain scrubbing changed 12 PM / 2% to 11 PM / 90%; Fahrenheit/Celsius changed 58°F to 14°C with corresponding wind/daily values, then Fahrenheit was restored. Daily detail, source/location settings and separate native-window opening work.
- Nook radar tiles and NOAA infrared imagery render through the cross-process SDK resource path. Infrared playback advanced from noon to an earlier real frame; Pause and switching to Wind worked. The new wind layer displayed a 25-sample regional forecast with hourly times. Native map rendering also showed live RainViewer echoes and visible attribution. Source metadata, tile loading and partial failures are separately represented.
- Map playback is user-started, stops on leaving the map/view, and follows real advertised times. The radar coverage layer stays mounted during playback to avoid duplicate requests. Native window close releases its WebKit view; reopening creates a new surface. Source policy, global coverage and sustained outage/performance acceptance remain separate gates.

Remaining: full global atmospheric fields/3D globe, commercial provider licenses, physical travel/sleep/wake, long outage testing, long-duration profiling and public release/notarization. This is not Windy/earth service integration or full website parity. Bambu and prior Ark hardware acceptance are not changed by this milestone.

Final install: Weather executable, bundled worker, CSS and JavaScript match the packaged build; automatic location and Fahrenheit remain selected. The host was recopied with framework symlinks preserved and passes deep/strict signature verification. The final external Nook forecast and MacBook forecast/radar were visually checked. With both views open, the MacBook Nook retained radar at 1 PM while the independent native window loaded infrared at noon. Closing the native window left the Nook running; reopening restored its full live forecast. The laptop was returned to Logitech with pinning off. Long-duration simultaneous map profiling remains open.

## September 24 · Weather Observatory 0.3.0

Official Windy Map Forecast API replaces the sampled regional wind map and adds Temperature in place of the plain Map layer. The user's free development key was created for this application, restricted to localhost/127.0.0.1, and entered directly into the plugin's Keychain field. No key was placed in this repository, host snapshots, preferences JSON or command-line arguments. No paid plan was started.

- Host 0.26.0 and independent Weather 0.3.0 are installed through the normal plugin review/update path. The vendored SDK snapshot points to host commit 6acd905; the host contains only a generic isolated-document contract.
- Final package and helper pass deep/strict development-signature verification. Seven Swift tests, eleven worker/controller tests and all three protocol modes (legacy, custom views without frames, custom views with frames) pass. New checks cover exact loopback origins/paths, server Host/method/capability access, no CORS or caching, shutdown, invalid keys, and Windy's delayed/stale unit initialization.
- Actual Windy wind particles and temperature colors rendered in the native window and the Nook. Both Ark and MacBook layouts were inspected. Point selection returned a Windy NW 4 mph forecast near Seattle at the selected forecast time; this is model output, not a station observation. Wind/temp changes keep the same document and update its fragment.
- Cold Temperature initialization now displays °F correctly, and °F → °C → °F changes update the legend. A real provider startup discrepancy (saved °F with an initially stale °C legend model) was reproduced and fixed using documented metric setters after the first redraw; a regression test covers it.
- Repeated reviewed updates restarted the plugin on new loopback ports and restored its saved key without browser login. Final installed Temperature opened directly in Fahrenheit. Automatic Redmond location remains selected. Windy's logo remains visible at the upper left, clear of the point picker. The MacBook workspace was restored to Logitech with pinning off.
- Forecast cards and hourly values keep their explicit NOAA/NWS or fallback source. They are not relabeled as Windy. Radar/infrared remain the existing independent feeds. The previous sampled Open-Meteo wind adapter is no longer dispatched by the worker.

Remaining boundaries: Windy testing is development-only (500 sessions/day); production licensing, sustained resource/quota testing and prolonged real network outage/revocation remain release checks. Maps use Windy's documented forecast/timeline UI; the main app supplies location and units. No public release, notarization, paid subscription, or extraction of earth.nullschool data/assets occurred.

## September 24 · Weather Observatory 0.4.0 candidate

- A saved Earth/Windy provider selector is available in the Wind/Temperature toolbar and Sources settings. Earth defaults to an unmodified public HTTPS viewer with no account. Windy has explicit user-owned signup/key setup; no shared key or account subscription is created. Existing location, units and private key are preserved.
- Host 0.26.1 adds generic, separately negotiated exact HTTPS frames; provider code remains entirely in the independent package. Older hosts get the existing diagram/custom-view fallback and an upgrade message for embedded Earth.
- Nine Swift tests, fourteen worker/controller tests, four protocol modes, host tests and candidate signatures pass. Regression coverage includes preference migration, provider persistence, globe exploration surviving ordinary refreshes, unloading the old viewer, missing-key setup and bounded remote document URLs.
- Native rendering/install is pending: computer control reported the Mac locked. The direct Earth website rendered in the research browser; its iframe prototype was blocked by that browser client, so it does not establish native WebKit acceptance. No claim of installed/live Earth acceptance is made yet.

Release boundaries: this public website view is not an Earth API or redistribution license. Windy's testing tier stays development-only. Production provider rights, long outage handling and profiling remain release work.
