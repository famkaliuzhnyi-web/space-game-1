extends Node

# Game System Manager - Manages all game systems
# Ported from original TypeScript SystemManager

class_name GameSystemManager

# System instances - will be initialized based on original implementation
var world_manager: WorldManager
var character_manager: CharacterManager
var economic_system: EconomicSystem
var combat_manager: CombatManager
var faction_manager: FactionManager
var quest_manager: QuestManager
var achievement_manager: AchievementManager
var save_manager: SaveManager

func _ready():
	print("Initializing Game System Manager...")
	initialize_systems()

func initialize_systems():
	# Initialize core systems - starting with WorldManager and CharacterManager
	print("Initializing WorldManager...")
	world_manager = WorldManager.new()
	add_child(world_manager)
	
	# Connect to world events
	world_manager.connect("location_changed", _on_location_changed)
	world_manager.connect("galaxy_updated", _on_galaxy_updated)
	
	print("Initializing CharacterManager...")
	character_manager = CharacterManager.new()
	add_child(character_manager)
	
	# Connect to character events
	character_manager.connect("character_created", _on_character_created)
	character_manager.connect("character_updated", _on_character_updated)
	character_manager.connect("experience_gained", _on_experience_gained)
	character_manager.connect("level_up", _on_level_up)
	character_manager.connect("skill_improved", _on_skill_improved)
	
	# TODO: Initialize remaining systems from original implementation
	# Priority systems to implement next:
	# - EconomicSystem (trading and market simulation) 
	# - FactionManager (reputation and politics)
	# - CombatManager (ship-to-ship combat)
	
	# Additional systems to implement later:
	# - AchievementManager
	# - ContactManager
	# - ContractManager
	# - EquipmentManager
	# - EventManager
	# - HackingManager
	# - HubShipConstructionSystem
	# - InputManager
	# - InvestmentManager
	# - MaintenanceManager
	# - NPCAIManager
	# - PersonalEquipmentManager
	# - PlayerManager
	# - QuestManager
	# - RouteAnalyzer
	# - SaveManager
	# - SecurityManager
	# - ShipConstructionSystem
	# - ShipStorageManager
	# - SkillSpecializationManager
	# - TimeManager
	# - TutorialManager
	
	print("WorldManager and CharacterManager initialized successfully")

func update(delta: float):
	# Update world manager first
	if world_manager:
		# WorldManager doesn't need delta updates in current implementation
		pass
	
	# Update character manager
	if character_manager:
		# CharacterManager doesn't need delta updates in current implementation
		pass
	
	# TODO: Update other systems as they are implemented
	pass

func shutdown():
	print("Shutting down all game systems...")
	# Clean shutdown of all systems
	if world_manager:
		world_manager.queue_free()
	if character_manager:
		character_manager.queue_free()

# Event handlers for world system
func _on_location_changed(sector_id: String, system_id: String, station_id: String):
	print("Location changed to: ", sector_id, "/", system_id, "/", station_id)
	# TODO: Notify other systems about location change

func _on_galaxy_updated():
	print("Galaxy data updated")
	# TODO: Notify other systems about galaxy updates

# Event handlers for character system
func _on_character_created(character: CharacterTypes.Character):
	print("Character created: ", character.name, " (", character.background.name, ")")

func _on_character_updated():
	print("Character data updated")

func _on_experience_gained(amount: int, source: String, category: CharacterTypes.ExperienceGain.Category):
	print("Experience gained: +", amount, " from ", source)

func _on_level_up(new_level: int):
	print("Character leveled up to level ", new_level)

func _on_skill_improved(skill_name: String, old_value: int, new_value: int):
	print("Skill improved: ", skill_name, " ", old_value, " -> ", new_value)

# Public interface for accessing systems
func get_world_manager() -> WorldManager:
	return world_manager

func get_character_manager() -> CharacterManager:
	return character_manager