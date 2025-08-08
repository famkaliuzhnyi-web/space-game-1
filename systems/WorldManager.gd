extends Node

# WorldManager - Core world and navigation system
# Ported from orig/src/systems/WorldManager.ts

class_name WorldManager

var galaxy: WorldTypes.Galaxy

signal location_changed(sector_id: String, system_id: String, station_id: String)
signal galaxy_updated()

func _ready():
	print("Initializing WorldManager...")
	galaxy = generate_initial_galaxy()
	emit_signal("galaxy_updated")

func generate_initial_galaxy() -> WorldTypes.Galaxy:
	var new_galaxy = WorldTypes.Galaxy.new()
	
	# Create Core Worlds Sector
	var core_sector = create_core_sector()
	new_galaxy.sectors.append(core_sector)
	
	# Create Frontier Sector
	var frontier_sector = create_frontier_sector()
	new_galaxy.sectors.append(frontier_sector)
	
	# Create Industrial Sector
	var industrial_sector = create_industrial_sector()
	new_galaxy.sectors.append(industrial_sector)
	
	# Set initial player location
	new_galaxy.current_player_location = WorldTypes.PlayerLocation.new(
		"core-sector", "sol-system", "earth-station"
	)
	
	return new_galaxy

func create_core_sector() -> WorldTypes.Sector:
	var sector = WorldTypes.Sector.new("core-sector", "Core Worlds Sector")
	sector.position = WorldTypes.Coordinates.new(0, 0)
	sector.controlling_faction = "Earth Federation"
	sector.description = "The heart of human civilization, containing Sol and the most developed systems."
	
	# Add systems
	sector.systems.append(create_sol_system())
	sector.systems.append(create_alpha_centauri_system())
	sector.systems.append(create_sirius_system())
	sector.systems.append(create_vega_system())
	sector.systems.append(create_arcturus_system())
	
	return sector

func create_frontier_sector() -> WorldTypes.Sector:
	var sector = WorldTypes.Sector.new("frontier-sector", "Frontier Sector")
	sector.position = WorldTypes.Coordinates.new(500, 0)
	sector.controlling_faction = "Outer Colonies Coalition"
	sector.description = "The expanding frontier of human space, filled with opportunities and dangers."
	
	# Add systems
	sector.systems.append(create_kepler_system())
	sector.systems.append(create_gliese_system())
	sector.systems.append(create_trappist_system())
	
	return sector

func create_industrial_sector() -> WorldTypes.Sector:
	var sector = WorldTypes.Sector.new("industrial-sector", "Industrial Sector")
	sector.position = WorldTypes.Coordinates.new(0, 400)
	sector.controlling_faction = "Industrial Consortium"
	sector.description = "The manufacturing heart of human space, dominated by massive industrial operations."
	
	# Add systems
	sector.systems.append(create_bernard_system())
	sector.systems.append(create_wolf_system())
	sector.systems.append(create_ross_system())
	
	return sector

func create_sol_system() -> WorldTypes.StarSystem:
	var system = WorldTypes.StarSystem.new("sol-system", "Sol System")
	system.position = WorldTypes.Coordinates.new(100, 100)
	system.security_level = 9
	system.star = WorldTypes.Star.new("Sol", WorldTypes.Star.StarType.YELLOW_DWARF, 5778.0)
	
	# Earth Station Alpha
	var earth_station = WorldTypes.Station.new("earth-station", "Earth Station Alpha", WorldTypes.Station.StationType.TRADE)
	earth_station.position = WorldTypes.Coordinates.new(100, 70)
	earth_station.faction = "Earth Federation"
	earth_station.docking_capacity = 50
	earth_station.services = ["refuel", "repair", "trading", "missions"]
	earth_station.description = "The primary orbital station around Earth, hub of interstellar commerce."
	system.stations.append(earth_station)
	
	# Sol Defense Platform
	var military_base = WorldTypes.Station.new("sol-military-base", "Sol Defense Platform", WorldTypes.Station.StationType.MILITARY)
	military_base.position = WorldTypes.Coordinates.new(60, 120)
	military_base.faction = "Earth Federation"
	military_base.docking_capacity = 30
	military_base.services = ["refuel", "repair", "military_contracts", "weapons"]
	military_base.description = "Heavily fortified military station protecting the Sol system."
	system.stations.append(military_base)
	
	# Orbital Paradise Resort
	var luxury_resort = WorldTypes.Station.new("sol-luxury-resort", "Orbital Paradise Resort", WorldTypes.Station.StationType.LUXURY)
	luxury_resort.position = WorldTypes.Coordinates.new(160, 90)
	luxury_resort.faction = "Neutral"
	luxury_resort.docking_capacity = 25
	luxury_resort.services = ["refuel", "luxury_trading", "entertainment", "high_end_missions"]
	luxury_resort.description = "Exclusive resort station catering to the wealthy elite."
	system.stations.append(luxury_resort)
	
	return system

func create_alpha_centauri_system() -> WorldTypes.StarSystem:
	var system = WorldTypes.StarSystem.new("alpha-centauri", "Alpha Centauri")
	system.position = WorldTypes.Coordinates.new(200, 150)
	system.security_level = 7
	system.star = WorldTypes.Star.new("Alpha Centauri", WorldTypes.Star.StarType.YELLOW_DWARF, 5260.0)
	
	# Research facility
	var research_station = WorldTypes.Station.new("centauri-research", "Centauri Research Complex", WorldTypes.Station.StationType.RESEARCH)
	research_station.position = WorldTypes.Coordinates.new(200, 130)
	research_station.faction = "Earth Federation"
	research_station.docking_capacity = 20
	research_station.services = ["research", "technology_trading", "experimental_equipment", "data_analysis"]
	research_station.description = "Advanced research facility studying alien artifacts and new technologies."
	system.stations.append(research_station)
	
	return system

func create_sirius_system() -> WorldTypes.StarSystem:
	var system = WorldTypes.StarSystem.new("sirius", "Sirius System")
	system.position = WorldTypes.Coordinates.new(300, 200)
	system.security_level = 6
	system.star = WorldTypes.Star.new("Sirius", WorldTypes.Star.StarType.BLUE_GIANT, 9940.0)
	
	# Trading hub
	var trading_hub = WorldTypes.Station.new("sirius-trading", "Sirius Trading Hub", WorldTypes.Station.StationType.TRADE)
	trading_hub.position = WorldTypes.Coordinates.new(300, 180)
	trading_hub.faction = "Traders Guild"
	trading_hub.docking_capacity = 40
	trading_hub.services = ["trading", "commodity_exchange", "cargo_storage", "route_planning"]
	trading_hub.description = "Major trading center connecting core and frontier regions."
	system.stations.append(trading_hub)
	
	return system

func create_vega_system() -> WorldTypes.StarSystem:
	var system = WorldTypes.StarSystem.new("vega", "Vega System")
	system.position = WorldTypes.Coordinates.new(400, 120)
	system.security_level = 8
	system.star = WorldTypes.Star.new("Vega", WorldTypes.Star.StarType.BLUE_GIANT, 9602.0)
	
	# Mining facility
	var mining_station = WorldTypes.Station.new("vega-mining", "Vega Mining Complex", WorldTypes.Station.StationType.MINING)
	mining_station.position = WorldTypes.Coordinates.new(400, 100)
	mining_station.faction = "Industrial Consortium"
	mining_station.docking_capacity = 35
	mining_station.services = ["raw_materials", "industrial_equipment", "mining_contracts", "refinery_services"]
	mining_station.description = "Massive asteroid mining operation extracting rare minerals."
	system.stations.append(mining_station)
	
	return system

func create_arcturus_system() -> WorldTypes.StarSystem:
	var system = WorldTypes.StarSystem.new("arcturus", "Arcturus System")
	system.position = WorldTypes.Coordinates.new(150, 300)
	system.security_level = 5
	system.star = WorldTypes.Star.new("Arcturus", WorldTypes.Star.StarType.RED_GIANT, 4286.0)
	
	# Diplomatic station
	var diplomatic_station = WorldTypes.Station.new("arcturus-diplomatic", "Arcturus Diplomatic Center", WorldTypes.Station.StationType.DIPLOMATIC)
	diplomatic_station.position = WorldTypes.Coordinates.new(150, 280)
	diplomatic_station.faction = "Neutral"
	diplomatic_station.docking_capacity = 30
	diplomatic_station.services = ["diplomatic_missions", "faction_negotiations", "neutral_trading", "peace_talks"]
	diplomatic_station.description = "Neutral diplomatic facility mediating between major factions."
	system.stations.append(diplomatic_station)
	
	return system

func create_kepler_system() -> WorldTypes.StarSystem:
	var system = WorldTypes.StarSystem.new("kepler-442", "Kepler-442 System")
	system.position = WorldTypes.Coordinates.new(600, 100)
	system.security_level = 4
	system.star = WorldTypes.Star.new("Kepler-442", WorldTypes.Star.StarType.RED_DWARF, 4402.0)
	
	# Colonial station
	var colonial_station = WorldTypes.Station.new("kepler-colony", "New Kepler Colony", WorldTypes.Station.StationType.COLONIAL)
	colonial_station.position = WorldTypes.Coordinates.new(600, 80)
	colonial_station.faction = "Outer Colonies Coalition"
	colonial_station.docking_capacity = 25
	colonial_station.services = ["colonization_supplies", "frontier_missions", "agricultural_products", "pioneer_equipment"]
	colonial_station.description = "Growing colonial settlement on the edge of known space."
	system.stations.append(colonial_station)
	
	return system

func create_gliese_system() -> WorldTypes.StarSystem:
	var system = WorldTypes.StarSystem.new("gliese-667c", "Gliese 667C System")
	system.position = WorldTypes.Coordinates.new(700, 200)
	system.security_level = 3
	system.star = WorldTypes.Star.new("Gliese 667C", WorldTypes.Star.StarType.RED_DWARF, 3700.0)
	
	# Exploration outpost
	var exploration_outpost = WorldTypes.Station.new("gliese-exploration", "Deep Space Outpost", WorldTypes.Station.StationType.EXPLORATION)
	exploration_outpost.position = WorldTypes.Coordinates.new(700, 180)
	exploration_outpost.faction = "Independent Explorers"
	exploration_outpost.docking_capacity = 15
	exploration_outpost.services = ["exploration_equipment", "star_charts", "unknown_artifacts", "deep_space_missions"]
	exploration_outpost.description = "Remote outpost serving as base for deep space exploration."
	system.stations.append(exploration_outpost)
	
	return system

func create_trappist_system() -> WorldTypes.StarSystem:
	var system = WorldTypes.StarSystem.new("trappist-1", "TRAPPIST-1 System")
	system.position = WorldTypes.Coordinates.new(800, 150)
	system.security_level = 2
	system.star = WorldTypes.Star.new("TRAPPIST-1", WorldTypes.Star.StarType.RED_DWARF, 2566.0)
	
	# Pirate hideout
	var pirate_base = WorldTypes.Station.new("trappist-pirates", "Blackwater Base", WorldTypes.Station.StationType.PIRATE)
	pirate_base.position = WorldTypes.Coordinates.new(800, 130)
	pirate_base.faction = "Crimson Fleet"
	pirate_base.docking_capacity = 20
	pirate_base.services = ["black_market", "stolen_goods", "pirate_contracts", "smuggling_routes"]
	pirate_base.description = "Hidden pirate base operating in the lawless frontier regions."
	system.stations.append(pirate_base)
	
	return system

func create_bernard_system() -> WorldTypes.StarSystem:
	var system = WorldTypes.StarSystem.new("bernard-star", "Barnard's Star System")
	system.position = WorldTypes.Coordinates.new(100, 500)
	system.security_level = 6
	system.star = WorldTypes.Star.new("Barnard's Star", WorldTypes.Star.StarType.RED_DWARF, 3134.0)
	
	# Industrial foundry
	var foundry = WorldTypes.Station.new("bernard-foundry", "Barnard Industrial Foundry", WorldTypes.Station.StationType.FOUNDRY)
	foundry.position = WorldTypes.Coordinates.new(100, 480)
	foundry.faction = "Industrial Consortium"
	foundry.docking_capacity = 40
	foundry.services = ["heavy_manufacturing", "ship_construction", "industrial_contracts", "bulk_processing"]
	foundry.description = "Massive industrial complex manufacturing ships and heavy equipment."
	system.stations.append(foundry)
	
	return system

func create_wolf_system() -> WorldTypes.StarSystem:
	var system = WorldTypes.StarSystem.new("wolf-359", "Wolf 359 System")
	system.position = WorldTypes.Coordinates.new(200, 550)
	system.security_level = 8
	system.star = WorldTypes.Star.new("Wolf 359", WorldTypes.Star.StarType.RED_DWARF, 2800.0)
	
	# Security station
	var security_station = WorldTypes.Station.new("wolf-security", "Wolf 359 Security Station", WorldTypes.Station.StationType.SECURITY)
	security_station.position = WorldTypes.Coordinates.new(175, 550)
	security_station.faction = "Security Forces"
	security_station.docking_capacity = 30
	security_station.services = ["security_missions", "law_enforcement", "prisoner_transport", "bounty_hunting"]
	security_station.description = "High-security station coordinating law enforcement across industrial sectors."
	system.stations.append(security_station)
	
	# Prison complex
	var prison = WorldTypes.Station.new("wolf-prison", "Wolf Penitentiary Complex", WorldTypes.Station.StationType.PRISON)
	prison.position = WorldTypes.Coordinates.new(240, 575)
	prison.faction = "Security Forces"
	prison.docking_capacity = 10
	prison.services = ["prisoner_transport", "rehabilitation_programs", "restricted_access"]
	prison.description = "Maximum security prison complex for the most dangerous criminals."
	system.stations.append(prison)
	
	return system

func create_ross_system() -> WorldTypes.StarSystem:
	var system = WorldTypes.StarSystem.new("ross-128", "Ross 128 System")
	system.position = WorldTypes.Coordinates.new(300, 480)
	system.security_level = 6
	system.star = WorldTypes.Star.new("Ross 128", WorldTypes.Star.StarType.RED_DWARF, 3192.0)
	
	# Energy plant
	var energy_plant = WorldTypes.Station.new("ross-energy", "Ross Stellar Energy Plant", WorldTypes.Station.StationType.ENERGY)
	energy_plant.position = WorldTypes.Coordinates.new(300, 450)
	energy_plant.faction = "Industrial Consortium"
	energy_plant.docking_capacity = 25
	energy_plant.services = ["fuel_depot", "energy_trading", "stellar_harvesting", "power_systems"]
	energy_plant.description = "Advanced stellar energy collection facility powering industrial operations."
	system.stations.append(energy_plant)
	
	return system

# Navigation functions
func get_galaxy() -> WorldTypes.Galaxy:
	return galaxy

func get_current_sector() -> WorldTypes.Sector:
	return galaxy.get_sector_by_id(galaxy.current_player_location.sector_id)

func get_current_system() -> WorldTypes.StarSystem:
	var sector = get_current_sector()
	if not sector:
		return null
	return sector.get_system_by_id(galaxy.current_player_location.system_id)

func get_current_station() -> WorldTypes.Station:
	var system = get_current_system()
	if not system or galaxy.current_player_location.station_id.is_empty():
		return null
	return system.get_station_by_id(galaxy.current_player_location.station_id)

func get_available_targets() -> Array[WorldTypes.NavigationTarget]:
	var current_sector = get_current_sector()
	if not current_sector:
		return []
	
	var targets: Array[WorldTypes.NavigationTarget] = []
	var current_pos = get_current_system().position if get_current_system() else WorldTypes.Coordinates.new()
	
	# Add systems in current sector
	for system in current_sector.systems:
		if system.id != galaxy.current_player_location.system_id:
			var target = WorldTypes.NavigationTarget.new(
				WorldTypes.NavigationTarget.TargetType.SYSTEM, system.id, system.name
			)
			target.position = system.position
			target.distance = current_pos.distance_to(system.position)
			target.estimated_travel_time = target.distance / 10.0  # Simple time calculation
			targets.append(target)
		
		# Add stations in current system
		if system.id == galaxy.current_player_location.system_id:
			for station in system.stations:
				if station.id != galaxy.current_player_location.station_id:
					var target = WorldTypes.NavigationTarget.new(
						WorldTypes.NavigationTarget.TargetType.STATION, station.id, station.name
					)
					target.position = station.position
					target.distance = current_pos.distance_to(station.position)
					target.estimated_travel_time = target.distance / 50.0  # Faster local travel
					targets.append(target)
	
	# Add other sectors
	for sector in galaxy.sectors:
		if sector.id != galaxy.current_player_location.sector_id:
			var target = WorldTypes.NavigationTarget.new(
				WorldTypes.NavigationTarget.TargetType.SECTOR, sector.id, sector.name
			)
			target.position = sector.position
			target.distance = current_pos.distance_to(sector.position)
			target.estimated_travel_time = target.distance / 5.0  # Slower inter-sector travel
			targets.append(target)
	
	return targets

func navigate_to_target(target_id: String, target_type: WorldTypes.NavigationTarget.TargetType) -> bool:
	match target_type:
		WorldTypes.NavigationTarget.TargetType.SECTOR:
			return navigate_to_sector(target_id)
		WorldTypes.NavigationTarget.TargetType.SYSTEM:
			return navigate_to_system(target_id)
		WorldTypes.NavigationTarget.TargetType.STATION:
			return navigate_to_station(target_id)
		_:
			return false

func navigate_to_sector(sector_id: String) -> bool:
	var sector = galaxy.get_sector_by_id(sector_id)
	if not sector or sector.systems.is_empty():
		return false
	
	# Move to first system in sector
	var first_system = sector.systems[0]
	galaxy.current_player_location.sector_id = sector_id
	galaxy.current_player_location.system_id = first_system.id
	galaxy.current_player_location.station_id = ""
	
	emit_signal("location_changed", sector_id, first_system.id, "")
	return true

func navigate_to_system(system_id: String) -> bool:
	# Find system in current sector first
	var current_sector = get_current_sector()
	if current_sector:
		var system = current_sector.get_system_by_id(system_id)
		if system:
			galaxy.current_player_location.system_id = system_id
			galaxy.current_player_location.station_id = ""
			emit_signal("location_changed", galaxy.current_player_location.sector_id, system_id, "")
			return true
	
	# If not found in current sector, search all sectors
	for sector in galaxy.sectors:
		var system = sector.get_system_by_id(system_id)
		if system:
			galaxy.current_player_location.sector_id = sector.id
			galaxy.current_player_location.system_id = system_id
			galaxy.current_player_location.station_id = ""
			emit_signal("location_changed", sector.id, system_id, "")
			return true
	
	return false

func navigate_to_station(station_id: String) -> bool:
	var current_system = get_current_system()
	if not current_system:
		return false
	
	var station = current_system.get_station_by_id(station_id)
	if not station:
		return false
	
	galaxy.current_player_location.station_id = station_id
	emit_signal("location_changed", 
		galaxy.current_player_location.sector_id, 
		galaxy.current_player_location.system_id, 
		station_id
	)
	return true

func calculate_distance(from: WorldTypes.Coordinates, to: WorldTypes.Coordinates) -> float:
	return from.distance_to(to)

# Save/Load support
func to_dict() -> Dictionary:
	var data = {
		"galaxy": serialize_galaxy(galaxy)
	}
	return data

func from_dict(data: Dictionary):
	if data.has("galaxy"):
		galaxy = deserialize_galaxy(data["galaxy"])
		emit_signal("galaxy_updated")

func serialize_galaxy(g: WorldTypes.Galaxy) -> Dictionary:
	var sectors_data = []
	for sector in g.sectors:
		sectors_data.append(serialize_sector(sector))
	
	return {
		"sectors": sectors_data,
		"current_player_location": {
			"sector_id": g.current_player_location.sector_id,
			"system_id": g.current_player_location.system_id,
			"station_id": g.current_player_location.station_id
		}
	}

func serialize_sector(sector: WorldTypes.Sector) -> Dictionary:
	var systems_data = []
	for system in sector.systems:
		systems_data.append(serialize_system(system))
	
	return {
		"id": sector.id,
		"name": sector.name,
		"position": {"x": sector.position.x, "y": sector.position.y, "z": sector.position.z},
		"systems": systems_data,
		"controlling_faction": sector.controlling_faction,
		"description": sector.description
	}

func serialize_system(system: WorldTypes.StarSystem) -> Dictionary:
	var stations_data = []
	for station in system.stations:
		stations_data.append(serialize_station(station))
	
	var planets_data = []
	for planet in system.planets:
		planets_data.append(serialize_planet(planet))
	
	return {
		"id": system.id,
		"name": system.name,
		"position": {"x": system.position.x, "y": system.position.y, "z": system.position.z},
		"star": serialize_star(system.star),
		"stations": stations_data,
		"planets": planets_data,
		"security_level": system.security_level
	}

func serialize_station(station: WorldTypes.Station) -> Dictionary:
	return {
		"id": station.id,
		"name": station.name,
		"type": station.type,
		"position": {"x": station.position.x, "y": station.position.y, "z": station.position.z},
		"faction": station.faction,
		"docking_capacity": station.docking_capacity,
		"services": station.services,
		"description": station.description
	}

func serialize_planet(planet: WorldTypes.Planet) -> Dictionary:
	return {
		"id": planet.id,
		"name": planet.name,
		"type": planet.type,
		"position": {"x": planet.position.x, "y": planet.position.y, "z": planet.position.z},
		"radius": planet.radius,
		"habitable": planet.habitable,
		"population": planet.population,
		"description": planet.description
	}

func serialize_star(star: WorldTypes.Star) -> Dictionary:
	return {
		"name": star.name,
		"type": star.type,
		"temperature": star.temperature
	}

func deserialize_galaxy(data: Dictionary) -> WorldTypes.Galaxy:
	var g = WorldTypes.Galaxy.new()
	
	if data.has("sectors"):
		for sector_data in data["sectors"]:
			g.sectors.append(deserialize_sector(sector_data))
	
	if data.has("current_player_location"):
		var loc = data["current_player_location"]
		g.current_player_location = WorldTypes.PlayerLocation.new(
			loc.get("sector_id", ""),
			loc.get("system_id", ""),
			loc.get("station_id", "")
		)
	
	return g

func deserialize_sector(data: Dictionary) -> WorldTypes.Sector:
	var sector = WorldTypes.Sector.new(data.get("id", ""), data.get("name", ""))
	
	if data.has("position"):
		var pos = data["position"]
		sector.position = WorldTypes.Coordinates.new(pos.get("x", 0), pos.get("y", 0), pos.get("z", 0))
	
	if data.has("systems"):
		for system_data in data["systems"]:
			sector.systems.append(deserialize_system(system_data))
	
	sector.controlling_faction = data.get("controlling_faction", "")
	sector.description = data.get("description", "")
	
	return sector

func deserialize_system(data: Dictionary) -> WorldTypes.StarSystem:
	var system = WorldTypes.StarSystem.new(data.get("id", ""), data.get("name", ""))
	
	if data.has("position"):
		var pos = data["position"]
		system.position = WorldTypes.Coordinates.new(pos.get("x", 0), pos.get("y", 0), pos.get("z", 0))
	
	if data.has("star"):
		system.star = deserialize_star(data["star"])
	
	if data.has("stations"):
		for station_data in data["stations"]:
			system.stations.append(deserialize_station(station_data))
	
	if data.has("planets"):
		for planet_data in data["planets"]:
			system.planets.append(deserialize_planet(planet_data))
	
	system.security_level = data.get("security_level", 5)
	
	return system

func deserialize_station(data: Dictionary) -> WorldTypes.Station:
	var station = WorldTypes.Station.new(data.get("id", ""), data.get("name", ""), data.get("type", WorldTypes.Station.StationType.TRADE))
	
	if data.has("position"):
		var pos = data["position"]
		station.position = WorldTypes.Coordinates.new(pos.get("x", 0), pos.get("y", 0), pos.get("z", 0))
	
	station.faction = data.get("faction", "")
	station.docking_capacity = data.get("docking_capacity", 10)
	station.services = data.get("services", [])
	station.description = data.get("description", "")
	
	return station

func deserialize_planet(data: Dictionary) -> WorldTypes.Planet:
	var planet = WorldTypes.Planet.new(data.get("id", ""), data.get("name", ""), data.get("type", WorldTypes.Planet.PlanetType.TERRESTRIAL))
	
	if data.has("position"):
		var pos = data["position"]
		planet.position = WorldTypes.Coordinates.new(pos.get("x", 0), pos.get("y", 0), pos.get("z", 0))
	
	planet.radius = data.get("radius", 1000.0)
	planet.habitable = data.get("habitable", false)
	planet.population = data.get("population", 0)
	planet.description = data.get("description", "")
	
	return planet

func deserialize_star(data: Dictionary) -> WorldTypes.Star:
	return WorldTypes.Star.new(
		data.get("name", "Unknown"), 
		data.get("type", WorldTypes.Star.StarType.YELLOW_DWARF), 
		data.get("temperature", 5778.0)
	)