import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2";

// 1. Pioneer Silence: Stop the "Node Assignment" warnings
env.backends.onnx.logLevel = 'error'; 
env.allowLocalModels = false;

let generator;

self.onmessage = async (e) => {
    const { type, modelId, query, context } = e.data;

    try {
        if (type === 'load') {
            generator = await pipeline("text-generation", modelId, {
                device: "webgpu",
                dtype: "q4",
                // FIX for 401: Explicitly tell HF this is a public request
                token: false, 
                progress_callback: (p) => self.postMessage({ type: 'progress', data: p })
            });
            self.postMessage({ type: 'ready', device: 'WebGPU' });
        }

        if (type === 'query') {
            const prompt = `<|system|>TruthBot. Context:\n${context}\n<|user|>${query}<|assistant|>`;
            const output = await generator(prompt, { max_new_tokens: 500, temperature: 0.7 });
            self.postMessage({ type: 'result', data: output[0].generated_text });
        }
    } catch (err) {
        // FIX for Channel Closed: Always report the error back to the UI
        self.postMessage({ type: 'error', error: err.message });
        
        // Fallback: If WebGPU fails due to compatibility, try WASM
        if (type === 'load' && !generator) {
             console.warn("GPU Failed. Pioneer falling back to CPU...");
             generator = await pipeline("text-generation", modelId, { device: "wasm", dtype: "q8" });
             self.postMessage({ type: 'ready', device: 'WASM (CPU)' });
        }
    }
};
