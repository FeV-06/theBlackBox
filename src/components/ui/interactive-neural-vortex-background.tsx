"use client";

import React, { useEffect, useRef } from "react";

interface InteractiveNeuralVortexProps {
    className?: string;
}

const InteractiveNeuralVortex: React.FC<InteractiveNeuralVortexProps> = ({ className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pointer = useRef({ x: 0, y: 0, tX: 0, tY: 0 });
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const canvasEl = canvasRef.current;
        if (!canvasEl) return;

        const gl =
            canvasEl.getContext("webgl") ||
            canvasEl.getContext("experimental-webgl");
        if (!gl) {
            console.error("WebGL not supported");
            return;
        }

        // ─── Shader sources ───
        const vsSource = `
      precision mediump float;
      attribute vec2 a_position;
      varying vec2 vUv;
      void main() {
        vUv = .5 * (a_position + 1.);
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

        const fsSource = `
      precision mediump float;
      varying vec2 vUv;
      uniform float u_time;
      uniform float u_ratio;
      uniform vec2 u_pointer_position;
      uniform float u_scroll_progress;
      
      vec2 rotate(vec2 uv, float th) {
        return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
      }
      
      float neuro_shape(vec2 uv, float t, float p) {
        vec2 sine_acc = vec2(0.);
        vec2 res = vec2(0.);
        float scale = 8.;
        for (int j = 0; j < 15; j++) {
          uv = rotate(uv, 1.);
          sine_acc = rotate(sine_acc, 1.);
          vec2 layer = uv * scale + float(j) + sine_acc - t;
          sine_acc += sin(layer) + 2.4 * p;
          res += (.5 + .5 * cos(layer)) / scale;
          scale *= (1.2);
        }
        return res.x + res.y;
      }
      
      void main() {
        vec2 uv = .5 * vUv;
        uv.x *= u_ratio;
        vec2 pointer = vUv - u_pointer_position;
        pointer.x *= u_ratio;
        float p = clamp(length(pointer), 0., 1.);
        p = .5 * pow(1. - p, 2.);
        float t = .001 * u_time;
        vec3 color = vec3(0.);
        float noise = neuro_shape(uv, t, p);
        noise = 1.2 * pow(noise, 3.);
        noise += pow(noise, 10.);
        noise = max(.0, noise - .5);
        noise *= (1. - length(vUv - .5));
        color = vec3(0.5, 0.15, 0.65);
        color = mix(color, vec3(0.02, 0.7, 0.9), 0.32 + 0.16 * sin(2.0 * u_scroll_progress + 1.2));
        color += vec3(0.15, 0.0, 0.6) * sin(2.0 * u_scroll_progress + 1.5);
        color = color * noise;
        gl_FragColor = vec4(color, noise);
      }
    `;

        // ─── Shader compilation ───
        const compileShader = (
            glCtx: WebGLRenderingContext,
            source: string,
            type: number
        ): WebGLShader | null => {
            const shader = glCtx.createShader(type);
            if (!shader) return null;
            glCtx.shaderSource(shader, source);
            glCtx.compileShader(shader);
            if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
                console.error("Shader error:", glCtx.getShaderInfoLog(shader));
                glCtx.deleteShader(shader);
                return null;
            }
            return shader;
        };

        const vertexShader = compileShader(
            gl as WebGLRenderingContext,
            vsSource,
            (gl as WebGLRenderingContext).VERTEX_SHADER
        );
        const fragmentShader = compileShader(
            gl as WebGLRenderingContext,
            fsSource,
            (gl as WebGLRenderingContext).FRAGMENT_SHADER
        );
        if (!vertexShader || !fragmentShader) return;

        const glCtx = gl as WebGLRenderingContext;

        // ─── Program setup ───
        const program = glCtx.createProgram()!;
        glCtx.attachShader(program, vertexShader);
        glCtx.attachShader(program, fragmentShader);
        glCtx.linkProgram(program);
        if (!glCtx.getProgramParameter(program, glCtx.LINK_STATUS)) {
            console.error("Program link error:", glCtx.getProgramInfoLog(program));
            return;
        }
        glCtx.useProgram(program);

        // ─── Geometry ───
        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        const vertexBuffer = glCtx.createBuffer();
        glCtx.bindBuffer(glCtx.ARRAY_BUFFER, vertexBuffer);
        glCtx.bufferData(glCtx.ARRAY_BUFFER, vertices, glCtx.STATIC_DRAW);

        const positionLocation = glCtx.getAttribLocation(program, "a_position");
        glCtx.enableVertexAttribArray(positionLocation);
        glCtx.vertexAttribPointer(positionLocation, 2, glCtx.FLOAT, false, 0, 0);

        // ─── Uniforms ───
        const uTime = glCtx.getUniformLocation(program, "u_time");
        const uRatio = glCtx.getUniformLocation(program, "u_ratio");
        const uPointerPosition = glCtx.getUniformLocation(program, "u_pointer_position");
        const uScrollProgress = glCtx.getUniformLocation(program, "u_scroll_progress");

        // ─── Resize handler ───
        const resizeCanvas = () => {
            const dpr = Math.min(window.devicePixelRatio, 2);
            canvasEl.width = canvasEl.clientWidth * dpr;
            canvasEl.height = canvasEl.clientHeight * dpr;
            glCtx.viewport(0, 0, canvasEl.width, canvasEl.height);
            glCtx.uniform1f(uRatio, canvasEl.width / canvasEl.height);
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // ─── Animation loop ───
        const render = () => {
            const currentTime = performance.now();

            pointer.current.x += (pointer.current.tX - pointer.current.x) * 0.2;
            pointer.current.y += (pointer.current.tY - pointer.current.y) * 0.2;

            glCtx.uniform1f(uTime, currentTime);
            glCtx.uniform2f(
                uPointerPosition,
                pointer.current.x / window.innerWidth,
                1 - pointer.current.y / window.innerHeight
            );
            glCtx.uniform1f(
                uScrollProgress,
                window.pageYOffset / (2 * window.innerHeight)
            );

            glCtx.drawArrays(glCtx.TRIANGLE_STRIP, 0, 4);
            animationRef.current = requestAnimationFrame(render);
        };

        render();

        // ─── Pointer events ───
        const handlePointerMove = (e: PointerEvent) => {
            pointer.current.tX = e.clientX;
            pointer.current.tY = e.clientY;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches[0]) {
                pointer.current.tX = e.touches[0].clientX;
                pointer.current.tY = e.touches[0].clientY;
            }
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("touchmove", handleTouchMove);

        // ─── Cleanup ───
        return () => {
            window.removeEventListener("resize", resizeCanvas);
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("touchmove", handleTouchMove);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            glCtx.deleteProgram(program);
            glCtx.deleteShader(vertexShader);
            glCtx.deleteShader(fragmentShader);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={`w-full h-full ${className ?? ""}`}
            style={{ display: "block" }}
        />
    );
};

export default InteractiveNeuralVortex;
