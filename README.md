# 🌊 Coastal Savior - NASA Space Apps Challenge 2025

## Data Pathways to Healthy Cities and Human Settlements

An interactive climate simulation game that integrates real-time NASA Earth observation data to teach coastal urban planning and climate resilience.

![Coastal Savior Game](https://img.shields.io/badge/NASA-Space%20Apps%20Challenge-blue) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow) ![HTML5](https://img.shields.io/badge/HTML5-CSS3-orange)

## 🎯 Project Overview

**Coastal Savior** addresses NASA's "Data Pathways to Healthy Cities" challenge by creating an engaging educational tool that demonstrates how NASA Earth observation data can inform sustainable urban planning decisions. Players manage a coastal city through climate change scenarios while balancing economic development, community wellbeing, and environmental protection.

## 🚀 Live Demo

🔗 [Play Coastal Savior](https://your-username.github.io/nasa-challenge-2025/)

## ✨ Key Features

### 🛰️ Real-Time NASA API Integration
- **EONET Climate Events**: Live climate disasters from NASA's Earth Observatory
- **Jason-3 Sea Level Data**: Real-time satellite altimetry measurements  
- **GISS Temperature Analysis**: Global temperature anomaly data
- **OCO-2 CO2 Measurements**: Atmospheric carbon dioxide levels

### 🎮 Interactive Gameplay
- **6x6 Grid Board**: Strategic coastal and inland area management
- **Resource Management**: Balance budget (💰), wellbeing (😊), environment (🌿), and resilience (🛡️)
- **Building System**: Construct residential zones, industrial areas, mangroves, and sea walls
- **Climate Events**: Dynamic disasters based on real NASA data patterns

### 💾 Advanced Save System
- **Auto-save**: Automatic progress saving every 2 minutes
- **Manual Controls**: Save/load game states
- **Statistics Tracking**: Performance analytics across multiple playthroughs
- **Import/Export**: Backup and restore game data

### 🤖 AI Climate Advisor
- **Strategic Recommendations**: AI-powered analysis of game state and NASA data
- **Real-time Guidance**: Context-aware advice for optimal city planning

## 🏗️ Technical Implementation

### Project Structure
```
nasa-challenge-2025/
├── index.html              # Main game interface
├── styles.css              # Visual styling and animations
├── game.js                 # Core game logic and mechanics
├── nasa-api.js             # NASA API integration and data processing
├── save-manager.js         # Save/load system and statistics
├── data.js                 # Game configuration and static data
└── README.md               # Project documentation
```

### Core Technologies

#### Frontend
- **HTML5**: Semantic structure with accessibility features
- **CSS3**: Advanced styling with animations and responsive design
  - CSS Grid for board layout
  - Flexbox for UI components
  - Gradient animations for ocean theme
  - Mobile-responsive design

#### JavaScript (ES6+)
- **Modular Architecture**: Separated concerns across multiple files
- **Async/Await**: Modern API handling
- **LocalStorage**: Client-side data persistence
- **Event-Driven**: Interactive user interface

#### NASA APIs
- **EONET**: Earth Observatory Natural Event Tracker
- **Jason-3**: Sea level altimetry data
- **GISS**: Global temperature analysis
- **OCO-2**: Carbon dioxide measurements

### Key Classes and Systems

#### NasaApiService (`nasa-api.js`)
```javascript
class NasaApiService {
    constructor() {
        this.apiKey = this.getApiKey();
        this.cache = new Map();
        this.cacheDuration = 1000 * 60 * 30; // 30 minutes
    }
    
    async getClimateEvents(limit = 5)
    async getSeaLevelData()
    async getGlobalTemperature()
    async getCO2Data()
}
```

#### SaveManager (`save-manager.js`)
```javascript
class SaveManager {
    saveGame(gameState)
    loadGame()
    saveGameStats(gameState)
    exportSave()
    importSave(file)
}
```

#### Game State Management (`game.js`)
```javascript
const gameState = {
    money: number,
    wellbeing: number,
    environment: number,
    resilience: number,
    currentYear: number,
    turn: number,
    board: Array<Array<Cell>>,
    nasaData: Object
};
```

### Data Processing Pipeline

1. **API Data Retrieval**: Fetch live NASA data with error handling
2. **Data Validation**: Ensure data integrity and format consistency
3. **Cache Management**: 30-minute cache to optimize performance
4. **Game Integration**: Transform scientific data into game mechanics
5. **UI Updates**: Real-time visualization of climate conditions

### Error Handling and Resilience

- **Fallback Systems**: Offline mode with simulated data
- **Graceful Degradation**: Game continues if APIs are unavailable
- **Data Validation**: Robust error checking at all levels
- **User Feedback**: Clear error messages and recovery options

## 🎮 How to Play

### Objective
Guide your coastal city from 2025 to 2060+ while maintaining:
- **Wellbeing** ≥ 60 (happy citizens)
- **Resilience** ≥ 50 (climate protection)
- **Environment** ≥ 40 (ecosystem health)
- **Budget** > 0 (economic sustainability)

### Building Options
- 🏠 **Residential Zones** (+Wellbeing, -Environment, 20 cost)
- 🏭 **Industrial Areas** (+Money, -Environment, 30 cost)
- 🟢 **Mangrove Restoration** (+Environment, +Resilience, 15 cost)
- 🛡️ **Sea Wall Protection** (+Resilience, 25 cost)

### Gameplay Mechanics
1. **Select cells** on the 6x6 grid (coastal areas in blue)
2. **Build strategically** considering NASA climate data
3. **Advance turns** (5-year intervals) to see climate impacts
4. **Respond to events** based on real NASA satellite observations
5. **Balance resources** to achieve victory conditions

## 🛠️ Installation & Setup

### Local Development
```bash
# Clone the repository
git clone https://github.com/your-username/nasa-challenge-2025.git

# Navigate to project directory
cd nasa-challenge-2025

# Serve locally (Python 3)
python -m http.server 8000

# Or with Node.js
npx serve .

# Open in browser
open http://localhost:8000
```

### GitHub Pages Deployment
The project includes automated deployment via GitHub Actions:
- Push to `main` branch triggers automatic deployment
- Live site available at: `https://username.github.io/nasa-challenge-2025/`

### API Configuration
```javascript
// Optional: Add your NASA API key for higher rate limits
const NASA_API_KEY = 'your_api_key_here';

// Or use environment configuration
window.nasaConfig = {
    apiKey: 'your_api_key_here'
};
```

## 📊 NASA Data Integration

### Real-Time Climate Events (EONET)
```javascript
const response = await fetch(
    `https://eonet.gsfc.nasa.gov/api/v3/events?limit=5&days=30&category=severeStorms,floods,seaLakeIce,wildfires`
);
```

### Sea Level Monitoring (Jason-3)
- **Current Rise**: Calculated from 1993 baseline
- **Trend Analysis**: mm/year measurements
- **Future Projections**: Integrated into game mechanics

### Global Temperature (GISS)
- **Anomaly Data**: Deviation from 20th century average
- **Trend Calculations**: Decadal warming rates
- **Heat Wave Events**: Triggered by temperature thresholds

### Atmospheric CO2 (OCO-2)
- **Current Levels**: Parts per million measurements
- **Emission Trends**: Annual increase rates
- **Climate Impact**: Affects event probability

## 🎯 Educational Impact

### Learning Objectives
- **Data Literacy**: Interpreting NASA Earth observation data
- **Systems Thinking**: Understanding climate-development interactions
- **Decision Making**: Balancing competing urban planning priorities
- **Climate Awareness**: Real-world consequences of environmental choices

### Target Audience
- **Urban Planners**: Professional development tool
- **Students**: Climate science and geography education
- **Policymakers**: Understanding data-driven decision making
- **General Public**: Climate change awareness and engagement

## 🏆 NASA Challenge Alignment

### "Data Pathways to Healthy Cities"
✅ **Real NASA Data Integration**: Live EONET, Jason-3, GISS, and OCO-2 APIs  
✅ **Urban Planning Focus**: Coastal city development scenarios  
✅ **Human-Environment Balance**: Wellbeing vs. environmental protection  
✅ **Climate Resilience**: Sea level rise and extreme weather adaptation  
✅ **Educational Tool**: Accessible interface for complex climate data  
✅ **Decision Support**: AI-powered recommendations based on NASA data  

## 🤝 Contributing

We welcome contributions to improve Coastal Savior:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow ES6+ JavaScript standards
- Maintain responsive design principles
- Test with real NASA API data
- Document new features thoroughly
- Ensure accessibility compliance

## 📈 Future Enhancements

### Planned Features
- 🗺️ **Multiple Cities**: Different coastal regions worldwide
- 👥 **Multiplayer Mode**: Collaborative urban planning
- 📱 **Mobile App**: Native iOS/Android versions
- 🎓 **Curriculum Integration**: Classroom lesson plans
- 📊 **Advanced Analytics**: Detailed performance metrics
- 🌐 **Localization**: Multi-language support

### Technical Roadmap
- **WebGL Visualization**: 3D city rendering
- **Machine Learning**: Predictive climate modeling
- **Real-time Collaboration**: Shared planning sessions
- **VR Integration**: Immersive city exploration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NASA Earth Science Division**: For providing open access to critical climate data
- **NASA Space Apps Challenge**: For inspiring innovative uses of Earth observation data
- **EONET Team**: Real-time climate event tracking system
- **Jason-3 Mission**: Sea level altimetry measurements
- **GISS Team**: Global temperature analysis
- **OCO-2 Mission**: Atmospheric CO2 monitoring

## 📞 Contact

**Team**: Coastal Savior Development Team  
**Linkedin**: https://www.linkedin.com/in/luis-federico-s%C3%A1nchez/
**NASA Space Apps**: [Challenge Submission Page](https://www.spaceappschallenge.org/2025/find-a-team/star-field/)  

---

*Built with 🌊 for NASA Space Apps Challenge 2025*  
*Making climate data accessible, one city at a time.*
