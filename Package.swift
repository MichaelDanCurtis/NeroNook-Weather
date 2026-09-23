// swift-tools-version: 6.0
import PackageDescription
let package = Package(name: "WeatherPlugin", platforms: [.macOS(.v14)], products: [.executable(name: "WeatherPlugin", targets: ["WeatherPlugin"])], dependencies: [.package(path: "Vendor/NookPluginSDK")], targets: [.target(name: "WeatherCore"), .executableTarget(name: "WeatherPlugin", dependencies: ["WeatherCore", "NookPluginSDK"]), .testTarget(name: "WeatherCoreTests", dependencies: ["WeatherCore"])], swiftLanguageModes: [.v5])
