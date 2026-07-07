const GAME_CONFIG = {
    CLASSES: {
        MARIO_JUMP: 'jump',
        GAME_OVER_SCREEN: 'visible'
    },
    ASSETS: {
        MARIO_GAME_OVER: './images/game-over.png'
    },
    TIMINGS: {
        JUMP_DURATION: 500
    },
    COLLISION: {
        MAX_PIPE_X: 80,
        MIN_PIPE_X: 0,
        MAX_MARIO_Y: 75
    }
};

class MarioGame {
    // Elementos do DOM
    #mario = null;
    #pipe = null;
    #gameOverScreen = null;
    #mobileBtn = null;
    #currentScoreElement = null;
    #highScoreElement = null;
    #finalScoreElement = null;
    #finalHighScoreElement = null;

    // Estado do Jogo
    #isGameOver = false;
    #isJumping = false;
    #animationFrameId = null;
    
    // Estado do Sistema de Pontos
    #score = 0;
    #highScore = 0;
    #canScore = true; // Flag preventiva para evitar múltiplas contagens no mesmo cano

    constructor() {
        this.#initializeDOMReferences();
        this.#loadHighScore();
        this.#registerEvents();
        this.#startGameLoop();
    }

    #initializeDOMReferences() {
        this.#mario = document.querySelector('.mario') || document.querySelector('img[src*="mario"]');
        this.#pipe = document.querySelector('.pipe') || document.querySelector('img[src*="pipe"]');
        this.#gameOverScreen = document.querySelector('.game-over-screen');
        this.#mobileBtn = document.querySelector('.mobile-jump-btn') || document.querySelector('button');
        
        // Elementos de texto do Score
        this.#currentScoreElement = document.getElementById('current-score');
        this.#highScoreElement = document.getElementById('high-score');
        this.#finalScoreElement = document.getElementById('final-score');
        this.#finalHighScoreElement = document.getElementById('final-high-score');

        if (!this.#mario || !this.#pipe) {
            console.warn("⚠️ Elementos estruturais não encontrados no DOM.");
            return;
        }
    }

    // Carrega o recorde salvo no navegador do usuário
    #loadHighScore() {
        this.#highScore = parseInt(localStorage.getItem('mario_high_score')) || 0;
        if (this.#highScoreElement) {
            this.#highScoreElement.textContent = this.#highScore;
        }
    }

     #registerEvents() {
        const triggerJump = (event) => {
            if (this.#isGameOver) return;
            if (event && event.cancelable) event.preventDefault();
            this.jump();
        };

        // Teclado físico do PC
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') triggerJump(e);
        });

        // Toque na tela inteira (exclusivo para mobile)
        document.addEventListener('touchstart', (e) => {
            if (!e.target.classList.contains('btn-restart')) triggerJump(e);
        }, { passive: false });

        // Clique no botão físico (SÓ funciona se ele estiver visível/display block)
        if (this.#mobileBtn) {
            this.#mobileBtn.addEventListener('click', (e) => {
                const isBtnVisible = window.getComputedStyle(this.#mobileBtn).display !== 'none';
                if (isBtnVisible) triggerJump(e);
            });
        }
    }


    jump() {
        if (this.#isJumping) return;

        this.#isJumping = true;
        this.#mario.classList.add(GAME_CONFIG.CLASSES.MARIO_JUMP);

        const onJumpEnd = () => {
            this.#mario.classList.remove(GAME_CONFIG.CLASSES.MARIO_JUMP);
            this.#isJumping = false;
            this.#mario.removeEventListener('animationend', onJumpEnd);
        };
        
        this.#mario.addEventListener('animationend', onJumpEnd);
    }

    #startGameLoop() {
        const loop = () => {
            if (this.#isGameOver) return;

            this.#checkCollision();
            this.#checkScore(); // Executa o monitoramento de pontos a cada frame
            
            this.#animationFrameId = requestAnimationFrame(loop);
        };
        this.#animationFrameId = requestAnimationFrame(loop);
    }

    // Monitora a posição do cano em relação ao Mario para validar o ponto
    #checkScore() {
        const pipeStyle = window.getComputedStyle(this.#pipe);
        const pipeLeft = parseFloat(pipeStyle.left || this.#pipe.offsetLeft);

        // Se o cano passou totalmente da lateral esquerda do Mario (X < 0)
        if (pipeLeft < 0 && this.#canScore) {
            this.#score += 1;
            this.#canScore = false; // Bloqueia novos pontos para este mesmo cano
            
            if (this.#currentScoreElement) {
                this.#currentScoreElement.textContent = this.#score;
            }
        }

        // Quando o cano volta para o lado direito (reiniciando a animação), libera para pontuar de novo
        if (pipeLeft > 200) {
            this.#canScore = true;
        }
    }

    #checkCollision() {
        const pipeStyle = window.getComputedStyle(this.#pipe);
        const marioStyle = window.getComputedStyle(this.#mario);

        const pipeLeft = parseFloat(pipeStyle.left || this.#pipe.offsetLeft);
        const marioBottom = parseFloat(marioStyle.bottom || this.#mario.offsetTop);

        const isMobile = window.innerWidth <= 768;
        const maxPipeHit = isMobile ? 60 : GAME_CONFIG.COLLISION.MAX_PIPE_X;
        const minPipeHit = GAME_CONFIG.COLLISION.MIN_PIPE_X;
        const maxMarioHeightHit = isMobile ? 60 : GAME_CONFIG.COLLISION.MAX_MARIO_Y;

        const hitPipeX = pipeLeft <= maxPipeHit && pipeLeft > minPipeHit;
        const hitMarioY = marioBottom < maxMarioHeightHit;

        if (hitPipeX && hitMarioY) {
            this.#executeGameOver(pipeLeft, marioBottom);
        }
    }

    #executeGameOver(pipeLeft, marioBottom) {
        this.#isGameOver = true;
        cancelAnimationFrame(this.#animationFrameId);

        this.#pipe.style.animation = 'none';
        this.#pipe.style.left = `${pipeLeft}px`;

        this.#mario.style.animation = 'none';
        this.#mario.style.bottom = `${marioBottom}px`;
        this.#mario.src = GAME_CONFIG.ASSETS.MARIO_GAME_OVER;
        this.#mario.style.width = window.innerWidth <= 768 ? '60px' : '75px';
        this.#mario.style.marginLeft = '40px';

        // Atualiza a persistência do High Score se a pontuação atual for maior
        if (this.#score > this.#highScore) {
            this.#highScore = this.#score;
            localStorage.setItem('mario_high_score', this.#highScore);
        }

        // Alimenta e exibe o painel de Game Over com os dados finais
        if (this.#finalScoreElement) this.#finalScoreElement.textContent = this.#score;
        if (this.#finalHighScoreElement) this.#finalHighScoreElement.textContent = this.#highScore;

        if (this.#gameOverScreen) {
            this.#gameOverScreen.classList.add(GAME_CONFIG.CLASSES.GAME_OVER_SCREEN);
        }
    }
}

window.addEventListener('load', () => {
    window.game = new MarioGame();
});
