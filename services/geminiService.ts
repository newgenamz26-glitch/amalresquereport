
import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Verifies if the Gemini API is reachable.
 */
export const pingGemini = async () => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'Respond with "pong"',
    });
    return response.text?.toLowerCase().includes('pong') || !!response.text;
  } catch (error) {
    console.error("Gemini API Ping Failed:", error);
    return false;
  }
};

/**
 * Maps Grounding MUST use Gemini 2.5 series.
 */
export const getNearbyMedicalFacilities = async (lat: number, lng: number) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [{
          text: `Bertindak sebagai pakar koordinasi kecemasan ResQ Amal. 
          Lokasi saya sekarang: Latitude ${lat}, Longitude ${lng}.
          
          TUGAS:
          1. Cari 5 Hospital dan 5 Klinik terdekat menggunakan Google Maps.
          2. Susun senarai dari PALING DEKAT ke paling jauh.
          3. Nyatakan jarak anggaran (cth: 1.5 KM) untuk setiap premis.
          4. Berikan ulasan ringkas (1 ayat) tentang kepakaran atau kemudahan setiap premis tersebut berdasarkan rekod awam.`
        }]
      },
      config: {
        tools: [
          { googleMaps: {} },
          { googleSearch: {} }
        ],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      },
    });
    
    const text = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const links = chunks
      .filter(c => c.maps || c.web)
      .map(c => {
        const title = (c.maps?.title || c.web?.title || "Fasiliti Perubatan").trim();
        const uri = c.maps?.uri || c.web?.uri;
        const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const distanceRegex = new RegExp(`${escapedTitle}.*?(\\d+\\.?\\d*)\\s*KM`, 'i');
        const match = text.match(distanceRegex);
        const distance = match ? parseFloat(match[1]) : 999;

        return { title, uri, distance };
      })
      .filter(link => link.uri);

    links.sort((a, b) => a.distance - b.distance);

    return { text, links };
  } catch (error) {
    console.error("Medical facility grounding failed:", error);
    return { 
      text: "Maaf, sistem rujukan AI sedang mengalami gangguan teknikal. Sila gunakan butang 'Buka Google Maps' untuk carian manual.", 
      links: [] 
    };
  }
};

/**
 * Live Assistant for Voice-to-Text in forms.
 */
export const startLiveAssistant = (callbacks: any) => {
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks: callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      systemInstruction: 'You are an assistant that converts speech to text for medical responders. Just listen and transcribe the user\'s medical observations concisely.',
      outputAudioTranscription: {},
      inputAudioTranscription: {},
    }
  });
};
