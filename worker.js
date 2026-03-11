import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2";

// 1. Pioneer Silence: Stop the node assignment logs
env.backends.onnx.logLevel = 'error'; 

// 2. YOUR HUBBING FACE TOKEN (Generate at huggingface.co/settings/tokens)
const HF_TOKEN = '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'; 

let generator;

self.onmessage = async (e) => {
    const { type, modelId, query, context } = e.data;

    try {
        if (type === 'load') {
            generator = await pipeline("text-generation", modelId, {
                device: "wasm", 
                dtype: "q8",
                token: HF_TOKEN, // Pass token to fix 401 errors
                progress_callback: (p) => self.postMessage({ type: 'progress', data: p })
            });
            self.postMessage({ type: 'ready', device: 'WASM (CPU)' });
        }

        if (type === 'query') {
            const prompt = `<|system|>TruthBot. Use context:\n${context}\n<|user|>${query}<|assistant|>`;
            const output = await generator(prompt, { max_new_tokens: 500 });
            self.postMessage({ type: 'result', data: output[0].generated_text });
        }
    } catch (err) {
        // Ensure the message channel stays open even on error
        self.postMessage({ type: 'error', error: err.message });
    }
};
