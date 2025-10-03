// game.js - Lógica Principal del Juego

// Estado global del juego
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
 * Inicializa el juego - función principal
 */
function initGame() {
    console.log('Inicializando juego...');
    
    try {
        // Intentar cargar partida guardada
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
        
        console.log('Juego inicializado correctamente');
    } catch (error) {
        console.error('Error inicializando el juego:', error);
        // Fallback: crear juego nuevo
        createBoard();
        updateUI();
        setupEventListeners();
    }
}

/**
 * Crea el tablero de juego desde cero
 */
function createBoard() {
    const gameBoard = document.getElementById('game-board');
    if (!gameBoard) {
        console.error('Elemento game-board no encontrado');
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
            
            // Definir celdas costeras (las 2 últimas filas)
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
 * Crea el tablero desde datos guardados
 */
function createBoardFromSave() {
    const gameBoard = document.getElementById('game-board');
    if (!gameBoard) {
        console.error('Elemento game-board no encontrado');
        return;
    }
    
    gameBoard.innerHTML = '';
    
    // Verificar que tenemos datos del tablero guardados
    if (!gameState.board || gameState.board.length === 0) {
        console.warn('No hay datos de tablero guardados, creando nuevo tablero');
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
            
            // Restaurar tipo de celda
            if (savedCell.type === 'coast') {
                cell.classList.add('coast');
                cell.dataset.type = 'coast';
            } else {
                cell.dataset.type = 'land';
            }
            
            // Restaurar estructura
            if (savedCell.structure) {
                const structure = structures[savedCell.structure];
                if (structure) {
                    cell.innerHTML = structure.icon;
                    cell.title = structure.name;
                }
            }
            
            // Restaurar estado de inundación
            if (savedCell.flooded) {
                cell.classList.add('flooded');
                if (!savedCell.structure) {
                    cell.innerHTML = '💧';
                }
            }
            
            cell.addEventListener('click', () => selectCell(row, col));
            gameBoard.appendChild(cell);
            
            // Actualizar referencia al elemento DOM
            gameState.board[row][col].element = cell;
        }
    }
}

// ========== INTERACCIÓN DEL USUARIO ==========

/**
 * Selecciona una celda para construir
 */
function selectCell(row, col) {
    if (gameState.gameOver) return;
    
    // Validar coordenadas
    if (row < 0 || row >= gameState.board.length || col < 0 || col >= gameState.board[0].length) {
        console.error('Coordenadas de celda inválidas:', row, col);
        return;
    }
    
    // Deseleccionar celda anterior
    if (gameState.selectedCell && gameState.selectedCell.element) {
        gameState.selectedCell.element.classList.remove('selected');
    }

    gameState.selectedCell = gameState.board[row][col];
    gameState.selectedCell.element.classList.add('selected');
    
    console.log(`Celda seleccionada: (${row}, ${col}) - Tipo: ${gameState.selectedCell.type}`);
}

/**
 * Construye una estructura en la celda seleccionada
 */
function buildStructure(structureType) {
    if (gameState.gameOver) {
        showEventModal("Juego Terminado", "El juego ha concluido. Por favor, recarga la página para jugar de nuevo.");
        return;
    }

    if (!gameState.selectedCell) {
        alert("Por favor, selecciona una celda primero.");
        return;
    }

    const structure = structures[structureType];
    if (!structure) {
        console.error('Estructura no encontrada:', structureType);
        return;
    }

    const cell = gameState.selectedCell;

    // Verificar si ya hay una estructura
    if (cell.structure) {
        alert("Ya hay una estructura en esta celda.");
        return;
    }

    // Verificar costo
    if (gameState.money < structure.cost) {
        alert("No tienes suficiente dinero.");
        return;
    }

    // Verificar restricciones de construcción usando la función canBuild si existe
    if (structure.canBuild && !structure.canBuild(cell)) {
        alert(`No se puede construir ${structure.name} en este tipo de celda.`);
        return;
    }

    // Verificar restricciones de construcción manuales (fallback)
    if (structureType === 'mangrove' && cell.type !== 'coast') {
        alert("Los manglares solo se pueden construir en zonas costeras.");
        return;
    }

    if (structureType === 'seawall' && cell.type !== 'coast') {
        alert("Los diques solo se pueden construir en zonas costeras.");
        return;
    }

    // Construir la estructura
    gameState.money -= structure.cost;
    cell.structure = structureType;
    cell.element.innerHTML = structure.icon;
    cell.element.title = structure.name;

    // Aplicar efectos
    applyStructureEffects(structure.effects);

    // Actualizar UI
    updateUI();
    
    console.log(`Construido: ${structure.name} en celda (${cell.element.dataset.row}, ${cell.element.dataset.col})`);
}

/**
 * Aplica los efectos de una estructura a los recursos del juego
 */
function applyStructureEffects(effects) {
    Object.keys(effects).forEach(resource => {
        if (gameState.hasOwnProperty(resource)) {
            gameState[resource] += effects[resource];
            // Asegurar que los valores estén en rangos válidos (0-100)
            gameState[resource] = Math.max(0, Math.min(100, gameState[resource]));
        }
    });
}

// ========== SISTEMA DE TURNOS ==========

/**
 * Avanza al siguiente turno
 */
function nextTurn() {
    if (gameState.gameOver) {
        console.log('Juego terminado, no se puede avanzar turno');
        return;
    }

    gameState.turn++;
    gameState.currentYear += gameConfig.yearsPerTurn;

    // Verificar límite de turnos
    if (gameState.turn > gameConfig.maxTurns) {
        gameState.gameOver = true;
        showEventModal("Límite de Turnos", "Has alcanzado el límite máximo de turnos.");
        return;
    }

    processTurnEvents();
    checkGameEnd();
    updateUI();
    
    // Guardar después de cada turno
    saveManager.saveGame(gameState);
}

/**
 * Procesa los eventos del turno actual
 */
function processTurnEvents() {
    // Verificar eventos climáticos base
    climateEvents.forEach(event => {
        try {
            if (event.condition(gameState.currentYear, gameState.resilience, gameState.turn)) {
                const eventResult = event.effect(gameState);
                handleEventResult(eventResult, event);
            }
        } catch (error) {
            console.error('Error procesando evento climático:', error, event);
        }
    });
    
    // Eventos NASA (10% de probabilidad por turno)
    if (Math.random() < 0.1) {
        const nasaEvent = getRandomNasaEvent();
        if (nasaEvent) {
            try {
                const eventResult = nasaEvent.effect(gameState);
                showEventModal(nasaEvent.name, nasaEvent.description);
                handleEventResult(eventResult, nasaEvent);
            } catch (error) {
                console.error('Error procesando evento NASA:', error, nasaEvent);
            }
        }
    }
    
    // Ingresos base por turno
    gameState.money += 10;
}

/**
 * Maneja los resultados de los eventos
 */
function handleEventResult(eventResult, event) {
    switch (eventResult) {
        case 'FLOOD':
            triggerFlood();
            break;
        case 'STORM_DAMAGE':
            showEventModal("Daño por Tormenta", "La infraestructura de la ciudad ha sufrido daños.");
            break;
        case 'NASA_EVENT_IMPACT':
            showEventModal("Impacto de Evento Real", "Un evento climático real reportado por NASA ha afectado la ciudad.");
            break;
        case 'HEAT_WAVE':
            showEventModal("Ola de Calor", "El consumo energético ha aumentado debido a las altas temperaturas.");
            break;
        case 'POSITIVE_EVENT':
            showEventModal("Evento Positivo", "La conciencia ambiental de la población ha traído beneficios.");
            break;
        default:
            // Evento sin efecto específico
            break;
    }
}

// ========== EVENTOS CLIMÁTICOS ==========

/**
 * Obtiene el nivel del mar actual basado en datos NASA
 */
function getCurrentSeaLevel() {
    // Priorizar datos NASA si están disponibles
    if (gameState.nasaData && gameState.nasaData.seaLevel) {
        const baseRise = gameState.nasaData.seaLevel.currentRise;
        const additionalRise = (gameState.currentYear - new Date().getFullYear()) * 
                              (gameState.nasaData.seaLevel.trend / 1000);
        return baseRise + additionalRise;
    }
    
    // Fallback a datos simulados
    for (let i = seaLevelData.length - 1; i >= 0; i--) {
        if (gameState.currentYear >= seaLevelData[i].year) {
            return seaLevelData[i].rise;
        }
    }
    return 0;
}

/**
 * Activa una inundación en las celdas costeras
 */
function triggerFlood() {
    showEventModal(
        "¡Inundación Costera!",
        "El aumento del nivel del mar ha causado inundaciones en las zonas costeras no protegidas."
    );

    let floodedCells = 0;
    
    gameState.board.forEach(row => {
        row.forEach(cell => {
            if (cell.type === 'coast' && !cell.flooded) {
                // Las celdas con manglares o diques tienen protección
                const hasProtection = cell.structure === 'mangrove' || cell.structure === 'seawall';
                
                if (!hasProtection) {
                    cell.flooded = true;
                    cell.element.classList.add('flooded');
                    cell.element.innerHTML = '💧';
                    floodedCells++;
                    
                    // Penalización por inundación
                    gameState.wellbeing -= 5;
                    gameState.money -= 5;
                }
            }
        });
    });

    if (floodedCells > 0) {
        showEventModal(
            "Zonas Inundadas",
            `${floodedCells} zonas costeras han sido inundadas. Bienestar y economía afectados.`
        );
    }
}

// ========== SISTEMA DE GUARDADO ==========

/**
 * Configura el guardado automático
 */
function setupAutoSave() {
    // Guardar automáticamente cada 2 minutos
    setInterval(() => {
        if (!gameState.gameOver) {
            saveManager.saveGame(gameState);
            showAutoSaveNotification();
        }
    }, saveConfig.autoSaveInterval);
}

/**
 * Muestra notificación de guardado automático
 */
function showAutoSaveNotification() {
    const notification = document.createElement('div');
    notification.className = 'save-notification';
    notification.textContent = '💾 Partida guardada automáticamente';
    document.body.appendChild(notification);
    
    // Animación de entrada
    setTimeout(() => notification.style.opacity = '1', 10);
    
    // Remover después de 2 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 2000);
}

// ========== INTERFAZ DE USUARIO ==========

/**
 * Actualiza la interfaz de usuario
 */
function updateUI() {
    // Actualizar valores numéricos
    document.getElementById('money').textContent = Math.round(gameState.money);
    document.getElementById('wellbeing').textContent = Math.round(gameState.wellbeing);
    document.getElementById('environment').textContent = Math.round(gameState.environment);
    document.getElementById('resilience').textContent = Math.round(gameState.resilience);
    document.getElementById('year').textContent = gameState.currentYear;

    // Actualizar colores de recursos
    updateResourceColors();
    
    // Deshabilitar botones si el juego terminó
    updateButtonStates();
}

/**
 * Actualiza colores de recursos según su nivel
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
            color = '#e74c3c'; // Rojo (crítico)
        } else if (value < 50) {
            color = '#f39c12'; // Naranja (bajo)
        } else if (value < 75) {
            color = '#f1c40f'; // Amarillo (medio)
        } else {
            color = '#2ecc71'; // Verde (bueno)
        }
        
        element.style.color = color;
    });
}

/**
 * Actualiza estados de los botones
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
 * Muestra modal de eventos
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
 * Cierra modal de eventos
 */
function closeEventModal() {
    const modal = document.getElementById('event-modal');
    if (modal) modal.classList.add('hidden');
}

// ========== SISTEMA NASA ==========

/**
 * Inicializa datos de la NASA
 */
async function initNasaData() {
    try {
        console.log('🌍 Inicializando datos NASA en tiempo real...');
        
        const [seaLevelData, climateEvents, temperatureData, co2Data] = await Promise.all([
            nasaService.getSeaLevelData(),
            nasaService.getClimateEvents(3),
            nasaService.getGlobalTemperature(),
            nasaService.getCO2Data()
        ]);
        
        // Actualizar configuración del juego con datos reales
        if (seaLevelData) {
            gameConfig.seaLevelRisePerTurn = seaLevelData.currentRise / 20; // Ajustar para balance del juego
        }
        
        gameState.nasaData = {
            seaLevel: seaLevelData,
            recentEvents: climateEvents,
            temperature: temperatureData,
            co2: co2Data,
            lastUpdated: new Date().toISOString()
        };
        
        console.log('✅ Datos NASA en tiempo real cargados:', gameState.nasaData);
        showNasaDataPanel();
        
    } catch (error) {
        console.error('❌ Error inicializando datos NASA:', error);
        gameState.nasaData = this.getFallbackNasaData();
    }
}

/**
 * Refresca los datos de la NASA y actualiza la interfaz
 */
async function refreshNasaData() {
    console.log("🔄 Actualizando datos NASA...");

    try {
        const [seaLevelData, climateEvents, temperatureData, co2Data] = await Promise.all([
            nasaService.getSeaLevelData(),
            nasaService.getClimateEvents(3),
            nasaService.getGlobalTemperature(),
            nasaService.getCO2Data()
        ]);

        // Actualizamos el estado global
        gameState.nasaData = {
            seaLevel: seaLevelData,
            recentEvents: climateEvents,
            temperature: temperatureData,
            co2: co2Data,
            lastUpdated: new Date().toISOString()
        };

        console.log("✅ Datos NASA actualizados:", gameState.nasaData);

        // Redibujar el panel con la nueva info
        showNasaDataPanel();

    } catch (error) {
        console.error("❌ Error refrescando datos NASA:", error);
        showEventModal("Error", "No se pudieron actualizar los datos de la NASA. Intenta nuevamente más tarde.");
    }
}

// Hacerla accesible globalmente para el botón
window.refreshNasaData = refreshNasaData;

/**
 * Muestra panel de datos NASA en la UI
 */
function showNasaDataPanel() {
    const controlPanel = document.getElementById('control-panel');
    if (!controlPanel) return;
    
	//remover panel si existe
    const existingPanel = document.getElementById('nasa-data-panel');
    if (existingPanel) existingPanel.remove();
    
    const nasaPanel = document.createElement('div');
    nasaPanel.id = 'nasa-data-panel';
    nasaPanel.innerHTML = `
        <h3>🌍 Datos NASA en Tiempo Real</h3>
        <div class="nasa-metrics-grid">
            <div class="nasa-metric ${gameState.nasaData?.seaLevel?.trend > 3.5 ? 'warning' : ''}">
                <div class="metric-icon">🌊</div>
                <div class="metric-info">
                    <div class="metric-value">+${(gameState.nasaData.seaLevel.currentRise * 100).toFixed(1)}cm</div>
                    <div class="metric-label">Nivel del Mar</div>
                    <div class="metric-trend">${gameState.nasaData.seaLevel.trend.toFixed(1)} mm/año</div>
                </div>
            </div>
            
            <div class="nasa-metric ${gameState.nasaData?.temperature?.anomaly > 1.2 ? 'warning' : ''}">
                <div class="metric-icon">🌡️</div>
                <div class="metric-info">
                    <div class="metric-value">+${gameState.nasaData.temperature.anomaly.toFixed(1)}°C</div>
                    <div class="metric-label">Calentamiento</div>
                    <div class="metric-trend">${gameState.nasaData.temperature.trend}°C/década</div>
                </div>
            </div>
            
            <div class="nasa-metric">
                <div class="metric-icon">🏭</div>
                <div class="metric-info">
                    <div class="metric-value">${gameState.nasaData.co2.co2Level.toFixed(0)}</div>
                    <div class="metric-label">CO₂ (ppm)</div>
                    <div class="metric-trend">+${gameState.nasaData.co2.trend} ppm/año</div>
                </div>
            </div>
        </div>
        
        <div class="nasa-events">
            <h4>📡 Eventos Activos</h4>
            ${gameState.nasaData.recentEvents.map(event => `
                <div class="nasa-event ${event.magnitude > 0.7 ? 'high-impact' : ''}">
                    <span class="event-type">${event.type}</span>
                    <span class="event-title">${event.title}</span>
                    <span class="event-magnitude">${'⚠️'.repeat(Math.ceil(event.magnitude * 3))}</span>
                </div>
            `).join('')}
        </div>
        
        <div class="nasa-footer">
            <small>Última actualización: ${new Date(gameState.nasaData.lastUpdated).toLocaleTimeString()}</small>
            <button onclick="refreshNasaData()" class="refresh-btn">🔄 Actualizar</button>
        </div>
    `;
    
    controlPanel.appendChild(nasaPanel);
}

/**
 * Obtiene un evento aleatorio de la NASA
 */
function getRandomNasaEvent() {
    if (!gameState.nasaData || !gameState.nasaData.recentEvents || gameState.nasaData.recentEvents.length === 0) {
        return null;
    }
    
    const randomEvent = gameState.nasaData.recentEvents[
        Math.floor(Math.random() * gameState.nasaData.recentEvents.length)
    ];
    
    return {
        name: `Evento NASA: ${randomEvent.title}`,
        description: `Basado en datos satelitales recientes. ${randomEvent.title} reportado por NASA EONET.`,
        effect: (gameState) => {
            // Efecto más severo para eventos reales
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
    // Buscar contenedores en tu HTML
    const statsContent = document.getElementById("stats-content");

    if (!statsContent) return;

    statsContent.innerHTML = `
        <h3>🌍 Datos NASA Actualizados</h3>
        <p><strong>🌊 Nivel del Mar:</strong> ${seaLevel.currentRise.toFixed(2)} m (tendencia: ${seaLevel.trend.toFixed(2)} mm/año)</p>
        <p><strong>🌡️ Temperatura Global:</strong> +${temp.anomaly.toFixed(2)} °C (tendencia: ${temp.trend.toFixed(2)} °C/año)</p>
        <p><strong>🌫️ CO₂ Atmosférico:</strong> ${co2.co2Level.toFixed(1)} ppm (tendencia: ${co2.trend.toFixed(1)} ppm/año)</p>
        <h4>🌪️ Últimos eventos climáticos</h4>
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


// ========== GESTIÓN DEL JUEGO ==========

/**
 * Verifica condiciones de fin del juego
 */
function checkGameEnd() {
    // Condición de derrota
    if (gameState.wellbeing <= defeatConditions.minWellbeing || 
        gameState.money <= defeatConditions.minMoney || 
        gameState.environment <= defeatConditions.minEnvironment) {
        
        gameState.gameOver = true;
        saveManager.saveGameStats(gameState);
        saveManager.clearSave();
        
        const randomMessage = gameTexts.defeat[Math.floor(Math.random() * gameTexts.defeat.length)];
        showEventModal("Juego Terminado - Derrota", randomMessage);
        return;
    }

    // Condición de victoria
    if (gameState.currentYear >= victoryConditions.minYear && 
        gameState.wellbeing >= victoryConditions.minWellbeing && 
        gameState.resilience >= victoryConditions.minResilience &&
        gameState.environment >= victoryConditions.minEnvironment) {
        
        gameState.gameOver = true;
        saveManager.saveGameStats(gameState);
        saveManager.clearSave();
        
        const randomMessage = gameTexts.victory[Math.floor(Math.random() * gameTexts.victory.length)];
        showEventModal("¡Victoria!", randomMessage);
        return;
    }

    // Victoria por tiempo (llegar a 2100)
    if (gameState.currentYear >= 2100) {
        gameState.gameOver = true;
        saveManager.saveGameStats(gameState);
        saveManager.clearSave();
        
        const score = saveManager.calculateScore(gameState);
        if (score >= 200) {
            showEventModal("¡Éxito Sostenible!", "Has guiado a la ciudad a través de 76 años de cambios climáticos. Tu gestión balanceada ha asegurado un futuro próspero.");
        } else {
            showEventModal("Fin del Juego", `Has llegado al año 2100. La ciudad sobrevive, pero podría haberlo hecho mejor. Puntuación final: ${Math.round(score)}`);
        }
    }
}

/**
 * Muestra prompt para cargar partida
 */
function showLoadGamePrompt() {
    if (confirm('¿Deseas continuar tu partida guardada?')) {
        showEventModal(
            "Partida Cargada", 
            `Bienvenido de nuevo. Continuamos en el año ${gameState.currentYear}.`
        );
    } else {
        // Iniciar nueva partida
        saveManager.clearSave();
        location.reload();
    }
}

// ========== CONTROLES DE GUARDADO ==========

/**
 * Guarda la partida manualmente
 */
function manualSave() {
    if (saveManager.saveGame(gameState)) {
        showEventModal("Partida Guardada", "Tu progreso ha sido guardado exitosamente.");
    } else {
        showEventModal("Error", "No se pudo guardar la partida. Intenta nuevamente.");
    }
}

/**
 * Carga partida manualmente
 */
function manualLoad() {
    if (saveManager.hasSavedGame()) {
        if (confirm('¿Cargar partida guardada? Se perderá el progreso actual.')) {
            location.reload();
        }
    } else {
        alert('No hay partida guardada.');
    }
}

/**
 * Inicia nuevo juego
 */
function newGame() {
    if (confirm('¿Iniciar nueva partida? Se perderá el progreso no guardado.')) {
        saveManager.clearSave();
        location.reload();
    }
}

/**
 * Reinicia el juego
 */
function restartGame() {
    if (confirm("¿Estás seguro de que quieres reiniciar el juego?")) {
        location.reload();
    }
}

// ========== SISTEMA DE ESTADÍSTICAS ==========

/**
 * Muestra estadísticas de partidas
 */
function viewStats() {
    const stats = saveManager.loadGameStats();
    const statsContent = document.getElementById('stats-content');
    const statsModal = document.getElementById('stats-modal');
    
    if (!statsContent || !statsModal) {
        alert('Error: No se pudo cargar el sistema de estadísticas.');
        return;
    }
    
    let html = `<h3>Resumen de Partidas</h3>`;
    
    if (stats.sessions.length === 0) {
        html += `<p>No hay estadísticas de partidas anteriores.</p>`;
    } else {
        const totalGames = stats.sessions.length;
        const victories = stats.sessions.filter(s => s.outcome === 'victory').length;
        const defeats = stats.sessions.filter(s => s.outcome === 'defeat').length;
        const bestScore = Math.max(...stats.sessions.map(s => s.finalScore));
        
        html += `
            <div class="stats-summary">
                <p><strong>Total de partidas:</strong> ${totalGames}</p>
                <p><strong>Victorias:</strong> ${victories}</p>
                <p><strong>Derrotas:</strong> ${defeats}</p>
                <p><strong>Mejor puntuación:</strong> ${bestScore}</p>
            </div>
            <h4>Historial:</h4>
            <div class="sessions-list">
                ${stats.sessions.slice().reverse().map(session => `
                    <div class="session-item">
                        <strong>${new Date(session.date).toLocaleDateString()}</strong>
                        - Año: ${session.finalYear} 
                        - Puntuación: ${session.finalScore}
                        - ${session.outcome === 'victory' ? '🏆 Victoria' : session.outcome === 'defeat' ? '💀 Derrota' : '⏸️ Incompleta'}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    statsContent.innerHTML = html;
    statsModal.classList.remove('hidden');
}

/**
 * Cierra modal de estadísticas
 */
function closeStatsModal() {
    const statsModal = document.getElementById('stats-modal');
    if (statsModal) statsModal.classList.add('hidden');
}

/**
 * Exporta partida actual
 */
function exportSave() {
    if (saveManager.exportSave()) {
        alert('Partida exportada exitosamente.');
    } else {
        alert('No hay partida para exportar.');
    }
}

/**
 * Importa partida desde archivo
 */
async function importSave(file) {
    if (!file) return;
    
    try {
        await saveManager.importSave(file);
        alert('Partida importada exitosamente. Recarga la página para jugar.');
    } catch (error) {
        alert('Error importando partida: ' + error.message);
    }
}

// ========== EVENT LISTENERS ==========

/**
 * Configura event listeners
 */
function setupEventListeners() {
    // Teclado shortcuts
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

    // Prevenir acciones por defecto en modales
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });
}

// Consultar IA
async function consultAI() {
    const state = {
        turno: gameState.turn,
        recursos: gameState.resources,
        resiliencia: gameState.resilience,
        bienestar: gameState.wellbeing,
        nasa: gameState.nasaData
    };

    // Prompt básico (esto luego se conecta con la IA real)
    const aiPrompt = `
        Estado actual del juego:
        - Turno: ${state.turno}
        - Recursos: ${JSON.stringify(state.recursos)}
        - Resiliencia: ${state.resiliencia}
        - Bienestar: ${state.bienestar}
        - Datos NASA: ${JSON.stringify(state.nasa)}

        Actúa como un asesor experto en gestión climática y urbanística.
        Da una recomendación clara y estructurada de qué acciones
        debería tomar el jugador para sobrevivir y proteger la costa.
    `;

    // 🔮 Aquí llamarías a la IA real (API de OpenAI u otro motor).
    // Por ahora simulamos la respuesta:
   /*  const fakeAIResponse = `
        📊 Análisis de la IA:
        - Los niveles del mar están aumentando de forma acelerada.
        - Tu resiliencia actual (${state.resiliencia}) es insuficiente.
        - Prioriza la construcción de diques y manglares en las zonas costeras.
        - Invierte recursos en reducir la contaminación para frenar futuros eventos.

        ✅ Recomendación: dedica los próximos 2 turnos a reforzar la costa
        antes de expandir otras infraestructuras.
    `; */

 /*    document.getElementById("ai-response").innerHTML = `<pre>${fakeAIResponse}</pre>`;
    document.getElementById("ai-modal").classList.remove("hidden"); */

        // Mostrar mensaje de carga
    document.getElementById("ai-response").innerHTML = `<p>🔄 Consultando a la IA...</p>`;
    document.getElementById("ai-modal").classList.remove("hidden");

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}` // Necesitas definir esta variable en tu entorno
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "Eres un asesor climático experto en resiliencia costera." },
                    { role: "user", content: aiPrompt }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error.message);
        }

        const aiText = data.choices[0].message.content;

        document.getElementById("ai-response").innerHTML = `<pre>${aiText}</pre>`;
    } catch (error) {
        console.error("Error al consultar la IA:", error);
        document.getElementById("ai-response").innerHTML = `
            <p style="color:red;">❌ Error al consultar la IA:<br>${error.message}</p>
        `;
    }
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