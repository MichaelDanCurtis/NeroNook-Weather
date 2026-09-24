import Foundation
import Security
import SwiftUI

/// The provider key never enters host snapshots, settings JSON, arguments or logs.
enum WindyKey {
    private static var query: [String: Any] { [kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:moduleID+".windy",kSecAttrAccount as String:"map-forecast"] }
    static func read() -> String? {
        var q=query;q[kSecReturnData as String]=true;q[kSecMatchLimit as String]=kSecMatchLimitOne
        var result:CFTypeRef?;guard SecItemCopyMatching(q as CFDictionary,&result)==errSecSuccess,let data=result as? Data else{return nil}
        return String(data:data,encoding:.utf8)
    }
    static func save(_ key:String) throws {
        let data=Data(key.utf8);let result=SecItemUpdate(query as CFDictionary,[kSecValueData as String:data] as CFDictionary)
        if result==errSecItemNotFound { var q=query;q[kSecValueData as String]=data;q[kSecAttrAccessible as String]=kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly;guard SecItemAdd(q as CFDictionary,nil)==errSecSuccess else{throw CocoaError(.fileWriteNoPermission)} }
        else if result != errSecSuccess {throw CocoaError(.fileWriteNoPermission)}
    }
    static func remove() throws {let result=SecItemDelete(query as CFDictionary);guard result==errSecSuccess || result==errSecItemNotFound else{throw CocoaError(.fileWriteNoPermission)}}
}
struct WindySettings: View {
    @ObservedObject var model:WeatherModule
    @State private var key=""
    var body:some View {
        VStack(alignment:.leading,spacing:14){
            Text("Windy maps").font(.title2.bold())
            Text("Animated wind and temperature maps from Windy · GFS forecast.").foregroundStyle(.secondary)
            Text(model.windyMessage).foregroundStyle(model.windyURL.isEmpty ? Color.secondary:Color.green)
            SecureField("Map Forecast API testing key",text:$key).textFieldStyle(.roundedBorder)
            HStack {
                Button("Save Windy key"){model.saveWindyKey(key);key=""}.disabled(key.trimmingCharacters(in:.whitespacesAndNewlines).isEmpty)
                Button("Reconnect"){model.connectWindy()}.disabled(!model.hasWindyKey)
                Button("Remove key"){model.removeWindyKey()}.disabled(!model.hasWindyKey)
            }
            Text("Stored in this plugin’s Keychain. Windy loads directly only while its map is shown. The free testing key is for development, with up to 500 sessions per day. No subscription is started.").font(.callout).foregroundStyle(.secondary)
            Link("Manage Windy API keys",destination:URL(string:"https://api.windy.com/keys")!)
        }.padding(20).frame(maxWidth:.infinity,alignment:.leading).background(.white.opacity(0.04),in:RoundedRectangle(cornerRadius:14))
    }
}
