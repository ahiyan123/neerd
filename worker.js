// worker.js
self.onmessage = async (e) => {
    // 1. Immediately acknowledge receipt to keep the channel open
    const { type, query, context, modelId } = e.data;

    try {
        if (type === 'load') {
            // ... (your loading logic)
            self.postMessage({ type: 'ready' });
        } 
        else if (type === 'query') {
            // ... (your inference logic)
            self.postMessage({ type: 'result', data: finalOutput });
        }
    } catch (err) {
        // 2. If it crashes, tell the UI WHY so it doesn't just hang
        self.postMessage({ type: 'error', error: err.message });
    }
    
    // 3. Crucial: return nothing or true isn't needed in Web Workers, 
    // but ensuring the catch block exists prevents the "Closed Channel" silence.
};
