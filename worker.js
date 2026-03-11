import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2";

// Pioneer Settings: Optimize for CPU
env.allowLocalModels = false;
env.backends.onnx.wasm.proxy = true; // Use a proxy to prevent UI lag

let generator;

self.onmessage = async (e) => {
    const { type, modelId, query, context } = e.data;

    try {
        if (type === 'load') {
            // SWITCHED TO WASM: Works on every browser/device
            generator = await pipeline("text-generation", modelId, {
                device: "wasm", 
                dtype: "q8", // 8-bit is faster and more stable on CPUs
                token: false,
                progress_callback: (p) => self.postMessage({ type: 'progress', data: p })
            });
            self.postMessage({ type: 'ready', device: 'CPU (WASM)' });
        }

        if (type === 'query') {
            const prompt = `<|system|>TruthBot. Pioneer doesn't rest. Use context:\n${context}\n<|user|>${query}<|assistant|>`;
            
            // CPUs handle shorter sequences better; kept tokens at 500 for speed
            const output = await generator(prompt, { 
                max_new_tokens: 500, 
                temperature: 0.7,
                do_sample: true 
            });
            
            self.postMessage({ type: 'result', data: output[0].generated_text });
        }
    } catch (err) {
        self.postMessage({ type: 'error', error: "CPU Processing Error: " + err.message });
    }
};
