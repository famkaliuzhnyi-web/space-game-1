extends Control

# Simple WorldUI for testing the WorldManager implementation

var world_manager: WorldManager

@onready var location_label = $VBox/LocationInfo
@onready var system_list = $VBox/HSplitContainer/SystemList
@onready var station_list = $VBox/HSplitContainer/StationList
@onready var navigate_button = $VBox/NavigateButton

func _ready():
	# This will be connected by the main game
	pass

func connect_to_world_manager(wm: WorldManager):
	world_manager = wm
	if world_manager:
		world_manager.connect("location_changed", _on_location_changed)
		world_manager.connect("galaxy_updated", _on_galaxy_updated)
		update_ui()

func update_ui():
	if not world_manager:
		return
	
	# Update current location
	var current_sector = world_manager.get_current_sector()
	var current_system = world_manager.get_current_system()
	var current_station = world_manager.get_current_station()
	
	var location_text = "Location: Unknown"
	if current_sector and current_system:
		location_text = "Location: %s / %s" % [current_sector.name, current_system.name]
		if current_station:
			location_text += " / %s" % current_station.name
	
	location_label.text = location_text
	
	# Update system list
	system_list.clear()
	if current_sector:
		for system in current_sector.systems:
			var item = system_list.add_item(system.name)
			system_list.set_item_metadata(item, {"type": "system", "id": system.id})
	
	# Update station list
	station_list.clear()
	if current_system:
		for station in current_system.stations:
			var item = station_list.add_item(station.name)
			station_list.set_item_metadata(item, {"type": "station", "id": station.id})

func _on_location_changed(sector_id: String, system_id: String, station_id: String):
	update_ui()

func _on_galaxy_updated():
	update_ui()

func _on_system_list_item_selected(index):
	if not world_manager:
		return
	
	var metadata = system_list.get_item_metadata(index)
	if metadata and metadata.has("id"):
		world_manager.navigate_to_system(metadata["id"])

func _on_station_list_item_selected(index):
	if not world_manager:
		return
	
	var metadata = station_list.get_item_metadata(index)
	if metadata and metadata.has("id"):
		world_manager.navigate_to_station(metadata["id"])

func _on_navigate_button_pressed():
	# Simple navigation test - cycle through available targets
	if not world_manager:
		return
	
	var targets = world_manager.get_available_targets()
	if targets.size() > 0:
		var target = targets[0]  # Take first available target
		world_manager.navigate_to_target(target.id, target.type)