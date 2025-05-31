const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');

const tileSize = 20; // Ukuran setiap segmen/grid
let canvasWidth = 600; // Default, akan disesuaikan
let canvasHeight = 400; // Default, akan disesuaikan

let cols, rows;

// Fungsi untuk menyesuaikan ukuran canvas agar responsif dalam batas tertentu
function resizeCanvas() {
    const maxWidth = 800;
    const maxHeight = 600;
    const windowWidth = window.innerWidth * 0.8;
    const windowHeight = window.innerHeight * 0.7;

    canvasWidth = Math.min(maxWidth, Math.floor(windowWidth / tileSize) * tileSize);
    canvasHeight = Math.min(maxHeight, Math.floor(windowHeight / tileSize) * tileSize);

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    cols = canvas.width / tileSize;
    rows = canvas.height / tileSize;
}
resizeCanvas(); // Panggil sekali di awal
window.addEventListener('resize', () => {
    resizeCanvas();
    // Jika game sedang berjalan dan layar diresize, mungkin perlu mereset game
    // atau menyesuaikan posisi elemen game. Untuk saat ini, biarkan sederhana.
    // Jika game over atau di start screen, tidak masalah.
});


let snake;
let food;
let score;
let highScore = localStorage.getItem('cyberSlitherHighScore') || 0;
highScoreDisplay.textContent = highScore;

let dx = tileSize; // Pergerakan horizontal awal
let dy = 0; // Pergerakan vertikal awal
let changingDirection = false;
let gameSpeed = 120; // milidetik per frame, angka lebih kecil = lebih cepat
let gameLoopTimeout;
let gameRunning = false;

const snakeColor = '#00ffcc'; // Neon cyan
const snakeHeadColor = '#00ffff'; // Brighter cyan for head
const foodColor = '#ff00ff'; // Neon pink
const trailColors = ['#00e6b8', '#00ccA3', '#00b38e', '#00997a']; // Warna gradasi untuk ekor

class SnakeSegment {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
    }
}

function initSnake() {
    // Mulai di tengah canvas
    const startX = Math.floor(cols / 2) * tileSize;
    const startY = Math.floor(rows / 2) * tileSize;
    snake = [
        new SnakeSegment(startX, startY, snakeHeadColor),
        new SnakeSegment(startX - tileSize, startY, trailColors[0] || snakeColor),
        new SnakeSegment(startX - (2 * tileSize), startY, trailColors[1] || snakeColor)
    ];
    dx = tileSize; // Mulai bergerak ke kanan
    dy = 0;
}

function drawSnakeSegment(segment, index) {
    ctx.fillStyle = segment.color;
    ctx.strokeStyle = '#000510'; // Dark border for segments
    ctx.lineWidth = 1;

    // Efek futuristik sederhana: kotak dengan sudut sedikit membulat dan glow tipis
    const cornerRadius = 5;
    ctx.beginPath();
    ctx.moveTo(segment.x + cornerRadius, segment.y);
    ctx.lineTo(segment.x + tileSize - cornerRadius, segment.y);
    ctx.quadraticCurveTo(segment.x + tileSize, segment.y, segment.x + tileSize, segment.y + cornerRadius);
    ctx.lineTo(segment.x + tileSize, segment.y + tileSize - cornerRadius);
    ctx.quadraticCurveTo(segment.x + tileSize, segment.y + tileSize, segment.x + tileSize - cornerRadius, segment.y + tileSize);
    ctx.lineTo(segment.x + cornerRadius, segment.y + tileSize);
    ctx.quadraticCurveTo(segment.x, segment.y + tileSize, segment.x, segment.y + tileSize - cornerRadius);
    ctx.lineTo(segment.x, segment.y + cornerRadius);
    ctx.quadraticCurveTo(segment.x, segment.y, segment.x + cornerRadius, segment.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tambahkan efek glow untuk kepala
    if (index === 0) {
        ctx.shadowColor = snakeHeadColor;
        ctx.shadowBlur = 8;
        ctx.fill(); // Gambar lagi dengan shadow
        ctx.shadowBlur = 0; // Reset shadow
    }
}

function drawSnake() {
    snake.forEach(drawSnakeSegment);
}

function moveSnake() {
    if (!gameRunning) return;
    changingDirection = false; // Reset flag

    const head = {
        x: snake[0].x + dx,
        y: snake[0].y + dy,
        color: snakeHeadColor
    };

    snake.unshift(head); // Tambahkan kepala baru di depan

    // Cek apakah makan makanan
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreDisplay.textContent = score;
        if (score > highScore) {
            highScore = score;
            highScoreDisplay.textContent = highScore;
            localStorage.setItem('cyberSlitherHighScore', highScore);
        }
        spawnFood();
        // Tingkatkan kecepatan sedikit setiap kali makan (opsional)
        // if (gameSpeed > 60) gameSpeed -= 2;

    } else {
        snake.pop(); // Hapus ekor jika tidak makan
    }

    // Perbarui warna ekor untuk efek gradasi/aliran
    for (let i = 1; i < snake.length; i++) {
        snake[i].color = trailColors[(i - 1) % trailColors.length] || snakeColor;
    }
}

function spawnFood() {
    let foodX, foodY;
    let onSnake = true;
    while (onSnake) {
        foodX = Math.floor(Math.random() * cols) * tileSize;
        foodY = Math.floor(Math.random() * rows) * tileSize;
        onSnake = snake.some(segment => segment.x === foodX && segment.y === foodY);
    }
    food = { x: foodX, y: foodY };
}

function drawFood() {
    ctx.fillStyle = foodColor;
    ctx.strokeStyle = '#000510';
    ctx.lineWidth = 2;

    // Gambar makanan sebagai "data orb" atau kubus digital
    const foodSize = tileSize * 0.8;
    const offset = (tileSize - foodSize) / 2;

    ctx.beginPath();
    ctx.rect(food.x + offset, food.y + offset, foodSize, foodSize);
    ctx.fill();
    ctx.stroke();

    // Efek glow untuk makanan
    ctx.shadowColor = foodColor;
    ctx.shadowBlur = 10;
    ctx.fill(); // Gambar lagi dengan shadow
    ctx.shadowBlur = 0; // Reset shadow
}

function checkCollision() {
    const head = snake[0];

    // Tabrakan dengan dinding
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
        return true;
    }

    // Tabrakan dengan diri sendiri
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    return false;
}

function drawGrid() { // Opsional: untuk tampilan futuristik
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.1)'; // Warna grid neon tipis
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * tileSize, 0);
        ctx.lineTo(i * tileSize, canvas.height);
        ctx.stroke();
    }
    for (let j = 0; j <= rows; j++) {
        ctx.beginPath();
        ctx.moveTo(0, j * tileSize);
        ctx.lineTo(canvas.width, j * tileSize);
        ctx.stroke();
    }
}

function gameLoop() {
    if (!gameRunning) return;

    gameLoopTimeout = setTimeout(() => {
        clearCanvas();
        drawGrid(); // Gambar grid di bawah
        drawFood();
        moveSnake();
        drawSnake();

        if (checkCollision()) {
            gameOver();
            return;
        }
        requestAnimationFrame(gameLoop); // Loop modern
    }, gameSpeed);
}

function clearCanvas() {
    ctx.fillStyle = '#000510'; // Warna background canvas
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function changeDirection(event) {
    if (changingDirection) return; // Mencegah putar balik instan yang menyebabkan game over

    const keyPressed = event.key; // Atau event.keyCode untuk kompatibilitas lama

    const goingUp = dy === -tileSize;
    const goingDown = dy === tileSize;
    const goingRight = dx === tileSize;
    const goingLeft = dx === -tileSize;

    // Left arrow
    if ((keyPressed === 'ArrowLeft' || keyPressed.toLowerCase() === 'a') && !goingRight) {
        dx = -tileSize;
        dy = 0;
        changingDirection = true;
    }
    // Up arrow
    if ((keyPressed === 'ArrowUp' || keyPressed.toLowerCase() === 'w') && !goingDown) {
        dx = 0;
        dy = -tileSize;
        changingDirection = true;
    }
    // Right arrow
    if ((keyPressed === 'ArrowRight' || keyPressed.toLowerCase() === 'd') && !goingLeft) {
        dx = tileSize;
        dy = 0;
        changingDirection = true;
    }
    // Down arrow
    if ((keyPressed === 'ArrowDown' || keyPressed.toLowerCase() === 's') && !goingUp) {
        dx = 0;
        dy = tileSize;
        changingDirection = true;
    }
}

function startGame() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    canvas.classList.remove('hidden'); // Jika ada class hidden untuk canvas

    score = 0;
    scoreDisplay.textContent = score;
    gameSpeed = 120; // Reset game speed
    initSnake();
    spawnFood();
    gameRunning = true;
    changingDirection = false; // Reset flag ini saat memulai
    if(gameLoopTimeout) clearTimeout(gameLoopTimeout); // Hapus timeout lama jika ada
    gameLoop();
}

function gameOver() {
    gameRunning = false;
    clearTimeout(gameLoopTimeout);
    finalScoreDisplay.textContent = score;
    gameOverScreen.classList.remove('hidden');
    // canvas.classList.add('hidden'); // Opsional: sembunyikan canvas
}

document.addEventListener('keydown', changeDirection);
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// Tampilkan layar mulai saat halaman dimuat
function showStartScreen() {
    clearCanvas(); // Bersihkan canvas jika ada sisa dari game sebelumnya
    ctx.fillStyle = '#000510';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid(); // Gambar grid di background start screen
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
}

// Panggil ini saat halaman pertama kali dimuat
showStartScreen();