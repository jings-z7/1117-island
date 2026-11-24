// Minimal stand-in for the `postprocessing` (pmndrs) package.
// vendor/n8ao/N8AO.js declares `N8AOPostPass extends Pass` from "postprocessing" at module load time.
// This site only uses `N8AOPass` (three.js EffectComposer flavour), so N8AOPostPass is never constructed;
// the empty class just lets the module evaluate without shipping the whole postprocessing library.
export class Pass {}
