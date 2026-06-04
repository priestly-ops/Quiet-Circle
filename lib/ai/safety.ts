const high=['suicide','kill myself','end my life','want to die','self harm','hurt myself','abuse','violence','immediate danger'];
export function detectRisk(message:string){const lower=message.toLowerCase();return high.some(w=>lower.includes(w))?'high':'low'}
export const crisisMessage="I’m really sorry you’re feeling this much pain. You don’t have to handle this alone. Please contact emergency support or someone you trust right now. India emergency: 112. KIRAN: 1800-599-0019. AASRA: 91-22-27546669. If you are outside India, contact your local emergency number immediately.";
