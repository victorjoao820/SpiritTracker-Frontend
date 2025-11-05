import { TTB_TEMPERATURE_CORRECTIONS, DENSITY_ETHANOL_LBS_PER_GALLON, DENSITY_WATER_LBS_PER_GALLON } from '../constants';

// --- Helper Functions ---

// Get TTB temperature correction factor
export const getTTBTemperatureCorrection = (temperature, observedProof) => {
  // Round temperature to nearest even number (TTB table uses even temperatures)
  const roundedTemp = Math.round(temperature / 2) * 2;
  const roundedProof = Math.round(observedProof / 5) * 5; // Round to nearest 5
  
  // Get the correction table for this temperature
  const tempTable = TTB_TEMPERATURE_CORRECTIONS[roundedTemp];
  if (!tempTable) return 0; // No correction if temperature out of range
  
  // Get the correction factor for this proof
  const correction = tempTable[roundedProof];
  return correction || 0;
};

// Calculate true proof using TTB method
export const calculateTrueProof = (observedProof, temperature) => {
  const correction = getTTBTemperatureCorrection(temperature, observedProof);
  return observedProof + correction;
};

// Calculate proof gallons using TTB method
export const calculateProofGallonsTTB = (wineGallons, observedProof, temperature) => {
  const trueProof = calculateTrueProof(observedProof, temperature);
  return wineGallons * (trueProof / 100);
};

// TTB-compliant density calculation at 60°F
// Since Snap 51 provides temperature-corrected proof readings, we use the proof directly
export const calculateSpiritDensity = (proof, temperature = 60) => {
  if (isNaN(proof) || proof < 0) proof = 0;
  if (proof === 0) return DENSITY_WATER_LBS_PER_GALLON;
  
  // TTB Table 5 density values for different proof levels at 60°F
  // These values are based on TTB Table 5 (Pounds per wine gallon)
  const densityTable = {
    0: 8.32198,   // Water (approximate)
    1: 8.32198,
    2: 8.31574,
    3: 8.30957,
    4: 8.30350,
    5: 8.29742,
    6: 8.29150,
    7: 8.28551,
    8: 8.27976,
    9: 8.27401,
    10: 8.26835,
    11: 8.26277,
    12: 8.25736,
    13: 8.25194,
    14: 8.24670,
    15: 8.24153,
    16: 8.23645,
    17: 8.23137,
    18: 8.22646,
    19: 8.22155,
    20: 8.21663,
    21: 8.21172,
    22: 8.20689,
    23: 8.20206,
    24: 8.19731,
    25: 8.19265,
    26: 8.18807,
    27: 8.18349,
    28: 8.17899,
    29: 8.17457,
    30: 8.17016,
    31: 8.16575,
    32: 8.16133,
    33: 8.15700,
    34: 8.15275,
    35: 8.14851,
    36: 8.14434,
    37: 8.14018,
    38: 8.13601,
    39: 8.13193,
    40: 8.12785,
    41: 8.12369,
    42: 8.11936,
    43: 8.11519,
    44: 8.11095,
    45: 8.10670,
    46: 8.10245,
    47: 8.09812,
    48: 8.09379,
    49: 8.08946,
    50: 8.08505,
    51: 8.08063,
    52: 8.07622,
    53: 8.07172,
    54: 8.06722,
    55: 8.06264,
    56: 8.05806,
    57: 8.05340,
    58: 8.04873,
    59: 8.04399,
    60: 8.03924,
    61: 8.03433,
    62: 8.02950,
    63: 8.02450,
    64: 8.01934,
    65: 8.01417,
    66: 8.00884,
    67: 8.00351,
    68: 7.99810,
    69: 7.99260,
    70: 7.98702,
    71: 7.98136,
    72: 7.97553,
    73: 7.96970,
    74: 7.96370,
    75: 7.95771,
    76: 7.95146,
    77: 7.94530,
    78: 7.93897,
    79: 7.93264,
    80: 7.92614,
    81: 7.91965,
    82: 7.91298,
    83: 7.90632,
    84: 7.89949,
    85: 7.89266,
    86: 7.88575,
    87: 7.87876,
    88: 7.87168,
    89: 7.86443,
    90: 7.85719,
    91: 7.84986,
    92: 7.84244,
    93: 7.83495,
    94: 7.82737,
    95: 7.81971,
    96: 7.81196,
    97: 7.80413,
    98: 7.79622,
    99: 7.78823,
    100: 7.78007,
    // TTB Table 5 values for proofs 101-200
    101: 7.77190,
    102: 7.76374,
    103: 7.75550,
    104: 7.74717,
    105: 7.73884,
    106: 7.73043,
    107: 7.72193,
    108: 7.71344,
    109: 7.70486,
    110: 7.69603,
    111: 7.68737,
    112: 7.67863,
    113: 7.66988,
    114: 7.66106,
    115: 7.65214,
    116: 7.64315,
    117: 7.63407,
    118: 7.62491,
    119: 7.61567,
    120: 7.60642,
    121: 7.59709,
    122: 7.58777,
    123: 7.57836,
    124: 7.56886,
    125: 7.55937,
    126: 7.54979,
    127: 7.54021,
    128: 7.53055,
    129: 7.52089,
    130: 7.51123,
    131: 7.50149,
    132: 7.49166,
    133: 7.48175,
    134: 7.47184,
    135: 7.46184,
    136: 7.45177,
    137: 7.44169,
    138: 7.43145,
    139: 7.42120,
    140: 7.41096,
    141: 7.40063,
    142: 7.39030,
    143: 7.37981,
    144: 7.36923,
    145: 7.35866,
    146: 7.34800,
    147: 7.33734,
    148: 7.32659,
    149: 7.31585,
    150: 7.30502,
    151: 7.29411,
    152: 7.28304,
    153: 7.27196,
    154: 7.26088,
    155: 7.24972,
    156: 7.23840,
    157: 7.22707,
    158: 7.21566,
    159: 7.20417,
    160: 7.19259,
    161: 7.18102,
    162: 7.16927,
    163: 7.15753,
    164: 7.14570,
    165: 7.13380,
    166: 7.12189,
    167: 7.10973,
    168: 7.09757,
    169: 7.08532,
    170: 7.07292,
    171: 7.06042,
    172: 7.04776,
    173: 7.03494,
    174: 7.02211,
    175: 7.00920,
    176: 6.99621,
    177: 6.98305,
    178: 6.96973,
    179: 6.95624,
    180: 6.94258,
    181: 6.92875,
    182: 6.91485,
    183: 6.90069,
    184: 6.88620,
    185: 6.87154,
    186: 6.85663,
    187: 6.84156,
    188: 6.82607,
    189: 6.81041,
    190: 6.79434,
    191: 6.77793,
    192: 6.76119,
    193: 6.74412,
    194: 6.72671,
    195: 6.70881,
    196: 6.69032,
    197: 6.67125,
    198: 6.65142,
    199: 6.63094,
    200: 6.60970
  };
  
  // For exact proof values, return the table value
  if (densityTable[proof] !== undefined) {
    return densityTable[proof];
  }
  
  // For values between table entries, interpolate
  const lowerProof = Math.floor(proof);
  const upperProof = Math.ceil(proof);
  
  if (densityTable[lowerProof] !== undefined && densityTable[upperProof] !== undefined) {
    const weight = proof - lowerProof;
    return densityTable[lowerProof] + (densityTable[upperProof] - densityTable[lowerProof]) * weight;
  }
  
  // Fallback to linear calculation for extreme values
  const volEthanolFraction = proof / 200;
  const volWaterFraction = 1 - volEthanolFraction;
  return (volEthanolFraction * DENSITY_ETHANOL_LBS_PER_GALLON) + (volWaterFraction * DENSITY_WATER_LBS_PER_GALLON);
};

// Calculate derived values from weight - using temperature-corrected proof from Snap 51
export const calculateDerivedValuesFromWeight = (tareWeight, grossWeight, observedProof, temperature = 60) => {
  const tare = parseFloat(tareWeight) || 0;
  const gross = parseFloat(grossWeight) || 0;
  const prf = parseFloat(observedProof) || 0;
  let netWeightLbs = 0;
  if (gross > tare) { netWeightLbs = gross - tare; } else { netWeightLbs = 0; }
  
  // Since Snap 51 provides temperature-corrected proof, use it directly for density calculation
  const spiritDensity = calculateSpiritDensity(prf, 60); // Always use 60°F for TTB standard
  let wineGallons = 0;
  if (netWeightLbs > 0 && spiritDensity > 0) { wineGallons = netWeightLbs / spiritDensity; }
  // For proof gallons, use the temperature-corrected proof directly (no additional correction needed)
  const proofGallons = wineGallons * (prf / 100);
  
  return {
      netWeightLbs: parseFloat(netWeightLbs.toFixed(2)),
      wineGallons: parseFloat(wineGallons.toFixed(2)),
      proofGallons: parseFloat(proofGallons.toFixed(2)),
      spiritDensity: parseFloat(spiritDensity.toFixed(2)),
      grossWeightLbs: parseFloat(gross.toFixed(2))
  };
};

export const calculateDerivedValuesFromWineGallons = (wineGallons, observedProof, tareWeight, temperature = 60) => {
  const wg = parseFloat(wineGallons) || 0;
  const prf = parseFloat(observedProof) || 0;
  const tare = parseFloat(tareWeight) || 0;
  const spiritDensity = calculateSpiritDensity(prf, temperature);
  const netWeightLbs = wg * spiritDensity;
  const grossWeightLbs = netWeightLbs + tare;
  
  // Calculate proof gallons using TTB method
  const proofGallons = calculateProofGallonsTTB(wg, prf, temperature);
  
  return {
      netWeightLbs: parseFloat(netWeightLbs.toFixed(2)),
      wineGallons: parseFloat(wg.toFixed(2)),
      proofGallons: parseFloat(proofGallons.toFixed(2)),
      spiritDensity: parseFloat(spiritDensity.toFixed(2)),
      grossWeightLbs: parseFloat(grossWeightLbs.toFixed(2))
  };
};

export const calculateDerivedValuesFromProofGallons = (proofGallons, observedProof, tareWeight, temperature = 60) => {
  const pg = parseFloat(proofGallons) || 0;
  const prf = parseFloat(observedProof) || 0;
  const tare = parseFloat(tareWeight) || 0;
  
  // For proof gallons input, we need to work backwards to find wine gallons
  let wineGallons = 0;
  if (prf > 0 && pg > 0) {
      // Use the true proof to calculate wine gallons
      const trueProof = calculateTrueProof(prf, temperature);
      wineGallons = pg / (trueProof / 100);
  } else if (pg === 0) {
      wineGallons = 0;
  } else if (prf === 0) {
      // If proof is 0, we can't calculate wine gallons from proof gallons
      wineGallons = 0;
  }
  
  const spiritDensity = calculateSpiritDensity(prf, temperature);
  const netWeightLbs = wineGallons * spiritDensity;
  const grossWeightLbs = netWeightLbs + tare;
  
  return {
      netWeightLbs: parseFloat(netWeightLbs.toFixed(2)),
      wineGallons: parseFloat(wineGallons.toFixed(2)),
      proofGallons: parseFloat(pg.toFixed(2)),
      spiritDensity: parseFloat(spiritDensity.toFixed(2)),
      grossWeightLbs: parseFloat(grossWeightLbs.toFixed(2))
  };
};

//**GOM **//
export const calcGallonsFromWeight = (proof, netWeightLbs, temperature = 60) =>
{
  const spiritDensity = calculateSpiritDensity(proof, temperature);
  const wineGallons = netWeightLbs / spiritDensity;
  const proofGallons = wineGallons * proof / 100;

  return {
    wineGallons,
    proofGallons
  };
};

export const calcWeightFromWineGallons = (proof, wineGallons, temperature = 60) =>
{
  const spiritDensity = calculateSpiritDensity(proof, temperature);
  const netWeightLbs = wineGallons * spiritDensity;

  return parseFloat(netWeightLbs.toFixed(3));
};

export const calcWeightFromProofGallons = (proof, proofGallons, temperature = 60) =>
{
  const spiritDensity = calculateSpiritDensity(proof, temperature);
  const wineGallons = proofGallons / (proof / 100);
  const netWeightLbs = wineGallons * spiritDensity;

  return parseFloat(netWeightLbs.toFixed(3));
};


export const logTransaction = async (logData) => {
  // This function will be handled by the API service layer
  // The actual logging is done in the App component using transactionsAPI
  console.log("Transaction logged:", logData.transactionType);
  return logData;
};

export const convertToCSV = (dataArray, headers) => {
  const array = [headers, ...dataArray];
  return array.map(row => row.map(field => { const data = field === null || field === undefined ? '' : String(field); const result = data.replace(/"/g, '""'); if (result.search(/("|,|\n)/g) >= 0) return `"${result}"`; return result; }).join(',')).join('\n');
};

export const downloadCSV = (csvString, filename) => {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); }
};