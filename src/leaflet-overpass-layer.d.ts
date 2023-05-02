declare module 'leaflet-overpass-layer' {
    import { Layer } from 'leaflet';

    interface OverPassLayerOptions {
        // Add the options you want to use here
    }

    class OverPassLayer extends Layer {
        constructor(options?: OverPassLayerOptions);
        // Add any additional methods or properties you want to use here
    }

    export default OverPassLayer;
}