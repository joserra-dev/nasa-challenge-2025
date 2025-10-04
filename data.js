// data.js - Game Configuration and Data

// Initial game configuration
const gameConfig = {
    initialYear: 2025,
    yearsPerTurn: 5,
    initialMoney: 100,
    initialWellbeing: 50,
    initialEnvironment: 50,
    initialResilience: 20,
    seaLevelRisePerTurn: 0.05, // in meters (based on real NASA data)
    floodRiskBase: 0.1,
    maxTurns: 100 // Turn limit to prevent infinite loops
};

// Add to gameConfig (CORRECTED - without reference to gameState)
const difficultySettings = {
    easy: {
        initialMoney: 150,
        seaLevelRisePerTurn: 0.03,
        floodRiskBase: 0.05
    },
    normal: {
        initialMoney: 100,
        seaLevelRisePerTurn: 0.05,
        floodRiskBase: 0.1
    },
    hard: {
        initialMoney: 70,
        seaLevelRisePerTurn: 0.08,
        floodRiskBase: 0.15
    },
    realistic: {
        initialMoney: 50,
        seaLevelRisePerTurn: 0.05, // Valor por defecto, se actualizará después
        floodRiskBase: 0.2
    }
};

// Function to update realistic difficulty with NASA data
function updateRealisticDifficulty(nasaData) {
    if (nasaData && nasaData.seaLevel) {
        difficultySettings.realistic.seaLevelRisePerTurn = nasaData.seaLevel.trend / 1000;
    }
}

// Structure costs and effects
const structures = {
    residential: {
        name: "Residential Zone",
        cost: 20,
        effects: { wellbeing: +10, environment: -5 },
        icon: "🏠",
        canBuild: (cell) => cell.type === 'land' || cell.type === 'coast'
    },
    industrial: {
        name: "Industrial Zone", 
        cost: 30,
        effects: { money: +15, environment: -10 },
        icon: "🏭",
        canBuild: (cell) => cell.type === 'land' || cell.type === 'coast'
    },
    mangrove: {
        name: "Restored Mangrove",
        cost: 15,
        effects: { environment: +15, resilience: +5 },
        icon: "🟢",
        canBuild: (cell) => cell.type === 'coast' && !cell.flooded
    },
    seawall: {
        name: "Protection Seawall",
        cost: 25,
        effects: { resilience: +10 },
        icon: "🛡️",
        canBuild: (cell) => cell.type === 'coast' && !cell.flooded
    }
};

// Achievement and goal system (CORRECTED - functions that receive gameState as parameter)
const achievements = {
    earlyPlanner: {
        name: "Early Planner",
        description: "Reach 50 resilience before year 2050",
        check: (gameState) => gameState.currentYear < 2050 && gameState.resilience >= 50,
        reward: { money: 50, wellbeing: 10 }
    },
    ecoWarrior: {
        name: "Eco Warrior",
        description: "Keep environment above 80 for 10 consecutive turns",
        check: (gameState) => gameState.environment >= 80,
        reward: { environment: 15, resilience: 10 }
    },
    coastalGuardian: {
        name: "Coastal Guardian",
        description: "Protect all coastal cells with mangroves or seawalls",
        check: (gameState) => {
            const coastalCells = gameState.board.flat().filter(cell => cell.type === 'coast');
            return coastalCells.every(cell => cell.structure === 'mangrove' || cell.structure === 'seawall');
        },
        reward: { money: 100, resilience: 20 }
    }
};

// Board cell types
const cellTypes = {
    land: {
        name: "Land",
        color: "#27ae60",
        buildable: true
    },
    coast: {
        name: "Coast", 
        color: "#3498db",
        buildable: true
    },
    flooded: {
        name: "Flooded",
        color: "#8e44ad",
        buildable: false
    }
};

// Climate events based on NASA data (CORRECTED - without direct reference to gameState)
const climateEvents = [
    {
        id: "sea_level_rise",
        name: "Sea Level Rise",
        description: "Sea level has risen significantly. Unprotected coastal areas are at risk.",
        condition: (year, resilience, turn) => year >= 2030 && turn % 3 === 0,
        effect: (gameState) => {
            const floodChance = gameConfig.floodRiskBase - (gameState.resilience * 0.01);
            if (Math.random() < floodChance) {
                return "FLOOD";
            }
            return null;
        },
        severity: "high"
    },
    {
        id: "intense_storm", 
        name: "Intense Storm",
        description: "A powerful storm hits the coast. The city's resilience is put to the test.",
        condition: (year, resilience, turn) => Math.random() < 0.3 && turn > 2,
        effect: (gameState) => {
            if (gameState.resilience < 30) {
                gameState.wellbeing -= 10;
                gameState.money -= 5;
                return "STORM_DAMAGE";
            }
            return null;
        },
        severity: "medium"
    },
    {
        id: "heat_wave",
        name: "Heat Wave",
        description: "A prolonged heat wave affects the city, increasing energy consumption.",
        condition: (year, resilience, turn) => Math.random() < 0.2 && year >= 2040,
        effect: (gameState) => {
            gameState.money -= 8;
            gameState.wellbeing -= 5;
            return "HEAT_WAVE";
        },
        severity: "low"
    },
    {
        id: "environmental_awareness",
        name: "Environmental Awareness",
        description: "The population becomes more environmentally conscious, supporting green initiatives.",
        condition: (year, resilience, turn) => Math.random() < 0.15 && gameState.environment > 60,
        effect: (gameState) => {
            gameState.wellbeing += 10;
            gameState.money += 5;
            return "POSITIVE_EVENT";
        },
        severity: "positive"
    }
];

// NASA Events (will be added dynamically later)
let nasaClimateEvents = [];

// Function to add NASA events dynamically
function addNasaClimateEvents(nasaData) {
    nasaClimateEvents = [
        {
            name: "NASA Extreme Heat Event",
            description: "Based on real NASA global temperature data. Heat waves are more frequent and intense.",
            condition: (year, resilience, turn) => {
                return nasaData?.temperature?.anomaly > 1.2 && Math.random() < 0.4;
            },
            effect: (gameState) => {
                gameState.wellbeing -= 15;
                gameState.money -= 10;
                return "NASA_HEATWAVE";
            }
        },
        {
            name: "Sea Level Acceleration",
            description: `Jason-3 satellite data shows acceleration in sea level rise`,
            condition: (year, resilience, turn) => year >= 2040 && turn % 5 === 0,
            effect: (gameState) => {
                // Temporarily increase flood rate
                const originalRisk = gameConfig.floodRiskBase;
                gameConfig.floodRiskBase += 0.1;
                setTimeout(() => {
                    gameConfig.floodRiskBase = originalRisk;
                }, 3000);
                return "SEA_LEVEL_SPIKE";
            }
        }
    ];
}

// Function to get all climate events (base + NASA)
function getAllClimateEvents() {
    return [...climateEvents, ...nasaClimateEvents];
}

// Technologies (CORRECTED - functions that receive gameState as parameter)
const technologies = {
    earlyWarning: {
        name: "Early Warning System",
        cost: 80,
        description: "Reduces climate event damage by 30%",
        effect: (gameState) => {
            gameState.resilience += 15;
            // Implement damage reduction logic
        },
        requirements: { turn: 5, money: 100 }
    },
    greenEnergy: {
        name: "Green Energy Transition",
        cost: 120,
        description: "Industries pollute less and generate more money",
        effect: (gameState) => {
            // Modify effects of existing structures
        },
        requirements: { environment: 60, turn: 10 }
    },
    coastalEngineering: {
        name: "Advanced Coastal Engineering",
        cost: 150,
        description: "Seawalls are more effective and cheaper",
        effect: (gameState) => {
            // These modifications would be temporary for this game
            console.log("Ingeniería costera aplicada");
        },
        requirements: { resilience: 40, money: 200 }
    }
};

// Sea level elevation data (simulated based on NASA projections)
const seaLevelData = [
    { year: 2020, rise: 0.00, source: "NASA Satellite Data" },
    { year: 2025, rise: 0.02, source: "NASA Projection" },
    { year: 2030, rise: 0.05, source: "NASA Projection" },
    { year: 2035, rise: 0.08, source: "NASA Projection" },
    { year: 2040, rise: 0.12, source: "NASA Projection" },
    { year: 2045, rise: 0.16, source: "NASA Projection" },
    { year: 2050, rise: 0.20, source: "NASA Projection" },
    { year: 2055, rise: 0.25, source: "NASA Projection" },
    { year: 2060, rise: 0.30, source: "NASA Projection" },
    { year: 2070, rise: 0.40, source: "NASA Long-term Projection" },
    { year: 2080, rise: 0.55, source: "NASA Long-term Projection" },
    { year: 2090, rise: 0.70, source: "NASA Long-term Projection" },
    { year: 2100, rise: 0.85, source: "NASA Long-term Projection" }
];

// NASA API configuration
const nasaAPIs = {
    // Climate Events API (EONET)
    eonet: {
        url: 'https://eonet.gsfc.nasa.gov/api/v3/events',
        cache: null,
        lastFetch: null,
        cacheDuration: 1000 * 60 * 30 // 30 minutos
    },
    
    // Satellite Images API (GIBS)
    gibs: {
        baseUrl: 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi',
        layers: {
            seaLevel: 'GHRSST_L4_MUR_Sea_Surface_Temperature',
            vegetation: 'MODIS_Terra_NDVI',
            temperature: 'AIRS_Surface_Skin_Temperature_Day',
            precipitation: 'GPCP_1DD'
        }
    }
};

// NASA API Key
const NASA_API_KEY = 'Lgq2xsi7Rn1HgRPyyX1AvbgNivaFSdflQQKqQdeo';

// Save system configuration
const saveConfig = {
    version: '1.0.0',
    autoSaveInterval: 120000, // 2 minutes in milliseconds
    maxSaveSlots: 5,
    backupEnabled: true
};

// Game states for the save system
const gameStates = {
    PLAYING: 'playing',
    VICTORY: 'victory',
    DEFEAT: 'defeat',
    PAUSED: 'paused'
};

// Thresholds for victory/defeat conditions
const victoryConditions = {
    minYear: 2060,
    minWellbeing: 60,
    minResilience: 50,
    minEnvironment: 40
};

const defeatConditions = {
    minWellbeing: 0,
    minMoney: 0, 
    minEnvironment: 0
};

// Texts for events and messages
const gameTexts = {
    victory: [
        "Congratulations! You have guided the city towards a resilient and sustainable future.",
        "The city is prepared for the climate challenges of the 21st century.",
        "Your balanced management has secured a prosperous future for future generations."
    ],
    defeat: [
        "The city has not been able to adapt to climate change.",
        "Resources have been exhausted and the population has suffered the consequences.",
        "Lack of long-term planning has led to the city's collapse."
    ],
    floodWarning: "Unprotected coastal areas are at risk of flooding.",
    resilienceTip: "Investing in mangroves and seawalls increases coastal resilience."
};