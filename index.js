import { LabShad } from "./app.js";
import { Pane } from "https://cdn.jsdelivr.net/npm/tweakpane@4.0.0/dist/tweakpane.min.js";

const config = {
  pixelSize: 30,
  lineWidth: 0.2,
  colA: "rgb(10,10,10)",
  colB: "rgb(180,180,180)",
};

const labshad = new LabShad(config);

// Initialize Tweakpane and bind configuration parameters
const pane = new Pane();

// Bind config to Tweakpane
pane.addBinding(config, "pixelSize", { min: 10, max: 100, step: 1 });
pane.addBinding(config, "lineWidth", { min: 0.1, max: 5, step: 0.1 });
pane.addBinding(config, "threshold", { min: 0.1, max: 1, step: 0.1 });
pane.addBinding(config, "neighbohrs", { min: 1, max: 10, step: 1 });
pane.addBinding(config, "frames", { min: 1, max: 10, step: 1 });
pane.addBinding(config, "colA");
pane.addBinding(config, "colB");
pane.on("change", () => {
  labshad.update();
});

window.labshad = labshad;
