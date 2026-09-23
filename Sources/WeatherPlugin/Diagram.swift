import WeatherCore
import NookPluginSDK
@MainActor func weatherDiagram(_ m:WeatherModule,page:String)->PluginDiagram {
 var e:[PluginDiagramElement]=[]
 func box(_ x:Double,_ y:Double,_ w:Double,_ h:Double,_ color:String){e.append(.init(.box,x:x,y:y,w:w,h:h,fill:color,radius:14))}
 func text(_ x:Double,_ y:Double,_ w:Double,_ h:Double,_ value:String,_ font:Double=16,_ color:String="#DAECF5"){e.append(.init(.text,x:x,y:y,w:w,h:h,fill:color,text:String(value.prefix(190)),font:font))}
 box(0,0,640,360,"#101D2C");text(22,16,410,28,m.preferences.automatic && !m.located ? "Your local observatory":m.place.name,23);text(430,22,190,20,page.uppercased(),12,"#74D8D0")
 if m.preferences.automatic && !m.located {text(45,115,550,45,"Weather where you are",30);text(40,178,560,55,m.locationMessage,18);text(40,255,560,40,"Open Observatory to manage location",14);return .init(id:page.lowercased(),title:page,width:640,height:360,summary:m.locationMessage,elements:e)}
 if page=="Now"{
 box(20,63,255,207,"#183344");text(30,81,235,75,m.currentTemp+"°"+m.unit,58,"#9FE5DC");text(30,165,235,43,m.condition,20);text(30,224,235,25,"Forecast · "+Display.time(Display.number(m.current["time"]),zone:m.place.timezone),12,"#ABC7D3")
 let metrics=[("WIND",Display.wind(Display.number(m.current["wind_speed_10m"]),unit:m.unit)+" "+(m.unit=="F" ? "mph":"km/h")),("HUMIDITY",Display.value(Display.number(m.current["relative_humidity_2m"]))+"%"),("FEELS LIKE",Display.temperature(Display.number(m.current["apparent_temperature"]),unit:m.unit)+"°"),("AIR · US AQI",Display.value(m.number("air","current","us_aqi")))]
 for(i,item) in metrics.enumerated(){let x=290+Double(i%2)*165,y=63+Double(i/2)*109;box(x,y,150,98,"#1A2B3D");text(x+8,y+12,134,18,item.0,10,"#9AB3C8");text(x+8,y+39,134,35,item.1,26)}
 }else if page=="Forecast"{
 let times=m.row("weather","daily","time"),high=m.row("weather","daily","temperature_2m_max"),low=m.row("weather","daily","temperature_2m_min"),rain=m.row("weather","daily","precipitation_probability_max")
 if times.isEmpty{text(40,135,560,60,m.errors["weather"] ?? "Loading forecast…",18)}
 for i in 0..<min(7,times.count){let x=20+Double(i)*86;box(x,72,78,209,"#1A2E40");text(x+3,90,72,24,Display.time(times[i],zone:m.place.timezone,format:"EEE"),15);text(x+3,144,72,38,Display.temperature(i<high.count ? high[i]:nil,unit:m.unit)+"°",26,"#9FE5DC");text(x+3,186,72,25,Display.temperature(i<low.count ? low[i]:nil,unit:m.unit)+"°",18,"#9AB3C8");text(x+3,239,72,25,Display.value(i<rain.count ? rain[i]:nil)+"%",13)}
 }else{
 let values=[("SIGNIFICANT WAVES",Display.wave(m.number("marine","current","wave_height"),unit:m.unit)+(m.unit=="F" ? " ft":" m")),("WAVE PERIOD",Display.value(m.number("marine","current","wave_period"),digits:1)+" s"),("SWELL",Display.wave(m.number("marine","current","swell_wave_height"),unit:m.unit)+(m.unit=="F" ? " ft":" m")),("SWELL PERIOD",Display.value(m.number("marine","current","swell_wave_period"),digits:1)+" s")]
 for(i,item) in values.enumerated(){let x=20+Double(i%2)*308,y=70+Double(i/2)*110;box(x,y,292,96,"#173343");text(x+10,y+12,272,20,item.0,11,"#9AB3C8");text(x+10,y+40,272,38,item.1,31,"#9FE5DC")}
 }
 text(20,293,600,23,m.errors[page=="Marine" ? "marine":"weather"] ?? m.source(page=="Marine" ? "marine":"weather"),12,"#9AB3C8");text(20,324,600,20,m.age(page=="Marine" ? "marine":"weather")+" · "+m.place.timezone,11,"#9AB3C8")
 return .init(id:page.lowercased(),title:page,width:640,height:360,summary:page+". "+m.status,elements:e)
}
