extends Node

# Core Game Engine for Space Game 1 Godot Port
# Based on the original TypeScript engine implementation

class_name GameEngine

# Core engine components
var system_manager: GameSystemManager
# TODO: Add other engine components as needed:
# var renderer: GameRenderer
# var input_handler: GameInputHandler  
# var game_loop: GameGameLoop

func _ready():
	print("Initializing Godot Game Engine...")
	initialize_engine()

func initialize_engine():
	# Initialize system manager first
	system_manager = GameSystemManager.new()
	add_child(system_manager)
	
	# TODO: Initialize other engine components as they are created:
	# renderer = GameRenderer.new()
	# add_child(renderer)
	
	# input_handler = GameInputHandler.new()
	# add_child(input_handler)
	
	# game_loop = GameGameLoop.new()
	# add_child(game_loop)
	
	print("Game Engine initialized successfully")

func handle_input(event):
	# TODO: Implement input handling
	pass

func _process(delta):
	if system_manager:
		system_manager.update(delta)

func shutdown():
	print("Shutting down Game Engine...")
	if system_manager:
		system_manager.shutdown()