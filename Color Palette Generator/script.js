document.addEventListener('DOMContentLoaded', () => {
    // --- Application State ---
    let palette = [];
    let savedPalettes = [];
    const maxColors = 10;
    const minColors = 2;

    // --- DOM Elements Cache ---
    const paletteGrid = document.getElementById('palette-grid');
    const harmonySelector = document.getElementById('harmony-selector');
    const generateBtn = document.getElementById('generate-btn');
    const addColorBtn = document.getElementById('add-color-btn');
    const saveBtn = document.getElementById('save-btn');
    const exportBtn = document.getElementById('export-btn');
    
    // Modal elements
    const exportModal = document.getElementById('export-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const exportCssCode = document.getElementById('export-css-code');
    const exportTailwindCode = document.getElementById('export-tailwind-code');
    const exportJsonCode = document.getElementById('export-json-code');
    
    // Copy buttons
    const copyCssBtn = document.getElementById('copy-css-btn');
    const copyTailwindBtn = document.getElementById('copy-tailwind-btn');
    const copyJsonBtn = document.getElementById('copy-json-btn');
    
    // Toast and Library elements
    const toastContainer = document.getElementById('toast-container');
    const savedPalettesList = document.getElementById('saved-palettes-list');
    const savedCountLabel = document.getElementById('saved-count');

    // Live UI Preview DOM parts
    const pHeader = document.getElementById('p-header');
    const pLogoDot = document.getElementById('p-logo-dot');
    const pHero = document.getElementById('p-hero');
    const pBtnMain = document.getElementById('p-btn-main');
    const pBtnSec = document.getElementById('p-btn-sec');
    const pCard1 = document.getElementById('p-card-1');
    const pCard2 = document.getElementById('p-card-2');
    const pTag1 = document.getElementById('p-tag-1');
    const pTag2 = document.getElementById('p-tag-2');

    // --- Color Utilities & Conversions ---
    function generateRandomHex() {
        const hexChars = '0123456789ABCDEF';
        let hex = '#';
        for (let i = 0; i < 6; i++) {
            hex += hexChars[Math.floor(Math.random() * 16)];
        }
        return hex;
    }

    function generateVividHex() {
        let hex = generateRandomHex();
        const hsl = hexToHsl(hex);
        if (hsl.s < 30) {
            return hslToHex(hsl.h, 70, hsl.l);
        }
        return hex;
    }

    function hexToRgb(hex) {
        let cleanHex = hex.replace('#', '');
        if (cleanHex.length === 3) {
            cleanHex = cleanHex.split('').map(char => char + char).join('');
        }
        const num = parseInt(cleanHex, 16);
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255
        };
    }

    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('').toUpperCase();
    }

    function hexToHsl(hex) {
        const { r, g, b } = hexToRgb(hex);
        const rNorm = r / 255;
        const gNorm = g / 255;
        const bNorm = b / 255;
        
        const max = Math.max(rNorm, gNorm, bNorm);
        const min = Math.min(rNorm, gNorm, bNorm);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
                case gNorm: h = (bNorm - rNorm) / d + 2; break;
                case bNorm: h = (rNorm - gNorm) / d + 4; break;
            }
            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    function hslToHex(h, s, l) {
        s /= 100;
        l /= 100;
        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
        
        const r = Math.round(255 * f(0));
        const g = Math.round(255 * f(8));
        const b = Math.round(255 * f(4));
        
        return rgbToHex(r, g, b);
    }

    // WCAG contrast calculation
    function getLuminance(r, g, b) {
        const a = [r, g, b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    function calculateContrastRatio(hex1, hex2) {
        const rgb1 = hexToRgb(hex1);
        const rgb2 = hexToRgb(hex2);
        
        const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
        const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
        
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        
        return (brightest + 0.05) / (darkest + 0.05);
    }

    function getContrastRating(ratio) {
        if (ratio >= 7) return { text: 'AAA Pass', class: 'pass-aaa', score: 'AAA' };
        if (ratio >= 4.5) return { text: 'AA Pass', class: 'pass-aa', score: 'AA' };
        return { text: 'Fail', class: 'fail', score: 'Fail' };
    }

    function getBestTextColor(hexBg) {
        const contrastWithWhite = calculateContrastRatio(hexBg, '#FFFFFF');
        const contrastWithBlack = calculateContrastRatio(hexBg, '#09090E');
        return contrastWithWhite > contrastWithBlack ? '#FFFFFF' : '#000000';
    }

    // --- Dynamic Palette Harmonies Engine ---
    function calculateHarmonies(baseHex, type, count) {
        const baseHsl = hexToHsl(baseHex);
        const colorsList = [];
        const safeS = Math.max(40, baseHsl.s);
        const safeL = Math.max(25, Math.min(75, baseHsl.l));

        switch (type) {
            case 'complementary': {
                const hues = [baseHsl.h, (baseHsl.h + 180) % 360];
                for (let i = 0; i < count; i++) {
                    const h = hues[i % 2];
                    const s = Math.max(30, safeS - (i * 8));
                    const l = Math.max(20, Math.min(80, safeL + (i < 2 ? 0 : (i === 2 ? -15 : i === 3 ? 15 : -25))));
                    colorsList.push(hslToHex(h, s, l));
                }
                break;
            }
            case 'analogous': {
                const step = 25;
                for (let i = 0; i < count; i++) {
                    const offset = (i - Math.floor(count / 2)) * step + Math.round(Math.random() * 6 - 3);
                    const h = (baseHsl.h + offset + 360) % 360;
                    colorsList.push(hslToHex(h, safeS, safeL));
                }
                break;
            }
            case 'triadic': {
                const hues = [baseHsl.h, (baseHsl.h + 120) % 360, (baseHsl.h + 240) % 360];
                for (let i = 0; i < count; i++) {
                    const h = hues[i % 3];
                    const s = Math.max(30, safeS - (i * 5));
                    const l = Math.max(20, Math.min(80, safeL + (i < 2 ? 0 : (i === 2 ? -15 : i === 3 ? 12 : -20))));
                    colorsList.push(hslToHex(h, s, l));
                }
                break;
            }
            case 'split': {
                const hues = [baseHsl.h, (baseHsl.h + 150) % 360, (baseHsl.h + 210) % 360];
                for (let i = 0; i < count; i++) {
                    const h = hues[i % 3];
                    const s = Math.max(30, safeS - (i * 5));
                    const l = Math.max(20, Math.min(80, safeL + (i < 2 ? 0 : (i === 2 ? 18 : i === 3 ? -15 : -22))));
                    colorsList.push(hslToHex(h, s, l));
                }
                break;
            }
            case 'monochromatic': {
                for (let i = 0; i < count; i++) {
                    const l = Math.round(15 + (i * (65 / Math.max(count - 1, 1))));
                    const s = Math.max(30, safeS - (i * 6));
                    colorsList.push(hslToHex(baseHsl.h, s, l));
                }
                break;
            }
            case 'random':
            default: {
                for (let i = 0; i < count; i++) {
                    colorsList.push(generateRandomHex());
                }
                break;
            }
        }
        return colorsList;
    }

    // --- Core State Mutators ---
    function initializePalette() {
        // Build 5 default starting colors using the selected harmony
        palette = [
            { hex: '#1E293B', locked: false, id: 'color-1' },
            { hex: '#4F46E5', locked: false, id: 'color-2' },
            { hex: '#06B6D4', locked: false, id: 'color-3' },
            { hex: '#10B981', locked: false, id: 'color-4' },
            { hex: '#F59E0B', locked: false, id: 'color-5' }
        ];
        generatePalette();
    }

    function generatePalette() {
        const harmony = harmonySelector.value;
        
        let anchorHex;
        const firstLocked = palette.find(c => c.locked);
        if (firstLocked) {
            anchorHex = firstLocked.hex;
        } else {
            anchorHex = harmony === 'random' ? generateRandomHex() : generateVividHex();
        }

        const calculatedColors = calculateHarmonies(anchorHex, harmony, palette.length);
        
        palette = palette.map((color, index) => {
            if (color.locked) return color;
            return {
                ...color,
                hex: calculatedColors[index] || generateRandomHex()
            };
        });

        renderPalette();
        updateLivePreview();
    }

    function addNewColor() {
        if (palette.length >= maxColors) {
            showToast('⚠️ Maximum 10 colors reached', 'warning');
            return;
        }
        const id = 'color-' + Date.now();
        palette.push({
            hex: generateRandomHex(),
            locked: false,
            id: id
        });
        renderPalette();
        updateLivePreview();
        showToast('➕ Added color card');
    }

    function removeColor(id) {
        if (palette.length <= minColors) {
            showToast('⚠️ Minimum 2 colors required', 'warning');
            return;
        }
        palette = palette.filter(c => c.id !== id);
        renderPalette();
        updateLivePreview();
        showToast('➖ Removed color card');
    }

    function toggleColorLock(id) {
        palette = palette.map(c => {
            if (c.id === id) {
                const newLock = !c.locked;
                showToast(newLock ? '🔒 Locked color' : '🔓 Unlocked color');
                return { ...c, locked: newLock };
            }
            return c;
        });
        renderPalette();
    }

    function updateColorHex(id, newHex) {
        if (!newHex.startsWith('#')) newHex = '#' + newHex;
        // Validate HEX formatting
        const hexRegex = /^#[0-9A-F]{6}$/i;
        if (!hexRegex.test(newHex)) return; // Don't mutate state on incomplete user inputs

        palette = palette.map(c => {
            if (c.id === id) return { ...c, hex: newHex.toUpperCase() };
            return c;
        });
        renderPalette();
        updateLivePreview();
    }

    function updateColorHslSlider(id, field, value) {
        palette = palette.map(c => {
            if (c.id === id) {
                const hsl = hexToHsl(c.hex);
                hsl[field] = parseInt(value);
                const updatedHex = hslToHex(hsl.h, hsl.s, hsl.l);
                return { ...c, hex: updatedHex };
            }
            return c;
        });
        // We do dynamic style overrides to avoid complete grid re-rendering during dragging!
        const cardEl = document.getElementById(id);
        if (cardEl) {
            const colorObj = palette.find(c => c.id === id);
            const textCol = getBestTextColor(colorObj.hex);
            
            // Adjust card CSS variables
            cardEl.style.backgroundColor = colorObj.hex;
            cardEl.style.color = textCol;
            
            // Update labels
            const hexInput = cardEl.querySelector('.hex-value-input');
            if (hexInput) hexInput.value = colorObj.hex.replace('#', '');
            
            // Contrast indicators
            const contrastVal = calculateContrastRatio(colorObj.hex, textCol);
            const rating = getContrastRating(contrastVal);
            const badge = cardEl.querySelector('.badge-contrast');
            if (badge) {
                badge.className = `badge-contrast ${rating.class}`;
                badge.innerText = `${rating.score} contrast`;
            }
        }
        updateLivePreview();
    }

    // --- Dynamic HTML Rendering ---
    function renderPalette() {
        paletteGrid.innerHTML = '';
        
        palette.forEach((color, index) => {
            const textCol = getBestTextColor(color.hex);
            const contrastWithText = calculateContrastRatio(color.hex, textCol);
            const contrastRating = getContrastRating(contrastWithText);
            const hsl = hexToHsl(color.hex);

            const card = document.createElement('div');
            card.className = `color-card ${color.locked ? 'card-locked' : ''}`;
            card.id = color.id;
            card.style.backgroundColor = color.hex;
            card.style.color = textCol;
            card.setAttribute('draggable', 'true');

            card.innerHTML = `
                <!-- Hidden Picker input -->
                <input type="color" class="color-bg-trigger" value="${color.hex}">
                
                <!-- Adjustable Sliders Overlay -->
                <div class="adjust-panel" style="color: #ffffff;">
                    <div class="slider-group">
                        <label>Hue <span>${hsl.h}°</span></label>
                        <input type="range" class="slide-h" min="0" max="360" value="${hsl.h}" title="Hue">
                    </div>
                    <div class="slider-group">
                        <label>Sat <span>${hsl.s}%</span></label>
                        <input type="range" class="slide-s" min="0" max="100" value="${hsl.s}" title="Saturation">
                    </div>
                    <div class="slider-group">
                        <label>Light <span>${hsl.l}%</span></label>
                        <input type="range" class="slide-l" min="0" max="100" value="${hsl.l}" title="Lightness">
                    </div>
                </div>

                <!-- Footer Card details (Labels + controls) -->
                <div class="card-details">
                    <!-- HEX code input panel -->
                    <div class="hex-input-container">
                        <span class="hex-hash">#</span>
                        <input type="text" class="hex-value-input" value="${color.hex.replace('#', '')}" maxlength="6" title="HEX color code">
                    </div>

                    <!-- WCAG accessibility ratio badge -->
                    <div class="badge-contrast ${contrastRating.class}">
                        ${contrastRating.score} contrast
                    </div>

                    <!-- Lock, Copy, Close Actions panel -->
                    <div class="card-actions">
                        <button class="action-icon-btn copy-hex-btn" title="Copy HEX to clipboard">
                            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z"/></svg>
                        </button>
                        <button class="action-icon-btn lock-btn ${color.locked ? 'locked' : ''}" title="${color.locked ? 'Unlock Color' : 'Lock Color'}">
                            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
                        </button>
                        <button class="action-icon-btn remove-card-btn" title="Remove Color card">
                            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                        <div class="action-icon-btn drag-handle" title="Drag to reorder">
                            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5"/></svg>
                        </div>
                    </div>
                </div>
            `;

            // Event Listeners for Color adjustments
            const bgTrigger = card.querySelector('.color-bg-trigger');
            const hexInput = card.querySelector('.hex-value-input');
            const copyHexBtn = card.querySelector('.copy-hex-btn');
            const lockBtn = card.querySelector('.lock-btn');
            const removeBtn = card.querySelector('.remove-card-btn');
            
            // HSL adjustments
            const slideH = card.querySelector('.slide-h');
            const slideS = card.querySelector('.slide-s');
            const slideL = card.querySelector('.slide-l');

            // Interactive dynamic color picker changes background
            bgTrigger.addEventListener('input', (e) => {
                updateColorHex(color.id, e.target.value);
            });

            hexInput.addEventListener('input', (e) => {
                const val = e.target.value;
                if (val.length === 6) {
                    updateColorHex(color.id, '#' + val);
                }
            });

            // If input loses focus and is invalid, restore previous
            hexInput.addEventListener('blur', (e) => {
                e.target.value = color.hex.replace('#', '');
            });

            copyHexBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(color.hex);
                showToast(`Copied ${color.hex} to clipboard!`);
            });

            lockBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleColorLock(color.id);
            });

            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeColor(color.id);
            });

            // Sliders real-time feedback
            slideH.addEventListener('input', (e) => {
                const label = slideH.previousElementSibling.querySelector('span');
                label.innerText = `${e.target.value}°`;
                updateColorHslSlider(color.id, 'h', e.target.value);
            });
            slideS.addEventListener('input', (e) => {
                const label = slideS.previousElementSibling.querySelector('span');
                label.innerText = `${e.target.value}%`;
                updateColorHslSlider(color.id, 's', e.target.value);
            });
            slideL.addEventListener('input', (e) => {
                const label = slideL.previousElementSibling.querySelector('span');
                label.innerText = `${e.target.value}%`;
                updateColorHslSlider(color.id, 'l', e.target.value);
            });

            // --- HTML5 Drag and Drop Handlers ---
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', index);
                card.classList.add('dragging');
            });

            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                card.classList.add('drag-over');
            });

            card.addEventListener('dragleave', () => {
                card.classList.remove('drag-over');
            });

            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove('drag-over');
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const toIndex = index;
                
                if (fromIndex !== toIndex) {
                    const draggedItem = palette[fromIndex];
                    palette.splice(fromIndex, 1);
                    palette.splice(toIndex, 0, draggedItem);
                    
                    renderPalette();
                    updateLivePreview();
                    showToast('🔀 Reordered colors');
                }
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });

            paletteGrid.appendChild(card);
        });
    }

    // --- Dynamic Live UI Preview Hydration ---
    function updateLivePreview() {
        if (palette.length === 0) return;

        // Allocate palette colors to mockup UI properties
        const c1 = palette[0].hex; // Backgrounds or branding
        const c2 = palette[1] ? palette[1].hex : c1; // Prominents or primary
        const c3 = palette[2] ? palette[2].hex : c2; // Accents or cards
        const c4 = palette[3] ? palette[3].hex : c3; // Tags / borders
        const c5 = palette[4] ? palette[4].hex : c4; // Extra tags

        const t1 = getBestTextColor(c1);
        const t2 = getBestTextColor(c2);
        const t3 = getBestTextColor(c3);
        const t4 = getBestTextColor(c4);
        const t5 = getBestTextColor(c5);

        // 1. Mockup SaaS Navbar
        pHeader.style.backgroundColor = c1;
        pHeader.style.color = t1;
        pLogoDot.style.backgroundColor = c2;

        // 2. Mockup Hero banner
        pHero.style.backgroundColor = c2;
        pHero.style.color = t2;

        // 3. Buttons preview
        pBtnMain.style.backgroundColor = c3;
        pBtnMain.style.color = t3;
        
        pBtnSec.style.borderColor = c4;
        pBtnSec.style.color = c4;

        // 4. Grid card mockups
        pCard1.style.backgroundColor = 'rgba(255,255,255,0.02)';
        pCard1.style.borderColor = 'rgba(255,255,255,0.05)';
        pTag1.style.backgroundColor = c4;
        pTag1.style.color = t4;

        pCard2.style.backgroundColor = 'rgba(255,255,255,0.02)';
        pCard2.style.borderColor = 'rgba(255,255,255,0.05)';
        pTag2.style.backgroundColor = c5;
        pTag2.style.color = t5;
    }

    // --- Saved Palettes (LocalStorage Engine) ---
    function saveCurrentPalette() {
        const hexList = palette.map(c => c.hex);
        const paletteId = 'p-' + Date.now();
        const defaultName = `Palette #${savedPalettes.length + 1}`;

        const newPalette = {
            id: paletteId,
            name: defaultName,
            colors: hexList
        };

        savedPalettes.unshift(newPalette);
        localStorage.setItem('chromaforge_palettes', JSON.stringify(savedPalettes));
        
        renderSavedPalettes();
        showToast('⭐ Saved palette to library!');
    }

    function deleteSavedPalette(id) {
        savedPalettes = savedPalettes.filter(p => p.id !== id);
        localStorage.setItem('chromaforge_palettes', JSON.stringify(savedPalettes));
        renderSavedPalettes();
        showToast('🗑️ Deleted palette');
    }

    function renameSavedPalette(id, newName) {
        savedPalettes = savedPalettes.map(p => {
            if (p.id === id) return { ...p, name: newName };
            return p;
        });
        localStorage.setItem('chromaforge_palettes', JSON.stringify(savedPalettes));
    }

    function loadSavedPalette(colorsList) {
        // Rehydrate active colors grid
        palette = colorsList.map((hex, index) => {
            return {
                hex: hex,
                locked: false,
                id: 'color-' + index + '-' + Date.now()
            };
        });
        renderPalette();
        updateLivePreview();
        showToast('🚀 Loaded palette into canvas!');
    }

    function renderSavedPalettes() {
        savedPalettesList.innerHTML = '';
        savedCountLabel.innerText = `${savedPalettes.length} Palettes`;

        if (savedPalettes.length === 0) {
            savedPalettesList.innerHTML = `
                <div class="empty-saved">
                    No saved palettes yet.<br>Click "Save" above to create one.
                </div>
            `;
            return;
        }

        savedPalettes.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'saved-palette-item';
            
            // Create strip blocks
            let colorStrips = '';
            item.colors.forEach(hex => {
                colorStrips += `<div class="color-strip-bar" style="background-color: ${hex};"></div>`;
            });

            itemEl.innerHTML = `
                <div class="palette-meta">
                    <input type="text" class="palette-name-input" value="${item.name}" title="Rename palette">
                    <div class="palette-meta-actions">
                        <button class="palette-mini-action load" title="Load Palette">📂</button>
                        <button class="palette-mini-action delete" title="Delete Palette">🗑️</button>
                    </div>
                </div>
                <div class="palette-color-strip">
                    ${colorStrips}
                </div>
            `;

            // Setup triggers
            const nameInput = itemEl.querySelector('.palette-name-input');
            const loadBtn = itemEl.querySelector('.palette-mini-action.load');
            const delBtn = itemEl.querySelector('.palette-mini-action.delete');
            const strip = itemEl.querySelector('.palette-color-strip');

            nameInput.addEventListener('change', (e) => {
                renameSavedPalette(item.id, e.target.value);
            });

            loadBtn.addEventListener('click', () => loadSavedPalette(item.colors));
            strip.addEventListener('click', () => loadSavedPalette(item.colors));
            delBtn.addEventListener('click', () => deleteSavedPalette(item.id));

            savedPalettesList.appendChild(itemEl);
        });
    }

    function loadLocalStorage() {
        const stored = localStorage.getItem('chromaforge_palettes');
        if (stored) {
            try {
                savedPalettes = JSON.parse(stored);
            } catch (e) {
                savedPalettes = [];
            }
        }
        renderSavedPalettes();
    }

    // --- Modal Exports generator ---
    function populateExportData() {
        const hexList = palette.map(c => c.hex);
        
        // 1. CSS Variables
        let cssStr = ':root {\n';
        hexList.forEach((hex, index) => {
            cssStr += `  --color-${index + 1}: ${hex};\n`;
        });
        cssStr += '}';
        exportCssCode.innerText = cssStr;

        // 2. Tailwind Config
        let twStr = 'colors: {\n';
        hexList.forEach((hex, index) => {
            twStr += `  color${index + 1}: '${hex}',\n`;
        });
        twStr += '}';
        exportTailwindCode.innerText = twStr;

        // 3. JSON Array
        exportJsonCode.innerText = JSON.stringify(hexList, null, 2);
    }

    function toggleExportModal(show) {
        if (show) {
            populateExportData();
            exportModal.classList.add('active');
        } else {
            exportModal.classList.remove('active');
        }
    }

    // --- Toast Notifications System ---
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('removing');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 2200);
    }

    // --- Event Listeners Setup ---

    // Keyboard Spacebar listener
    window.addEventListener('keydown', (e) => {
        // Prevent default spacebar scrolling if focus isn't inside text fields
        if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            generatePalette();
        }
    });

    generateBtn.addEventListener('click', () => generatePalette());
    addColorBtn.addEventListener('click', () => addNewColor());
    saveBtn.addEventListener('click', () => saveCurrentPalette());
    
    // Modal controls
    exportBtn.addEventListener('click', () => toggleExportModal(true));
    modalCloseBtn.addEventListener('click', () => toggleExportModal(false));
    exportModal.addEventListener('click', (e) => {
        if (e.target === exportModal) toggleExportModal(false);
    });

    // Copy actions in Modal
    copyCssBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(exportCssCode.innerText);
        showToast('📋 Copied CSS variables to clipboard!');
    });

    copyTailwindBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(exportTailwindCode.innerText);
        showToast('📋 Copied Tailwind configuration!');
    });

    copyJsonBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(exportJsonCode.innerText);
        showToast('📋 Copied JSON array!');
    });

    // Handle Harmony selection resets
    harmonySelector.addEventListener('change', () => {
        generatePalette();
        showToast(`🔄 Switch harmony to: ${harmonySelector.value}`);
    });

    // --- Initialize App ---
    loadLocalStorage();
    initializePalette();
});
