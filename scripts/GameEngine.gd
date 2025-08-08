extends Node

# Core Game Engine for Space Game 1 Godot Port
# Based on the original TypeScript engine implementation

class_name GameEngine

# Core engine components
var renderer: GameRenderer
var input_handler: GameInputHandler
var system_manager: GameSystemManager
var game_loop: GameGameLoop

func _ready():
	print("Initializing Godot Game Engine...")
	initialize_engine()

func initialize_engine():
	# Initialize core engine components
	system_manager = GameSystemManager.new()
	add_child(system_manager)
	
	renderer = GameRenderer.new()
	add_child(renderer)
	
	input_handler = GameInputHandler.new()
	add_child(input_handler)
	
	game_loop = GameGameLoop.new()
	add_child(game_loop)
	
	print("Game Engine initialized successfully")

func handle_input(event):
	if input_handler:
		input_handler.handle_input(event)

func _process(delta):
	if game_loop:
		game_loop.update(delta)

func shutdown():
	print("Shutting down Game Engine...")
	# Clean shutdown of all systems