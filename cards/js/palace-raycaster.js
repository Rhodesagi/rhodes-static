/**
 * RhodesCards Memory Palace — Raycaster Engine
 * Pseudo-3D renderer using DDA algorithm. Zero dependencies.
 * Reference: Lode's Raycasting Tutorial (lodev.org)
 */
(function() {
    'use strict';

    var TEX_W = 64, TEX_H = 64;

    var RC_Ray = {
        canvas: null, ctx: null, imgData: null, buf: null, buf8: null,
        width: 0, height: 0,
        map: null, mapW: 0, mapH: 0,
        posX: 0, posY: 0, dirX: -1, dirY: 0,
        planeX: 0, planeY: 0.66,
        textures: [], // Uint32Array[TEX_W * TEX_H] per texture
        sprites: [],  // { x, y, type, texture, data }
        zBuffer: [],
        animId: null, lastTime: 0,
        keys: {}, mouseX: 0, mouseLocked: false,
        moveSpeed: 3.5, rotSpeed: 2.0, mouseSens: 0.002,
        _boundKey: null, _boundKeyUp: null, _boundMouse: null, _boundClick: null, _boundResize: null,
        interactCallback: null,
        showMinimap: true,

        init: function(containerId) {
            var container = document.getElementById(containerId);
            if (!container) return;
            container.innerHTML = '';
            this.canvas = document.createElement('canvas');
            this.canvas.style.cssText = 'width:100%;height:100%;display:block;cursor:crosshair;image-rendering:pixelated';
            container.appendChild(this.canvas);
            this._resize(container);
            this.ctx = this.canvas.getContext('2d');
            this.imgData = this.ctx.createImageData(this.width, this.height);
            this.buf = new ArrayBuffer(this.imgData.data.length);
            this.buf8 = new Uint8ClampedArray(this.buf);
            this.zBuffer = new Float64Array(this.width);
            this._genTextures();
            this._bindEvents(container);
        },

        _resize: function(container) {
            // Render at half res for performance, CSS scales up
            var w = Math.min(container.clientWidth, 960);
            var h = Math.min(container.clientHeight, 540);
            // Keep aspect ratio reasonable
            this.width = Math.floor(w / 2) * 2;
            this.height = Math.floor(h / 2) * 2;
            if (this.width < 320) this.width = 320;
            if (this.height < 240) this.height = 240;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            if (this.ctx) {
                this.imgData = this.ctx.createImageData(this.width, this.height);
                this.buf = new ArrayBuffer(this.imgData.data.length);
                this.buf8 = new Uint8ClampedArray(this.buf);
                this.zBuffer = new Float64Array(this.width);
            }
        },

        setMap: function(map, w, h) {
            this.map = map;
            this.mapW = w;
            this.mapH = h;
        },

        setSprites: function(sprites) {
            this.sprites = sprites || [];
        },

        setPos: function(x, y, angle) {
            this.posX = x; this.posY = y;
            this.dirX = Math.cos(angle); this.dirY = Math.sin(angle);
            this.planeX = -this.dirY * 0.66; this.planeY = this.dirX * 0.66;
        },

        // ── Procedural textures ──
        _genTextures: function() {
            this.textures = [];
            var i, x, y, c, r, g, b;
            for (i = 0; i < 6; i++) {
                this.textures[i] = new Uint32Array(TEX_W * TEX_H);
            }
            // 0: Stone (gray noise)
            for (x = 0; x < TEX_W; x++) for (y = 0; y < TEX_H; y++) {
                c = 80 + ((x * 7 + y * 13 + x * y) & 31);
                this.textures[0][y * TEX_W + x] = 0xFF000000 | (c << 16) | (c << 8) | c;
            }
            // 1: Brick (red with mortar)
            for (x = 0; x < TEX_W; x++) for (y = 0; y < TEX_H; y++) {
                var mortar = (y % 16 < 1) || (x % 32 < 1 && y % 32 < 16) || ((x + 16) % 32 < 1 && y % 32 >= 16);
                if (mortar) { r = 160; g = 155; b = 145; }
                else { r = 140 + ((x * 3 + y * 7) & 15); g = 50 + ((x + y) & 7); b = 40; }
                this.textures[1][y * TEX_W + x] = 0xFF000000 | (b << 16) | (g << 8) | r;
            }
            // 2: Wood (brown grain)
            for (x = 0; x < TEX_W; x++) for (y = 0; y < TEX_H; y++) {
                var grain = (Math.abs(((y * 3 + x) * 7) % 64 - 32)) >> 3;
                r = 100 + grain * 5; g = 60 + grain * 3; b = 30 + grain;
                this.textures[2][y * TEX_W + x] = 0xFF000000 | (b << 16) | (g << 8) | r;
            }
            // 3: Dark stone
            for (x = 0; x < TEX_W; x++) for (y = 0; y < TEX_H; y++) {
                c = 40 + ((x * 11 + y * 7 + x * y * 3) & 23);
                this.textures[3][y * TEX_W + x] = 0xFF000000 | (c << 16) | (c << 8) | c;
            }
            // 4: Blue tile
            for (x = 0; x < TEX_W; x++) for (y = 0; y < TEX_H; y++) {
                var edge = (x % 16 < 1 || y % 16 < 1) ? 1 : 0;
                r = edge ? 30 : 40; g = edge ? 40 : 60 + ((x + y) & 7); b = edge ? 50 : 120 + ((x * 3 + y) & 15);
                this.textures[4][y * TEX_W + x] = 0xFF000000 | (b << 16) | (g << 8) | r;
            }
            // 5: Metal (gray with rivets)
            for (x = 0; x < TEX_W; x++) for (y = 0; y < TEX_H; y++) {
                c = 100 + ((x * 5 + y * 3) & 15);
                var rivet = ((x - 8) * (x - 8) + (y - 8) * (y - 8) < 9) || ((x - 56) * (x - 56) + (y - 56) * (y - 56) < 9);
                if (rivet) c += 30;
                this.textures[5][y * TEX_W + x] = 0xFF000000 | (c << 16) | ((c - 10) << 8) | (c + 10);
            }

            // Generate sprite textures (64x64 each, 0 = transparent)
            this.spriteTextures = {};
            this._genNapoleon();
            this._genOrb();
            this._genPedestal();
            this._genFrame();
            this._genGlow();
        },

        _px: function(tex, x, y, r, g, b) {
            if (x >= 0 && x < 64 && y >= 0 && y < 64)
                tex[y * 64 + x] = 0xFF000000 | (b << 16) | (g << 8) | r;
        },

        _rect: function(tex, x1, y1, x2, y2, r, g, b) {
            for (var yy = y1; yy <= y2; yy++)
                for (var xx = x1; xx <= x2; xx++)
                    this._px(tex, xx, yy, r, g, b);
        },

        _FONT: {
            N:[1,0,1,1,1,1,1,0,1,1,0,1,1,0,1],
            A:[0,1,0,1,0,1,1,1,1,1,0,1,1,0,1],
            P:[1,1,0,1,0,1,1,1,0,1,0,0,1,0,0],
            O:[0,1,0,1,0,1,1,0,1,1,0,1,0,1,0],
            L:[1,0,0,1,0,0,1,0,0,1,0,0,1,1,1],
            E:[1,1,1,1,0,0,1,1,0,1,0,0,1,1,1]
        },

        _drawText: function(tex, sx, sy, text, r, g, b) {
            var cx = sx;
            for (var ci = 0; ci < text.length; ci++) {
                var gl = this._FONT[text[ci]];
                if (!gl) { cx += 3; continue; }
                for (var gy = 0; gy < 5; gy++)
                    for (var gx = 0; gx < 3; gx++)
                        if (gl[gy * 3 + gx]) this._px(tex, cx + gx, sy + gy, r, g, b);
                cx += 4;
            }
        },

        _genNapoleon: function() {
            // 2 frames of animation
            for (var frame = 0; frame < 2; frame++) {
                var t = new Uint32Array(64 * 64); // 0 = transparent
                var sway = frame; // slight sway

                // Boots (dark brown)
                this._rect(t, 24+sway, 56, 30+sway, 63, 40, 25, 15);
                this._rect(t, 33+sway, 56, 39+sway, 63, 40, 25, 15);

                // Trousers (white)
                this._rect(t, 25+sway, 44, 30+sway, 56, 220, 215, 200);
                this._rect(t, 33+sway, 44, 38+sway, 56, 220, 215, 200);

                // Coat body (dark blue)
                this._rect(t, 23+sway, 28, 40+sway, 44, 25, 35, 90);
                // Coat tails
                this._rect(t, 23+sway, 44, 27+sway, 50, 20, 30, 80);
                this._rect(t, 36+sway, 44, 40+sway, 50, 20, 30, 80);

                // Vest (white V front)
                this._rect(t, 29+sway, 30, 34+sway, 40, 230, 225, 210);

                // Epaulettes (gold)
                this._rect(t, 21+sway, 28, 24+sway, 30, 200, 170, 50);
                this._rect(t, 39+sway, 28, 42+sway, 30, 200, 170, 50);

                // Hand in coat (right hand tucked)
                this._rect(t, 30+sway, 35, 33+sway, 38, 210, 180, 150);

                // Left arm (slightly out)
                this._rect(t, 20+sway - frame, 31, 23+sway, 40, 25, 35, 90);
                // Left hand
                this._rect(t, 19+sway - frame, 39, 22+sway - frame, 42, 210, 180, 150);

                // Collar (high, white)
                this._rect(t, 27+sway, 25, 36+sway, 28, 240, 235, 220);

                // Head (face)
                this._rect(t, 28+sway, 16, 35+sway, 25, 220, 190, 160);
                // Sideburns
                this._rect(t, 27+sway, 18, 28+sway, 23, 70, 50, 30);
                this._rect(t, 35+sway, 18, 36+sway, 23, 70, 50, 30);
                // Eyes
                this._px(t, 30+sway, 20, 30, 30, 40);
                this._px(t, 33+sway, 20, 30, 30, 40);
                // Mouth
                this._px(t, 31+sway, 23, 180, 120, 110);
                this._px(t, 32+sway, 23, 180, 120, 110);

                // BICORNE HAT (the iconic shape)
                // Brim
                this._rect(t, 22+sway, 14, 41+sway, 16, 15, 15, 25);
                // Hat body (tall sides)
                this._rect(t, 25+sway, 6, 38+sway, 14, 15, 15, 25);
                // Hat peaks (the two points)
                this._rect(t, 22+sway, 8, 25+sway, 14, 15, 15, 25);
                this._rect(t, 38+sway, 8, 41+sway, 14, 15, 15, 25);
                // Cockade (red-white-blue rosette)
                this._px(t, 31+sway, 11, 200, 30, 30);
                this._px(t, 32+sway, 11, 240, 240, 240);
                this._px(t, 33+sway, 11, 30, 50, 180);
                this._px(t, 31+sway, 12, 200, 30, 30);
                this._px(t, 32+sway, 12, 240, 240, 240);
                this._px(t, 33+sway, 12, 30, 50, 180);

                // Medals on chest (gold dots)
                this._px(t, 26+sway, 32, 220, 190, 50);
                this._px(t, 27+sway, 33, 220, 190, 50);
                this._px(t, 28+sway, 32, 220, 190, 50);

                // Sword hilt at waist (gold)
                this._rect(t, 41+sway, 38, 43+sway, 42, 180, 160, 40);

                // Base/pedestal
                this._rect(t, 20, 62, 43, 63, 100, 95, 85);
                this._rect(t, 22, 60, 41, 62, 110, 105, 95);

                this.spriteTextures['napoleon_' + frame] = t;
            }
            this.spriteTextures['statue'] = this.spriteTextures['napoleon_0'];
        },

        _genOrb: function() {
            var t = new Uint32Array(64 * 64);
            for (var y = 0; y < 64; y++) for (var x = 0; x < 64; x++) {
                var dx = x - 32, dy = y - 32;
                var d = Math.sqrt(dx * dx + dy * dy);
                if (d < 20) {
                    var shade = 1.0 - d / 25;
                    var highlight = Math.max(0, 1 - Math.sqrt((dx + 5) * (dx + 5) + (dy + 5) * (dy + 5)) / 12);
                    var r = Math.min(255, Math.floor(80 * shade + 180 * highlight));
                    var g = Math.min(255, Math.floor(120 * shade + 200 * highlight));
                    var b = Math.min(255, Math.floor(255 * shade + 255 * highlight));
                    t[y * 64 + x] = 0xFF000000 | (b << 16) | (g << 8) | r;
                }
            }
            this.spriteTextures['orb'] = t;
        },

        _genPedestal: function() {
            var t = new Uint32Array(64 * 64);
            // Column
            this._rect(t, 24, 20, 39, 55, 140, 135, 125);
            this._rect(t, 25, 21, 38, 54, 160, 155, 145);
            // Top plate
            this._rect(t, 20, 16, 43, 20, 150, 145, 135);
            // Base
            this._rect(t, 20, 55, 43, 60, 130, 125, 115);
            this._rect(t, 18, 60, 45, 63, 120, 115, 105);
            // Orb on top
            for (var y = 4; y < 18; y++) for (var x = 25; x < 39; x++) {
                var dx = x - 32, dy = y - 11;
                if (dx * dx + dy * dy < 49) {
                    var shade = 1.0 - Math.sqrt(dx*dx+dy*dy) / 10;
                    t[y * 64 + x] = 0xFF000000 | (Math.floor(200*shade) << 16) | (Math.floor(180*shade) << 8) | Math.floor(80*shade);
                }
            }
            this.spriteTextures['pedestal'] = t;
        },

        _genFrame: function() {
            var t = new Uint32Array(64 * 64);
            // Outer frame (gold)
            this._rect(t, 10, 8, 53, 55, 160, 130, 50);
            // Inner frame
            this._rect(t, 12, 10, 51, 53, 180, 150, 60);
            // Canvas (dark, like a painting)
            this._rect(t, 14, 12, 49, 51, 60, 40, 35);
            // Simple landscape: sky
            this._rect(t, 14, 12, 49, 30, 70, 90, 130);
            // Ground
            this._rect(t, 14, 30, 49, 51, 50, 70, 40);
            // Sun
            for (var y = 14; y < 24; y++) for (var x = 38; x < 48; x++) {
                var dx = x-43, dy = y-19;
                if (dx*dx+dy*dy < 20) t[y*64+x] = 0xFF000000 | (100 << 16) | (220 << 8) | 240;
            }
            this.spriteTextures['frame'] = t;
        },

        _genGlow: function() {
            var t = new Uint32Array(64 * 64);
            for (var y = 0; y < 64; y++) for (var x = 0; x < 64; x++) {
                var dx = x - 32, dy = y - 32;
                var d = Math.sqrt(dx * dx + dy * dy);
                if (d < 28) {
                    var a = Math.max(0, 1.0 - d / 28);
                    a = a * a; // fade out edges
                    var r = Math.min(255, Math.floor(50 * a));
                    var g = Math.min(255, Math.floor(255 * a));
                    var b = Math.min(255, Math.floor(150 * a));
                    if (a > 0.05) t[y * 64 + x] = 0xFF000000 | (b << 16) | (g << 8) | r;
                }
            }
            this.spriteTextures['glow'] = t;
        },

        // ── Main render ──
        render: function() {
            var w = this.width, h = this.height;
            var data = new Uint32Array(this.buf);
            var halfH = h >> 1;

            // Ceiling & floor (gradient)
            for (var y = 0; y < h; y++) {
                var shade;
                if (y < halfH) {
                    shade = Math.floor(15 + 20 * (1 - y / halfH)); // ceiling
                    for (var x = 0; x < w; x++) data[y * w + x] = 0xFF000000 | (shade << 16) | ((shade + 5) << 8) | (shade + 10);
                } else {
                    shade = Math.floor(15 + 30 * ((y - halfH) / halfH)); // floor
                    for (var x = 0; x < w; x++) data[y * w + x] = 0xFF000000 | (shade << 16) | (shade << 8) | (shade - 5 > 0 ? shade - 5 : 0);
                }
            }

            // ── Walls (DDA) ──
            for (var x = 0; x < w; x++) {
                var cameraX = 2 * x / w - 1;
                var rayDirX = this.dirX + this.planeX * cameraX;
                var rayDirY = this.dirY + this.planeY * cameraX;

                var mapX = Math.floor(this.posX), mapY = Math.floor(this.posY);
                var deltaDistX = Math.abs(1 / rayDirX);
                var deltaDistY = Math.abs(1 / rayDirY);
                var stepX, stepY, sideDistX, sideDistY;

                if (rayDirX < 0) { stepX = -1; sideDistX = (this.posX - mapX) * deltaDistX; }
                else { stepX = 1; sideDistX = (mapX + 1 - this.posX) * deltaDistX; }
                if (rayDirY < 0) { stepY = -1; sideDistY = (this.posY - mapY) * deltaDistY; }
                else { stepY = 1; sideDistY = (mapY + 1 - this.posY) * deltaDistY; }

                var hit = 0, side = 0;
                while (!hit) {
                    if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; }
                    else { sideDistY += deltaDistY; mapY += stepY; side = 1; }
                    if (mapX < 0 || mapX >= this.mapW || mapY < 0 || mapY >= this.mapH) { hit = 1; break; }
                    if (this.map[mapY * this.mapW + mapX] > 0) hit = 1;
                }

                var perpDist;
                if (side === 0) perpDist = sideDistX - deltaDistX;
                else perpDist = sideDistY - deltaDistY;
                if (perpDist < 0.001) perpDist = 0.001;
                this.zBuffer[x] = perpDist;

                var lineH = Math.floor(h / perpDist);
                var drawStart = Math.max(0, halfH - (lineH >> 1));
                var drawEnd = Math.min(h - 1, halfH + (lineH >> 1));

                // Texture mapping
                var texNum = this.map[mapY * this.mapW + mapX] - 1;
                if (texNum < 0 || texNum >= this.textures.length) texNum = 0;

                var wallX;
                if (side === 0) wallX = this.posY + perpDist * rayDirY;
                else wallX = this.posX + perpDist * rayDirX;
                wallX -= Math.floor(wallX);

                var texX = Math.floor(wallX * TEX_W);
                if (side === 0 && rayDirX > 0) texX = TEX_W - texX - 1;
                if (side === 1 && rayDirY < 0) texX = TEX_W - texX - 1;
                if (texX < 0) texX = 0;
                if (texX >= TEX_W) texX = TEX_W - 1;

                var step = TEX_H / lineH;
                var texPos = (drawStart - halfH + (lineH >> 1)) * step;
                var tex = this.textures[texNum];

                for (var y = drawStart; y <= drawEnd; y++) {
                    var texY = Math.floor(texPos) & (TEX_H - 1);
                    texPos += step;
                    var color = tex[texY * TEX_W + texX];
                    // Darken side=1 for depth
                    if (side === 1) {
                        color = (color & 0xFF000000) |
                            (((color & 0xFF0000) >> 1) & 0xFF0000) |
                            (((color & 0x00FF00) >> 1) & 0x00FF00) |
                            (((color & 0x0000FF) >> 1) & 0x0000FF);
                    }
                    data[y * w + x] = color;
                }
            }

            // ── Sprites ──
            this._renderSprites(data, w, h);

            // Copy to canvas
            this.imgData.data.set(this.buf8);
            this.ctx.putImageData(this.imgData, 0, 0);

            // Draw sprite labels in screen space
            this._drawSpriteLabels(w, h);

            // Minimap overlay
            if (this.showMinimap) this._renderMinimap();

            // Crosshair
            this.ctx.strokeStyle = '#0f8';
            this.ctx.lineWidth = 1;
            var cx = w >> 1, cy = h >> 1;
            this.ctx.beginPath();
            this.ctx.moveTo(cx - 8, cy); this.ctx.lineTo(cx + 8, cy);
            this.ctx.moveTo(cx, cy - 8); this.ctx.lineTo(cx, cy + 8);
            this.ctx.stroke();

            // Interaction hint
            var nearest = this._nearestSprite();
            if (nearest && nearest.dist < 1.5) {
                this.ctx.fillStyle = '#0f8';
                this.ctx.font = '14px monospace';
                this.ctx.textAlign = 'center';
                var label = nearest.sprite.data?.label || 'Locus';
                this.ctx.fillText('[E] ' + label, cx, h - 40);
            }
        },

        _renderSprites: function(data, w, h) {
            if (!this.sprites.length) return;

            // Sort by distance (far first)
            var self = this;
            var sorted = this.sprites.map(function(s, i) {
                return { i: i, dist: (self.posX - s.x) * (self.posX - s.x) + (self.posY - s.y) * (self.posY - s.y) };
            }).sort(function(a, b) { return b.dist - a.dist; });

            var invDet = 1.0 / (this.planeX * this.dirY - this.dirX * this.planeY);

            for (var i = 0; i < sorted.length; i++) {
                var s = this.sprites[sorted[i].i];
                var sx = s.x - this.posX, sy = s.y - this.posY;
                var transformX = invDet * (this.dirY * sx - this.dirX * sy);
                var transformY = invDet * (-this.planeY * sx + this.planeX * sy);
                if (transformY <= 0.1) continue;

                var spriteScreenX = Math.floor((w / 2) * (1 + transformX / transformY));
                var spriteH = Math.abs(Math.floor(h / transformY));
                var spriteW = spriteH; // square sprites

                var drawStartY = Math.max(0, (h >> 1) - (spriteH >> 1));
                var drawEndY = Math.min(h - 1, (h >> 1) + (spriteH >> 1));
                var drawStartX = Math.max(0, spriteScreenX - (spriteW >> 1));
                var drawEndX = Math.min(w - 1, spriteScreenX + (spriteW >> 1));

                // Get sprite texture (with animation)
                var texKey = s.type;
                if (s.type === 'statue') {
                    texKey = 'napoleon_' + (Math.floor(Date.now() / 600) % 2);
                }
                var spriteTex = this.spriteTextures[texKey];
                if (!spriteTex) spriteTex = this.spriteTextures['orb'];
                var hasCards = s.data && s.data.card_ids && s.data.card_ids.length > 0;
                var pulse = hasCards ? (Math.sin(Date.now() * 0.004) * 0.3 + 1.0) : 1.0;

                for (var stripe = drawStartX; stripe <= drawEndX; stripe++) {
                    if (transformY >= this.zBuffer[stripe]) continue;
                    var texX = Math.floor(((stripe - (spriteScreenX - spriteW / 2)) / spriteW) * 64);
                    if (texX < 0 || texX >= 64) continue;
                    for (var y = drawStartY; y <= drawEndY; y++) {
                        var texY = Math.floor(((y - drawStartY) / (drawEndY - drawStartY + 1)) * 64);
                        if (texY < 0 || texY >= 64) continue;
                        var pixel = spriteTex[texY * 64 + texX];
                        if (pixel === 0) continue; // transparent
                        if (pulse !== 1.0) {
                            var pr = Math.min(255, Math.floor((pixel & 0xFF) * pulse));
                            var pg = Math.min(255, Math.floor(((pixel >> 8) & 0xFF) * pulse));
                            var pb = Math.min(255, Math.floor(((pixel >> 16) & 0xFF) * pulse));
                            pixel = 0xFF000000 | (pb << 16) | (pg << 8) | pr;
                        }
                        data[y * w + stripe] = pixel;
                    }
                }
            }
        },

        _nearestSprite: function() {
            var best = null, bestDist = Infinity;
            for (var i = 0; i < this.sprites.length; i++) {
                var s = this.sprites[i];
                var dx = s.x - this.posX, dy = s.y - this.posY;
                var d = Math.sqrt(dx * dx + dy * dy);
                // Also check if roughly in front of player
                var dot = dx * this.dirX + dy * this.dirY;
                if (dot > 0 && d < bestDist) { bestDist = d; best = { sprite: s, dist: d, index: i }; }
            }
            return best;
        },

        _renderMinimap: function() {
            var size = 120, padding = 10;
            var scale = size / Math.max(this.mapW, this.mapH);
            var ox = this.width - size - padding, oy = padding;

            this.ctx.globalAlpha = 0.7;
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(ox - 2, oy - 2, size + 4, size + 4);

            // Walls
            for (var y = 0; y < this.mapH; y++) {
                for (var x = 0; x < this.mapW; x++) {
                    if (this.map[y * this.mapW + x] > 0) {
                        this.ctx.fillStyle = '#445';
                        this.ctx.fillRect(ox + x * scale, oy + y * scale, Math.ceil(scale), Math.ceil(scale));
                    }
                }
            }

            // Sprites
            for (var i = 0; i < this.sprites.length; i++) {
                var s = this.sprites[i];
                this.ctx.fillStyle = (s.data && s.data.card_ids && s.data.card_ids.length) ? '#0f8' : '#88f';
                this.ctx.fillRect(ox + s.x * scale - 1, oy + s.y * scale - 1, 3, 3);
            }

            // Player
            this.ctx.fillStyle = '#ff0';
            this.ctx.fillRect(ox + this.posX * scale - 2, oy + this.posY * scale - 2, 4, 4);
            // Direction line
            this.ctx.strokeStyle = '#ff0';
            this.ctx.beginPath();
            this.ctx.moveTo(ox + this.posX * scale, oy + this.posY * scale);
            this.ctx.lineTo(ox + (this.posX + this.dirX * 2) * scale, oy + (this.posY + this.dirY * 2) * scale);
            this.ctx.stroke();

            this.ctx.globalAlpha = 1.0;
        },

        _drawSpriteLabels: function(w, h) {
            var invDet = 1.0 / (this.planeX * this.dirY - this.dirX * this.planeY);
            this.ctx.textAlign = 'center';

            for (var i = 0; i < this.sprites.length; i++) {
                var s = this.sprites[i];
                var sx = s.x - this.posX, sy = s.y - this.posY;
                var transformY = invDet * (-this.planeY * sx + this.planeX * sy);
                if (transformY <= 0.3 || transformY > 12) continue;
                var transformX = invDet * (this.dirY * sx - this.dirX * sy);
                var screenX = Math.floor((w / 2) * (1 + transformX / transformY));
                var spriteH = Math.abs(Math.floor(h / transformY));
                var screenY = (h >> 1) - (spriteH >> 1) - 8;
                if (screenX < -100 || screenX > w + 100 || screenY < 0) continue;

                // Label text
                var label = '';
                if (s.type === 'statue') label = 'NAPOLEON';
                else if (s.data && s.data.label) label = s.data.label;
                if (!label) continue;

                var fontSize = Math.max(8, Math.min(20, Math.floor(60 / transformY)));
                this.ctx.font = 'bold ' + fontSize + 'px monospace';

                // Glow/shadow
                this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
                this.ctx.fillText(label, screenX + 1, screenY + 1);
                // Gold text for statues, green for others
                this.ctx.fillStyle = (s.type === 'statue') ? '#ddb840' : '#0f8';
                this.ctx.fillText(label, screenX, screenY);
            }
        },

        // ── Input ──
        _bindEvents: function(container) {
            var self = this;
            this._boundKey = function(e) {
                self.keys[e.code] = true;
                if (e.code === 'KeyE') self._interact();
                if (e.code === 'KeyM') self.showMinimap = !self.showMinimap;
            };
            this._boundKeyUp = function(e) { self.keys[e.code] = false; };
            this._boundMouse = function(e) {
                if (self.mouseLocked) self.mouseX += e.movementX;
            };
            this._boundClick = function() {
                if (!self.mouseLocked) {
                    self.canvas.requestPointerLock();
                }
            };
            this._boundResize = function() { self._resize(container); };

            document.addEventListener('keydown', this._boundKey);
            document.addEventListener('keyup', this._boundKeyUp);
            document.addEventListener('mousemove', this._boundMouse);
            this.canvas.addEventListener('click', this._boundClick);
            window.addEventListener('resize', this._boundResize);

            document.addEventListener('pointerlockchange', function() {
                self.mouseLocked = (document.pointerLockElement === self.canvas);
            });
        },

        _interact: function() {
            var nearest = this._nearestSprite();
            if (nearest && nearest.dist < 2.0 && this.interactCallback) {
                this.interactCallback(nearest.sprite, nearest.index);
            }
        },

        // ── Movement ──
        update: function(dt) {
            var speed = this.moveSpeed * dt;
            var rotAmt = this.rotSpeed * dt;

            // Mouse rotation
            if (this.mouseX !== 0) {
                var rot = -this.mouseX * this.mouseSens;
                var oldDirX = this.dirX;
                this.dirX = this.dirX * Math.cos(rot) - this.dirY * Math.sin(rot);
                this.dirY = oldDirX * Math.sin(rot) + this.dirY * Math.cos(rot);
                var oldPlaneX = this.planeX;
                this.planeX = this.planeX * Math.cos(rot) - this.planeY * Math.sin(rot);
                this.planeY = oldPlaneX * Math.sin(rot) + this.planeY * Math.cos(rot);
                this.mouseX = 0;
            }

            // Keyboard rotation (arrow keys)
            if (this.keys['ArrowLeft']) {
                var oldDirX = this.dirX;
                this.dirX = this.dirX * Math.cos(rotAmt) - this.dirY * Math.sin(rotAmt);
                this.dirY = oldDirX * Math.sin(rotAmt) + this.dirY * Math.cos(rotAmt);
                var oldPlaneX = this.planeX;
                this.planeX = this.planeX * Math.cos(rotAmt) - this.planeY * Math.sin(rotAmt);
                this.planeY = oldPlaneX * Math.sin(rotAmt) + this.planeY * Math.cos(rotAmt);
            }
            if (this.keys['ArrowRight']) {
                var oldDirX = this.dirX;
                this.dirX = this.dirX * Math.cos(-rotAmt) - this.dirY * Math.sin(-rotAmt);
                this.dirY = oldDirX * Math.sin(-rotAmt) + this.dirY * Math.cos(-rotAmt);
                var oldPlaneX = this.planeX;
                this.planeX = this.planeX * Math.cos(-rotAmt) - this.planeY * Math.sin(-rotAmt);
                this.planeY = oldPlaneX * Math.sin(-rotAmt) + this.planeY * Math.cos(-rotAmt);
            }

            // Sprint
            var sp = (this.keys['ShiftLeft'] || this.keys['ShiftRight']) ? speed * 2 : speed;
            var margin = 0.2;

            // WASD movement with collision
            var newX = this.posX, newY = this.posY;
            if (this.keys['KeyW'] || this.keys['ArrowUp'])   { newX += this.dirX * sp; newY += this.dirY * sp; }
            if (this.keys['KeyS'] || this.keys['ArrowDown']) { newX -= this.dirX * sp; newY -= this.dirY * sp; }
            if (this.keys['KeyA'])                            { newX += this.dirY * sp; newY -= this.dirX * sp; }
            if (this.keys['KeyD'])                            { newX -= this.dirY * sp; newY += this.dirX * sp; }

            // Wall collision (slide along walls)
            var mx, my;
            mx = Math.floor(newX + (newX > this.posX ? margin : -margin));
            if (mx >= 0 && mx < this.mapW && this.map[Math.floor(this.posY) * this.mapW + mx] === 0) {
                this.posX = newX;
            }
            my = Math.floor(newY + (newY > this.posY ? margin : -margin));
            if (my >= 0 && my < this.mapH && this.map[my * this.mapW + Math.floor(this.posX)] === 0) {
                this.posY = newY;
            }
        },

        // ── Game loop ──
        start: function() {
            this.lastTime = performance.now();
            var self = this;
            function loop(now) {
                var dt = (now - self.lastTime) / 1000;
                if (dt > 0.1) dt = 0.1; // clamp
                self.lastTime = now;
                self.update(dt);
                self.render();
                self.animId = requestAnimationFrame(loop);
            }
            this.animId = requestAnimationFrame(loop);
        },

        stop: function() {
            if (this.animId) cancelAnimationFrame(this.animId);
            this.animId = null;
        },

        dispose: function() {
            this.stop();
            if (this._boundKey) document.removeEventListener('keydown', this._boundKey);
            if (this._boundKeyUp) document.removeEventListener('keyup', this._boundKeyUp);
            if (this._boundMouse) document.removeEventListener('mousemove', this._boundMouse);
            if (this._boundClick) this.canvas.removeEventListener('click', this._boundClick);
            if (this._boundResize) window.removeEventListener('resize', this._boundResize);
            if (document.pointerLockElement === this.canvas) document.exitPointerLock();
            if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
            this.canvas = null; this.ctx = null;
        }
    };

    RC.Raycaster = RC_Ray;
})();
