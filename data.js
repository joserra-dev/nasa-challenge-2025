// data.js - Configuración y Datos del Juego

// Configuración inicial del juego
const gameConfig = {
    initialYear: 2025,
    yearsPerTurn: 5,
    initialMoney: 100,
    initialWellbeing: 50,
    initialEnvironment: 50,
    initialResilience: 20,
    seaLevelRisePerTurn: 0.05, // en metros (basado en datos reales de la NASA)
    floodRiskBase: 0.1,
    maxTurns: 100 // Límite de turnos para prevenir bucles infinitos
};

// Añadir a gameConfig (CORREGIDO - sin referencia a gameState)
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

// Función para actualizar dificultad realista con datos NASA
function updateRealisticDifficulty(nasaData) {
    if (nasaData && nasaData.seaLevel) {
        difficultySettings.realistic.seaLevelRisePerTurn = nasaData.seaLevel.trend / 1000;
    }
}

// Costos y efectos de las estructuras
const structures = {
    residential: {
        name: "Zona Residencial",
        cost: 20,
        effects: { wellbeing: +10, environment: -5 },
        icon: "🏠",
        canBuild: (cell) => cell.type === 'land' || cell.type === 'coast'
    },
    industrial: {
        name: "Zona Industrial", 
        cost: 30,
        effects: { money: +15, environment: -10 },
        icon: "🏭",
        canBuild: (cell) => cell.type === 'land' || cell.type === 'coast'
    },
    mangrove: {
        name: "Manglar Restaurado",
        cost: 15,
        effects: { environment: +15, resilience: +5 },
        icon: "🟢",
        canBuild: (cell) => cell.type === 'coast' && !cell.flooded
    },
    seawall: {
        name: "Dique de Protección",
        cost: 25,
        effects: { resilience: +10 },
        icon: "🛡️",
        canBuild: (cell) => cell.type === 'coast' && !cell.flooded
    }
};

// Sistema de logros y metas (CORREGIDO - funciones que reciben gameState como parámetro)
const achievements = {
    earlyPlanner: {
        name: "Planificador Temprano",
        description: "Alcanza 50 de resiliencia antes del año 2050",
        check: (gameState) => gameState.currentYear < 2050 && gameState.resilience >= 50,
        reward: { money: 50, wellbeing: 10 }
    },
    ecoWarrior: {
        name: "Guerrero Ecológico",
        description: "Mantén el ambiente por encima de 80 por 10 turnos consecutivos",
        check: (gameState) => gameState.environment >= 80,
        reward: { environment: 15, resilience: 10 }
    },
    coastalGuardian: {
        name: "Guardián Costero",
        description: "Protege todas las celdas costeras con manglares o diques",
        check: (gameState) => {
            const coastalCells = gameState.board.flat().filter(cell => cell.type === 'coast');
            return coastalCells.every(cell => cell.structure === 'mangrove' || cell.structure === 'seawall');
        },
        reward: { money: 100, resilience: 20 }
    }
};

// Tipos de celdas del tablero
const cellTypes = {
    land: {
        name: "Tierra",
        color: "#27ae60",
        buildable: true
    },
    coast: {
        name: "Costa", 
        color: "#3498db",
        buildable: true
    },
    flooded: {
        name: "Inundado",
        color: "#8e44ad",
        buildable: false
    }
};

// Eventos climáticos basados en datos de la NASA (CORREGIDO - sin referencia directa a gameState)
const climateEvents = [
    {
        id: "sea_level_rise",
        name: "Aumento del Nivel del Mar",
        description: "El nivel del mar ha subido significativamente. Las áreas costeras no protegidas están en riesgo.",
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
        name: "Tormenta Intensa",
        description: "Una tormenta poderosa golpea la costa. La resiliencia de la ciudad es puesta a prueba.",
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
        name: "Ola de Calor",
        description: "Una prolongada ola de calor afecta la ciudad, aumentando el consumo energético.",
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
        name: "Conciencia Ambiental",
        description: "La población se vuelve más consciente del medio ambiente, apoyando iniciativas verdes.",
        condition: (year, resilience, turn) => Math.random() < 0.15 && gameState.environment > 60,
        effect: (gameState) => {
            gameState.wellbeing += 10;
            gameState.money += 5;
            return "POSITIVE_EVENT";
        },
        severity: "positive"
    }
];

// Eventos NASA (se añadirán dinámicamente después)
let nasaClimateEvents = [];

// Función para añadir eventos NASA dinámicamente
function addNasaClimateEvents(nasaData) {
    nasaClimateEvents = [
        {
            name: "Evento de Calor Extremo NASA",
            description: "Basado en datos reales de temperatura global de la NASA. Las olas de calor son más frecuentes e intensas.",
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
            name: "Aceleración del Nivel del Mar",
            description: `Los datos del satélite Jason-3 muestran una aceleración en el aumento del nivel del mar`,
            condition: (year, resilience, turn) => year >= 2040 && turn % 5 === 0,
            effect: (gameState) => {
                // Aumentar temporalmente la tasa de inundación
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

// Función para obtener todos los eventos climáticos (base + NASA)
function getAllClimateEvents() {
    return [...climateEvents, ...nasaClimateEvents];
}

// Tecnologías (CORREGIDO - funciones que reciben gameState como parámetro)
const technologies = {
    earlyWarning: {
        name: "Sistema de Alerta Temprana",
        cost: 80,
        description: "Reduce el daño de eventos climáticos en un 30%",
        effect: (gameState) => {
            gameState.resilience += 15;
            // Implementar lógica de reducción de daño
        },
        requirements: { turn: 5, money: 100 }
    },
    greenEnergy: {
        name: "Transición a Energía Verde",
        cost: 120,
        description: "Las industrias contaminan menos y generan más dinero",
        effect: (gameState) => {
            // Modificar efectos de estructuras existentes
        },
        requirements: { environment: 60, turn: 10 }
    },
    coastalEngineering: {
        name: "Ingeniería Costera Avanzada",
        cost: 150,
        description: "Los diques son más efectivos y baratos",
        effect: (gameState) => {
            // Estas modificaciones serían temporales para esta partida
            console.log("Ingeniería costera aplicada");
        },
        requirements: { resilience: 40, money: 200 }
    }
};

// Datos de elevación del nivel del mar (simulados basados en proyecciones NASA)
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

// Configuración de APIs NASA
const nasaAPIs = {
    // API de Eventos Climáticos (EONET)
    eonet: {
        url: 'https://eonet.gsfc.nasa.gov/api/v3/events',
        cache: null,
        lastFetch: null,
        cacheDuration: 1000 * 60 * 30 // 30 minutos
    },
    
    // API de Imágenes Satelitales (GIBS)
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

// Clave API NASA
const NASA_API_KEY = 'Lgq2xsi7Rn1HgRPyyX1AvbgNivaFSdflQQKqQdeo';

// Configuración del sistema de guardado
const saveConfig = {
    version: '1.0.0',
    autoSaveInterval: 120000, // 2 minutos en milisegundos
    maxSaveSlots: 5,
    backupEnabled: true
};

// Estados del juego para el sistema de guardado
const gameStates = {
    PLAYING: 'playing',
    VICTORY: 'victory',
    DEFEAT: 'defeat',
    PAUSED: 'paused'
};

// Umbrales para condiciones de victoria/derrota
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

// Textos para eventos y mensajes
const gameTexts = {
    victory: [
        "¡Felicidades! Has guiado a la ciudad hacia un futuro resiliente y sostenible.",
        "La ciudad está preparada para los desafíos climáticos del siglo XXI.",
        "Tu gestión balanceada ha asegurado un futuro próspero para las generaciones venideras."
    ],
    defeat: [
        "La ciudad no ha podido adaptarse al cambio climático.",
        "Los recursos se han agotado y la población ha sufrido las consecuencias.",
        "La falta de planificación a largo plazo ha llevado al colapso de la ciudad."
    ],
    floodWarning: "Las áreas costeras sin protección están en riesgo de inundación.",
    resilienceTip: "Invertir en manglares y diques aumenta la resiliencia costera."
};