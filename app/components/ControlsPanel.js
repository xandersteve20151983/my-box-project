// app/components/ControlsPanel.js
"use client";

import { useState } from "react";
import StylePickerModal from "./StylePickerModal";

export default function ControlsPanel({ inputs, setInputs }) {
  const [styleModal, setStyleModal] = useState(false);

  const onNum  = (key) => (e) => setInputs(v => ({ ...v, [key]: num(e.target.value) }));
  const onStr  = (key) => (e) => setInputs(v => ({ ...v, [key]: e.target.value }));
  const onBool = (key) => (e) => setInputs(v => ({ ...v, [key]: e.target.checked }));

  return (
    <div className="border rounded-xl p-4 bg-white space-y-6">
      {/* Internal dims */}
      <Section title="Internal Dimensions (mm)">
        <Row>
          <Num label="L" value={inputs.L} onChange={onNum("L")} />
          <Num label="W" value={inputs.W} onChange={onNum("W")} />
          <Num label="D" value={inputs.D} onChange={onNum("D")} />
        </Row>
      </Section>

      {/* Allowances */}
      <Section title="Allowances & Material">
        <Row>
          <Num label="Flute thickness" value={inputs.fluteThickness} onChange={onNum("fluteThickness")} />
          <Num label="Flap allowance" value={inputs.flapAllowance} onChange={onNum("flapAllowance")} />
        </Row>
        <Row>
          <Num label="Panel allowance P1" value={inputs.p1} onChange={onNum("p1")} />
          <Num label="Panel allowance P2" value={inputs.p2} onChange={onNum("p2")} />
        </Row>
        <Row>
          <Num label="Panel allowance P3" value={inputs.p3} onChange={onNum("p3")} />
          <Num label="Panel allowance P4" value={inputs.p4} onChange={onNum("p4")} />
        </Row>
        <Row>
          <Num label="Flap gap (inner)" value={inputs.flapGapInner} onChange={onNum("flapGapInner")} />
          <Num label="Flap gap (outer)" value={inputs.flapGapOuter} onChange={onNum("flapGapOuter")} />
        </Row>
      </Section>

      {/* Glue-lap */}
      <Section title="Glue-lap Geometry">
        <Row>
          <Num label="Glue-lap width" value={inputs.glueLapWidth} onChange={onNum("glueLapWidth")} />
          <Num label="Extension a" value={inputs.glueLapExtensionA} onChange={onNum("glueLapExtensionA")} />
          <Num label="Bevel angle (°)" value={inputs.glueLapBevelAngle} onChange={onNum("glueLapBevelAngle")} />
        </Row>
        <Row>
          <Select label="Glue position" value={inputs.gluePosition} onChange={onStr("gluePosition")}
                  options={[["inside","Inside glue"],["outside","Outside glue"]]} />
          <Select label="Glue lap off" value={inputs.glueLapOff} onChange={onStr("glueLapOff")}
                  options={[["small","Small panel (W)"],["large","Large panel (L)"]]} />
        </Row>
      </Section>

      {/* Slots & Display */}
      <Section title="Slots & Display">
        <Row>
          <Num label="Slot width" value={inputs.slotWidth} onChange={onNum("slotWidth")} />
        </Row>
        <Row>
          <Chk label="Show panel labels" checked={inputs.showPanelLabels} onChange={onBool("showPanelLabels")} />
          <Chk label="Show dimension lines" checked={inputs.showDimLines} onChange={onBool("showDimLines")} />
          <Chk label="Show flap labels" checked={inputs.showFlapLabels} onChange={onBool("showFlapLabels")} />
        </Row>
      </Section>

      {/* Style/Flute (placeholders) */}
      <Section title="Style & Flute (placeholders)">
        <Row>
          <Select label="Parent style" value={inputs.parentStyle} onChange={onStr("parentStyle")}
                  options={[["0200","0200 — Slotted family"]]} />

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Style</span>
              <button
                type="button"
                onClick={() => setStyleModal(true)}
                className="text-xs px-2 py-1 rounded border hover:bg-gray-50 inline-flex items-center gap-1"
                title="Show style visuals"
              >
                <span className="grid grid-cols-2 gap-[2px]">
                  <span className="w-2 h-2 border" />
                  <span className="w-2 h-2 border" />
                  <span className="w-2 h-2 border" />
                  <span className="w-2 h-2 border" />
                </span>
                Show style visuals
              </button>
            </div>
            <select className="border rounded-md px-2 py-1"
                    value={inputs.styleCode}
                    onChange={onStr("styleCode")}>
              {["0201","0202","0203","0204","0205","0206"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <Select label="Flute" value={inputs.fluteCode} onChange={onStr("fluteCode")}
                  options={[["B","B (3 mm)"],["C","C (4 mm)"],["E","E (2 mm)"]]} />
        </Row>
      </Section>

      {/* Modal */}
      <StylePickerModal
        open={styleModal}
        value={inputs.styleCode}
        onSelect={(code) => setInputs(v => ({ ...v, styleCode: code }))}
        onClose={() => setStyleModal(false)}
      />
    </div>
  );
}

/* -------- UI bits -------- */
function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <div className="font-semibold">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Row({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>;
}
function Num({ label, value, onChange }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-gray-700">{label}</span>
      <input type="number" className="border rounded-md px-2 py-1" value={value} onChange={onChange} />
    </label>
  );
}
function Select({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-gray-700">{label}</span>
      <select className="border rounded-md px-2 py-1" value={value} onChange={onChange}>
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </label>
  );
}
function Chk({ label, checked, onChange }) {
  return (
    <label className="inline-flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}
const num = (x) => (x === "" || isNaN(Number(x))) ? 0 : Number(x);
