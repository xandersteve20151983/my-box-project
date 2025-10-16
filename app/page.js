import BoxPreview2D from "./components/BoxPreview2D";

// …left-panel state…
const [L, setL] = useState(300);
const [W, setW] = useState(200);
const [D, setD] = useState(150);  // this is H
const [flute, setFlute] = useState("B");
const [glueSide, setGlueSide] = useState("inside"); // inside|outside
const [glueOff, setGlueOff] = useState("small");    // small(W)|large(L)
const [glue, setGlue] = useState(35);
const [glueExt, setGlueExt] = useState(0);
const [bevelDeg, setBevelDeg] = useState(30);
const [slotWidth, setSlotWidth] = useState(6);

// you already have these on the left:
const [gapTopInner, setGapTopInner] = useState(4);
const [gapTopOuter, setGapTopOuter] = useState(4);
const [gapBotInner, setGapBotInner] = useState(4);
const [gapBotOuter, setGapBotOuter] = useState(4);

const [showDims, setShowDims] = useState(true);
const [showLabels, setShowLabels] = useState(true);

// …left panel UI (your inputs) …

<BoxPreview2D
  controls={false}                 // hide the right-side controls
  L={L} W={W} H={D}
  flute={flute}
  glueSide={glueSide}
  glueOff={glueOff}
  glue={glue}
  glueExt={glueExt}
  bevelDeg={bevelDeg}
  slotWidth={slotWidth}
  gapTopInner={gapTopInner}
  gapTopOuter={gapTopOuter}
  gapBotInner={gapBotInner}
  gapBotOuter={gapBotOuter}
  showDims={showDims}
  showLabels={showLabels}
/>
