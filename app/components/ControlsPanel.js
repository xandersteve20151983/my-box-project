// components/ControlsPanel.js
"use client";

export default function ControlsPanel({ inputs, setInputs }) {
  const number = (key) => ({
    value: inputs[key],
    onChange: (e) => setInputs(prev => ({ ...prev, [key]: +e.target.value })),
    step: "any",
  });

  const bool = (key) => ({
    checked: inputs[key],
    onChange: (e) => setInputs(prev => ({ ...prev, [key]: e.target.checked })),
  });

  return (
    <div className="space-y-4">
      <div className="border rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold mb-3">Internal Dimensions (mm)</h3>
        <div className="grid grid-cols-3 gap-3">
          <LabeledInput label="L" {...number("L")} />
          <LabeledInput label="W" {...number("W")} />
          <LabeledInput label="D" {...number("D")} />
        </div>
      </div>

      <div className="border rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold mb-3">Allowances & Material</h3>
        <div className="grid grid-cols-2 gap-3">
          <LabeledInput label="Flute thickness" {...number("fluteThickness")} />
          <LabeledInput label="Flap allowance" {...number("flapAllowance")} />
          <LabeledInput label="Panel allowance P1" {...number("p1")} />
          <LabeledInput label="Panel allowance P2" {...number("p2")} />
          <LabeledInput label="Panel allowance P3" {...number("p3")} />
          <LabeledInput label="Panel allowance P4" {...number("p4")} />
          <LabeledInput label="Flap gap (inner)" {...number("flapGapInner")} />
          <LabeledInput label="Flap gap (outer)" {...number("flapGapOuter")} />
        </div>
      </div>

      <div className="border rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold mb-3">Glue-lap Geometry</h3>
        <div className="grid grid-cols-3 gap-3">
          <LabeledInput label="Glue-lap width" {...number("glueLapWidth")} />
          <LabeledInput label="Extension a" {...number("glueLapExtensionA")} />
          <LabeledInput label="Bevel angle (°)" {...number("glueLapBevelAngle")} />
        </div>
      </div>

      <div className="border rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold mb-3">Slots & Display</h3>
        <div className="grid grid-cols-2 gap-3">
          <LabeledInput label="Slot width" {...number("slotWidth")} />
          <Toggle label="Show panel labels" {...bool("showPanelLabels")} />
          <Toggle label="Show dimension lines" {...bool("showDimLines")} />
          <Toggle label="Show flap labels" {...bool("showFlapLabels")} />
        </div>
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, step = "any" }) {
  return (
    <label className="text-sm">
      <div className="mb-1 text-gray-600">{label}</div>
      <input
        type="number"
        step={step}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border px-2 py-1"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="text-gray-700">{label}</span>
    </label>
  );
}
