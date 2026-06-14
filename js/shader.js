// WebGL Shader Background for AI Banners & Full Page (Gold-Yellow Lines Theme)

const vsSource = `
  attribute vec4 aVertexPosition;
  void main() {
    gl_Position = aVertexPosition;
  }
`;

const fsSource = `
  precision highp float;
  uniform vec2 iResolution;
  uniform float iTime;

  const float overallSpeed = 0.25;
  const float gridSmoothWidth = 0.015;
  const float axisWidth = 0.05;
  const float majorLineWidth = 0.025;
  const float minorLineWidth = 0.0125;
  const float majorLineFrequency = 5.0;
  const float minorLineFrequency = 1.0;
  const float scale = 5.0;
  
  // Gold-Yellow Line Color (RGB matching Noto Sans gold accent: 212, 160, 23)
  const vec4 lineColor = vec4(0.83, 0.63, 0.09, 1.0);
  
  const float minLineWidth = 0.01;
  const float maxLineWidth = 0.18;
  const float lineSpeed = 1.2 * overallSpeed;
  const float lineAmplitude = 0.8;
  const float lineFrequency = 0.25;
  const float warpSpeed = 0.25 * overallSpeed;
  const float warpFrequency = 0.4;
  const float warpAmplitude = 0.8;
  const float offsetFrequency = 0.45;
  const float offsetSpeed = 1.2 * overallSpeed;
  const float minOffsetSpread = 0.5;
  const float maxOffsetSpread = 1.8;

  #define drawCircle(pos, radius, coord) smoothstep(radius + gridSmoothWidth, radius, length(coord - (pos)))
  #define drawSmoothLine(pos, halfWidth, t) smoothstep(halfWidth, 0.0, abs(pos - (t)))
  #define drawCrispLine(pos, halfWidth, t) smoothstep(halfWidth + gridSmoothWidth, halfWidth, abs(pos - (t)))
  #define drawPeriodicLine(freq, width, t) drawCrispLine(freq / 2.0, width, abs(mod(t, freq) - (freq) / 2.0))

  float drawGridLines(float axis) {
    return drawCrispLine(0.0, axisWidth, axis)
          + drawPeriodicLine(majorLineFrequency, majorLineWidth, axis)
          + drawPeriodicLine(minorLineFrequency, minorLineWidth, axis);
  }

  float drawGrid(vec2 space) {
    return min(1.0, drawGridLines(space.x) + drawGridLines(space.y));
  }

  float random(float t) {
    return (cos(t) + cos(t * 1.3 + 1.3) + cos(t * 1.4 + 1.4)) / 3.0;
  }

  float getPlasmaY(float x, float horizontalFade, float offset) {
    return random(x * lineFrequency + iTime * lineSpeed) * horizontalFade * lineAmplitude + offset;
  }

  void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec4 fragColor;
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec2 space = (fragCoord - iResolution.xy / 2.0) / iResolution.x * 2.0 * scale;

    float horizontalFade = 1.0 - (cos(uv.x * 6.28) * 0.5 + 0.5);
    float verticalFade = 1.0 - (cos(uv.y * 6.28) * 0.5 + 0.5);

    space.y += random(space.x * warpFrequency + iTime * warpSpeed) * warpAmplitude * (0.5 + horizontalFade);
    space.x += random(space.y * warpFrequency + iTime * warpSpeed + 2.0) * warpAmplitude * horizontalFade;

    vec4 lines = vec4(0.0);
    
    // Charcoal Dark Gray backgrounds to blend with --dark-gray banner
    vec4 bgColor1 = vec4(0.06, 0.06, 0.06, 1.0);
    vec4 bgColor2 = vec4(0.12, 0.12, 0.12, 1.0);

    for(int l = 0; l < 12; l++) {
      float normalizedLineIndex = float(l) / 12.0;
      float offsetTime = iTime * offsetSpeed;
      float offsetPosition = float(l) + space.x * offsetFrequency;
      float rand = random(offsetPosition + offsetTime) * 0.5 + 0.5;
      float halfWidth = mix(minLineWidth, maxLineWidth, rand * horizontalFade) / 2.0;
      float offset = random(offsetPosition + offsetTime * (1.0 + normalizedLineIndex)) * mix(minOffsetSpread, maxOffsetSpread, horizontalFade);
      float linePosition = getPlasmaY(space.x, horizontalFade, offset);
      float line = drawSmoothLine(linePosition, halfWidth, space.y) / 2.0 + drawCrispLine(linePosition, halfWidth * 0.12, space.y);

      float circleX = mod(float(l) + iTime * lineSpeed, 25.0) - 12.0;
      vec2 circlePosition = vec2(circleX, getPlasmaY(circleX, horizontalFade, offset));
      float circle = drawCircle(circlePosition, 0.01, space) * 3.0;

      line = line + circle;
      lines += line * lineColor * rand;
    }

    fragColor = mix(bgColor1, bgColor2, uv.x);
    fragColor *= verticalFade;
    fragColor.a = 1.0;
    fragColor += lines;

    gl_FragColor = fragColor;
  }
`;

// ============================================================================
// WebGL Boilerplate
// ============================================================================

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error: ', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return null;
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Shader program link error: ', gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    return shaderProgram;
}

const activeShaderBanners = [];

function initShaderBanner(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.warn('WebGL not supported for', canvasId);
        return;
    }

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    if (!shaderProgram) {
        console.error('Failed to compile Lines shader for', canvasId);
        return;
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1,  -1, 1,  1, 1
    ]), gl.STATIC_DRAW);

    const programInfo = {
        canvas: canvas,
        gl: gl,
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        },
        uniformLocations: {
            resolution: gl.getUniformLocation(shaderProgram, 'iResolution'),
            time: gl.getUniformLocation(shaderProgram, 'iTime'),
        },
        positionBuffer: positionBuffer,
        startTime: Date.now()
    };

    activeShaderBanners.push(programInfo);
    resizeBannerCanvas(programInfo);
}

function resizeBannerCanvas(info) {
    const canvas = info.canvas;
    const gl = info.gl;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.floor(canvas.clientWidth * dpr);
    const height = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
    }
}

function renderShaderBanners() {
    const now = Date.now();

    activeShaderBanners.forEach(info => {
        const canvas = info.canvas;
        if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) return;

        resizeBannerCanvas(info);

        const gl = info.gl;
        const currentTime = (now - info.startTime) / 1000;

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(info.program);
        gl.uniform2f(info.uniformLocations.resolution, canvas.width, canvas.height);
        gl.uniform1f(info.uniformLocations.time, currentTime);

        gl.bindBuffer(gl.ARRAY_BUFFER, info.positionBuffer);
        gl.vertexAttribPointer(info.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(info.attribLocations.vertexPosition);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    });

    requestAnimationFrame(renderShaderBanners);
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initShaderBanner('glass-bg-canvas');
        initShaderBanner('canvas-banner-dashboard');
        initShaderBanner('canvas-banner-insights');
        initShaderBanner('canvas-banner-agent');
        requestAnimationFrame(renderShaderBanners);
    }, 100);

    window.addEventListener('resize', () => {
        activeShaderBanners.forEach(resizeBannerCanvas);
    });
});
