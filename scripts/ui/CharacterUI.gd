extends Control

# Simple CharacterUI for testing the CharacterManager implementation

var character_manager: CharacterManager

@onready var character_info = $VBox/CharacterInfo
@onready var create_button = $VBox/CreateButton
@onready var add_exp_button = $VBox/AddExpButton
@onready var improve_skill_button = $VBox/ImproveSkillButton

func _ready():
	# This will be connected by the main game
	pass

func connect_to_character_manager(cm: CharacterManager):
	character_manager = cm
	if character_manager:
		character_manager.connect("character_created", _on_character_created)
		character_manager.connect("character_updated", _on_character_updated)
		character_manager.connect("experience_gained", _on_experience_gained)
		character_manager.connect("level_up", _on_level_up)
		character_manager.connect("skill_improved", _on_skill_improved)
		update_ui()

func update_ui():
	if not character_manager:
		return
	
	var character = character_manager.get_character()
	
	if character:
		var info_text = "Character: %s\n" % character.name
		info_text += "Background: %s\n" % character.background.name
		info_text += "Level: %d (XP: %d/%d)\n" % [character.progression.level, character.progression.experience, character.progression.experience_to_next]
		info_text += "Skill Points: %d | Attribute Points: %d\n" % [character.progression.skill_points, character.progression.attribute_points]
		info_text += "\nAttributes:\n"
		info_text += "  STR: %d  INT: %d  CHA: %d\n" % [character.attributes.strength, character.attributes.intelligence, character.attributes.charisma]
		info_text += "  END: %d  DEX: %d  PER: %d\n" % [character.attributes.endurance, character.attributes.dexterity, character.attributes.perception]
		info_text += "\nTop Skills:\n"
		info_text += "  Trading: %d  Engineering: %d  Piloting: %d\n" % [character.skills.trading, character.skills.engineering, character.skills.piloting]
		info_text += "  Navigation: %d  Negotiation: %d\n" % [character.skills.navigation, character.skills.negotiation]
		
		character_info.text = info_text
		create_button.text = "Recreate Character"
		add_exp_button.disabled = false
		improve_skill_button.disabled = character.progression.skill_points <= 0
	else:
		character_info.text = "No character created yet"
		create_button.text = "Create Character"
		add_exp_button.disabled = true
		improve_skill_button.disabled = true

func _on_character_created(character: CharacterTypes.Character):
	update_ui()

func _on_character_updated():
	update_ui()

func _on_experience_gained(amount: int, source: String, category: CharacterTypes.ExperienceGain.Category):
	print("UI: Experience gained: +", amount, " from ", source)

func _on_level_up(new_level: int):
	print("UI: Level up! Now level ", new_level)

func _on_skill_improved(skill_name: String, old_value: int, new_value: int):
	print("UI: Skill improved: ", skill_name, " from ", old_value, " to ", new_value)

func _on_create_button_pressed():
	if not character_manager:
		return
	
	# Create a test character
	var appearance = CharacterTypes.CharacterAppearance.new()
	appearance.age = 30
	appearance.gender = CharacterTypes.CharacterAppearance.Gender.MALE
	appearance.skin_tone = "medium"
	appearance.hair_color = "brown"
	appearance.eye_color = "blue"
	appearance.portrait = "default"
	
	# Choose a random background
	var backgrounds = character_manager.get_available_backgrounds()
	var bg_index = randi() % backgrounds.size()
	var background_id = backgrounds[bg_index].id
	
	var character_name = "Test Pilot " + str(randi() % 1000)
	
	character_manager.create_character(
		"test-char-" + str(randi()),
		character_name,
		appearance,
		background_id
	)

func _on_add_exp_button_pressed():
	if not character_manager or not character_manager.has_character():
		return
	
	# Add some test experience
	var sources = ["Trading cargo", "Successful navigation", "Ship maintenance", "Combat victory"]
	var categories = [
		CharacterTypes.ExperienceGain.Category.TRADING,
		CharacterTypes.ExperienceGain.Category.EXPLORATION,
		CharacterTypes.ExperienceGain.Category.TECHNICAL,
		CharacterTypes.ExperienceGain.Category.COMBAT
	]
	
	var source_index = randi() % sources.size()
	var amount = 25 + randi() % 75  # 25-100 experience
	
	character_manager.add_experience(amount, sources[source_index], categories[source_index])

func _on_improve_skill_button_pressed():
	if not character_manager or not character_manager.has_character():
		return
	
	var character = character_manager.get_character()
	if character.progression.skill_points <= 0:
		return
	
	# Improve a random skill
	var skills = ["trading", "negotiation", "economics", "engineering", "piloting", "navigation", "combat", "tactics"]
	var skill_index = randi() % skills.size()
	var skill_name = skills[skill_index]
	
	character_manager.improve_skill(skill_name, 1)