class TextDance {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        
                const textInput = document.getElementById('textInput');
        this.text = textInput.value; // 从HTML中读取初始文本

        this.effects = new Set(['wave', 'rainbow']);
        this.time = 0;
        this.lastTime = 0;
        this.speed = 1.0;
        this.entranceEffect = 'none';
        this.entranceEffectDuration = 1.5;
        this.animationDuration = 5;
        this.entranceProgress = 1; // 默认动画已完成
        this.entranceStartTime = null; // 初始化为null
        this.animationId = null;
        this.fontFamily = "'Montserrat', sans-serif";
        this.fontSize = this.fontSizeSlider ? parseInt(this.fontSizeSlider.value) : 100;
        this.widthInput = document.getElementById('canvasWidth');
        this.heightInput = document.getElementById('canvasHeight');
        this.fontSizeSlider = document.getElementById('fontSizeSlider');
        this.fontSizeValue = document.getElementById('fontSizeValue');
        this.saveGifButton = document.getElementById('saveGif');
        console.log('In constructor, saveGifButton is:', this.saveGifButton);
        this.chars = [];
        
        this.setupCanvas();
        this.createText();
        this.setupEventListeners();
        this.animate(0);
    }

    setupCanvas() {
        this.canvas.width = this.widthInput.value;
        this.canvas.height = this.heightInput.value;
    }

    createText() {
        this.chars = [];
        const text = this.text; // 使用当前文本，不再使用默认值
        for (let i = 0; i < text.length; i++) {
            this.chars.push({
                char: text[i],
                x: 0, y: 0, // 初始位置，将在update中计算
                fontSize: this.fontSize,
                fontFamily: this.fontFamily,
                r: 255, g: 255, b: 255, a: 1, // 默认颜色
                scale: 1
            });
        }
    }

    setupEventListeners() {
        // Helper to add event listener safely
        const addListener = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
            }
        };

        // Canvas size
        addListener('canvasWidth', 'change', () => { this.setupCanvas(); this.createText(); });
        addListener('canvasHeight', 'change', () => { this.setupCanvas(); this.createText(); });

        addListener('fontSizeSlider', 'input', (e) => {
            this.fontSize = parseInt(e.target.value);
            if (this.fontSizeValue) {
                this.fontSizeValue.textContent = `${this.fontSize}px`;
            }
            this.createText();
        });

        // Text input
        addListener('textInput', 'input', (e) => {
            this.text = e.target.value || '';
            this.createText();
            this.startEntranceAnimation();
        });

        // Font selector
        addListener('fontSelector', 'change', (e) => {
            this.fontFamily = e.target.value;
            this.createText();
        });

        // Apply effects button
        addListener('applyEffect', 'click', () => {
            this.applyEffects();
        });

        // Save GIF button
        addListener('saveGif', 'click', () => {
            if (this.saveGifButton.disabled) return;
            this.exportAsGif();
        });

        // Entrance effect selector
        addListener('entranceEffect', 'change', (e) => {
            this.entranceEffect = e.target.value;
            this.startEntranceAnimation();
        });

        // Sliders
        const setupSlider = (controlId, valueId, property, unit = '') => {
            addListener(controlId, 'input', (e) => {
                this[property] = parseFloat(e.target.value);
                const valueElement = document.getElementById(valueId);
                if (valueElement) {
                    valueElement.textContent = this[property].toFixed(1) + unit;
                }
            });
        };

        setupSlider('speedControl', 'speedValue', 'speed', 'x');
        // setupSlider for 'entranceEffectDuration' was removed because the HTML element does not exist.
        setupSlider('animationDuration', 'animationDurationValue', 'animationDuration', 's');

        // Effect checkboxes
        const checkboxes = document.querySelectorAll('input[name="effect"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.effects.has(checkbox.value);
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    this.effects.add(checkbox.value);
                } else {
                    this.effects.delete(checkbox.value);
                }

                this.time = 0; // Reset time to see effect immediately
            });
        });

        addListener('verticalToggle', 'change', (e) => {
            this.isVertical = e.target.checked;
            this.createText();
        });
    }

    clear(transparent = false) {
        if (transparent) {
            // 完全透明背景
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            // 白色背景（用于预览）
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'black'; // 重置填充颜色
        }
    }

    // 应用变换效果
    applyTransforms(char, i, centerX, centerY) {
        const time = this.time * this.speed;
        const transforms = {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            alpha: 1,
            rotationX: 0,
            rotationY: 0,
            perspective: 0
        };
        
        // 应用所有选中的效果
        this.effects.forEach(effect => {
            switch(effect) {
                case 'wave':
                    transforms.y = Math.sin(time * 2 + i * 0.5) * 20;
                    break;
                case 'bounce':
                    transforms.y = -Math.abs(Math.sin(time * 2 + i * 0.3) * 30);
                    break;
                case 'jump':
                    transforms.y = -Math.max(0, Math.sin(time * 3 + i * 0.5) * 40);
                    break;
                case 'rotate':
                    transforms.rotation = Math.sin(time * 2 + i * 0.5) * Math.PI / 8;
                    break;
                case '3drotate':
                    transforms.rotationX = Math.sin(time * 0.5 + i * 0.2) * Math.PI / 6;
                    transforms.rotationY = Math.cos(time * 0.3 + i * 0.15) * Math.PI / 6;
                    transforms.perspective = 1000;
                    // 添加一些 Z 轴偏移以增强 3D 效果
                    transforms.z = Math.sin(time * 0.3 + i * 0.1) * 50;
                    break;
                case 'zoom':
                    const zoomScale = 1 + Math.sin(time * 2 + i * 0.1) * 0.3;
                    transforms.scaleX = zoomScale;
                    transforms.scaleY = zoomScale;
                    break;
                case 'pulse':
                    transforms.scale = 1 + Math.sin(time * 3) * 0.2;
                    break;
                case 'swing':
                    transforms.rotation = Math.sin(time * 2 + i * 0.3) * Math.PI / 12;
                    break;
                case 'spiral':
                    const radius = 100;
                    const angle = time * 2 + i * 0.2;
                    transforms.x = Math.cos(angle) * radius - radius;
                    transforms.y = Math.sin(angle) * radius;
                    transforms.rotation = angle;
                    break;
                case 'particle':
                    if (!this.particles) this.particles = [];
                    if (!this.particles[i]) {
                        this.particles[i] = {
                            x: 0,
                            y: 0,
                            vx: (Math.random() - 0.5) * 5,
                            vy: (Math.random() - 0.5) * 5,
                            life: 100 + Math.random() * 50
                        };
                    }
                    const p = this.particles[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.life--;
                    if (p.life <= 0) {
                        p.x = 0;
                        p.y = 0;
                        p.vx = (Math.random() - 0.5) * 5;
                        p.vy = (Math.random() - 0.5) * 5;
                        p.life = 100 + Math.random() * 50;
                    }
                    transforms.x = p.x;
                    transforms.y = p.y;
                    transforms.alpha = p.life / 150;
                    break;
                case 'shake':
                    transforms.x += (Math.random() - 0.5) * 10 * Math.sin(time * 5 + i);
                    transforms.y += (Math.random() - 0.5) * 10 * Math.sin(time * 5 + i + 1);
                    break;
                case 'float':
                    transforms.y = -Math.sin(time * 0.5 + i * 0.2) * 15;
                    break;
            }
        });
        
        return transforms;
    }
    
    // 开始出现动画
    startEntranceAnimation() {
        this.entranceProgress = 0;
        this.entranceStartTime = performance.now();
    }

    resetAnimation() {
        this.entranceProgress = 0;
        this.lastTime = null; // Reset time to restart animations
    }

    // 更新出现动画进度
    updateEntranceProgress() {
        if (this.entranceEffect === 'none' || this.entranceProgress >= 1) return;
        
        const now = performance.now();
        const elapsed = (now - this.entranceStartTime) / 1000; // 转换为秒
        this.entranceProgress = Math.min(1, elapsed / this.entranceEffectDuration);
    }

    // 获取字符样式
    getCharStyle(char, i, totalChars) {
        const time = this.time * this.speed;
        const style = {
            fillStyle: '#4a6bdf',
            shadowBlur: 0,
            shadowColor: 'transparent',
            strokeStyle: null,
            lineWidth: 0,
            globalAlpha: 1,
            textShadow: ''
        };
        
        // 应用所有选中的效果
        this.effects.forEach(effect => {
            switch(effect) {
                case 'rainbow':
                    style.fillStyle = `hsl(${(time * 50 + i * 30) % 360}, 100%, 50%)`;
                    break;
                case 'glow':
                    style.shadowBlur = Math.abs(Math.sin(time * 2)) * 10 + 5;
                    style.shadowColor = `hsla(${time * 50 % 360}, 100%, 50%, 0.8)`;
                    break;
                case 'blur':
                    style.shadowBlur = Math.sin(time * 3 + i) * 5 + 5;
                    style.shadowColor = 'rgba(0,0,0,0.8)';
                    break;
                case 'outline':
                    // 使用更醒目的轮廓颜色和宽度
                    style.strokeStyle = '#ff0000';  // 红色轮廓
                    style.lineWidth = 3;           // 更粗的轮廓
                    style.lineJoin = 'round';       // 圆角连接
                    style.miterLimit = 2;           // 斜接限制
                    
                    // 确保填充颜色与轮廓形成对比
                    if (!style.fillStyle || style.fillStyle === '#4a6bdf') {
                        style.fillStyle = '#ffffff'; // 白色填充
                    }
                    break;
                case 'gradient':
                    const gradient = this.ctx.createLinearGradient(0, -30, 0, 30);
                    gradient.addColorStop(0, `hsl(${(time * 30 + i * 10) % 360}, 100%, 70%)`);
                    gradient.addColorStop(1, `hsl(${(time * 30 + 180 + i * 10) % 360}, 100%, 50%)`);
                    style.fillStyle = gradient;
                    break;
                case 'fire':
                    const fireGradient = this.ctx.createLinearGradient(0, -20, 0, 20);
                    fireGradient.addColorStop(0, `hsl(${40 + Math.sin(time * 5 + i) * 10}, 100%, 50%)`);
                    fireGradient.addColorStop(0.5, `hsl(${20 + Math.sin(time * 5 + i * 0.5) * 10}, 100%, 40%)`);
                    fireGradient.addColorStop(1, `hsl(${0 + Math.sin(time * 5 + i * 0.3) * 10}, 100%, 30%)`);
                    style.fillStyle = fireGradient;
                    style.shadowBlur = 15;
                    style.shadowColor = `hsla(20, 100%, 50%, 0.7)`;
                    break;
                case 'ice':
                    style.fillStyle = `hsl(${180 + Math.sin(time * 2 + i) * 10}, 80%, 70%)`;
                    style.shadowBlur = 10;
                    style.shadowColor = `hsla(200, 100%, 70%, 0.8)`;
                    break;
                case 'lightning':
                    if (Math.random() > 0.9) {
                        style.fillStyle = '#ffffff';
                        style.shadowBlur = 20;
                        style.shadowColor = '#00ffff';
                    } else {
                        style.fillStyle = '#00ffff';
                        style.shadowBlur = 10;
                        style.shadowColor = '#ffffff';
                    }
                    break;
                case 'shadow':
                    style.shadowBlur = 5;
                    style.shadowColor = `hsla(${(time * 40 + i * 20) % 360}, 100%, 50%, 0.8)`;
                    style.shadowOffsetX = Math.sin(time * 2 + i) * 5;
                    style.shadowOffsetY = Math.cos(time * 2 + i) * 5;
                    break;
                case 'glitch':
                    style.shadowBlur = 2;
                    style.shadowColor = `hsl(${(this.time * 100 + i * 50) % 360}, 100%, 50%)`;
                    style.shadowOffsetX = (Math.random() - 0.5) * 10;
                    style.shadowOffsetY = (Math.random() - 0.5) * 10;
                    break;
                case 'neon':
                    style.shadowBlur = 15;
                    style.shadowColor = `hsla(${(this.time * 50 + i * 20) % 360}, 100%, 70%, 0.8)`;
                    style.textShadow = `0 0 5px #fff, 
                                        0 0 10px #fff, 
                                        0 0 20px ${style.shadowColor}, 
                                        0 0 40px ${style.shadowColor}`;
                    break;
                case 'bounceIn':
                    style.globalAlpha = this.entranceProgress ** 2;
                    style.scale = 1 + (1 - this.entranceProgress) * 2;
                    break;
                case 'fadeIn':
                    style.globalAlpha = this.entranceProgress;
                    break;
                case 'slideIn':
                    style.translateX = (1 - this.entranceProgress) * 100 * (i % 2 ? 1 : -1);
                    break;
            }
        });
        
        return style;
    }
    
    // 应用出现效果
    applyEntranceEffect(char, x, y, i, totalChars, charWidth, centerY) {
        if (this.entranceEffect === 'none' || this.entranceProgress >= 1) {
            return { x: 0, y: 0, scale: 1, rotation: 0, alpha: 1 };
        }
        
        // 计算字符延迟
        const delay = (i / totalChars) * 0.5; // 最大延迟0.5秒
        const progress = Math.max(0, (this.entranceProgress - delay) / (1 - delay));
        
        if (progress <= 0) {
            return { x: 0, y: 0, scale: 0.1, alpha: 0 };
        }
        
        const easeOut = 1 - Math.pow(1 - progress, 3); // 缓动效果
        const easeInOut = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
        const result = { x: 0, y: 0, scale: 1, rotation: 0, alpha: 1 };
        
        switch (this.entranceEffect) {
            case 'fade':
                result.alpha = easeOut;
                break;
                
            case 'slideUp':
                result.y = (1 - easeOut) * 50;
                result.alpha = easeOut;
                break;
                
            case 'slideDown':
                result.y = -(1 - easeOut) * 50;
                result.alpha = easeOut;
                break;
                
            case 'slideLeft':
                result.x = (1 - easeOut) * charWidth;
                result.alpha = easeOut;
                break;
                
            case 'slideRight':
                result.x = -(1 - easeOut) * charWidth;
                result.alpha = easeOut;
                break;
                
            case 'bounceIn':
                const bounce = Math.sin(progress * Math.PI * 2) * (1 - progress) * 50;
                result.y = -bounce;
                result.scale = 0.5 + easeOut * 0.5;
                result.alpha = easeOut;
                break;
                
            case 'zoomIn':
                result.scale = 0.1 + easeOut * 0.9;
                result.alpha = easeOut;
                break;
                
            case 'flipX':
                result.rotation = (1 - easeOut) * Math.PI;
                result.alpha = easeOut;
                break;
                
            case 'flipY':
                result.rotation = (1 - easeOut) * Math.PI * 2;
                result.alpha = easeOut;
                break;
                
            case 'random':
                result.alpha = progress > 0.5 ? 1 : 0;
                if (progress < 0.1) {
                    const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
                    return { ...result, char: chars[Math.floor(Math.random() * chars.length)] };
                }
                break;
        }
        
        return result;
    }
    
    drawText() {
        if (!this.text) return;

        this.ctx.save();
        this.ctx.font = `bold ${this.fontSize}px ${this.fontFamily}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // 处理打字机效果
        let visibleChars = this.text.length;
        if (this.effects.has('typewriter')) {
            visibleChars = Math.min(
                Math.floor(this.time * 5),
                this.text.length
            );
        }

        // 计算总宽度
        const textWidth = Array.from(this.text).slice(0, visibleChars).reduce(
            (width, char) => width + this.ctx.measureText(char).width, 0
        );
        
        let x = centerX - textWidth / 2;
        
        // 绘制每个字符
        for (let i = 0; i < visibleChars; i++) {
            const char = this.text[i];
            const charWidth = this.ctx.measureText(char).width;
            
            // 获取变换和样式
            const transforms = this.applyTransforms(char, i, x + charWidth/2, centerY);
            const style = this.getCharStyle(char, i, visibleChars);
            
            // 应用出现效果
            let entrance = { alpha: 1 }; // 默认可见
            if (this.entranceStartTime !== null) {
                entrance = this.applyEntranceEffect(
                    char, 
                    x, 
                    centerY, 
                    i, 
                    visibleChars,
                    charWidth,
                    centerY
                );
            }
            
            // 如果有随机字符效果，替换字符
            if (entrance.char) {
                char = entrance.char;
            }
            
            // 应用透明度
            this.ctx.globalAlpha = style.globalAlpha * entrance.alpha;
            
            this.ctx.save();
            
            // 应用变换
            this.ctx.translate(x + charWidth/2 + (transforms.x || 0) + (entrance.x || 0), 
                             centerY + (transforms.y || 0) + (entrance.y || 0));
            
            // 应用旋转
            const rotation = (transforms.rotation || 0) + (entrance.rotation || 0);
            if (rotation) this.ctx.rotate(rotation);
            
            // 应用缩放
            const scaleX = (transforms.scaleX || transforms.scale || 1) * (entrance.scaleX || entrance.scale || 1);
            const scaleY = (transforms.scaleY || transforms.scale || 1) * (entrance.scaleY || entrance.scale || 1);
            
            // 应用 3D 变换
            if (transforms.perspective) {
                const z = transforms.z || 0;
                const scale = transforms.perspective / (transforms.perspective + z);
                this.ctx.transform(1, 0, 0, 1, 0, 0);
                this.ctx.transform(1, 0, 0, Math.cos(transforms.rotationX), 0, 0);
                this.ctx.transform(Math.cos(transforms.rotationY), 0, 0, 1, 0, 0);
                this.ctx.scale(scale, scale);
            }
            
            if (scaleX !== 1 || scaleY !== 1) this.ctx.scale(scaleX, scaleY);
            
            // 应用样式
            Object.entries(style).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    this.ctx[key] = value;
                }
            });
            
            // 绘制文字描边（轮廓效果）
            if (style.strokeStyle && style.lineWidth) {
                this.ctx.strokeText(char, -charWidth/2, 0);
            }
            
            // 绘制文字填充
            this.ctx.fillText(char, -charWidth/2, 0);
            
            this.ctx.restore();
            
            x += charWidth;
        }
        
        // 绘制光标（打字机效果）
        if (this.effects.has('typewriter') && visibleChars < this.text.length && Math.floor(this.time * 2) % 2 === 0) {
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(x, centerY - 20, 2, 30);
        }
        
        this.ctx.restore();
    }

    drawWaveText(centerX, centerY) {
        const textWidth = this.ctx.measureText(this.text).width;
        let x = centerX - textWidth / 2;
        
        for (let i = 0; i < this.text.length; i++) {
            const char = this.text[i];
            const y = centerY + Math.sin(this.time * 2 + i * 0.5) * 20;
            
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.fillStyle = `hsl(${(this.time * 20 + i * 30) % 360}, 100%, 50%)`;
            this.ctx.fillText(char, 0, 0);
            this.ctx.restore();
            
            x += this.ctx.measureText(char).width;
        }
    }

    drawBounceText(centerX, centerY) {
        const textWidth = this.ctx.measureText(this.text).width;
        let x = centerX - textWidth / 2;
        
        for (let i = 0; i < this.text.length; i++) {
            const char = this.text[i];
            const bounce = Math.abs(Math.sin(this.time * 2 + i * 0.5)) * 30;
            const y = centerY - bounce;
            
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.fillStyle = '#4a6bdf';
            this.ctx.fillText(char, 0, 0);
            this.ctx.restore();
            
            x += this.ctx.measureText(char).width;
        }
    }

    drawRainbowText(centerX, centerY) {
        const textWidth = this.ctx.measureText(this.text).width;
        let x = centerX - textWidth / 2;
        
        for (let i = 0; i < this.text.length; i++) {
            const char = this.text[i];
            const hue = (this.time * 10 + i * 10) % 360;
            
            this.ctx.save();
            this.ctx.translate(x, centerY);
            this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            this.ctx.fillText(char, 0, 0);
            this.ctx.restore();
            
            x += this.ctx.measureText(char).width;
        }
    }

    drawTypewriterText(centerX, centerY) {
        const visibleChars = Math.min(
            Math.floor(this.time * 5),
            this.text.length
        );
        const visibleText = this.text.substring(0, visibleChars);
        
        this.ctx.fillStyle = '#333';
        this.ctx.fillText(visibleText, centerX, centerY);
        
        // Draw cursor
        if (Math.floor(this.time * 2) % 2 === 0 && visibleChars < this.text.length) {
            const cursorX = centerX + this.ctx.measureText(visibleText).width / 2;
            this.ctx.fillRect(cursorX, centerY - 20, 2, 30);
        }
    }

    drawZoomText(centerX, centerY) {
        const scale = 1 + Math.sin(this.time * 2) * 0.3;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.scale(scale, scale);
        this.ctx.fillStyle = `hsl(${Math.sin(this.time) * 60 + 200}, 100%, 50%)`;
        this.ctx.fillText(this.text, 0, 0);
        this.ctx.restore();
    }

    drawJumpText(centerX, centerY) {
        const textWidth = this.ctx.measureText(this.text).width;
        let x = centerX - textWidth / 2;
        
        for (let i = 0; i < this.text.length; i++) {
            const char = this.text[i];
            const jump = Math.max(0, Math.sin(this.time * 3 + i * 0.5) * 40);
            
            this.ctx.save();
            this.ctx.translate(x, centerY - jump);
            this.ctx.fillStyle = `hsl(${i * 30 + this.time * 50 % 360}, 100%, 50%)`;
            this.ctx.fillText(char, 0, 0);
            this.ctx.restore();
            
            x += this.ctx.measureText(char).width;
        }
    }

    drawGlowText(centerX, centerY) {
        const glow = Math.abs(Math.sin(this.time * 2)) * 10 + 5;
        
        // Draw glow effect
        this.ctx.shadowColor = `hsla(${this.time * 50 % 360}, 100%, 50%, 0.8)`;
        this.ctx.shadowBlur = glow * 2;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // Draw multiple times for stronger glow
        for (let i = 0; i < 5; i++) {
            this.ctx.fillStyle = `hsla(${this.time * 50 % 360}, 100%, 70%, 0.3)`;
            this.ctx.fillText(this.text, centerX, centerY);
        }
        
        // Draw main text
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = `hsl(${this.time * 50 % 360}, 100%, 60%)`;
        this.ctx.fillText(this.text, centerX, centerY);
    }

    drawRotateText(centerX, centerY) {
        const textWidth = this.ctx.measureText(this.text).width;
        let x = centerX - textWidth / 2;
        
        for (let i = 0; i < this.text.length; i++) {
            const char = this.text[i];
            const rotation = Math.sin(this.time * 2 + i * 0.5) * Math.PI / 8;
            
            this.ctx.save();
            this.ctx.translate(x, centerY);
            this.ctx.rotate(rotation);
            this.ctx.fillStyle = `hsl(${(i * 30 + this.time * 50) % 360}, 100%, 60%)`;
            this.ctx.fillText(char, 0, 0);
            this.ctx.restore();
            
            x += this.ctx.measureText(char).width * Math.cos(rotation);
        }
    }

    drawShakeText(centerX, centerY) {
        const textWidth = this.ctx.measureText(this.text).width;
        let x = centerX - textWidth / 2;
        
        for (let i = 0; i < this.text.length; i++) {
            const char = this.text[i];
            const shakeX = (Math.random() - 0.5) * 10 * Math.sin(this.time * 5 + i);
            const shakeY = (Math.random() - 0.5) * 10 * Math.sin(this.time * 5 + i + 1);
            
            this.ctx.save();
            this.ctx.translate(x + shakeX, centerY + shakeY);
            this.ctx.fillStyle = `hsl(${(i * 50 + this.time * 30) % 360}, 100%, 50%)`;
            this.ctx.fillText(char, 0, 0);
            this.ctx.restore();
            
            x += this.ctx.measureText(char).width;
        }
    }

    animate(currentTime) {
        if (!this.lastTime) {
            this.lastTime = currentTime;
        }
        const deltaTime = (currentTime - this.lastTime) / 1000; // in seconds
        this.lastTime = currentTime;

        this.time += deltaTime;

        this.updateEntranceProgress();

        // 诊断代码：打印动画状态
        if (this.entranceStartTime && this.entranceProgress < 1) {
            console.log(`动画进度: ${this.entranceProgress.toFixed(2)}`);
        }

        this.clear();
        this.drawText();

        this.animationId = requestAnimationFrame(this.animate.bind(this));
    }

    
    // 应用效果时重置出现动画
    applyEffects() {
        // 更新文本
        this.text = document.getElementById('textInput').value || '文字动画效果';
        
        // 清空当前效果
        this.effects.clear();
        
        // 获取所有选中的效果
        const checkboxes = document.querySelectorAll('input[name="effect"]:checked');
        checkboxes.forEach(checkbox => {
            this.effects.add(checkbox.value);
        });
        
        console.log('应用效果:', Array.from(this.effects));
        
        // 重置动画
        this.startEntranceAnimation();
    }



    update() {
        // 更新动画进度
        if (this.entranceStartTime !== null) {
            const elapsed = (this.time - this.entranceStartTime) * this.speed;
            this.entranceProgress = Math.min(elapsed / this.entranceEffectDuration, 1);
            if (this.entranceProgress === 1) {
                this.entranceStartTime = null; // 动画完成后重置
            }
        }

        const t = this.time * this.speed;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Set font for measurement
        this.ctx.font = `bold ${this.fontSize}px ${this.fontFamily}`;

        // Calculate base positions
        const textWidth = this.ctx.measureText(this.text).width;
        let currentX = centerX - textWidth / 2;
        const positions = this.chars.map(char => {
            const charWidth = this.ctx.measureText(char.char).width;
            const pos = {
                x: currentX + charWidth / 2,
                y: centerY
            };
            currentX += charWidth;
            return pos;
        });

        this.chars.forEach((char, i) => {
            // Assign base position
            char.x = positions[i].x;
            char.y = positions[i].y;

            // Apply entrance animations OR set default state
            if (this.entranceProgress < 1 && this.entranceEffect !== 'none') {
                // Entrance animation is active, calculate properties based on progress
                switch (this.entranceEffect) {
                    case 'fade-in':
                        char.a = this.entranceProgress;
                        char.scale = 1;
                        break;
                    case 'slide-in-left':
                        char.x -= (1 - this.entranceProgress) * 100;
                        char.a = this.entranceProgress;
                        char.scale = 1;
                        break;
                    case 'slide-in-right':
                        char.x += (1 - this.entranceProgress) * 100;
                        char.a = this.entranceProgress;
                        char.scale = 1;
                        break;
                    case 'slide-in-top':
                        char.y -= (1 - this.entranceProgress) * 100;
                        char.a = this.entranceProgress;
                        char.scale = 1;
                        break;
                    case 'slide-in-bottom':
                        char.y += (1 - this.entranceProgress) * 100;
                        char.a = this.entranceProgress;
                        char.scale = 1;
                        break;
                    case 'zoom-in':
                        char.scale = this.entranceProgress;
                        char.a = this.entranceProgress;
                        break;
                    case 'zoom-out':
                        char.scale = 1 + (1 - this.entranceProgress);
                        char.a = this.entranceProgress;
                        break;
                    default:
                        char.a = 1;
                        char.scale = 1;
                }
            } else {
                // No entrance animation, set default state
                char.a = 1;
                char.scale = 1;
            }

            // Apply continuous effects (wave, rainbow, etc.)
            if (this.effects.has('wave')) {
                char.y += Math.sin(t * 0.1 + i * 0.5) * 20;
            }
            if (this.effects.has('rainbow')) {
                const color = `hsl(${(t * 10 + i * 10) % 360}, 100%, 70%)`;
                const rgb = color.match(/\d+/g);
                if (rgb) {
                    char.r = parseInt(rgb[0]);
                    char.g = parseInt(rgb[1]);
                    char.b = parseInt(rgb[2]);
                }
            }
        });
    }
    async exportAsGif() {
        const statusEl = document.getElementById('saveStatus');


        // 为确保导出效果与预览一致，重置动画状态
        this.time = 0;
        this.entranceProgress = 0;
        this.entranceStartTime = 0;

        let workerUrl = null;
        try {
            statusEl.textContent = '正在准备导出...';

            const workerScriptContent = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js').then(res => {
                if (!res.ok) throw new Error(`无法加载核心GIF脚本: ${res.statusText}`);
                return res.text();
            });

            const workerBlob = new Blob([workerScriptContent], { type: 'application/javascript' });
            workerUrl = URL.createObjectURL(workerBlob);

            statusEl.textContent = '正在生成GIF...';

            const gif = new GIF({
                workers: 2,
                quality: 10,
                width: this.canvas.width,
                height: this.canvas.height,
                workerScript: workerUrl,
                transparent: 0x000000,
                dither: false
            });

            const FPS = 20;
            const baseDuration = this.entranceEffectDuration + this.animationDuration;
            const totalDuration = baseDuration / this.speed;
            const frames = Math.round(totalDuration * FPS);
            const delay = 1000 / FPS;

            for (let i = 0; i <= frames; i++) {
                this.time = i / FPS; // 模拟真实时间流逝 (秒), 确保速度只被应用一次

                this.update();
                this.clear(true);
                this.drawText();

                gif.addFrame(this.ctx, { copy: true, delay: delay });
                
                statusEl.textContent = `正在生成GIF... ${Math.round((i / frames) * 100)}%`;
                await new Promise(resolve => requestAnimationFrame(resolve));
            }

            gif.on('finished', (blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `text-animation-${new Date().getTime()}.gif`;
                document.body.appendChild(a);
                a.click();
                
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    statusEl.textContent = 'GIF已保存！';
                }, 100);
            });

            gif.render();

        } catch (error) {
            console.error('导出GIF失败:', error);
            statusEl.textContent = `保存失败: ${error.message}`;
        } finally {
            if (workerUrl) {
                URL.revokeObjectURL(workerUrl);
            }
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    // Ensure fonts are loaded before initializing to prevent blank canvas
    document.fonts.ready.then(() => {
        new TextDance('textCanvas');
    });
});
