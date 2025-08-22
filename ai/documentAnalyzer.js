// Simple stub that "analyzes" based on filename keywords.
// Later you can replace with OpenAI/Gemini Vision models.
export const analyzeDocument = async (filePath) => {
    const p = (filePath || "").toLowerCase();
    if (p.includes("blood")) return "Report suggests possible anemia – please correlate with Hb and RBC indices.";
    if (p.includes("xray")) return "X-ray hints at possible fracture; recommend orthopedic evaluation.";
    if (p.includes("ecg")) return "ECG pattern may indicate arrhythmia; cardiology consult advised.";
    return "Report stored. No automated flags raised.";
  };
  