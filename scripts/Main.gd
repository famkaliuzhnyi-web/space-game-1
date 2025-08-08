extends Node2D

# Main game controller for Space Game 1
# Manages core game systems and initialization

var game_engine: GameEngine

@onready var world_ui = $UI/TabContainer/\World\ Navigation\
@onready var character_ui = $UI/TabContainer/Character

func _ready():
	print("Space Game 1 - Godot Version Starting...")
	initialize_game()

func initialize_game():
	# Initialize the game engine
	game_engine = GameEngine.new()
	add_child(game_engine)
	
	# Wait a frame for engine initialization
	await get_tree().process_frame
	
	# Connect UI to systems
	var system_manager = game_engine.system_manager
	if system_manager:
		# Connect WorldUI
		if system_manager.get_world_manager():
			world_ui.connect_to_world_manager(system_manager.get_world_manager())
			print("WorldUI connected to WorldManager")
		else:
			print("Warning: Could not connect WorldUI to WorldManager")
		
		# Connect CharacterUI
		if system_manager.get_character_manager():
			character_ui.connect_to_character_manager(system_manager.get_character_manager())
			print("CharacterUI connected to CharacterManager")
		else:
			print("Warning: Could not connect CharacterUI to CharacterManager")
	else:
		print("Warning: SystemManager not available")

func _input(event):
	if game_engine:
		game_engine.handle_input(event)