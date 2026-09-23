import AppKit
@main struct Entry { @MainActor static func main(){let app=NSApplication.shared;let module=WeatherModule();app.delegate=module;withExtendedLifetime(module){app.run()}} }
