import { env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2";

/**
 * 1. SILENCE THE NOISE
 * Silences the "Node not assigned to EP" warnings in the console 
 * to keep your Pioneer dashboard clean.
 */
env.backends.onnx.logLevel = 'error'; 

const WORKER_URL = "https://neerd.ahiyan1713.workers.dev/"; 
const aiWorker = new Worker('worker.js', { type: 'module' });

const status = document.getElementById('status');
const chat = document.getElementById('chat');
const modelTag = document.getElementById('model-tag');

// 2. HARDWARE DETECTION (Everyone isn't same)
const ram = navigator.deviceMemory || 4;
const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

// Selecting the "Effectivest" model based on your hardware
let MODEL_ID = "onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX";
if (isMobile) {
    // 0.5B is the sweet spot for mobile reasoning; 135M is the "low-drowning" backup
    MODEL_ID = (ram < 4) 
        ? "onnx-community/SmolLM2-135M-Instruct" 
        : "onnx-community/DeepSeek-R1-Distill-Qwen-0.5B";
}

// 3. INITIALIZE WORKER
aiWorker.postMessage({ type: 'load', modelId: MODEL_ID });

aiWorker.onmessage = (e) => {
    const { type, data, device, error } = e.data;

    if (type === 'progress') {
        const percent = Math.round(data.progress || 0);
        status.innerText = `⏳ Pioneer Loading: ${percent}%`;
    }
    
    if (type === 'ready') {
        status.innerText = `✅ Logic Active (${device})`;
        modelTag.innerText = `${MODEL_ID.split('/').pop()} | ${device}`;
    }

    if (type === 'result') {
        displayAnswer(data);
    }

    if (type === 'error') {
        status.innerText = `❌ System Halt: ${error}`;
        console.error("Worker Error:", error);
    }
};

/**
 * 4. THE TRUTH-SEEKING LOGIC
 */
async function askBot() {
    const input = document.getElementById('query');
    const query = input.value.trim();
    if (!query) return;

    // UI Update
    chat.innerHTML += `<div class="user-msg"><b>You:</b> ${query}</div>`;
    input.value = "";
    status.innerText = "🔍 Fetching sources from Bridge...";

    try {
        // Fetching from your neerd.ahiyan1713.workers.dev
        const searchRes = await fetch(`${WORKER_URL}?q=${encodeURIComponent(query)}`);
        
        if (!searchRes.ok) throw new Error("Search Bridge is unresponsive.");
        
        const facts = await searchRes.json();
        const context = facts.map(f =>
