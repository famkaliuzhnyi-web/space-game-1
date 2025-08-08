extends RefCounted

# World data structures ported from TypeScript
# Based on orig/src/types/world.ts

class_name WorldTypes

# Coordinates class for positioning
class Coordinates extends RefCounted:
	var x: float
	var y: float
	var z: float = 0.0  # For 3D expansion later
	
	func _init(p_x: float = 0.0, p_y: float = 0.0, p_z: float = 0.0):
		x = p_x
		y = p_y
		z = p_z
	
	func distance_to(other: Coordinates) -> float:
		var dx = x - other.x
		var dy = y - other.y
		var dz = z - other.z
		return sqrt(dx * dx + dy * dy + dz * dz)

# Station class
class Station extends RefCounted:
	enum StationType {
		TRADE,
		INDUSTRIAL, 
		MILITARY,
		RESEARCH,
		MINING,
		LUXURY,
		DIPLOMATIC,
		ENTERTAINMENT,
		PIRATE,
		AGRICULTURAL,
		MEDICAL,
		EXPLORATION,
		COLONIAL,
		SALVAGE,
		OBSERVATORY,
		FOUNDRY,
		HABITAT,
		SECURITY,
		PRISON,
		ENERGY
	}
	
	var id: String
	var name: String
	var type: StationType
	var position: Coordinates
	var faction: String
	var docking_capacity: int
	var services: Array[String] = []
	var description: String
	
	func _init(p_id: String = "", p_name: String = "", p_type: StationType = StationType.TRADE):
		id = p_id
		name = p_name
		type = p_type
		position = Coordinates.new()
		faction = ""
		docking_capacity = 10
		description = ""

# Planet class
class Planet extends RefCounted:
	enum PlanetType {
		TERRESTRIAL,
		GAS_GIANT,
		ICE,
		DESERT,
		OCEAN
	}
	
	var id: String
	var name: String
	var type: PlanetType
	var position: Coordinates
	var radius: float
	var habitable: bool
	var population: int = 0
	var description: String
	
	func _init(p_id: String = "", p_name: String = "", p_type: PlanetType = PlanetType.TERRESTRIAL):
		id = p_id
		name = p_name
		type = p_type
		position = Coordinates.new()
		radius = 1000.0
		habitable = false
		description = ""

# Star class
class Star extends RefCounted:
	enum StarType {
		RED_DWARF,
		YELLOW_DWARF,
		BLUE_GIANT,
		RED_GIANT,
		WHITE_DWARF
	}
	
	var name: String
	var type: StarType
	var temperature: float
	
	func _init(p_name: String = "", p_type: StarType = StarType.YELLOW_DWARF, p_temperature: float = 5778.0):
		name = p_name
		type = p_type
		temperature = p_temperature

# StarSystem class
class StarSystem extends RefCounted:
	var id: String
	var name: String
	var position: Coordinates
	var star: Star
	var stations: Array[Station] = []
	var planets: Array[Planet] = []
	var security_level: int = 5  # 0-10, 0 being lawless, 10 being maximum security
	
	func _init(p_id: String = "", p_name: String = ""):
		id = p_id
		name = p_name
		position = Coordinates.new()
		star = Star.new(p_name.split(" ")[0] if p_name else "Unknown Star")
	
	func get_station_by_id(station_id: String) -> Station:
		for station in stations:
			if station.id == station_id:
				return station
		return null

# Sector class
class Sector extends RefCounted:
	var id: String
	var name: String
	var position: Coordinates
	var systems: Array[StarSystem] = []
	var controlling_faction: String = ""
	var description: String
	
	func _init(p_id: String = "", p_name: String = ""):
		id = p_id
		name = p_name
		position = Coordinates.new()
		description = ""
	
	func get_system_by_id(system_id: String) -> StarSystem:
		for system in systems:
			if system.id == system_id:
				return system
		return null

# PlayerLocation class
class PlayerLocation extends RefCounted:
	var sector_id: String
	var system_id: String
	var station_id: String = ""
	
	func _init(p_sector_id: String = "", p_system_id: String = "", p_station_id: String = ""):
		sector_id = p_sector_id
		system_id = p_system_id
		station_id = p_station_id

# Galaxy class
class Galaxy extends RefCounted:
	var sectors: Array[Sector] = []
	var current_player_location: PlayerLocation
	
	func _init():
		current_player_location = PlayerLocation.new()
	
	func get_sector_by_id(sector_id: String) -> Sector:
		for sector in sectors:
			if sector.id == sector_id:
				return sector
		return null

# NavigationTarget class
class NavigationTarget extends RefCounted:
	enum TargetType {
		SECTOR,
		SYSTEM,
		STATION,
		PLANET
	}
	
	var type: TargetType
	var id: String
	var name: String
	var position: Coordinates
	var distance: float
	var estimated_travel_time: float
	
	func _init(p_type: TargetType = TargetType.SYSTEM, p_id: String = "", p_name: String = ""):
		type = p_type
		id = p_id
		name = p_name
		position = Coordinates.new()
		distance = 0.0
		estimated_travel_time = 0.0