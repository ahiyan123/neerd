const WORKER_URL = "https://neerd.ahiyan1713.workers.dev/"; 
const aiWorker = new Worker('worker.js', { type: 'module' });

const status = document.getElementById('status');
const chat = document.getElementById('chat');

// In WASM mode, the 0.5B model is the maximum recommended for speed
const MODEL_ID = "onnx-community/DeepSeek-R1-Distill-Qwen-0.5B";

aiWorker.postMessage({ type: 'load', modelId: MODEL_ID });

aiWorker.onmessage = (e) => {
    const { type, data, device, error } = e.data;
    if (type === 'progress') status.innerText = `⏳ Pioneer Loading: ${Math.round(data.progress)}%`;
    if (type === 'ready') status.innerText = `✅ System Live (${device})`;
    if (type === 'result') displayAnswer(data);
    if (type === 'error') status.innerText = `❌ Halt: ${error}`;
};

async function askBot() {
    const input = document.getElementById('query');
    const query = input.value;
    if (!query) return;

    chat.innerHTML += `<div class="user-msg"><b>You:</b> ${query}</div>`;
    status.innerText = "🔍 Checking the Bridge...";

    try {
        const res = await fetch(`${WORKER_URL}?q=${encodeURIComponent(query)}`);
        const facts = await res.json();
        const context = facts.map(f => f.content).join("\n\n");
        
        status.innerText = "🧠 CPU is thinking...";
        aiWorker.postMessage({ type: 'query', query, context });
    } catch (e) {
        status.innerText = "❌ Bridge Connection Failed.";
    }
}

function displayAnswer(text) {
    const answer = text.split("<|assistant|>")[1] || text;
    chat.innerHTML += `<div class="bot-msg"><b>Bot:</b> ${answer}</div>`;
    chat.scrollTop = chat.scrollHeight;
    status.innerText = "✅ Done.";
}

document.getElementById('sendBtn').onclick = askBot;
