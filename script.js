const WORKER_URL = "https://neerd.ahiyan1713.workers.dev/"; 
const aiWorker = new Worker('worker.js', { type: 'module' });

const status = document.getElementById('status');
const chat = document.getElementById('chat');

// 2. Hardware Detection
const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
const ram = navigator.deviceMemory || 4;
const MODEL_ID = isMobile && ram < 4 
    ? "onnx-community/SmolLM2-135M-Instruct" 
    : "onnx-community/DeepSeek-R1-Distill-Qwen-0.5B";

aiWorker.postMessage({ type: 'load', modelId: MODEL_ID });

aiWorker.onmessage = (e) => {
    const { type, data, device, error } = e.data;
    if (type === 'progress') status.innerText = `⏳ Loading: ${Math.round(data.progress)}%`;
    if (type === 'ready') status.innerText = `✅ Active (${device})`;
    if (type === 'result') displayAnswer(data);
    if (type === 'error') status.innerText = `❌ Error: ${error}`;
};

async function askBot() {
    const query = document.getElementById('query').value;
    if (!query) return;

    chat.innerHTML += `<div><b>You:</b> ${query}</div>`;
    status.innerText = "🔍 Searching Bridge...";

    try {
        const res = await fetch(`${WORKER_URL}?q=${encodeURIComponent(query)}`);
        const facts = await res.json();
        const context = facts.map(f => f.content).join("\n\n");
        
        status.innerText = "🧠 Reasoning...";
        aiWorker.postMessage({ type: 'query', query, context });
    } catch (e) {
        status.innerText = "❌ Bridge Connection Failed.";
    }
}

function displayAnswer(text) {
    const answer = text.split("<|assistant|>")[1] || text;
    chat.innerHTML += `<div><b>Bot:</b> ${answer}</div>`;
    status.innerText = "✅ Done.";
}

document.getElementById('sendBtn').onclick = askBot;
