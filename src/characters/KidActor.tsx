import { memo } from 'react';
import { useGame } from '../state/gameStore';
import type { KidLayer, RoomId } from '../state/gameTypes';
import { KidFigure } from './Kid';
import { InteractiveObject } from '../components/InteractiveObject';

/** The kid as he appears in a room – moves smoothly between spots via CSS transitions. */
export const KidActor = memo(function KidActor({ room, layer }: { room: RoomId; layer: KidLayer }) {
  const k = useGame((s) => s.kid);
  const talking = useGame((s) => !!s.dialogues.kid);
  const hairFlat = useGame((s) => !!s.fx['kid:hairFlat']);
  const name = useGame((s) => s.settings.kidName) || 'Kid';
  const outfit = useGame((s) => s.outfit);
  const balloon = useGame((s) => s.balloon);
  if (k.room !== room || k.layer !== layer) return null;
  const lying = k.pose === 'sleep' || k.pose === 'lie';
  return (
    <g style={{ transform: `translate(${k.x}px, ${k.y}px)`, transition: `transform ${k.moveMs}ms ${k.moveMs > 400 ? 'linear' : 'ease-out'}` }}>
      {!lying && layer === 'front' && <ellipse cx={0} cy={2} rx={38} ry={8} fill="#000" opacity={0.14} />}
      <InteractiveObject id="kid" label={name} hit={lying ? { x: -230, y: -60, w: 240, h: 80 } : { x: -55, y: -230, w: 110, h: 232 }} origin="0px 0px">
        <g style={{ transform: `scaleX(${k.facing})`, transition: 'transform 160ms' }}>
          <KidFigure pose={k.pose} expr={k.expr} prop={k.prop} holding={k.holding} talking={talking} hairFlat={hairFlat} outfit={outfit} balloon={balloon} />
        </g>
      </InteractiveObject>
    </g>
  );
});
