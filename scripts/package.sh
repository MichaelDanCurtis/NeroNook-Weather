#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
test -x Runtime/node || { echo "Run bash scripts/prepare-runtime.sh first"; exit 1; }
cp node_modules/leaflet/dist/leaflet.js node_modules/leaflet/dist/leaflet.css Resources/Web/
cp -R node_modules/leaflet/dist/images Resources/Web/
cp node_modules/leaflet/LICENSE Resources/LEAFLET-LICENSE
mkdir -p Resources/Views
cp Resources/Web/leaflet.js Resources/Web/leaflet.css Resources/Views/
cp -R Resources/Web/images Resources/Views/
mkdir -p Resources/Windy
cp node_modules/leaflet-windy/dist/leaflet.js Resources/Windy/
cp node_modules/leaflet-windy/LICENSE Resources/WINDY-LEAFLET-LICENSE
npm run build:worker
swift build -c release
bin="$(swift build -c release --show-bin-path)"
app="$PWD/build/Weather Observatory.app"
mkdir -p "$app/Contents/MacOS" "$app/Contents/Helpers" "$app/Contents/Resources"
cp "$bin/WeatherPlugin" "$app/Contents/MacOS/WeatherPlugin"
cp Runtime/node "$app/Contents/Helpers/weather-node"
cp Runtime/NODE-LICENSE "$app/Contents/Resources/"
cp -R Resources/. "$app/Contents/Resources/"
cat > "$app/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleIdentifier</key><string>cafe.nero.plugin.weather</string><key>CFBundleName</key><string>Weather Observatory</string><key>CFBundleExecutable</key><string>WeatherPlugin</string><key>CFBundlePackageType</key><string>APPL</string><key>CFBundleShortVersionString</key><string>0.3.0</string><key>CFBundleVersion</key><string>3</string><key>LSMinimumSystemVersion</key><string>14.0</string><key>LSUIElement</key><true/><key>NSLocationUsageDescription</key><string>Show weather for this Mac's location. Rounded coordinates are sent to the weather providers.</string><key>NSLocationWhenInUseUsageDescription</key><string>Show weather for this Mac's location. You can choose a place manually instead.</string></dict></plist>
PLIST
codesign --force --sign "${NERONOOK_SIGNING_IDENTITY:--}" "$app/Contents/Helpers/weather-node"
codesign --force --sign "${NERONOOK_SIGNING_IDENTITY:--}" "$app"
codesign --verify --deep --strict "$app"
