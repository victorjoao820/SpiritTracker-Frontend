import { useState, useEffect } from "react";
import {
  calculateSpiritDensity,
  calculateDerivedValuesFromWeight,
  calculateDerivedValuesFromWineGallons,
  calculateDerivedValuesFromProofGallons,
} from "../../utils/helpers";
import { TRANSACTION_TYPES } from "../../constants";

// --- AddEditContainerModal ---
export const AddEditContainerModal = ({
  isOpen,
  onClose,
  mode,
  container,
  products,
  onSave,
}) => {
  const isEditMode = mode === "edit";
  const isRefillMode = mode === "refill";
  const getDefaultProductType = () =>
    products.length > 0 ? products[0].name : "Unspecified Spirit";
  const initialFormData = {
    name: "",
    type: "wooden_barrel",
    tareWeightLbs: "",
    productType: getDefaultProductType(),
    fillDate: new Date().toISOString().split("T")[0],
    grossWeightLbs: "",
    proof: "",
    account: "storage",
    netWeight: "",
  };
  const [formData, setFormData] = useState(initialFormData);
  const [calculated, setCalculated] = useState({
    netWeightLbs: 0,
    wineGallons: 0,
    proofGallons: 0,
    spiritDensity: 0,
    grossWeightLbs: 0,
  });
  const [formError, setFormError] = useState("");
  const [isAddingEmpty, setIsAddingEmpty] = useState(
    mode === "add" && !container
  );
  const [fillInputMethod, setFillInputMethod] = useState("weight");
  const [wineGallonsInput, setWineGallonsInput] = useState("");
  const [proofGallonsInput, setProofGallonsInput] = useState("");

  useEffect(() => {
    let productT = getDefaultProductType();
    if (container) {
      productT = container.product?.name || getDefaultProductType();
      let grossW = container.grossWeight?.toString() || "";
      let prf = container.proof?.toString() || "";
      let fDate = container.fillDate || new Date().toISOString().split("T")[0];
      let wgInput = container.wineGallons?.toFixed(2) || "";
      let pgInput = container.proofGallons?.toFixed(2) || "";

      if (isRefillMode) {
        grossW = "";
        prf = "";
        wgInput = "";
        pgInput = "";
        fDate = new Date().toISOString().split("T")[0];
      }

      setIsAddingEmpty(false);
      setFormData({
        name: container.name || "",
        type: container.type || "wooden_barrel",
        tareWeightLbs: container.tareWeight?.toString() || "",
        productType: productT,
        fillDate: fDate,
        grossWeightLbs: grossW,
        proof: prf,
        account: container.account || "storage",
      });
      setWineGallonsInput(wgInput);
      setProofGallonsInput(pgInput);
      setFillInputMethod("weight");
    } else {
      setIsAddingEmpty(true);
      setFormData({
        ...initialFormData,
        productType: productT,
        account: "storage",
      });
      setWineGallonsInput("");
      setProofGallonsInput("");
    }
  }, [container, mode, isRefillMode, products]);

  useEffect(() => {
    const tare = parseFloat(formData.tareWeightLbs) || 0;
    const proofVal = parseFloat(formData.proof) || 0;
    let newCalculated = {
      netWeightLbs: 0,
      wineGallons: 0,
      proofGallons: 0,
      spiritDensity: calculateSpiritDensity(proofVal),
      grossWeightLbs: tare,
    };

    if (
      isAddingEmpty ||
      (mode === "edit" &&
        container?.status === "empty" &&
        !formData.grossWeightLbs &&
        !wineGallonsInput &&
        !proofGallonsInput &&
        !formData.proof)
    ) {
      setCalculated(newCalculated);
      if (fillInputMethod === "weight")
        setFormData((f) => ({ ...f, grossWeightLbs: tare.toString() }));
      else if (fillInputMethod === "wineGallons") setWineGallonsInput("0.000");
      else if (fillInputMethod === "proofGallons")
        setProofGallonsInput("0.000");
      return;
    }

    if (fillInputMethod === "weight") {
      const gross = parseFloat(formData.grossWeightLbs) || tare;
      newCalculated = calculateDerivedValuesFromWeight(tare, gross, proofVal);
      setWineGallonsInput(newCalculated.wineGallons.toFixed(2));
      setProofGallonsInput(newCalculated.proofGallons.toFixed(2));
    } else if (fillInputMethod === "wineGallons") {
      const wg = parseFloat(wineGallonsInput) || 0;
      newCalculated = calculateDerivedValuesFromWineGallons(wg, proofVal, tare);
      setFormData((f) => ({
        ...f,
        grossWeightLbs: newCalculated.grossWeightLbs.toFixed(2),
      }));
      setProofGallonsInput(newCalculated.proofGallons.toFixed(2));
    } else if (fillInputMethod === "proofGallons") {
      const pg = parseFloat(proofGallonsInput) || 0;
      if (proofVal === 0 && pg > 0) {
        /* Error caught by validateForm */
      }
      newCalculated = calculateDerivedValuesFromProofGallons(
        pg,
        proofVal,
        tare
      );
      setFormData((f) => ({
        ...f,
        grossWeightLbs: newCalculated.grossWeightLbs.toFixed(2),
      }));
      setWineGallonsInput(newCalculated.wineGallons.toFixed(2));
    }
    setCalculated(newCalculated);
  }, [
    formData.tareWeightLbs,
    formData.grossWeightLbs,
    formData.proof,
    wineGallonsInput,
    proofGallonsInput,
    fillInputMethod,
    isAddingEmpty,
    mode,
    container?.status,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "wineGallonsInput") setWineGallonsInput(value);
    else if (name === "proofGallonsInput") setProofGallonsInput(value);
    else setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError("");
  };

  const handleFillMethodChange = (method) => {
    setFillInputMethod(method);
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required.";
    const tare = parseFloat(formData.tareWeightLbs);
    if (isNaN(tare) || tare <= 0) return "Valid tare weight (>0) is required.";
    const isAttemptingToFill =
      !isAddingEmpty ||
      isRefillMode ||
      (isEditMode &&
        (formData.grossWeightLbs ||
          wineGallonsInput ||
          proofGallonsInput ||
          formData.proof ||
          (container?.status === "empty" &&
            formData.productType &&
            formData.productType !==
              (products.length > 0
                ? products[0].name
                : "Unspecified Spirit"))));

    if (isAttemptingToFill) {
      if (!formData.productType) return "Product type required to fill.";
      if (!formData.fillDate) return "Fill date required to fill.";

      const proofVal = parseFloat(formData.proof);
      if (isNaN(proofVal) || proofVal < 0 || proofVal > 200)
        return "Proof (0-200) required to fill.";

      if (fillInputMethod === "weight") {
        const gross = parseFloat(formData.grossWeightLbs);
        if (isNaN(gross) || gross <= 0)
          return "Gross weight (>0) required when filling by weight.";
        if (gross < tare) return "Gross weight must be >= tare weight.";
        if (gross > tare && proofVal === 0)
          return "Proof must be > 0 if net product weight is positive (using weight method).";
      } else if (fillInputMethod === "wineGallons") {
        const wg = parseFloat(wineGallonsInput);
        if (isNaN(wg) || wg < 0) return "Valid Wine Gallons (>=0) required.";
        if (wg > 0 && proofVal === 0)
          return "Proof must be > 0 if Wine Gallons > 0.";
      } else if (fillInputMethod === "proofGallons") {
        const pg = parseFloat(proofGallonsInput);
        if (isNaN(pg) || pg < 0) return "Valid Proof Gallons (>=0) required.";
        if (pg > 0 && proofVal === 0)
          return "Proof must be > 0 if Proof Gallons > 0.";
      }
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError("");

    try {
      // Prepare container data for API
      const containerData = {
        name: formData.name,
        type: formData.type,
        productId: products.find(p => p.name === formData.productType)?.id || null,
        status: (!formData.grossWeightLbs && !wineGallonsInput && !proofGallonsInput && !formData.proof) ? 'EMPTY' : 'FILLED',
        account: formData.account || 'storage',
        proof: parseFloat(formData.proof) || 0,
        tareWeight: parseFloat(formData.tareWeightLbs) || 0,
        netWeight: calculated.netWeightLbs || 0,
        temperatureFahrenheit: 60, // Default temperature
        fillDate: formData.fillDate || null,
        location: null,
        notes: null
      };

      console.log("Info:", containerData);
      
      // Call the onSave function passed from parent
      await onSave(containerData);
      onClose();
    } catch (err) {
      console.error("Save error:", err);
      setFormError("Save failed: " + err.message);
    }
  };
  const title =
    mode === "add"
      ? "Add Container"
      : mode === "refill"
      ? `Refill: ${container?.name}`
      : `Edit: ${container?.name}`;
  const showFillInputs =
    !isAddingEmpty ||
    mode === "refill" ||
    (isEditMode &&
      (container?.status === "filled" ||
        formData.grossWeightLbs ||
        wineGallonsInput ||
        proofGallonsInput ||
        formData.proof));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl mb-6 text-blue-300">{title}</h2>
        {formError && (
          <div className="bg-red-600 p-3 rounded mb-4 text-sm">{formError}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300"
            >
              Container Name/ID
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 w-full bg-gray-700 p-2 rounded"
            />
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-300 mt-2"
            >
              Container Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="mt-1 w-full bg-gray-700 p-2 rounded"
            >
              <option value="wooden_barrel">Wooden Barrel</option>
              <option value="metal_drum">Metal Drum</option>
              <option value="square_tank">Square Tank (IBC)</option>
              <option value="tote">Tote (250gal)</option>
              <option value="five_gallon_tote">5 Gallon Tote</option>
              <option value="still">Still</option>
            </select>
            <label
              htmlFor="tareWeightLbs"
              className="block text-sm font-medium text-gray-300 mt-2"
            >
              Tare Weight (lbs)
            </label>
            <input
              id="tareWeightLbs"
              type="number"
              name="tareWeightLbs"
              value={formData.tareWeightLbs}
              onChange={handleChange}
              required
              step="0.01"
              min="0.1"
              readOnly={
                isRefillMode || (isEditMode && container?.status === "filled")
              }
              className="mt-1 w-full bg-gray-700 p-2 rounded read-only:bg-gray-600"
            />
            {(isRefillMode ||
              (isEditMode && container?.status === "filled")) && (
              <p className="text-xs text-gray-500">
                Tare locked for filled/refill.
              </p>
            )}
          </div>
          {mode === "add" && (
            <div className="flex items-center mt-3">
              <input
                type="checkbox"
                id="addAsEmpty"
                checked={isAddingEmpty}
                onChange={(e) => setIsAddingEmpty(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-500 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="addAsEmpty"
                className="ml-2 block text-sm text-gray-300"
              >
                Add as new empty container
              </label>
            </div>
          )}

          {showFillInputs && (
            <>
              <hr className="my-3 border-gray-700" />
              <p className="text-lg text-blue-400">Fill Details:</p>
              <div className="my-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Fill Input Method:
                </label>
                <div className="flex space-x-4">
                  {["weight", "wineGallons", "proofGallons"].map((method) => (
                    <label
                      key={method}
                      className="flex items-center space-x-1 text-sm text-gray-200"
                    >
                      <input
                        type="radio"
                        name="fillInputMethod"
                        value={method}
                        checked={fillInputMethod === method}
                        onChange={() => handleFillMethodChange(method)}
                        className="form-radio h-4 w-4 text-blue-500"
                      />
                      <span>
                        {method === "weight"
                          ? "Weight"
                          : method === "wineGallons"
                          ? "Wine Gal"
                          : "Proof Gal"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <label
                htmlFor="productType"
                className="block text-sm font-medium text-gray-300"
              >
                Product Type
              </label>
              <select
                id="productType"
                name="productType"
                value={formData.productType}
                onChange={handleChange}
                className="mt-1 w-full bg-gray-700 p-2 rounded"
                required={!isAddingEmpty || mode === "refill"}
              >
                <option value="">-- Select Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
              <label
                htmlFor="fillDate"
                className="block text-sm font-medium text-gray-300 mt-2"
              >
                Date of Fill
              </label>
              <input
                id="fillDate"
                type="date"
                name="fillDate"
                value={formData.fillDate}
                onChange={handleChange}
                className="mt-1 w-full bg-gray-700 p-2 rounded"
              />
              <label
                htmlFor="proof"
                className="block text-sm font-medium text-gray-300 mt-2"
              >
                Proof (0-200)
              </label>
              <input
                id="proof"
                type="number"
                name="proof"
                value={formData.proof}
                onChange={handleChange}
                step="0.01"
                min="0"
                max="200"
                className="mt-1 w-full bg-gray-700 p-2 rounded"
              />
              <label
                htmlFor="account"
                className="block text-sm font-medium text-gray-300 mt-2"
              >
                Account
              </label>
              <select
                id="account"
                name="account"
                value={formData.account}
                onChange={handleChange}
                className="mt-1 w-full bg-gray-700 p-2 rounded"
              >
                <option value="storage">Storage</option>
                <option value="production">Production</option>
                <option value="processing">Processing</option>
              </select>
              {fillInputMethod === "weight" && (
                <div>
                  <label
                    htmlFor="grossWeightLbs"
                    className="block text-sm font-medium text-gray-300 mt-2"
                  >
                    Gross Weight (lbs)
                  </label>
                  <input
                    id="grossWeightLbs"
                    type="number"
                    name="grossWeightLbs"
                    value={formData.grossWeightLbs}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="mt-1 w-full bg-gray-700 p-2 rounded"
                  />
                </div>
              )}
              {fillInputMethod === "wineGallons" && (
                <div>
                  <label
                    htmlFor="wineGallonsInput"
                    className="block text-sm font-medium text-gray-300 mt-2"
                  >
                    Wine Gallons
                  </label>
                  <input
                    id="wineGallonsInput"
                    type="number"
                    name="wineGallonsInput"
                    value={wineGallonsInput}
                    onChange={handleChange}
                    step="0.001"
                    min="0"
                    className="mt-1 w-full bg-gray-700 p-2 rounded"
                  />
                </div>
              )}
              {fillInputMethod === "proofGallons" && (
                <div>
                  <label
                    htmlFor="proofGallonsInput"
                    className="block text-sm font-medium text-gray-300 mt-2"
                  >
                    Proof Gallons
                  </label>
                  <input
                    id="proofGallonsInput"
                    type="number"
                    name="proofGallonsInput"
                    value={proofGallonsInput}
                    onChange={handleChange}
                    step="0.001"
                    min="0"
                    className="mt-1 w-full bg-gray-700 p-2 rounded"
                  />
                </div>
              )}
            </>
          )}

          <div className="bg-gray-750 p-3 rounded mt-1 border border-gray-600">
            <h4 className="text-md font-semibold mb-1">Calculated:</h4>
            {!isAddingEmpty &&
              (!isAddingEmpty ||
                mode === "refill" ||
                (isEditMode && container?.status === "filled")) && (
                <>
                  <p className="text-sm">
                    Gross Wt: {calculated.grossWeightLbs.toFixed(2)} lbs
                  </p>
                  <p className="text-sm">
                    Net Wt: {calculated.netWeightLbs.toFixed(2)} lbs
                  </p>
                  <p className="text-sm">
                    Density: ~{calculated.spiritDensity?.toFixed(2)} lbs/gal
                  </p>
                  <p className="text-sm">
                    Wine Gal: {calculated.wineGallons.toFixed(2)} gal
                  </p>
                  <p className="text-md font-bold">
                    Proof Gal: {calculated.proofGallons.toFixed(2)} PG
                  </p>
                </>
              )}
            {isAddingEmpty && (
              <p className="text-sm">Container will be added empty.</p>
            )}
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 py-2 px-4 rounded"
            >
              Cancel
            </button>
            <button type="submit" className="bg-blue-600 py-2 px-4 rounded">
              {mode === "add" ? "Add" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
