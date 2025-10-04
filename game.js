// game.js - Main Game Logic

// Global game state
const gameState = {
    money: gameConfig.initialMoney,
    wellbeing: gameConfig.initialWellbeing,
    environment: gameConfig.initialEnvironment,
    resilience: gameConfig.initialResilience,
    currentYear: gameConfig.initialYear,
    turn: 0,
    board: [],
    selectedCell: null,
    gameOver: false,
    nasaData: null
};

// ========== INICIALIZACIÓN DEL JUEGO ==========

/**
 * Initialize the game - main function
 */
function initGame() {
    console.log('Initializing game...');
    
    try {
        // Try to load saved game
        const savedGame = saveManager.loadGame();
        
        if (savedGame) {
            Object.assign(gameState, savedGame);
            createBoardFromSave();
            showLoadGamePrompt();
        } else {
            createBoard();
        }
        
        updateUI();
        setupEventListeners();
        initNasaData();
        setupAutoSave();
        
        console.log('Game initialized correctly');
    } catch (error) {
        console.error('Error initializing game:', error);
        // Fallback: create new game
        createBoard();
        updateUI();
        setupEventListeners();
    }
}

/**
 * Creates the game board from scratch
 */
function createBoard() {
    const gameBoard = document.getElementById('game-board');
    if (!gameBoard) {
        console.error('game-board element not found');
        return;
    }
    
    gameBoard.innerHTML = '';
    gameState.board = [];

    for (let row = 0; row < 6; row++) {
        const boardRow = [];
        for (let col = 0; col < 6; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // Define coastal cells (the last 2 rows)
            const cellType = row >= 4 ? 'coast' : 'land';
            if (cellType === 'coast') {
                cell.classList.add('coast');
            }
            cell.dataset.type = cellType;

            cell.addEventListener('click', () => selectCell(row, col));
            gameBoard.appendChild(cell);
            
            boardRow.push({
                element: cell,
                type: cellType,
                structure: null,
                flooded: false
            });
        }
        gameState.board.push(boardRow);
    }
}

/**
 * Creates the board from saved data
 */
function createBoardFromSave() {
    const gameBoard = document.getElementById('game-board');
    if (!gameBoard) {
        console.error('game-board element not found');
        return;
    }
    
    gameBoard.innerHTML = '';
    
    // Check that we have saved board data
    if (!gameState.board || gameState.board.length === 0) {
        console.warn('No saved board data, creating new board');
        createBoard();
        return;
    }
    
    for (let row = 0; row < gameState.board.length; row++) {
        for (let col = 0; col < gameState.board[row].length; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            const savedCell = gameState.board[row][col];
            if (!savedCell) continue;
            
            // Restore cell type
            if (savedCell.type === 'coast') {
                cell.classList.add('coast');
                cell.dataset.type = 'coast';
            } else {
                cell.dataset.type = 'land';
            }
            
            // Restore structure
            if (savedCell.structure) {
                const structure = structures[savedCell.structure];
                if (structure) {
                    cell.innerHTML = structure.icon;
                    cell.title = structure.name;
                }
            }
            
            // Restore flood state
            if (savedCell.flooded) {
                cell.classList.add('flooded');
                if (!savedCell.structure) {
                    cell.innerHTML = '💧';
                }
            }
            
            cell.addEventListener('click', () => selectCell(row, col));
            gameBoard.appendChild(cell);
            
            // Update DOM element reference
            gameState.board[row][col].element = cell;
        }
    }
}

// ========== USER INTERACTION ==========

/**
 * Selects a cell to build on
 */
function selectCell(row, col) {
    if (gameState.gameOver) return;
    
    // Validate coordinates
    if (row < 0 || row >= gameState.board.length || col < 0 || col >= gameState.board[0].length) {
        console.error('Invalid cell coordinates:', row, col);
        return;
    }
    
    // Deselect previous cell
    if (gameState.selectedCell && gameState.selectedCell.element) {
        gameState.selectedCell.element.classList.remove('selected');
    }

    gameState.selectedCell = gameState.board[row][col];
    gameState.selectedCell.element.classList.add('selected');
    
    console.log(`Cell selected: (${row}, ${col}) - Type: ${gameState.selectedCell.type}`);
}

/**
 * Builds a structure on the selected cell
 */
function buildStructure(structureType) {
    if (gameState.gameOver) {
        showEventModal("Game Over", "The game has ended. Please reload the page to play again.");
        return;
    }

    if (!gameState.selectedCell) {
        alert("Please select a cell first.");
        return;
    }

    const structure = structures[structureType];
    if (!structure) {
        console.error('Structure not found:', structureType);
        return;
    }

    const cell = gameState.selectedCell;

    // Check if there is already a structure
    if (cell.structure) {
        alert("There is already a structure in this cell.");
        return;
    }

    // Check cost
    if (gameState.money < structure.cost) {
        alert("You don't have enough money.");
        return;
    }

    // Check construction restrictions using canBuild function if it exists
    if (structure.canBuild && !structure.canBuild(cell)) {
        alert(`Cannot build ${structure.name} on this type of cell.`);
        return;
    }

    // Check manual construction restrictions (fallback)
    if (structureType === 'mangrove' && cell.type !== 'coast') {
        alert("Mangroves can only be built in coastal areas.");
        return;
    }

    if (structureType === 'seawall' && cell.type !== 'coast') {
        alert("Seawalls can only be built in coastal areas.");
        return;
    }

    // Build the structure
    gameState.money -= structure.cost;
    cell.structure = structureType;
    cell.element.innerHTML = structure.icon;
    cell.element.title = structure.name;

    // Apply effects
    applyStructureEffects(structure.effects);

    // Update UI
    updateUI();
    
    console.log(`Built: ${structure.name} in cell (${cell.element.dataset.row}, ${cell.element.dataset.col})`);
}

/**
 * Applies structure effects to game resources
 */
function applyStructureEffects(effects) {
    Object.keys(effects).forEach(resource => {
        if (gameState.hasOwnProperty(resource)) {
            gameState[resource] += effects[resource];
            // Ensure values are in valid ranges (0-100)
            gameState[resource] = Math.max(0, Math.min(100, gameState[resource]));
        }
    });
}

// ========== TURN SYSTEM ==========

/**
 * Advances to the next turn
 */
function nextTurn() {
    if (gameState.gameOver) {
        console.log('Game over, cannot advance turn');
        return;
    }

    gameState.turn++;
    gameState.currentYear += gameConfig.yearsPerTurn;

    // Check turn limit
    if (gameState.turn > gameConfig.maxTurns) {
        gameState.gameOver = true;
        showEventModal("Turn Limit", "You have reached the maximum turn limit.");
        return;
    }

    processTurnEvents();
    checkGameEnd();
    updateUI();
    
    // Save after each turn
    saveManager.saveGame(gameState);
}

/**
 * Processes events for the current turn
 */
function processTurnEvents() {
    // Check base climate events
    climateEvents.forEach(event => {
        try {
            if (event.condition(gameState.currentYear, gameState.resilience, gameState.turn)) {
                const eventResult = event.effect(gameState);
                handleEventResult(eventResult, event);
            }
        } catch (error) {
            console.error('Error processing climate event:', error, event);
        }
    });
    
    // NASA Events (10% probability per turn)
    if (Math.random() < 0.1) {
        const nasaEvent = getRandomNasaEvent();
        if (nasaEvent) {
            try {
                const eventResult = nasaEvent.effect(gameState);
                showEventModal(nasaEvent.name, nasaEvent.description);
                handleEventResult(eventResult, nasaEvent);
            } catch (error) {
                console.error('Error processing NASA event:', error, nasaEvent);
            }
        }
    }
    
    // Base income per turn
    gameState.money += 10;
}

/**
 * Handles event results
 */
function handleEventResult(eventResult, event) {
    switch (eventResult) {
        case 'FLOOD':
            triggerFlood();
            break;
        case 'STORM_DAMAGE':
            showEventModal("Storm Damage", "The city's infrastructure has been damaged.");
            break;
        case 'NASA_EVENT_IMPACT':
            showEventModal("Real Event Impact", "A real climate event reported by NASA has affected the city.");
            break;
        case 'HEAT_WAVE':
            showEventModal("Heat Wave", "Energy consumption has increased due to high temperatures.");
            break;
        case 'POSITIVE_EVENT':
            showEventModal("Positive Event", "The population's environmental awareness has brought benefits.");
            break;
        default:
            // Event with no specific effect
            break;
    }
}

// ========== CLIMATE EVENTS ==========

/**
 * Gets current sea level based on NASA data
 */
function getCurrentSeaLevel() {
    // Prioritize NASA data if available
    if (gameState.nasaData && gameState.nasaData.seaLevel) {
        const baseRise = gameState.nasaData.seaLevel.currentRise;
        const additionalRise = (gameState.currentYear - new Date().getFullYear()) * 
                              (gameState.nasaData.seaLevel.trend / 1000);
        return baseRise + additionalRise;
    }
    
    // Fallback to simulated data
    for (let i = seaLevelData.length - 1; i >= 0; i--) {
        if (gameState.currentYear >= seaLevelData[i].year) {
            return seaLevelData[i].rise;
        }
    }
    return 0;
}

/**
 * Triggers a flood in coastal cells
 */
function triggerFlood() {
    showEventModal(
        "Coastal Flood!",
        "Sea level rise has caused flooding in unprotected coastal areas."
    );

    let floodedCells = 0;
    
    gameState.board.forEach(row => {
        row.forEach(cell => {
            if (cell.type === 'coast' && !cell.flooded) {
                // Cells with mangroves or seawalls have protection
                const hasProtection = cell.structure === 'mangrove' || cell.structure === 'seawall';
                
                if (!hasProtection) {
                    cell.flooded = true;
                    cell.element.classList.add('flooded');
                    cell.element.innerHTML = '💧';
                    floodedCells++;
                    
                    // Flood penalty
                    gameState.wellbeing -= 5;
                    gameState.money -= 5;
                }
            }
        });
    });

    if (floodedCells > 0) {
        showEventModal(
            "Flooded Areas",
            `${floodedCells} coastal areas have been flooded. Wellbeing and economy affected.`
        );
    }
}

// ========== SAVE SYSTEM ==========

/**
 * Sets up automatic saving
 */
function setupAutoSave() {
    // Auto-save every 2 minutes
    setInterval(() => {
        if (!gameState.gameOver) {
            saveManager.saveGame(gameState);
            showAutoSaveNotification();
        }
    }, saveConfig.autoSaveInterval);
}

/**
 * Shows auto-save notification
 */
function showAutoSaveNotification() {
    const notification = document.createElement('div');
    notification.className = 'save-notification';
    notification.textContent = '💾 Game saved automatically';
    document.body.appendChild(notification);
    
    // Entry animation
    setTimeout(() => notification.style.opacity = '1', 10);
    
    // Remove after 2 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 2000);
}

// ========== USER INTERFACE ==========

/**
 * Updates the user interface
 */
function updateUI() {
    // Update numerical values
    document.getElementById('money').textContent = Math.round(gameState.money);
    document.getElementById('wellbeing').textContent = Math.round(gameState.wellbeing);
    document.getElementById('environment').textContent = Math.round(gameState.environment);
    document.getElementById('resilience').textContent = Math.round(gameState.resilience);
    document.getElementById('year').textContent = gameState.currentYear;

    // Update resource colors
    updateResourceColors();
    
    // Disable buttons if game ended
    updateButtonStates();
}

/**
 * Updates resource colors based on their level
 */
function updateResourceColors() {
    const resources = {
        'money': gameState.money,
        'wellbeing': gameState.wellbeing, 
        'environment': gameState.environment,
        'resilience': gameState.resilience
    };
    
    Object.keys(resources).forEach(resource => {
        const element = document.getElementById(resource);
        if (!element) return;
        
        const value = resources[resource];
        let color;
        
        if (value < 25) {
            color = '#e74c3c'; // Red (critical)
        } else if (value < 50) {
            color = '#f39c12'; // Orange (low)
        } else if (value < 75) {
            color = '#f1c40f'; // Yellow (medium)
        } else {
            color = '#2ecc71'; // Green (good)
        }
        
        element.style.color = color;
    });
}

/**
 * Updates button states
 */
function updateButtonStates() {
    const nextTurnBtn = document.getElementById('next-turn-btn');
    const actionButtons = document.querySelectorAll('.action-buttons button');
    
    if (gameState.gameOver) {
        if (nextTurnBtn) nextTurnBtn.disabled = true;
        actionButtons.forEach(btn => btn.disabled = true);
    } else {
        if (nextTurnBtn) nextTurnBtn.disabled = false;
        actionButtons.forEach(btn => btn.disabled = false);
    }
}

/**
 * Shows event modal
 */
function showEventModal(title, description) {
    const titleElement = document.getElementById('event-title');
    const descriptionElement = document.getElementById('event-description');
    const modal = document.getElementById('event-modal');
    
    if (titleElement) titleElement.textContent = title;
    if (descriptionElement) descriptionElement.textContent = description;
    if (modal) modal.classList.remove('hidden');
}

/**
 * Closes event modal
 */
function closeEventModal() {
    const modal = document.getElementById('event-modal');
    if (modal) modal.classList.add('hidden');
}

// ========== NASA SYSTEM ==========

/**
 * Initializes NASA data
 */
async function initNasaData() {
    try {
        console.log('🌍 Initializing real-time NASA data...');
        
        const [seaLevelData, climateEvents, temperatureData, co2Data] = await Promise.all([
            nasaService.getSeaLevelData(),
            nasaService.getClimateEvents(3),
            nasaService.getGlobalTemperature(),
            nasaService.getCO2Data()
        ]);
        
        // Update game configuration with real data
        if (seaLevelData) {
            gameConfig.seaLevelRisePerTurn = seaLevelData.currentRise / 20; // Adjust for game balance
        }
        
        gameState.nasaData = {
            seaLevel: seaLevelData,
            recentEvents: climateEvents,
            temperature: temperatureData,
            co2: co2Data,
            lastUpdated: new Date().toISOString()
        };
        
        console.log('✅ Real-time NASA data loaded:', gameState.nasaData);
        showNasaDataPanel();
        
    } catch (error) {
        console.error('❌ Error initializing NASA data:', error);
        gameState.nasaData = this.getFallbackNasaData();
    }
}

/**
 * Refreshes NASA data and updates the interface
 */
async function refreshNasaData() {
    console.log("🔄 Updating NASA data...");

    try {
        const [seaLevelData, climateEvents, temperatureData, co2Data] = await Promise.all([
            nasaService.getSeaLevelData(),
            nasaService.getClimateEvents(3),
            nasaService.getGlobalTemperature(),
            nasaService.getCO2Data()
        ]);

        // Update global state
        gameState.nasaData = {
            seaLevel: seaLevelData,
            recentEvents: climateEvents,
            temperature: temperatureData,
            co2: co2Data,
            lastUpdated: new Date().toISOString()
        };

        console.log("✅ NASA data updated:", gameState.nasaData);

        // Redraw panel with new info
        showNasaDataPanel();

    } catch (error) {
        console.error("❌ Error refreshing NASA data:", error);
        showEventModal("Error", "Could not update NASA data. Please try again later.");
    }
}

// Make it globally accessible for the button
window.refreshNasaData = refreshNasaData;

/**
 * Shows NASA data panel in the UI
 */
function showNasaDataPanel() {
    const controlPanel = document.getElementById('control-panel');
    if (!controlPanel) return;
    
	//remove panel if it exists
    const existingPanel = document.getElementById('nasa-data-panel');
    if (existingPanel) existingPanel.remove();
    
    const nasaPanel = document.createElement('div');
    nasaPanel.id = 'nasa-data-panel';
    nasaPanel.innerHTML = `
        <h3>🌍 Real-Time NASA Data</h3>
        <div class="nasa-metrics-grid">
            <div class="nasa-metric ${gameState.nasaData?.seaLevel?.trend > 3.5 ? 'warning' : ''}">
                <div class="metric-icon">🌊</div>
                <div class="metric-info">
                    <div class="metric-value">+${(gameState.nasaData.seaLevel.currentRise * 100).toFixed(1)}cm</div>
                    <div class="metric-label">Sea Level</div>
                    <div class="metric-trend">${gameState.nasaData.seaLevel.trend.toFixed(1)} mm/year</div>
                </div>
            </div>
            
            <div class="nasa-metric ${gameState.nasaData?.temperature?.anomaly > 1.2 ? 'warning' : ''}">
                <div class="metric-icon">🌡️</div>
                <div class="metric-info">
                    <div class="metric-value">+${gameState.nasaData.temperature.anomaly.toFixed(1)}°C</div>
                    <div class="metric-label">Warming</div>
                    <div class="metric-trend">${gameState.nasaData.temperature.trend}°C/decade</div>
                </div>
            </div>
            
            <div class="nasa-metric">
                <div class="metric-icon">🏭</div>
                <div class="metric-info">
                    <div class="metric-value">${gameState.nasaData.co2.co2Level.toFixed(0)}</div>
                    <div class="metric-label">CO₂ (ppm)</div>
                    <div class="metric-trend">+${gameState.nasaData.co2.trend} ppm/year</div>
                </div>
            </div>
        </div>
        
        <div class="nasa-events">
            <h4>📡 Active Events</h4>
            ${gameState.nasaData.recentEvents.map(event => `
                <div class="nasa-event ${event.magnitude > 0.7 ? 'high-impact' : ''}">
                    <span class="event-type">${event.type}</span>
                    <span class="event-title">${event.title}</span>
                    <span class="event-magnitude">${'⚠️'.repeat(Math.ceil(event.magnitude * 3))}</span>
                </div>
            `).join('')}
        </div>
        
        <div class="nasa-footer">
            <small>Last update: ${new Date(gameState.nasaData.lastUpdated).toLocaleTimeString()}</small>
            <button onclick="refreshNasaData()" class="refresh-btn">🔄 Update</button>
        </div>
    `;
    
    controlPanel.appendChild(nasaPanel);
}

/**
 * Gets a random NASA event
 */
function getRandomNasaEvent() {
    if (!gameState.nasaData || !gameState.nasaData.recentEvents || gameState.nasaData.recentEvents.length === 0) {
        return null;
    }
    
    const randomEvent = gameState.nasaData.recentEvents[
        Math.floor(Math.random() * gameState.nasaData.recentEvents.length)
    ];
    
    return {
        name: `NASA Event: ${randomEvent.title}`,
        description: `Based on recent satellite data. ${randomEvent.title} reported by NASA EONET.`,
        effect: (gameState) => {
            // More severe effect for real events
            if (gameState.resilience < 40) {
                gameState.wellbeing -= 15;
                gameState.money -= 10;
                return "NASA_EVENT_IMPACT";
            }
            return null;
        }
    };
}

function updateNasaUI({ events, seaLevel, temp, co2 }) {
    // Look for containers in your HTML
    const statsContent = document.getElementById("stats-content");

    if (!statsContent) return;

    statsContent.innerHTML = `
        <h3>🌍 Updated NASA Data</h3>
        <p><strong>🌊 Sea Level:</strong> ${seaLevel.currentRise.toFixed(2)} m (trend: ${seaLevel.trend.toFixed(2)} mm/year)</p>
        <p><strong>🌡️ Global Temperature:</strong> +${temp.anomaly.toFixed(2)} °C (trend: ${temp.trend.toFixed(2)} °C/year)</p>
        <p><strong>🌫️ Atmospheric CO₂:</strong> ${co2.co2Level.toFixed(1)} ppm (trend: ${co2.trend.toFixed(1)} ppm/year)</p>
        <h4>🌪️ Latest climate events</h4>
        <ul>
            ${events.map(ev => `
                <li>
                    <strong>${ev.title}</strong> (${ev.type}) - ${ev.date.toLocaleDateString()}  
                    <br><small>${ev.description || ""}</small>
                </li>
            `).join("")}
        </ul>
    `;
}


// ========== GAME MANAGEMENT ==========

/**
 * Checks game end conditions
 */
function checkGameEnd() {
    // Defeat condition
    if (gameState.wellbeing <= defeatConditions.minWellbeing || 
        gameState.money <= defeatConditions.minMoney || 
        gameState.environment <= defeatConditions.minEnvironment) {
        
        gameState.gameOver = true;
        saveManager.saveGameStats(gameState);
        saveManager.clearSave();
        
        const randomMessage = gameTexts.defeat[Math.floor(Math.random() * gameTexts.defeat.length)];
        showEventModal("Game Over - Defeat", randomMessage);
        return;
    }

    // Victory condition
    if (gameState.currentYear >= victoryConditions.minYear && 
        gameState.wellbeing >= victoryConditions.minWellbeing && 
        gameState.resilience >= victoryConditions.minResilience &&
        gameState.environment >= victoryConditions.minEnvironment) {
        
        gameState.gameOver = true;
        saveManager.saveGameStats(gameState);
        saveManager.clearSave();
        
        const randomMessage = gameTexts.victory[Math.floor(Math.random() * gameTexts.victory.length)];
        showEventModal("Victory!", randomMessage);
        return;
    }

    // Victory by time (reaching 2100)
    if (gameState.currentYear >= 2100) {
        gameState.gameOver = true;
        saveManager.saveGameStats(gameState);
        saveManager.clearSave();
        
        const score = saveManager.calculateScore(gameState);
        if (score >= 200) {
            showEventModal("Sustainable Success!", "You have guided the city through 76 years of climate change. Your balanced management has secured a prosperous future.");
        } else {
            showEventModal("Game End", `You have reached the year 2100. The city survives, but could have done better. Final score: ${Math.round(score)}`);
        }
    }
}

/**
 * Shows prompt to load game
 */
function showLoadGamePrompt() {
    if (confirm('Do you want to continue your saved game?')) {
        showEventModal(
            "Game Loaded", 
            `Welcome back. We continue in the year ${gameState.currentYear}.`
        );
    } else {
        // Start new game
        saveManager.clearSave();
        location.reload();
    }
}

// ========== SAVE CONTROLS ==========

/**
 * Saves the game manually
 */
function manualSave() {
    if (saveManager.saveGame(gameState)) {
        showEventModal("Game Saved", "Your progress has been saved successfully.");
    } else {
        showEventModal("Error", "Could not save the game. Please try again.");
    }
}

/**
 * Loads game manually
 */
function manualLoad() {
    if (saveManager.hasSavedGame()) {
        if (confirm('Load saved game? Current progress will be lost.')) {
            location.reload();
        }
    } else {
        alert('No saved game.');
    }
}

/**
 * Starts new game
 */
function newGame() {
    if (confirm('Start new game? Unsaved progress will be lost.')) {
        saveManager.clearSave();
        location.reload();
    }
}

/**
 * Restarts the game
 */
function restartGame() {
    if (confirm("Are you sure you want to restart the game?")) {
        location.reload();
    }
}

// ========== STATISTICS SYSTEM ==========

/**
 * Shows game statistics
 */
function viewStats() {
    const stats = saveManager.loadGameStats();
    const statsContent = document.getElementById('stats-content');
    const statsModal = document.getElementById('stats-modal');
    
    if (!statsContent || !statsModal) {
        alert('Error: Could not load statistics system.');
        return;
    }
    
    let html = `<h3>Game Summary</h3>`;
    
    if (stats.sessions.length === 0) {
        html += `<p>No previous game statistics.</p>`;
    } else {
        const totalGames = stats.sessions.length;
        const victories = stats.sessions.filter(s => s.outcome === 'victory').length;
        const defeats = stats.sessions.filter(s => s.outcome === 'defeat').length;
        const bestScore = Math.max(...stats.sessions.map(s => s.finalScore));
        
        html += `
            <div class="stats-summary">
                <p><strong>Total games:</strong> ${totalGames}</p>
                <p><strong>Victories:</strong> ${victories}</p>
                <p><strong>Defeats:</strong> ${defeats}</p>
                <p><strong>Best score:</strong> ${bestScore}</p>
            </div>
            <h4>History:</h4>
            <div class="sessions-list">
                ${stats.sessions.slice().reverse().map(session => `
                    <div class="session-item">
                        <strong>${new Date(session.date).toLocaleDateString()}</strong>
                        - Year: ${session.finalYear} 
                        - Score: ${session.finalScore}
                        - ${session.outcome === 'victory' ? '🏆 Victory' : session.outcome === 'defeat' ? '💀 Defeat' : '⏸️ Incomplete'}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    statsContent.innerHTML = html;
    statsModal.classList.remove('hidden');
}

/**
 * Closes statistics modal
 */
function closeStatsModal() {
    const statsModal = document.getElementById('stats-modal');
    if (statsModal) statsModal.classList.add('hidden');
}

/**
 * Exports current game
 */
function exportSave() {
    if (saveManager.exportSave()) {
        alert('Game exported successfully.');
    } else {
        alert('No game to export.');
    }
}

/**
 * Imports game from file
 */
async function importSave(file) {
    if (!file) return;
    
    try {
        await saveManager.importSave(file);
        alert('Game imported successfully. Reload the page to play.');
    } catch (error) {
        alert('Error importing game: ' + error.message);
    }
}

// ========== EVENT LISTENERS ==========

/**
 * Sets up event listeners
 */
function setupEventListeners() {
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !gameState.gameOver) {
            nextTurn();
        }
        
        if (e.key === 'Escape') {
            const eventModal = document.getElementById('event-modal');
            const statsModal = document.getElementById('stats-modal');
            
            if (eventModal && !eventModal.classList.contains('hidden')) {
                closeEventModal();
            } else if (statsModal && !statsModal.classList.contains('hidden')) {
                closeStatsModal();
            }
        }
    });

    // Prevent default actions in modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });
}

// ====== Gestión de configuración de API en navegador ======

const API_CONFIG_KEY = 'game_ai_api_config';

/**
 * Muestra el modal de configuración
 */
function showApiConfigModal() {
    const modal = document.getElementById('api-config-modal');
    if (!modal) return;

    // Cargar valores guardados si existen
    const cfg = loadApiConfig();
    if (cfg) {
        document.getElementById('api-provider').value = cfg.provider || 'gemini';
        document.getElementById('api-key').value = cfg.apiKey || '';
        document.getElementById('api-remember').checked = !!cfg.persistent;
    } else {
        document.getElementById('api-provider').value = 'gemini';
        document.getElementById('api-key').value = '';
        document.getElementById('api-remember').checked = false;
    }

    modal.classList.remove('hidden');
}

/**
 * Guarda la configuración en sessionStorage o localStorage
 */
function saveApiConfig({ provider, apiKey, persistent }) {
    const cfg = { provider, apiKey, persistent: !!persistent, savedAt: new Date().toISOString() };

    try {
        // Guardar en sessionStorage siempre (para uso inmediato)
        sessionStorage.setItem(API_CONFIG_KEY, JSON.stringify(cfg));
        // Si quiere persistir, guardar también en localStorage
        if (persistent) {
            localStorage.setItem(API_CONFIG_KEY, JSON.stringify(cfg));
        } else {
            localStorage.removeItem(API_CONFIG_KEY);
        }
        return true;
    } catch (err) {
        console.error('Error guardando configuración de API:', err);
        return false;
    }
}

/**
 * Carga la configuración (prefiere localStorage si existe, luego sessionStorage)
 */
function loadApiConfig() {
    try {
        const persistent = localStorage.getItem(API_CONFIG_KEY);
        if (persistent) return JSON.parse(persistent);

        const session = sessionStorage.getItem(API_CONFIG_KEY);
        if (session) return JSON.parse(session);

        return null;
    } catch (err) {
        console.error('Error cargando configuración de API:', err);
        return null;
    }
}

/**
 * Cierra modal y limpia inputs si queremos
 */
function closeApiConfigModal() {
    const modal = document.getElementById('api-config-modal');
    if (!modal) return;
    modal.classList.add('hidden');
}

// Inicializar eventos del modal
function initApiConfigUI() {
    const saveBtn = document.getElementById('api-save-btn');
    const cancelBtn = document.getElementById('api-cancel-btn');

    if (saveBtn) {
        saveBtn.addEventListener('click', (e) => {
            const provider = document.getElementById('api-provider').value;
            const apiKey = document.getElementById('api-key').value.trim();
            const persistent = document.getElementById('api-remember').checked;

            if (!apiKey) {
                alert('Introduce tu API Key antes de guardar.');
                return;
            }

            saveApiConfig({ provider, apiKey, persistent });
            closeApiConfigModal();

            // Llamar a consultAI inmediatamente después de guardar
            consultAI();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            closeApiConfigModal();
        });
    }

    // Cerrar modal al hacer click fuera del contenido
    const modal = document.getElementById('api-config-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeApiConfigModal();
        });
    }
}

// Llamar en el DOMContentLoaded para enlazar UI
document.addEventListener('DOMContentLoaded', () => {
    initApiConfigUI();
});

// ====== Consult AI using dynamic configuration ======
async function consultAI() {
    // Read config
    const cfg = loadApiConfig();

    // If no config, ask user for it
    if (!cfg || !cfg.apiKey) {
        showApiConfigModal();
        return;
    }

    const provider = cfg.provider;
    const apiKey = cfg.apiKey;

    // Build prompt from game state
    const state = {
        turno: gameState.turn,
        dinero: gameState.money,
        bienestar: gameState.wellbeing,
        medioAmbiente: gameState.environment,
        resiliencia: gameState.resilience,
        nasa: gameState.nasaData
    };

    const aiPrompt = `
Current game state:
- Turn: ${state.turno}
- Money: ${state.dinero}
- Wellbeing: ${state.bienestar}
- Environment: ${state.medioAmbiente}
- Resilience: ${state.resiliencia}
- NASA Data: ${JSON.stringify(state.nasa)}

Act as an expert advisor in climate management and urban planning.
Give a clear and practical recommendation on what actions the player should take to protect the coast and survive.
`.trim();

    // Show AI modal (loading)
    const aiResponseEl = document.getElementById("ai-response");
    if (aiResponseEl) {
        aiResponseEl.innerHTML = `<p>🔄 Consulting ${provider.toUpperCase()}...</p>`;
        document.getElementById("ai-modal").classList.remove("hidden");
    }

    try {
        let aiText = '';

        if (provider === 'gemini') {
            // Gemini (example with gemini-2.5-flash-lite)
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

            const resp = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    // basic structure; you can customize safetySettings, temperature, etc.
                    contents: [
                        { role: "user", parts: [{ text: aiPrompt }] }
                    ]
                })
            });

            const data = await resp.json();
            if (data.error) throw new Error(data.error.message || JSON.stringify(data));
            aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Gemini did not return a response.";

        } else if (provider === 'openai') {
            // OpenAI (if someone wants to use it) - example with Chat Completions
            const resp = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "You are an expert climate advisor." },
                        { role: "user", content: aiPrompt }
                    ],
                    temperature: 0.7
                })
            });

            const data = await resp.json();
            if (data.error) throw new Error(data.error.message || JSON.stringify(data));
            aiText = data.choices?.[0]?.message?.content || "⚠️ OpenAI did not return a response.";

        } else {
            // Other: try a generic POST if user wants (this is a template)
            throw new Error("Provider not supported in this version. Use Gemini or OpenAI.");
        }

        // Show response
        if (aiResponseEl) {
            aiResponseEl.innerHTML = `<pre style="white-space:pre-wrap;">${escapeHtml(aiText)}</pre>`;
        }

    } catch (error) {
        console.error("Error consulting AI:", error);
        if (aiResponseEl) {
            aiResponseEl.innerHTML = `<p style="color:red;">❌ Error consulting AI:<br>${escapeHtml(error.message || String(error))}</p>`;
        }
    }
}

/** Helper to escape HTML and prevent injection if we display text */
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}


function closeAIModal() {
    document.getElementById("ai-modal").classList.add("hidden");
}

// Enlazar el botón al inicio del juego
document.getElementById("consult-ai-btn").addEventListener("click", consultAI);


// ========== INICIALIZACIÓN FINAL ==========

// Inicializar el juego cuando se carga la página
document.addEventListener('DOMContentLoaded', initGame);

// Hacer funciones globales disponibles
window.gameState = gameState;
window.buildStructure = buildStructure;
window.nextTurn = nextTurn;
window.closeEventModal = closeEventModal;
window.manualSave = manualSave;
window.manualLoad = manualLoad;
window.newGame = newGame;
window.viewStats = viewStats;
window.closeStatsModal = closeStatsModal;
window.exportSave = exportSave;
window.importSave = importSave;
window.restartGame = restartGame;

console.log('game.js cargado correctamente');