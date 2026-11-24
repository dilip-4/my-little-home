import { KidFigure } from '../characters/Kid';
import { SeatedAdult } from '../characters/SeatedAdult';
import { PAPA_LOOK, papaExtras, papaHairBack, papaHairFront } from '../characters/Papa';
import { MUMMY_LOOK, mummyExtras, mummyHairBack, mummyHairFront } from '../characters/Mummy';
import { KID_SPEC, MUMMY_SPEC, PAPA_SPEC, type CharacterSpec } from '../data/characters';
import type { AdultActivity, Expression, KidPose } from '../state/gameTypes';

const kidPoses: [KidPose, Expression][] = [['stand', 'happy'], ['walk', 'happy'], ['jump', 'laugh'], ['throw', 'funny'], ['hug', 'love'], ['lift', 'strain'], ['funny', 'funny'], ['crouch', 'funny2'], ['yawn', 'yawn'], ['cheer', 'surprised']];
const adultActs: [AdultActivity, Expression][] = [['typing', 'focused'], ['lookBack', 'annoyed'], ['lookBack', 'irritated'], ['turned', 'neutral'], ['hug', 'love'], ['drink', 'happy'], ['phone', 'puzzled'], ['stretch', 'yawn']];

function Specs({ spec }: { spec: CharacterSpec }) {
  return (
    <div className="sheet-spec">
      <h2>{spec.name}</h2>
      <ul>
        <li><b>Face:</b> {spec.faceShape}</li>
        <li><b>Eyes:</b> {spec.eyes}</li>
        <li><b>Clothing:</b> {spec.clothing}</li>
        <li><b>Proportions:</b> {spec.proportions}</li>
        <li><b>Expressions:</b> {spec.expressionStyle}</li>
      </ul>
      <div className="swatches">
        {[spec.skin, spec.hair, ...Object.values(spec.palette)].map((c, i) => (
          <span key={i} style={{ background: c }} title={c} />
        ))}
      </div>
    </div>
  );
}

/** Visual character reference sheet – open with  #sheet */
export default function CharacterSheet() {
  return (
    <div className="sheet">
      <h1>My Little Home – character reference sheet</h1>
      <Specs spec={PAPA_SPEC} />
      <svg viewBox="0 0 1600 320" className="sheet-row">
        {adultActs.map(([a, e], i) => (
          <g key={i} transform={`translate(${110 + i * 190} 230) scale(0.8)`}>
            <SeatedAdult look={PAPA_LOOK} activity={a} expr={e} hairBack={papaHairBack} hairFront={papaHairFront} extras={papaExtras} />
          </g>
        ))}
      </svg>
      <Specs spec={MUMMY_SPEC} />
      <svg viewBox="0 0 1600 320" className="sheet-row">
        {adultActs.map(([a, e], i) => (
          <g key={i} transform={`translate(${130 + i * 190} 230) scale(-0.8 0.8)`}>
            <SeatedAdult look={MUMMY_LOOK} activity={a} expr={e} hairBack={mummyHairBack} hairFront={mummyHairFront} extras={mummyExtras} />
          </g>
        ))}
      </svg>
      <Specs spec={KID_SPEC} />
      <svg viewBox="0 0 1600 300" className="sheet-row">
        {kidPoses.map(([p, e], i) => (
          <g key={i} transform={`translate(${90 + i * 150} 270)`}>
            <KidFigure pose={p} expr={e} />
          </g>
        ))}
      </svg>
      <p><a href="#">Back to the house</a></p>
    </div>
  );
}
