# Ship Building System

## Overview

Ships are constructed using a modular "hub-based" system where each hub serves as a building block with specific functions and equipment slots. Players can design custom ships or modify existing designs by connecting these hubs within structural and size constraints. Each hub can have slots for equipment like weapons, engines, or storage, and some hubs provide interior spaces that players can walk through.

## Hub Categories

### Core Hubs (Required)

#### Command Hubs
**Function:** Ship control and navigation  
**Requirements:** Every ship must have exactly one command hub

**Cockpit Hub**
- **Size:** 1x1x1
- **Mass:** 2 units
- **Power:** -5 units
- **Equipment Slots:** 2 (navigation equipment)
- **Interior:** Pilot station accessible for repairs
- **Features:** Basic navigation, communication, life support for 1 person
- **Cost:** 5,000 credits

**Bridge Block**
- **Size:** 2x2x1
- **Mass:** 6 units
- **Power:** -10 units
- **Features:** Advanced navigation, tactical systems, life support for 3 people
- **Cost:** 15,000 credits

**Command Center**
- **Size:** 3x3x2
- **Mass:** 15 units
- **Power:** -25 units
- **Features:** Fleet coordination, advanced AI, life support for 10 people
- **Cost:** 50,000 credits

#### Power Blocks
**Function:** Energy generation and storage  
**Requirements:** Power generation must meet or exceed power consumption

**Fusion Reactor (Small)**
- **Size:** 2x2x2
- **Mass:** 10 units
- **Power:** +50 units
- **Fuel:** 1 unit/hour hydrogen
- **Cost:** 25,000 credits

**Fusion Reactor (Large)**
- **Size:** 3x3x3
- **Mass:** 30 units
- **Power:** +150 units
- **Fuel:** 2 units/hour hydrogen
- **Cost:** 75,000 credits

**Solar Array**
- **Size:** 1x3x1 (must be surface-mounted)
- **Mass:** 1 unit
- **Power:** +10 units (variable by proximity to star)
- **Cost:** 8,000 credits

**Battery Pack**
- **Size:** 1x1x1
- **Mass:** 3 units
- **Power Storage:** 25 units
- **Efficiency:** 95% charge/discharge
- **Cost:** 3,000 credits

### Propulsion Blocks

#### Engine Systems
**Function:** Movement and maneuvering

**Ion Drive**
- **Size:** 1x1x2
- **Mass:** 4 units
- **Power:** -15 units
- **Thrust:** 20 units
- **Efficiency:** Very High
- **Fuel:** 0.5 units/hour hydrogen
- **Cost:** 12,000 credits

**Chemical Thruster**
- **Size:** 1x1x1
- **Mass:** 2 units
- **Power:** -5 units
- **Thrust:** 15 units
- **Efficiency:** Medium
- **Fuel:** 2 units/hour chemical fuel
- **Cost:** 6,000 credits

**Fusion Drive**
- **Size:** 2x2x3
- **Mass:** 20 units
- **Power:** -40 units
- **Thrust:** 100 units
- **Efficiency:** High
- **Fuel:** 3 units/hour hydrogen
- **Cost:** 45,000 credits

#### Maneuvering Systems
**Function:** Rotation and fine positioning

**RCS Thrusters**
- **Size:** 1x1x1
- **Mass:** 1 unit
- **Power:** -2 units
- **Maneuverability:** +10 units
- **Fuel:** 0.1 units/hour chemical fuel
- **Cost:** 2,000 credits

**Gyroscope**
- **Size:** 1x1x1
- **Mass:** 3 units
- **Power:** -8 units
- **Maneuverability:** +15 units
- **Cost:** 5,000 credits

### Cargo and Storage Blocks

#### Cargo Systems
**Function:** Storing and transporting goods

**Cargo Hold (Standard)**
- **Size:** 2x2x2
- **Mass:** 5 units
- **Cargo Capacity:** 10 units
- **Access:** Manual loading/unloading
- **Cost:** 4,000 credits

**Cargo Hold (Automated)**
- **Size:** 2x2x2
- **Mass:** 8 units
- **Power:** -3 units
- **Cargo Capacity:** 10 units
- **Access:** Automated loading/unloading systems
- **Cost:** 8,000 credits

**Specialized Container**
- **Size:** 2x2x2
- **Mass:** 6 units
- **Power:** -5 units
- **Cargo Capacity:** 8 units (specific cargo type only)
- **Features:** Temperature control, containment, security
- **Cost:** 12,000 credits

**Bulk Storage**
- **Size:** 3x3x3
- **Mass:** 15 units
- **Cargo Capacity:** 40 units
- **Access:** Slow loading/unloading
- **Restrictions:** Liquids and granular materials only
- **Cost:** 18,000 credits

#### Storage Accessories
**Function:** Supporting cargo operations

**Loading Arm**
- **Size:** 1x1x3 (extends externally)
- **Mass:** 4 units
- **Power:** -8 units
- **Function:** Automated external cargo transfer
- **Cost:** 15,000 credits

**Cargo Scanner**
- **Size:** 1x1x1
- **Mass:** 2 units
- **Power:** -4 units
- **Function:** Automatic cargo identification and manifests
- **Cost:** 6,000 credits

### Defense Blocks

#### Defensive Systems
**Function:** Protection from damage

**Shield Generator (Light)**
- **Size:** 1x1x1
- **Mass:** 3 units
- **Power:** -20 units
- **Shield Strength:** 100 units
- **Recharge Rate:** 5 units/second
- **Cost:** 18,000 credits

**Shield Generator (Heavy)**
- **Size:** 2x2x2
- **Mass:** 12 units
- **Power:** -60 units
- **Shield Strength:** 400 units
- **Recharge Rate:** 15 units/second
- **Cost:** 65,000 credits

**Armor Plating (Light)**
- **Size:** 1x1x1
- **Mass:** 4 units
- **Armor Value:** 50 units
- **Damage Reduction:** 25%
- **Cost:** 3,000 credits

**Armor Plating (Heavy)**
- **Size:** 1x1x1
- **Mass:** 8 units
- **Armor Value:** 120 units
- **Damage Reduction:** 40%
- **Cost:** 8,000 credits

#### Countermeasures
**Function:** Active defense systems

**Point Defense Turret**
- **Size:** 1x1x1
- **Mass:** 3 units
- **Power:** -10 units
- **Function:** Automatically destroys incoming missiles
- **Range:** Short
- **Cost:** 25,000 credits

**ECM Suite**
- **Size:** 1x1x1
- **Mass:** 2 units
- **Power:** -15 units
- **Function:** Reduces enemy targeting accuracy
- **Effect:** -30% hit chance for attackers
- **Cost:** 20,000 credits

### Utility Blocks

#### Life Support Systems
**Function:** Crew survival and comfort

**Life Support (Basic)**
- **Size:** 1x1x1
- **Mass:** 2 units
- **Power:** -8 units
- **Capacity:** 5 crew members
- **Features:** Air recycling, temperature control
- **Cost:** 6,000 credits

**Life Support (Advanced)**
- **Size:** 2x2x1
- **Mass:** 6 units
- **Power:** -15 units
- **Capacity:** 15 crew members
- **Features:** Full environmental control, waste recycling
- **Cost:** 18,000 credits

**Crew Quarters**
- **Size:** 2x2x1
- **Mass:** 4 units
- **Power:** -3 units
- **Capacity:** 4 crew members (sleeping)
- **Features:** Bunks, personal storage, entertainment
- **Cost:** 8,000 credits

#### Sensor and Communication Systems
**Function:** Detection, navigation, and communication

**Sensor Array (Basic)**
- **Size:** 1x1x1
- **Mass:** 1 unit
- **Power:** -5 units
- **Range:** Short (local system)
- **Resolution:** Basic ship and station detection
- **Cost:** 4,000 credits

**Sensor Array (Advanced)**
- **Size:** 1x1x2
- **Mass:** 3 units
- **Power:** -12 units
- **Range:** Medium (adjacent systems)
- **Resolution:** Detailed analysis and composition scanning
- **Cost:** 15,000 credits

**Communication Array**
- **Size:** 1x1x1
- **Mass:** 1 unit
- **Power:** -3 units
- **Range:** System-wide communication
- **Features:** Encrypted channels, emergency beacons
- **Cost:** 3,000 credits

**Long-Range Transmitter**
- **Size:** 1x1x3
- **Mass:** 4 units
- **Power:** -10 units
- **Range:** Inter-system communication
- **Features:** Quantum entanglement communication
- **Cost:** 25,000 credits

## Construction Mechanics

### Design Phase
**Tools:** Shipyard design interface or portable design software

#### Design Constraints
- **Size Limits:** Maximum dimensions based on construction facility
- **Mass Limits:** Structural integrity requires adequate support
- **Power Balance:** Power generation must exceed consumption
- **Required Systems:** Minimum life support, navigation, and propulsion

#### Design Validation
- **Structural Analysis:** Ensuring the ship won't fall apart
- **Performance Simulation:** Predicting speed, range, and capabilities
- **Cost Estimation:** Total material and construction costs
- **Certification:** Meeting safety and legal requirements

### Construction Phase
**Location:** Shipyards or construction platforms

#### Resource Requirements
- **Raw Materials:** Metals, composites, and electronic components
- **Specialized Components:** Engines, reactors, and advanced systems
- **Construction Time:** Based on ship size and complexity
- **Labor Costs:** Skilled technicians and engineers

#### Construction Process
1. **Foundation:** Core structural elements and command systems
2. **Primary Systems:** Power, propulsion, and life support
3. **Secondary Systems:** Cargo, defense, and utility blocks
4. **Integration:** System connections and software configuration
5. **Testing:** Performance validation and safety certification

### Modification and Upgrades

#### Modification Types
- **Block Replacement:** Swapping existing blocks for improved versions
- **Layout Changes:** Restructuring ship configuration
- **System Addition:** Adding new capabilities within size limits
- **Performance Tuning:** Optimizing existing systems

#### Modification Constraints
- **Structural Limits:** Cannot exceed original ship class limits
- **Integration Complexity:** Some changes require extensive rework
- **Cost Factors:** Modifications can be expensive relative to new construction
- **Time Requirements:** Complex changes take time in shipyard

## Advanced Construction

### Custom Block Development
**Availability:** Late-game content for advanced players

#### Research and Development
- **Technology Requirements:** Advanced materials and engineering knowledge
- **Design Process:** Creating specifications for new block types
- **Prototyping:** Testing and refining custom designs
- **Production:** Manufacturing custom blocks

#### Block Customization Options
- **Performance Tuning:** Optimizing blocks for specific applications
- **Size Variants:** Creating blocks in different dimensions
- **Integration Features:** Blocks designed to work together efficiently
- **Aesthetic Options:** Visual customization and faction-specific designs

### Automated Construction
**Availability:** Industrial-scale operations

#### Construction Platforms
- **Mobile Shipyards:** Ships capable of building other ships
- **Automated Factories:** Robotic construction systems
- **Resource Integration:** Direct connection to mining and refining operations
- **Quality Control:** Automated testing and certification

#### Mass Production
- **Standardized Designs:** Efficient production of common ship types
- **Component Standardization:** Interchangeable parts across ship designs
- **Supply Chain Integration:** Coordinated production with material suppliers
- **Economic Advantages:** Lower costs through scale and automation

## Design Philosophy

### Functional Design
Every block serves a specific purpose, and ship performance is determined by the combination and arrangement of blocks rather than arbitrary statistics.

### Trade-off Decisions
Players must make meaningful choices between competing priorities like cargo capacity vs. speed, defense vs. efficiency, and cost vs. performance.

### Creative Freedom
Within functional constraints, players have significant freedom to create unique ship designs that reflect their gameplay style and aesthetic preferences.

### Economic Integration
Ship construction is integrated with the game's economy, creating demand for materials and components while providing progression goals.

---

*This ship building system provides deep customization while maintaining clear functional relationships between design choices and performance outcomes.*