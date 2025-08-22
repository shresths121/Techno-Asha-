export const analyzeSymptoms = async (text) => {
  const t = (text || "").toLowerCase();

  // Updated symptom-to-specialty mapping based on user requirements
  const symptomMappings = [
    { specialty: "Cardiologist", keys: ["chest pain","palpitations","shortness of breath","hypertension","heart"] },
    { specialty: "General Physician", keys: ["fever","cold","cough","headache","weakness","flu"] },
    { specialty: "Dermatologist", keys: ["skin","rash","acne","itch","eczema"] },
    { specialty: "Dentist", keys: ["tooth","toothache","gum","cavity","dental"] },
    { specialty: "Ophthalmologist", keys: ["eye","blurry vision","red eye","eye pain"] },
    { specialty: "Orthopedic", keys: ["back pain","knee pain","joint","sprain","fracture"] },
    { specialty: "Psychiatrist", keys: ["anxiety","depression","insomnia","stress","mental"] }
  ];

  // Check each specialty for matching keywords
  for (const mapping of symptomMappings) {
    for (const key of mapping.keys) {
      if (t.includes(key)) {
        return mapping.specialty;
      }
    }
  }

  // Default fallback
  return "General Physician";
};
