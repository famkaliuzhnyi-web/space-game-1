extends Node2D

# Main game controller for Space Game 1
# Manages core game systems and initialization

var game_engine: GameEngine

func _ready():
	print("Space Game 1 - Godot Version Starting...")
	initialize_game()

func initialize_game():
	# Initialize the game engine
	game_engine = GameEngine.new()
	add_child(game_engine)
	
	# TODO: Initialize all game systems from original implementation
	# - CharacterManager
	# - EconomicSystem  
	# - CombatManager
	# - FactionManager
	# - WorldManager
	# - etc.

func _input(event):
	if game_engine:
		game_engine.handle_input(event)