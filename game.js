// AI Snake Revival - Modern AI meets Classic Gaming
class AISnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        // Game state
        this.snake = [{ x: 10, y: 10 }];
        this.food = { x: 15, y: 15 };
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.level = 1;
        this.gameRunning = false;
        this.gameSpeed = 150;
        
        // AI features
        this.aiPredict = true;
        this.aiGhost = false;
        this.aiAdapt = true;
        this.ghostSnake = [];
        this.predictedPath = [];
        this.difficultyHistory = [];
        
        // High score persistence
        this.highScore = localStorage.getItem('aiSnakeHighScore') || 0;
        
        this.initializeGame();
        this.setupEventListeners();
        this.updateUI();
    }
    
    initializeGame() {
        this.showOverlay('READY?', 'Press any arrow key to start!');
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
                this.startGame();
            }
            
            if (e.code === 'Space') {
                e.preventDefault();
                if (!this.gameRunning) {
                    this.resetGame();
                }
            }
            
            this.handleInput(e.code);
        });
        
        // AI feature toggles
        document.getElementById('aiPredict').addEventListener('change', (e) => {
            this.aiPredict = e.target.checked;
        });
        
        document.getElementById('aiGhost').addEventListener('change', (e) => {
            this.aiGhost = e.target.checked;
            if (this.aiGhost) {
                this.initializeGhostSnake();
            } else {
                this.ghostSnake = [];
            }
        });
        
        document.getElementById('aiAdapt').addEventListener('change', (e) => {
            this.aiAdapt = e.target.checked;
        });
    }
    
    handleInput(keyCode) {
        if (!this.gameRunning) return;
        
        const directions = {
            'ArrowUp': { dx: 0, dy: -1 },
            'ArrowDown': { dx: 0, dy: 1 },
            'ArrowLeft': { dx: -1, dy: 0 },
            'ArrowRight': { dx: 1, dy: 0 },
            'KeyW': { dx: 0, dy: -1 },
            'KeyS': { dx: 0, dy: 1 },
            'KeyA': { dx: -1, dy: 0 },
            'KeyD': { dx: 1, dy: 0 }
        };
        
        const direction = directions[keyCode];
        if (direction) {
            // Prevent reverse direction
            if (direction.dx !== -this.dx || direction.dy !== -this.dy) {
                this.dx = direction.dx;
                this.dy = direction.dy;
            }
        }
    }
    
    startGame() {
        this.gameRunning = true;
        this.hideOverlay();
        if (this.aiGhost) {
            this.initializeGhostSnake();
        }
    }
    
    resetGame() {
        this.snake = [{ x: 10, y: 10 }];
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.level = 1;
        this.gameSpeed = 150;
        this.ghostSnake = [];
        this.predictedPath = [];
        this.difficultyHistory = [];
        this.generateFood();
        this.gameRunning = false;
        this.updateUI();
        this.showOverlay('READY?', 'Press any arrow key to start!');
    }
    
    // AI Feature: Smart Food Placement
    generateFood() {
        if (this.aiPredict) {
            this.generateSmartFood();
        } else {
            this.generateRandomFood();
        }
    }
    
    generateSmartFood() {
        const head = this.snake[0];
        const possiblePositions = [];
        
        // Generate positions that are strategic but not too easy
        for (let x = 0; x < this.tileCount; x++) {
            for (let y = 0; y < this.tileCount; y++) {
                if (!this.isSnakePosition(x, y)) {
                    const distance = Math.abs(x - head.x) + Math.abs(y - head.y);
                    // Prefer positions that are 3-8 moves away
                    if (distance >= 3 && distance <= 8) {
                        possiblePositions.push({ x, y, distance });
                    }
                }
            }
        }
        
        if (possiblePositions.length > 0) {
            // Sort by distance and add some randomness
            possiblePositions.sort((a, b) => a.distance - b.distance);
            const topChoices = possiblePositions.slice(0, Math.min(5, possiblePositions.length));
            this.food = topChoices[Math.floor(Math.random() * topChoices.length)];
        } else {
            this.generateRandomFood();
        }
    }
    
    generateRandomFood() {
        do {
            this.food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.isSnakePosition(this.food.x, this.food.y));
    }
    
    // AI Feature: Ghost Snake (AI Opponent)
    initializeGhostSnake() {
        this.ghostSnake = [{ 
            x: Math.floor(Math.random() * this.tileCount), 
            y: Math.floor(Math.random() * this.tileCount) 
        }];
    }
    
    updateGhostSnake() {
        if (!this.aiGhost || this.ghostSnake.length === 0) return;
        
        const head = this.ghostSnake[0];
        const foodX = this.food.x;
        const foodY = this.food.y;
        
        // Simple AI: move towards food while avoiding walls and self
        let bestMove = { dx: 0, dy: 0, score: -Infinity };
        const moves = [
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 }   // right
        ];
        
        moves.forEach(move => {
            const newX = head.x + move.dx;
            const newY = head.y + move.dy;
            
            // Check bounds
            if (newX < 0 || newX >= this.tileCount || newY < 0 || newY >= this.tileCount) {
                return;
            }
            
            // Check collision with ghost snake itself
            if (this.ghostSnake.some(segment => segment.x === newX && segment.y === newY)) {
                return;
            }
            
            // Calculate score based on distance to food
            const distanceToFood = Math.abs(newX - foodX) + Math.abs(newY - foodY);
            const score = -distanceToFood + Math.random() * 2; // Add some randomness
            
            if (score > bestMove.score) {
                bestMove = { dx: move.dx, dy: move.dy, score };
            }
        });
        
        // Move ghost snake
        const newHead = {
            x: head.x + bestMove.dx,
            y: head.y + bestMove.dy
        };
        
        this.ghostSnake.unshift(newHead);
        
        // Check if ghost snake ate food
        if (newHead.x === foodX && newHead.y === foodY) {
            this.generateFood(); // Generate new food
        } else {
            this.ghostSnake.pop(); // Remove tail
        }
        
        // Limit ghost snake length
        if (this.ghostSnake.length > 8) {
            this.ghostSnake.pop();
        }
    }
    
    // AI Feature: Adaptive Difficulty
    updateDifficulty() {
        if (!this.aiAdapt) return;
        
        // Track performance metrics
        const currentPerformance = {
            score: this.score,
            length: this.snake.length,
            timestamp: Date.now()
        };
        
        this.difficultyHistory.push(currentPerformance);
        
        // Keep only recent history
        if (this.difficultyHistory.length > 10) {
            this.difficultyHistory.shift();
        }
        
        // Adjust speed based on performance
        if (this.score > 0 && this.score % 50 === 0) {
            const avgScore = this.difficultyHistory.reduce((sum, p) => sum + p.score, 0) / this.difficultyHistory.length;
            
            if (avgScore > this.score * 0.8) {
                // Player is doing well, increase difficulty
                this.gameSpeed = Math.max(80, this.gameSpeed - 10);
                this.level++;
            }
        }
    }
    
    update() {
        if (!this.gameRunning) return;
        
        // Move snake
        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }
        
        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.generateFood();
            this.updateDifficulty();
            
            // Particle effect for food collection
            this.createFoodParticles(head.x, head.y);
        } else {
            this.snake.pop();
        }
        
        // Update ghost snake
        this.updateGhostSnake();
        
        this.updateUI();
    }
    
    createFoodParticles(x, y) {
        // Simple particle effect using canvas
        const centerX = (x * this.gridSize) + (this.gridSize / 2);
        const centerY = (y * this.gridSize) + (this.gridSize / 2);
        
        // Create visual feedback
        setTimeout(() => {
            this.ctx.save();
            this.ctx.globalAlpha = 0.7;
            this.ctx.fillStyle = '#ffff00';
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, this.gridSize, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.restore();
        }, 50);
    }
    
    draw() {
        // Clear canvas with retro grid pattern
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw subtle grid
        this.ctx.strokeStyle = '#111';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
        
        // Draw snake with gradient effect
        this.snake.forEach((segment, index) => {
            const alpha = 1 - (index * 0.1);
            this.ctx.fillStyle = index === 0 ? '#00ff41' : `rgba(0, 255, 65, ${Math.max(alpha, 0.3)})`;
            
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
            
            // Add glow effect to head
            if (index === 0) {
                this.ctx.shadowColor = '#00ff41';
                this.ctx.shadowBlur = 10;
                this.ctx.fillRect(
                    segment.x * this.gridSize + 1,
                    segment.y * this.gridSize + 1,
                    this.gridSize - 2,
                    this.gridSize - 2
                );
                this.ctx.shadowBlur = 0;
            }
        });
        
        // Draw ghost snake
        if (this.aiGhost && this.ghostSnake.length > 0) {
            this.ghostSnake.forEach((segment, index) => {
                const alpha = 0.6 - (index * 0.1);
                this.ctx.fillStyle = `rgba(255, 0, 255, ${Math.max(alpha, 0.2)})`;
                this.ctx.fillRect(
                    segment.x * this.gridSize + 2,
                    segment.y * this.gridSize + 2,
                    this.gridSize - 4,
                    this.gridSize - 4
                );
            });
        }
        
        // Draw food with pulsing effect
        const pulseSize = Math.sin(Date.now() * 0.01) * 2;
        this.ctx.fillStyle = '#ff0000';
        this.ctx.shadowColor = '#ff0000';
        this.ctx.shadowBlur = 15;
        this.ctx.fillRect(
            this.food.x * this.gridSize + 2 - pulseSize,
            this.food.y * this.gridSize + 2 - pulseSize,
            this.gridSize - 4 + (pulseSize * 2),
            this.gridSize - 4 + (pulseSize * 2)
        );
        this.ctx.shadowBlur = 0;
        
        // Draw AI prediction path (if enabled)
        if (this.aiPredict && this.gameRunning) {
            this.drawPredictionPath();
        }
    }
    
    drawPredictionPath() {
        if (this.snake.length === 0) return;
        
        const head = this.snake[0];
        const foodX = this.food.x;
        const foodY = this.food.y;
        
        // Simple pathfinding visualization
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(
            head.x * this.gridSize + this.gridSize / 2,
            head.y * this.gridSize + this.gridSize / 2
        );
        this.ctx.lineTo(
            foodX * this.gridSize + this.gridSize / 2,
            foodY * this.gridSize + this.gridSize / 2
        );
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    gameOver() {
        this.gameRunning = false;
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('aiSnakeHighScore', this.highScore);
            this.showOverlay('NEW HIGH SCORE!', `${this.score} points! Press SPACE to play again`);
        } else {
            this.showOverlay('GAME OVER', `Score: ${this.score} • Press SPACE to restart`);
        }
        
        this.updateUI();
    }
    
    showOverlay(title, message) {
        document.getElementById('overlayTitle').textContent = title;
        document.getElementById('overlayMessage').textContent = message;
        document.getElementById('gameOverlay').classList.remove('hidden');
    }
    
    hideOverlay() {
        document.getElementById('gameOverlay').classList.add('hidden');
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('level').textContent = this.level;
    }
    
    isSnakePosition(x, y) {
        return this.snake.some(segment => segment.x === x && segment.y === y) ||
               (this.ghostSnake && this.ghostSnake.some(segment => segment.x === x && segment.y === y));
    }
    
    gameLoop() {
        this.update();
        this.draw();
        
        setTimeout(() => {
            requestAnimationFrame(() => this.gameLoop());
        }, this.gameSpeed);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new AISnakeGame();
});

// Add some retro sound effects (optional enhancement)
class RetroSounds {
    constructor() {
        this.audioContext = null;
        this.initAudio();
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    playTone(frequency, duration, type = 'square') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playEat() {
        this.playTone(800, 0.1);
    }
    
    playGameOver() {
        this.playTone(200, 0.5);
    }
}

// Export for potential use
window.RetroSounds = RetroSounds;