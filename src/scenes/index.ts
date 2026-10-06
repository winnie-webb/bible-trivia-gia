import type { SceneKind } from '../experience/beats';
import type { SceneFactory } from './types';
import { gate, rewindScene } from './text';
import { finaleScene, openingScene, roadScene } from './journey';
import { stopScene } from './stop';

/** Scene kind → component. Add a new scene type by registering it here. */
export const SCENES: Record<SceneKind, SceneFactory> = {
  gate,
  opening: openingScene,
  rewind: rewindScene,
  stop: stopScene,
  road: roadScene,
  finale: finaleScene,
};
