extends Node

# CharacterManager - Manages character creation, progression, skills, and personal equipment
# Ported from orig/src/systems/CharacterManager.ts

class_name CharacterManager

var character: CharacterTypes.Character = null
var experience_history: Array[CharacterTypes.ExperienceGain] = []

signal character_created(character: CharacterTypes.Character)
signal character_updated()
signal experience_gained(amount: int, source: String, category: CharacterTypes.ExperienceGain.Category)
signal level_up(new_level: int)
signal skill_improved(skill_name: String, old_value: int, new_value: int)

func _ready():
	print("Initializing CharacterManager...")

# Character Creation
func create_character(
	id: String,
	name: String,
	appearance: CharacterTypes.CharacterAppearance,
	background_id: String,
	allocated_attributes: Dictionary = {},
	allocated_skills: Dictionary = {}
) -> CharacterTypes.Character:
	var background = get_background(background_id)
	if not background:
		push_error("Background with ID " + background_id + " not found")
		return null
	
	var base_attributes = get_base_attributes()
	var base_skills = get_base_skills()
	
	# Apply background bonuses and allocated points
	var final_attributes = CharacterTypes.CharacterAttributes.new()
	final_attributes.strength = base_attributes.strength + background.starting_attribute_bonus.strength + allocated_attributes.get("strength", 0)
	final_attributes.intelligence = base_attributes.intelligence + background.starting_attribute_bonus.intelligence + allocated_attributes.get("intelligence", 0)
	final_attributes.charisma = base_attributes.charisma + background.starting_attribute_bonus.charisma + allocated_attributes.get("charisma", 0)
	final_attributes.endurance = base_attributes.endurance + background.starting_attribute_bonus.endurance + allocated_attributes.get("endurance", 0)
	final_attributes.dexterity = base_attributes.dexterity + background.starting_attribute_bonus.dexterity + allocated_attributes.get("dexterity", 0)
	final_attributes.perception = base_attributes.perception + background.starting_attribute_bonus.perception + allocated_attributes.get("perception", 0)
	
	var final_skills = CharacterTypes.CharacterSkills.new()
	final_skills.trading = base_skills.trading + background.starting_skill_bonus.trading + allocated_skills.get("trading", 0)
	final_skills.negotiation = base_skills.negotiation + background.starting_skill_bonus.negotiation + allocated_skills.get("negotiation", 0)
	final_skills.economics = base_skills.economics + background.starting_skill_bonus.economics + allocated_skills.get("economics", 0)
	final_skills.engineering = base_skills.engineering + background.starting_skill_bonus.engineering + allocated_skills.get("engineering", 0)
	final_skills.piloting = base_skills.piloting + background.starting_skill_bonus.piloting + allocated_skills.get("piloting", 0)
	final_skills.navigation = base_skills.navigation + background.starting_skill_bonus.navigation + allocated_skills.get("navigation", 0)
	final_skills.combat = base_skills.combat + background.starting_skill_bonus.combat + allocated_skills.get("combat", 0)
	final_skills.tactics = base_skills.tactics + background.starting_skill_bonus.tactics + allocated_skills.get("tactics", 0)
	final_skills.security = base_skills.security + background.starting_skill_bonus.security + allocated_skills.get("security", 0)
	final_skills.networking = base_skills.networking + background.starting_skill_bonus.networking + allocated_skills.get("networking", 0)
	final_skills.investigation = base_skills.investigation + background.starting_skill_bonus.investigation + allocated_skills.get("investigation", 0)
	final_skills.leadership = base_skills.leadership + background.starting_skill_bonus.leadership + allocated_skills.get("leadership", 0)
	
	var progression = CharacterTypes.CharacterProgression.new()
	progression.level = 1
	progression.experience = 0
	progression.experience_to_next = get_experience_for_level(2)
	progression.skill_points = 0
	progression.attribute_points = 0
	progression.total_attribute_points_spent = get_total_allocated_points(allocated_attributes)
	progression.total_skill_points_spent = get_total_allocated_points(allocated_skills)
	
	character = CharacterTypes.Character.new(id, name)
	character.appearance = appearance
	character.background = background
	character.attributes = final_attributes
	character.skills = final_skills
	character.progression = progression
	character.personal_equipment = get_empty_personal_equipment()
	
	print("Character created: ", name, " (", background.name, ")")
	emit_signal("character_created", character)
	emit_signal("character_updated")
	
	return character

func has_character() -> bool:
	return character != null

func get_character() -> CharacterTypes.Character:
	return character

func get_character_name() -> String:
	if character:
		return character.name
	return "No Character"

# Experience and Progression
func add_experience(amount: int, source: String, category: CharacterTypes.ExperienceGain.Category = CharacterTypes.ExperienceGain.Category.TRADING):
	if not character:
		return
	
	var exp_gain = CharacterTypes.ExperienceGain.new(source, amount, category)
	experience_history.append(exp_gain)
	
	character.progression.experience += amount
	emit_signal("experience_gained", amount, source, category)
	
	# Check for level up
	check_for_level_up()
	emit_signal("character_updated")

func check_for_level_up():
	if not character:
		return
	
	while character.progression.experience >= character.progression.experience_to_next:
		character.progression.level += 1
		
		# Award points for leveling up
		character.progression.skill_points += 2
		character.progression.attribute_points += 1
		
		# Calculate next level requirements
		var next_level = character.progression.level + 1
		character.progression.experience_to_next = get_experience_for_level(next_level)
		
		print("Level up! Now level ", character.progression.level)
		emit_signal("level_up", character.progression.level)

func get_experience_for_level(level: int) -> int:
	if level <= 1:
		return 0
	# More balanced progression: 150, 300, 475, 675, etc.
	return int(100 * level * 1.5)

# Skill Management
func improve_skill(skill_name: String, points: int) -> bool:
	if not character or points <= 0:
		return false
	
	if character.progression.skill_points < points:
		return false
	
	var old_value = get_skill_value(skill_name)
	if old_value == -1:
		return false  # Invalid skill name
	
	var max_increase = min(points, character.progression.skill_points)
	if max_increase <= 0:
		return false
	
	# Apply skill increase
	set_skill_value(skill_name, old_value + max_increase)
	character.progression.skill_points -= max_increase
	character.progression.total_skill_points_spent += max_increase
	
	# Record skill change
	var record = CharacterTypes.SkillChangeRecord.new(skill_name, old_value, old_value + max_increase, "Manual allocation")
	character.skill_history.append(record)
	
	print("Skill improved: ", skill_name, " ", old_value, " -> ", old_value + max_increase)
	emit_signal("skill_improved", skill_name, old_value, old_value + max_increase)
	emit_signal("character_updated")
	
	return true

func improve_attribute(attribute_name: String, points: int) -> bool:
	if not character or points <= 0:
		return false
	
	if character.progression.attribute_points < points:
		return false
	
	var old_value = get_attribute_value(attribute_name)
	if old_value == -1:
		return false  # Invalid attribute name
	
	var max_increase = min(points, character.progression.attribute_points)
	if max_increase <= 0:
		return false
	
	# Apply attribute increase
	set_attribute_value(attribute_name, old_value + max_increase)
	character.progression.attribute_points -= max_increase
	character.progression.total_attribute_points_spent += max_increase
	
	print("Attribute improved: ", attribute_name, " ", old_value, " -> ", old_value + max_increase)
	emit_signal("character_updated")
	
	return true

func get_skill_value(skill_name: String) -> int:
	if not character:
		return -1
	
	match skill_name:
		"trading": return character.skills.trading
		"negotiation": return character.skills.negotiation
		"economics": return character.skills.economics
		"engineering": return character.skills.engineering
		"piloting": return character.skills.piloting
		"navigation": return character.skills.navigation
		"combat": return character.skills.combat
		"tactics": return character.skills.tactics
		"security": return character.skills.security
		"networking": return character.skills.networking
		"investigation": return character.skills.investigation
		"leadership": return character.skills.leadership
		_: return -1

func set_skill_value(skill_name: String, value: int):
	if not character:
		return
	
	match skill_name:
		"trading": character.skills.trading = value
		"negotiation": character.skills.negotiation = value
		"economics": character.skills.economics = value
		"engineering": character.skills.engineering = value
		"piloting": character.skills.piloting = value
		"navigation": character.skills.navigation = value
		"combat": character.skills.combat = value
		"tactics": character.skills.tactics = value
		"security": character.skills.security = value
		"networking": character.skills.networking = value
		"investigation": character.skills.investigation = value
		"leadership": character.skills.leadership = value

func get_attribute_value(attribute_name: String) -> int:
	if not character:
		return -1
	
	match attribute_name:
		"strength": return character.attributes.strength
		"intelligence": return character.attributes.intelligence
		"charisma": return character.attributes.charisma
		"endurance": return character.attributes.endurance
		"dexterity": return character.attributes.dexterity
		"perception": return character.attributes.perception
		_: return -1

func set_attribute_value(attribute_name: String, value: int):
	if not character:
		return
	
	match attribute_name:
		"strength": character.attributes.strength = value
		"intelligence": character.attributes.intelligence = value
		"charisma": character.attributes.charisma = value
		"endurance": character.attributes.endurance = value
		"dexterity": character.attributes.dexterity = value
		"perception": character.attributes.perception = value

# Personal Equipment
func equip_personal_item(item: CharacterTypes.PersonalItem) -> bool:
	if not character:
		return false
	
	# Unequip existing item of same type if any
	match item.type:
		CharacterTypes.PersonalItem.ItemType.SUIT:
			character.personal_equipment.suit = item
		CharacterTypes.PersonalItem.ItemType.TOOL:
			character.personal_equipment.tool = item
		CharacterTypes.PersonalItem.ItemType.DATAPAD:
			character.personal_equipment.datapad = item
		CharacterTypes.PersonalItem.ItemType.ACCESSORY:
			character.personal_equipment.accessory = item
	
	emit_signal("character_updated")
	return true

func unequip_personal_item(type: CharacterTypes.PersonalItem.ItemType) -> CharacterTypes.PersonalItem:
	if not character:
		return null
	
	var item = null
	match type:
		CharacterTypes.PersonalItem.ItemType.SUIT:
			item = character.personal_equipment.suit
			character.personal_equipment.suit = null
		CharacterTypes.PersonalItem.ItemType.TOOL:
			item = character.personal_equipment.tool
			character.personal_equipment.tool = null
		CharacterTypes.PersonalItem.ItemType.DATAPAD:
			item = character.personal_equipment.datapad
			character.personal_equipment.datapad = null
		CharacterTypes.PersonalItem.ItemType.ACCESSORY:
			item = character.personal_equipment.accessory
			character.personal_equipment.accessory = null
	
	emit_signal("character_updated")
	return item

# Calculate effective attributes including equipment bonuses
func get_effective_attributes() -> CharacterTypes.CharacterAttributes:
	if not character:
		return get_base_attributes()
	
	var base = character.attributes
	var bonuses = get_equipment_attribute_bonuses()
	
	var effective = CharacterTypes.CharacterAttributes.new()
	effective.strength = min(100, base.strength + bonuses.get("strength", 0))
	effective.intelligence = min(100, base.intelligence + bonuses.get("intelligence", 0))
	effective.charisma = min(100, base.charisma + bonuses.get("charisma", 0))
	effective.endurance = min(100, base.endurance + bonuses.get("endurance", 0))
	effective.dexterity = min(100, base.dexterity + bonuses.get("dexterity", 0))
	effective.perception = min(100, base.perception + bonuses.get("perception", 0))
	
	return effective

func get_equipment_attribute_bonuses() -> Dictionary:
	if not character:
		return {}
	
	var bonuses = {}
	
	var equipment_items = [
		character.personal_equipment.suit,
		character.personal_equipment.tool,
		character.personal_equipment.datapad,
		character.personal_equipment.accessory
	]
	
	for item in equipment_items:
		if item and item.effects:
			if item.effects.strength_bonus > 0:
				bonuses["strength"] = bonuses.get("strength", 0) + item.effects.strength_bonus
			if item.effects.intelligence_bonus > 0:
				bonuses["intelligence"] = bonuses.get("intelligence", 0) + item.effects.intelligence_bonus
			if item.effects.charisma_bonus > 0:
				bonuses["charisma"] = bonuses.get("charisma", 0) + item.effects.charisma_bonus
			if item.effects.endurance_bonus > 0:
				bonuses["endurance"] = bonuses.get("endurance", 0) + item.effects.endurance_bonus
			if item.effects.dexterity_bonus > 0:
				bonuses["dexterity"] = bonuses.get("dexterity", 0) + item.effects.dexterity_bonus
			if item.effects.perception_bonus > 0:
				bonuses["perception"] = bonuses.get("perception", 0) + item.effects.perception_bonus
	
	return bonuses

# Background Management
func get_available_backgrounds() -> Array[CharacterTypes.CharacterBackground]:
	var backgrounds: Array[CharacterTypes.CharacterBackground] = []
	
	# Merchant background
	var merchant = CharacterTypes.CharacterBackground.new("merchant", "Merchant")
	merchant.description = "Started as a trader, skilled in commerce and negotiation."
	merchant.starting_attribute_bonus = CharacterTypes.CharacterAttributes.new(10, 13, 15, 10, 10, 10)  # +3 intelligence, +5 charisma
	merchant.starting_skill_bonus = CharacterTypes.CharacterSkills.new(15, 10, 8)  # +15 trading, +10 negotiation, +8 economics
	merchant.starting_equipment = ["merchant-datapad"]
	merchant.starting_credits = 2000
	backgrounds.append(merchant)
	
	# Pilot background
	var pilot = CharacterTypes.CharacterBackground.new("pilot", "Pilot")
	pilot.description = "Experienced spaceship pilot with superior flying skills."
	pilot.starting_attribute_bonus = CharacterTypes.CharacterAttributes.new(10, 10, 10, 10, 18, 15)  # +8 dexterity, +5 perception
	pilot.starting_skill_bonus = CharacterTypes.CharacterSkills.new(0, 0, 0, 0, 18, 12, 0, 5)  # +18 piloting, +12 navigation, +5 tactics
	pilot.starting_equipment = ["pilot-suit"]
	pilot.starting_credits = 500
	backgrounds.append(pilot)
	
	# Engineer background
	var engineer = CharacterTypes.CharacterBackground.new("engineer", "Engineer")
	engineer.description = "Technical expert specializing in ship systems and maintenance."
	engineer.starting_attribute_bonus = CharacterTypes.CharacterAttributes.new(12, 18, 10, 10, 10, 10)  # +2 strength, +8 intelligence
	engineer.starting_skill_bonus = CharacterTypes.CharacterSkills.new(0, 0, 0, 20, 0, 0, 0, 0, 8, 0, 5)  # +20 engineering, +8 security, +5 investigation
	engineer.starting_equipment = ["engineering-tool"]
	engineer.starting_credits = 1000
	backgrounds.append(engineer)
	
	# Explorer background
	var explorer = CharacterTypes.CharacterBackground.new("explorer", "Explorer")
	explorer.description = "Adventurous soul with knowledge of distant systems."
	explorer.starting_attribute_bonus = CharacterTypes.CharacterAttributes.new(10, 10, 10, 15, 10, 18)  # +5 endurance, +8 perception
	explorer.starting_skill_bonus = CharacterTypes.CharacterSkills.new(0, 0, 0, 0, 0, 15, 0, 0, 0, 8, 12)  # +15 navigation, +12 investigation, +8 networking
	explorer.starting_equipment = ["explorer-scanner"]
	explorer.starting_credits = 800
	backgrounds.append(explorer)
	
	return backgrounds

func get_background(background_id: String) -> CharacterTypes.CharacterBackground:
	var backgrounds = get_available_backgrounds()
	for bg in backgrounds:
		if bg.id == background_id:
			return bg
	return null

# Default Values
func get_base_attributes() -> CharacterTypes.CharacterAttributes:
	return CharacterTypes.CharacterAttributes.new(10, 10, 10, 10, 10, 10)

func get_base_skills() -> CharacterTypes.CharacterSkills:
	return CharacterTypes.CharacterSkills.new()

func get_empty_personal_equipment() -> CharacterTypes.PersonalEquipment:
	return CharacterTypes.PersonalEquipment.new()

func get_total_allocated_points(allocated_points: Dictionary) -> int:
	var total = 0
	for value in allocated_points.values():
		total += value
	return total

# Experience History
func get_experience_history(limit: int = 50) -> Array[CharacterTypes.ExperienceGain]:
	if experience_history.size() <= limit:
		return experience_history
	else:
		return experience_history.slice(experience_history.size() - limit, experience_history.size())

# Gameplay bonuses calculation
func get_trading_bonus() -> float:
	if not character:
		return 0.0
	
	var effective_attrs = get_effective_attributes()
	var charisma_bonus = (effective_attrs.charisma - 10) * 0.005  # 0.5% per point above 10
	var trading_bonus = character.skills.trading * 0.01          # 1% per trading skill point
	
	return charisma_bonus + trading_bonus

func get_maintenance_cost_reduction() -> float:
	if not character:
		return 0.0
	
	var effective_attrs = get_effective_attributes()
	var intelligence_bonus = (effective_attrs.intelligence - 10) * 0.01  # 1% per point above 10
	var engineering_bonus = character.skills.engineering * 0.01          # 1% per engineering skill point
	
	return min(0.5, intelligence_bonus + engineering_bonus)  # Cap at 50% reduction

# Save/Load support
func to_dict() -> Dictionary:
	var exp_history_data = []
	for exp in experience_history:
		exp_history_data.append(exp.to_dict())
	
	return {
		"character": character.to_dict() if character else null,
		"experience_history": exp_history_data
	}

func from_dict(data: Dictionary):
	if data.has("character") and data["character"]:
		character = CharacterTypes.Character.new()
		character.from_dict(data["character"])
		emit_signal("character_updated")
	else:
		character = null
	
	experience_history.clear()
	if data.has("experience_history"):
		for exp_data in data["experience_history"]:
			var exp = CharacterTypes.ExperienceGain.new()
			exp.from_dict(exp_data)
			experience_history.append(exp)

# Achievement support
func add_achievement(achievement_id: String):
	if not character:
		return
	
	if achievement_id not in character.achievements:
		character.achievements.append(achievement_id)
		print("Achievement unlocked: ", achievement_id)
		emit_signal("character_updated")

func has_achievement(achievement_id: String) -> bool:
	if not character:
		return false
	return achievement_id in character.achievements