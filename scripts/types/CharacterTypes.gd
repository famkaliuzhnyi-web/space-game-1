extends RefCounted

# Character data structures ported from TypeScript
# Based on orig/src/types/character.ts

class_name CharacterTypes

# Character attributes affecting gameplay
class CharacterAttributes extends RefCounted:
	var strength: int = 10        # Affects cargo handling, combat effectiveness  
	var intelligence: int = 10    # Affects hacking, system efficiency, learning speed
	var charisma: int = 10        # Affects trading prices, reputation gains
	var endurance: int = 10       # Affects long-distance travel, stress resistance
	var dexterity: int = 10       # Affects piloting, precision tasks, reaction time
	var perception: int = 10      # Affects scanning, threat detection, navigation
	
	func _init(p_strength: int = 10, p_intelligence: int = 10, p_charisma: int = 10,
			   p_endurance: int = 10, p_dexterity: int = 10, p_perception: int = 10):
		strength = p_strength
		intelligence = p_intelligence
		charisma = p_charisma
		endurance = p_endurance
		dexterity = p_dexterity
		perception = p_perception
	
	func to_dict() -> Dictionary:
		return {
			"strength": strength,
			"intelligence": intelligence, 
			"charisma": charisma,
			"endurance": endurance,
			"dexterity": dexterity,
			"perception": perception
		}
	
	func from_dict(data: Dictionary):
		strength = data.get("strength", 10)
		intelligence = data.get("intelligence", 10)
		charisma = data.get("charisma", 10)
		endurance = data.get("endurance", 10)
		dexterity = data.get("dexterity", 10)
		perception = data.get("perception", 10)

# Character skills that can be improved through gameplay
class CharacterSkills extends RefCounted:
	# Trading skills
	var trading: int = 0          # Better prices, market information
	var negotiation: int = 0      # Contract bonuses, reputation boosts  
	var economics: int = 0        # Market analysis, investment opportunities
	
	# Technical skills
	var engineering: int = 0      # Equipment efficiency, maintenance costs
	var piloting: int = 0         # Ship handling, fuel efficiency
	var navigation: int = 0       # Route optimization, travel time reduction
	
	# Combat/Security skills
	var combat: int = 0           # Weapon effectiveness, damage reduction
	var tactics: int = 0          # Combat strategy, threat assessment
	var security: int = 0         # Hacking defense, cargo protection
	
	# Social/Information skills
	var networking: int = 0       # Contact benefits, information access
	var investigation: int = 0    # Data gathering, market intelligence
	var leadership: int = 0       # Crew efficiency, reputation effects
	
	func _init(p_trading: int = 0, p_negotiation: int = 0, p_economics: int = 0,
			   p_engineering: int = 0, p_piloting: int = 0, p_navigation: int = 0,
			   p_combat: int = 0, p_tactics: int = 0, p_security: int = 0,
			   p_networking: int = 0, p_investigation: int = 0, p_leadership: int = 0):
		trading = p_trading
		negotiation = p_negotiation
		economics = p_economics
		engineering = p_engineering
		piloting = p_piloting
		navigation = p_navigation
		combat = p_combat
		tactics = p_tactics
		security = p_security
		networking = p_networking
		investigation = p_investigation
		leadership = p_leadership
	
	func to_dict() -> Dictionary:
		return {
			"trading": trading,
			"negotiation": negotiation,
			"economics": economics,
			"engineering": engineering,
			"piloting": piloting,
			"navigation": navigation,
			"combat": combat,
			"tactics": tactics,
			"security": security,
			"networking": networking,
			"investigation": investigation,
			"leadership": leadership
		}
	
	func from_dict(data: Dictionary):
		trading = data.get("trading", 0)
		negotiation = data.get("negotiation", 0)
		economics = data.get("economics", 0)
		engineering = data.get("engineering", 0)
		piloting = data.get("piloting", 0)
		navigation = data.get("navigation", 0)
		combat = data.get("combat", 0)
		tactics = data.get("tactics", 0)
		security = data.get("security", 0)
		networking = data.get("networking", 0)
		investigation = data.get("investigation", 0)
		leadership = data.get("leadership", 0)

# Experience and progression tracking
class CharacterProgression extends RefCounted:
	var level: int = 1                          # Overall character level
	var experience: int = 0                     # Total experience points
	var experience_to_next: int = 150           # XP needed for next level
	var skill_points: int = 0                   # Unallocated skill points
	var attribute_points: int = 0               # Unallocated attribute points
	var total_attribute_points_spent: int = 0  # Track total spent for validation
	var total_skill_points_spent: int = 0      # Track total spent for validation
	
	func _init():
		pass
	
	func to_dict() -> Dictionary:
		return {
			"level": level,
			"experience": experience,
			"experience_to_next": experience_to_next,
			"skill_points": skill_points,
			"attribute_points": attribute_points,
			"total_attribute_points_spent": total_attribute_points_spent,
			"total_skill_points_spent": total_skill_points_spent
		}
	
	func from_dict(data: Dictionary):
		level = data.get("level", 1)
		experience = data.get("experience", 0)
		experience_to_next = data.get("experience_to_next", 150)
		skill_points = data.get("skill_points", 0)
		attribute_points = data.get("attribute_points", 0)
		total_attribute_points_spent = data.get("total_attribute_points_spent", 0)
		total_skill_points_spent = data.get("total_skill_points_spent", 0)

# Personal equipment item effects
class PersonalItemEffects extends RefCounted:
	# Attribute bonuses
	var strength_bonus: int = 0
	var intelligence_bonus: int = 0
	var charisma_bonus: int = 0
	var endurance_bonus: int = 0
	var dexterity_bonus: int = 0
	var perception_bonus: int = 0
	
	# Skill bonuses
	var trading_bonus: int = 0
	var engineering_bonus: int = 0
	var piloting_bonus: int = 0
	var combat_bonus: int = 0
	var hacking_bonus: int = 0
	
	# Special effects
	var oxygen_efficiency: float = 0.0        # Reduces life support costs
	var radiation_resistance: float = 0.0     # Reduces radiation damage
	var repair_efficiency: float = 0.0        # Faster/cheaper repairs
	var scanner_range: float = 0.0            # Extended scanner range
	var information_access: float = 0.0       # Better market/faction data
	
	func _init():
		pass
	
	func to_dict() -> Dictionary:
		return {
			"strength_bonus": strength_bonus,
			"intelligence_bonus": intelligence_bonus,
			"charisma_bonus": charisma_bonus,
			"endurance_bonus": endurance_bonus,
			"dexterity_bonus": dexterity_bonus,
			"perception_bonus": perception_bonus,
			"trading_bonus": trading_bonus,
			"engineering_bonus": engineering_bonus,
			"piloting_bonus": piloting_bonus,
			"combat_bonus": combat_bonus,
			"hacking_bonus": hacking_bonus,
			"oxygen_efficiency": oxygen_efficiency,
			"radiation_resistance": radiation_resistance,
			"repair_efficiency": repair_efficiency,
			"scanner_range": scanner_range,
			"information_access": information_access
		}
	
	func from_dict(data: Dictionary):
		strength_bonus = data.get("strength_bonus", 0)
		intelligence_bonus = data.get("intelligence_bonus", 0)
		charisma_bonus = data.get("charisma_bonus", 0)
		endurance_bonus = data.get("endurance_bonus", 0)
		dexterity_bonus = data.get("dexterity_bonus", 0)
		perception_bonus = data.get("perception_bonus", 0)
		trading_bonus = data.get("trading_bonus", 0)
		engineering_bonus = data.get("engineering_bonus", 0)
		piloting_bonus = data.get("piloting_bonus", 0)
		combat_bonus = data.get("combat_bonus", 0)
		hacking_bonus = data.get("hacking_bonus", 0)
		oxygen_efficiency = data.get("oxygen_efficiency", 0.0)
		radiation_resistance = data.get("radiation_resistance", 0.0)
		repair_efficiency = data.get("repair_efficiency", 0.0)
		scanner_range = data.get("scanner_range", 0.0)
		information_access = data.get("information_access", 0.0)

# Personal equipment items
class PersonalItem extends RefCounted:
	enum ItemType { SUIT, TOOL, DATAPAD, ACCESSORY }
	enum Rarity { COMMON, UNCOMMON, RARE, LEGENDARY }
	
	var id: String
	var name: String
	var type: ItemType
	var description: String
	var rarity: Rarity
	var effects: PersonalItemEffects
	var cost: int
	var durability: float = 1.0            # 0-1, affects effectiveness
	var max_durability: float = 1.0        # Maximum durability when new
	
	func _init(p_id: String = "", p_name: String = "", p_type: ItemType = ItemType.SUIT, p_cost: int = 0):
		id = p_id
		name = p_name
		type = p_type
		cost = p_cost
		rarity = Rarity.COMMON
		effects = PersonalItemEffects.new()
		description = ""
	
	func to_dict() -> Dictionary:
		return {
			"id": id,
			"name": name,
			"type": type,
			"description": description,
			"rarity": rarity,
			"effects": effects.to_dict(),
			"cost": cost,
			"durability": durability,
			"max_durability": max_durability
		}
	
	func from_dict(data: Dictionary):
		id = data.get("id", "")
		name = data.get("name", "")
		type = data.get("type", ItemType.SUIT)
		description = data.get("description", "")
		rarity = data.get("rarity", Rarity.COMMON)
		cost = data.get("cost", 0)
		durability = data.get("durability", 1.0)
		max_durability = data.get("max_durability", 1.0)
		effects = PersonalItemEffects.new()
		if data.has("effects"):
			effects.from_dict(data["effects"])

# Personal equipment separate from ship equipment
class PersonalEquipment extends RefCounted:
	var suit: PersonalItem = null      # Space suit, affects survival, protection
	var tool: PersonalItem = null      # Multi-tool, affects repair/hacking efficiency
	var datapad: PersonalItem = null   # Information device, affects analysis
	var accessory: PersonalItem = null # Personal accessory, various effects
	
	func _init():
		pass
	
	func to_dict() -> Dictionary:
		return {
			"suit": suit.to_dict() if suit else null,
			"tool": tool.to_dict() if tool else null,
			"datapad": datapad.to_dict() if datapad else null,
			"accessory": accessory.to_dict() if accessory else null
		}
	
	func from_dict(data: Dictionary):
		if data.has("suit") and data["suit"]:
			suit = PersonalItem.new()
			suit.from_dict(data["suit"])
		else:
			suit = null
		
		if data.has("tool") and data["tool"]:
			tool = PersonalItem.new()
			tool.from_dict(data["tool"])
		else:
			tool = null
		
		if data.has("datapad") and data["datapad"]:
			datapad = PersonalItem.new()
			datapad.from_dict(data["datapad"])
		else:
			datapad = null
		
		if data.has("accessory") and data["accessory"]:
			accessory = PersonalItem.new()
			accessory.from_dict(data["accessory"])
		else:
			accessory = null

# Character visual customization
class CharacterAppearance extends RefCounted:
	enum Gender { MALE, FEMALE, OTHER }
	
	var gender: Gender
	var skin_tone: String
	var hair_color: String
	var eye_color: String
	var age: int
	var portrait: String              # Asset ID for character portrait
	
	func _init(p_gender: Gender = Gender.MALE, p_age: int = 30):
		gender = p_gender
		age = p_age
		skin_tone = "medium"
		hair_color = "brown"
		eye_color = "brown"
		portrait = "default"
	
	func to_dict() -> Dictionary:
		return {
			"gender": gender,
			"skin_tone": skin_tone,
			"hair_color": hair_color,
			"eye_color": eye_color,
			"age": age,
			"portrait": portrait
		}
	
	func from_dict(data: Dictionary):
		gender = data.get("gender", Gender.MALE)
		skin_tone = data.get("skin_tone", "medium")
		hair_color = data.get("hair_color", "brown")
		eye_color = data.get("eye_color", "brown")
		age = data.get("age", 30)
		portrait = data.get("portrait", "default")

# Character background affecting starting skills/attributes
class CharacterBackground extends RefCounted:
	var id: String
	var name: String
	var description: String
	var starting_attribute_bonus: CharacterAttributes
	var starting_skill_bonus: CharacterSkills
	var starting_equipment: Array[String] = []      # IDs of starting personal equipment
	var starting_credits: int                       # Bonus/penalty to starting credits
	
	func _init(p_id: String = "", p_name: String = ""):
		id = p_id
		name = p_name
		description = ""
		starting_attribute_bonus = CharacterAttributes.new()
		starting_skill_bonus = CharacterSkills.new()
		starting_credits = 1000
	
	func to_dict() -> Dictionary:
		return {
			"id": id,
			"name": name,
			"description": description,
			"starting_attribute_bonus": starting_attribute_bonus.to_dict(),
			"starting_skill_bonus": starting_skill_bonus.to_dict(),
			"starting_equipment": starting_equipment,
			"starting_credits": starting_credits
		}
	
	func from_dict(data: Dictionary):
		id = data.get("id", "")
		name = data.get("name", "")
		description = data.get("description", "")
		starting_credits = data.get("starting_credits", 1000)
		starting_equipment = data.get("starting_equipment", [])
		
		starting_attribute_bonus = CharacterAttributes.new()
		if data.has("starting_attribute_bonus"):
			starting_attribute_bonus.from_dict(data["starting_attribute_bonus"])
		
		starting_skill_bonus = CharacterSkills.new()
		if data.has("starting_skill_bonus"):
			starting_skill_bonus.from_dict(data["starting_skill_bonus"])

# Skill progression tracking
class SkillChangeRecord extends RefCounted:
	var skill_name: String
	var old_value: int
	var new_value: int
	var source: String                   # What caused the skill increase
	var timestamp: int
	
	func _init(p_skill_name: String = "", p_old_value: int = 0, p_new_value: int = 0, p_source: String = ""):
		skill_name = p_skill_name
		old_value = p_old_value
		new_value = p_new_value
		source = p_source
		timestamp = Time.get_ticks_msec()
	
	func to_dict() -> Dictionary:
		return {
			"skill_name": skill_name,
			"old_value": old_value,
			"new_value": new_value,
			"source": source,
			"timestamp": timestamp
		}
	
	func from_dict(data: Dictionary):
		skill_name = data.get("skill_name", "")
		old_value = data.get("old_value", 0)
		new_value = data.get("new_value", 0)
		source = data.get("source", "")
		timestamp = data.get("timestamp", 0)

# Experience sources for character progression
class ExperienceGain extends RefCounted:
	enum Category { TRADING, COMBAT, EXPLORATION, SOCIAL, TECHNICAL }
	
	var source: String                   # What activity granted XP
	var amount: int
	var category: Category
	var timestamp: int
	
	func _init(p_source: String = "", p_amount: int = 0, p_category: Category = Category.TRADING):
		source = p_source
		amount = p_amount
		category = p_category
		timestamp = Time.get_ticks_msec()
	
	func to_dict() -> Dictionary:
		return {
			"source": source,
			"amount": amount,
			"category": category,
			"timestamp": timestamp
		}
	
	func from_dict(data: Dictionary):
		source = data.get("source", "")
		amount = data.get("amount", 0)
		category = data.get("category", Category.TRADING)
		timestamp = data.get("timestamp", 0)

# Complete character data structure
class Character extends RefCounted:
	var id: String
	var name: String
	var appearance: CharacterAppearance
	var background: CharacterBackground
	var attributes: CharacterAttributes
	var skills: CharacterSkills
	var progression: CharacterProgression
	var personal_equipment: PersonalEquipment
	var achievements: Array[String] = []           # Achievement IDs earned
	var skill_history: Array[SkillChangeRecord] = [] # Track skill improvements
	
	func _init(p_id: String = "", p_name: String = ""):
		id = p_id
		name = p_name
		appearance = CharacterAppearance.new()
		background = CharacterBackground.new()
		attributes = CharacterAttributes.new()
		skills = CharacterSkills.new()
		progression = CharacterProgression.new()
		personal_equipment = PersonalEquipment.new()
	
	func to_dict() -> Dictionary:
		var skill_history_data = []
		for record in skill_history:
			skill_history_data.append(record.to_dict())
		
		return {
			"id": id,
			"name": name,
			"appearance": appearance.to_dict(),
			"background": background.to_dict(),
			"attributes": attributes.to_dict(),
			"skills": skills.to_dict(),
			"progression": progression.to_dict(),
			"personal_equipment": personal_equipment.to_dict(),
			"achievements": achievements,
			"skill_history": skill_history_data
		}
	
	func from_dict(data: Dictionary):
		id = data.get("id", "")
		name = data.get("name", "")
		
		appearance = CharacterAppearance.new()
		if data.has("appearance"):
			appearance.from_dict(data["appearance"])
		
		background = CharacterBackground.new()
		if data.has("background"):
			background.from_dict(data["background"])
		
		attributes = CharacterAttributes.new()
		if data.has("attributes"):
			attributes.from_dict(data["attributes"])
		
		skills = CharacterSkills.new()
		if data.has("skills"):
			skills.from_dict(data["skills"])
		
		progression = CharacterProgression.new()
		if data.has("progression"):
			progression.from_dict(data["progression"])
		
		personal_equipment = PersonalEquipment.new()
		if data.has("personal_equipment"):
			personal_equipment.from_dict(data["personal_equipment"])
		
		achievements = data.get("achievements", [])
		
		skill_history.clear()
		if data.has("skill_history"):
			for record_data in data["skill_history"]:
				var record = SkillChangeRecord.new()
				record.from_dict(record_data)
				skill_history.append(record)