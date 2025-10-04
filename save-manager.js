// save-manager.js - Save System with localStorage

class SaveManager {
    constructor() {
        this.saveKey = 'coastal_savior_save';
        this.statsKey = 'coastal_savior_stats';
        this.backupKey = 'coastal_savior_backup';
        this.version = '1.0.0';
    }

    /**
     * Obtener configuración del juego de forma segura
     */
    getGameConfig() {
        // Usar valores por defecto si gameConfig no está disponible
        return typeof gameConfig !== 'undefined' ? gameConfig : {
            initialMoney: 100,
            initialWellbeing: 50,
            initialEnvironment: 50,
            initialResilience: 20,
            initialYear: 2025
        };
    }

    /**
     * Guardar estado completo del juego
     */
    saveGame(gameState) {
        try {
            // Validar estado del juego antes de guardar
            if (!this.validateGameState(gameState)) {
                console.error('Estado del juego inválido para guardar');
                return false;
            }

            const saveData = {
                timestamp: new Date().toISOString(),
                version: this.version,
                gameState: this.prepareGameStateForSave(gameState)
            };
            
            // Crear backup antes de guardar
            this.createBackup();
            
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            console.log('Juego guardado exitosamente');
            return true;
            
        } catch (error) {
            console.error('Error guardando el juego:', error);
            // Intentar restaurar desde backup
            this.restoreFromBackup();
            return false;
        }
    }

    /**
     * Cargar juego guardado
     */
    loadGame() {
        try {
            const savedData = localStorage.getItem(this.saveKey);
            if (!savedData) {
                console.log('No hay partida guardada');
                return null;
            }

            const parsedData = JSON.parse(savedData);
            
            // Verificar versión y estructura
            if (!this.validateSaveData(parsedData)) {
                console.warn('Datos de guardado inválidos o versión incompatible');
                this.clearSave();
                return null;
            }

            console.log('Juego cargado exitosamente');
            return this.restoreGameState(parsedData.gameState);

        } catch (error) {
            console.error('Error cargando el juego:', error);
            // Intentar cargar desde backup
            const backupData = this.loadFromBackup();
            if (backupData) {
                console.log('Cargado desde backup');
                return backupData;
            }
            this.clearSave();
            return null;
        }
    }

    /**
     * Validar datos de guardado
     */
    validateSaveData(saveData) {
        return saveData && 
               saveData.version && 
               saveData.gameState && 
               saveData.timestamp &&
               this.validateGameState(saveData.gameState);
    }

    /**
     * Validar estado del juego
     */
    validateGameState(gameState) {
        if (!gameState) return false;
        
        const requiredProps = ['money', 'wellbeing', 'environment', 'resilience', 'currentYear', 'turn', 'gameOver', 'board'];
        const hasRequiredProps = requiredProps.every(prop => prop in gameState);
        
        if (!hasRequiredProps) {
            console.error('Faltan propiedades requeridas en el estado del juego');
            return false;
        }

        // Validar tipos básicos
        if (typeof gameState.money !== 'number' || 
            typeof gameState.wellbeing !== 'number' ||
            typeof gameState.environment !== 'number' ||
            typeof gameState.resilience !== 'number') {
            console.error('Propiedades numéricas inválidas');
            return false;
        }

        // Validar tablero
        if (!Array.isArray(gameState.board) || gameState.board.length !== 6) {
            console.error('Estructura de tablero inválida');
            return false;
        }

        return true;
    }

    /**
     * Preparar estado para guardado (eliminar elementos no serializables)
     */
    prepareGameStateForSave(gameState) {
        const saveState = {
            money: gameState.money,
            wellbeing: gameState.wellbeing,
            environment: gameState.environment,
            resilience: gameState.resilience,
            currentYear: gameState.currentYear,
            turn: gameState.turn,
            gameOver: gameState.gameOver,
            board: this.prepareBoardForSave(gameState.board),
            nasaData: gameState.nasaData,
            lastSaved: new Date().toISOString()
        };

        // Limpiar valores undefined/null
        Object.keys(saveState).forEach(key => {
            if (saveState[key] === undefined || saveState[key] === null) {
                delete saveState[key];
            }
        });

        return saveState;
    }

    /**
     * Preparar tablero para guardado
     */
    prepareBoardForSave(board) {
        if (!Array.isArray(board)) return [];

        return board.map(row => {
            if (!Array.isArray(row)) return [];
            
            return row.map(cell => {
                if (!cell || typeof cell !== 'object') return { type: 'land', structure: null, flooded: false };
                
                return {
                    type: cell.type || 'land',
                    structure: cell.structure || null,
                    flooded: Boolean(cell.flooded)
                    // No guardamos el elemento DOM u otras referencias no serializables
                };
            });
        });
    }

    /**
     * Restaurar estado del juego
     */
    restoreGameState(savedState) {
        const config = this.getGameConfig();
        
        const restoredState = {
            money: this.sanitizeNumber(savedState.money, config.initialMoney),
            wellbeing: this.sanitizeNumber(savedState.wellbeing, config.initialWellbeing),
            environment: this.sanitizeNumber(savedState.environment, config.initialEnvironment),
            resilience: this.sanitizeNumber(savedState.resilience, config.initialResilience),
            currentYear: this.sanitizeNumber(savedState.currentYear, config.initialYear),
            turn: this.sanitizeNumber(savedState.turn, 0),
            board: this.restoreBoard(savedState.board),
            selectedCell: null,
            gameOver: Boolean(savedState.gameOver),
            nasaData: savedState.nasaData || null
        };

        // Validar estado restaurado
        if (!this.validateGameState(restoredState)) {
            throw new Error('Estado restaurado inválido');
        }

        return restoredState;
    }

    /**
     * Sanitizar números
     */
    sanitizeNumber(value, defaultValue) {
        const num = Number(value);
        return isNaN(num) ? defaultValue : Math.max(0, num);
    }

    /**
     * Restaurar tablero
     */
    restoreBoard(savedBoard) {
        if (!Array.isArray(savedBoard) || savedBoard.length !== 6) {
            console.warn('Estructura de tablero guardado inválida, creando nuevo tablero');
            return this.createEmptyBoard();
        }

        return savedBoard.map((row, rowIndex) => {
            if (!Array.isArray(row) || row.length !== 6) {
                return this.createEmptyBoardRow(rowIndex);
            }

            return row.map((cell, colIndex) => {
                const baseCell = this.createEmptyBoardCell(rowIndex, colIndex);
                
                return {
                    ...baseCell,
                    type: cell.type || baseCell.type,
                    structure: cell.structure || null,
                    flooded: Boolean(cell.flooded)
                };
            });
        });
    }

    /**
     * Crear tablero vacío
     */
    createEmptyBoard() {
        const board = [];
        for (let row = 0; row < 6; row++) {
            board.push(this.createEmptyBoardRow(row));
        }
        return board;
    }

    /**
     * Crear fila de tablero vacía
     */
    createEmptyBoardRow(row) {
        const rowCells = [];
        for (let col = 0; col < 6; col++) {
            rowCells.push(this.createEmptyBoardCell(row, col));
        }
        return rowCells;
    }

    /**
     * Crear celda de tablero vacía
     */
    createEmptyBoardCell(row, col) {
        return {
            element: null, // Se asignará cuando se cree el DOM
            type: row >= 4 ? 'coast' : 'land',
            structure: null,
            flooded: false
        };
    }

    /**
     * Guardar estadísticas del juego
     */
    saveGameStats(gameState) {
        try {
            const stats = this.loadGameStats();
            const gameSession = {
                id: this.generateSessionId(),
                date: new Date().toISOString(),
                finalYear: gameState.currentYear,
                finalScore: this.calculateScore(gameState),
                turns: gameState.turn,
                outcome: this.determineOutcome(gameState),
                resources: {
                    money: gameState.money,
                    wellbeing: gameState.wellbeing,
                    environment: gameState.environment,
                    resilience: gameState.resilience
                }
            };

            stats.sessions.push(gameSession);
            
            // Mantener solo las últimas 20 sesiones
            if (stats.sessions.length > 20) {
                stats.sessions = stats.sessions.slice(-20);
            }

            // Ordenar por fecha (más reciente primero)
            stats.sessions.sort((a, b) => new Date(b.date) - new Date(a.date));

            localStorage.setItem(this.statsKey, JSON.stringify(stats));
            console.log('Estadísticas guardadas exitosamente');
            return true;

        } catch (error) {
            console.error('Error guardando estadísticas:', error);
            return false;
        }
    }

    /**
     * Generar ID de sesión único
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Determinar resultado del juego
     */
    determineOutcome(gameState) {
        if (!gameState.gameOver) return 'incomplete';
        
        if (gameState.currentYear >= 2060 && 
            gameState.wellbeing >= 60 && 
            gameState.resilience >= 50) {
            return 'victory';
        }
        
        if (gameState.wellbeing <= 0 || gameState.money <= 0 || gameState.environment <= 0) {
            return 'defeat';
        }
        
        return 'timeout'; // Llegó al año 2100 sin victoria/derrota clara
    }

    /**
     * Cargar estadísticas
     */
    loadGameStats() {
        try {
            const stats = localStorage.getItem(this.statsKey);
            const parsedStats = stats ? JSON.parse(stats) : { sessions: [] };
            
            // Validar estructura
            if (!parsedStats.sessions || !Array.isArray(parsedStats.sessions)) {
                return { sessions: [] };
            }
            
            return parsedStats;
            
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            return { sessions: [] };
        }
    }

    /**
     * Calcular puntuación
     */
    calculateScore(gameState) {
        const score = Math.round(
            gameState.wellbeing + 
            gameState.money / 10 + 
            gameState.environment + 
            gameState.resilience
        );
        return Math.max(0, score);
    }

    /**
     * Verificar si hay partida guardada
     */
    hasSavedGame() {
        try {
            return localStorage.getItem(this.saveKey) !== null;
        } catch (error) {
            console.error('Error verificando partida guardada:', error);
            return false;
        }
    }

    /**
     * Obtener información de la partida guardada
     */
    getSaveInfo() {
        try {
            const savedData = localStorage.getItem(this.saveKey);
            if (!savedData) return null;

            const parsedData = JSON.parse(savedData);
            return {
                timestamp: parsedData.timestamp,
                version: parsedData.version,
                year: parsedData.gameState.currentYear,
                turn: parsedData.gameState.turn
            };
        } catch (error) {
            console.error('Error obteniendo información de guardado:', error);
            return null;
        }
    }

    /**
     * Limpiar guardado
     */
    clearSave() {
        try {
            localStorage.removeItem(this.saveKey);
            console.log('Partida guardada eliminada');
            return true;
        } catch (error) {
            console.error('Error eliminando partida guardada:', error);
            return false;
        }
    }

    /**
     * Limpiar estadísticas
     */
    clearStats() {
        try {
            localStorage.removeItem(this.statsKey);
            console.log('Estadísticas eliminadas');
            return true;
        } catch (error) {
            console.error('Error eliminando estadísticas:', error);
            return false;
        }
    }

    /**
     * Crear backup
     */
    createBackup() {
        try {
            const currentSave = localStorage.getItem(this.saveKey);
            if (currentSave) {
                localStorage.setItem(this.backupKey, currentSave);
            }
        } catch (error) {
            console.warn('No se pudo crear backup:', error);
        }
    }

    /**
     * Cargar desde backup
     */
    loadFromBackup() {
        try {
            const backupData = localStorage.getItem(this.backupKey);
            if (!backupData) return null;

            const parsedData = JSON.parse(backupData);
            if (this.validateSaveData(parsedData)) {
                return this.restoreGameState(parsedData.gameState);
            }
            return null;
        } catch (error) {
            console.warn('Error cargando desde backup:', error);
            return null;
        }
    }

    /**
     * Restaurar desde backup
     */
    restoreFromBackup() {
        try {
            const backupData = localStorage.getItem(this.backupKey);
            if (backupData) {
                localStorage.setItem(this.saveKey, backupData);
                console.log('Backup restaurado exitosamente');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error restaurando desde backup:', error);
            return false;
        }
    }

    /**
     * Exportar partida (para backup)
     */
    exportSave() {
        try {
            const saveData = localStorage.getItem(this.saveKey);
            if (saveData) {
                const blob = new Blob([saveData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `coastal-savior-backup-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error exportando partida:', error);
            return false;
        }
    }

    /**
     * Importar partida
     */
    importSave(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // Validar estructura básica
                    if (!this.validateSaveData(importedData)) {
                        reject(new Error('Archivo de guardado inválido o incompatible'));
                        return;
                    }

                    // Crear backup antes de importar
                    this.createBackup();
                    
                    localStorage.setItem(this.saveKey, JSON.stringify(importedData));
                    console.log('Partida importada exitosamente');
                    resolve(true);
                    
                } catch (error) {
                    reject(new Error('Error procesando archivo: ' + error.message));
                }
            };
            reader.onerror = () => reject(new Error('Error leyendo archivo'));
            reader.readAsText(file);
        });
    }

    /**
     * Obtener información del almacenamiento
     */
    getStorageInfo() {
        try {
            const saveSize = localStorage.getItem(this.saveKey)?.length || 0;
            const statsSize = localStorage.getItem(this.statsKey)?.length || 0;
            
            return {
                hasSave: this.hasSavedGame(),
                saveSize: `${(saveSize / 1024).toFixed(2)} KB`,
                statsSize: `${(statsSize / 1024).toFixed(2)} KB`,
                totalSessions: this.loadGameStats().sessions.length
            };
        } catch (error) {
            console.error('Error obteniendo información de almacenamiento:', error);
            return null;
        }
    }
}

// Instancia global del gestor de guardado con manejo de errores
let saveManager;

try {
    saveManager = new SaveManager();
} catch (error) {
    console.error('Error creando SaveManager:', error);
    // Crear una versión mínima como fallback
    saveManager = {
        saveGame: () => false,
        loadGame: () => null,
        hasSavedGame: () => false,
        clearSave: () => false
    };
}

// Hacer disponible globalmente
window.saveManager = saveManager;