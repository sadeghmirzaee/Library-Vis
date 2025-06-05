import * as ThreeType from 'three';
import { OrbitControls as OrbitControlsType } from 'three/examples/jsm/controls/OrbitControls';
import { DragControls as DragControlsType } from 'three/examples/jsm/controls/DragControls';

declare global {
    const THREE: typeof ThreeType & {
        OrbitControls: typeof OrbitControlsType;
        DragControls: typeof DragControlsType;
    };
    const TWEEN: any;
} 