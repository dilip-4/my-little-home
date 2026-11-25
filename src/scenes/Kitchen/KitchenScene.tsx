import { memo } from 'react';
import { useGame } from '../../state/gameStore';
import { OUTLINE } from '../../data/characters';
import { InteractiveObject as Hot } from '../../components/InteractiveObject';
import { RoomShell, WindowView, Curtains, Plant, LightSwitch } from '../../components/RoomParts';
import { RoomDoor } from '../../components/RoomDoor';
import { WallClock } from '../../components/WallClock';
import { LightOverlay, ambientDarkness } from '../../components/LightOverlay';
import { Projectile, Sparkle, Hearts } from '../../components/Effects';
import { Bubbles } from '../../components/Toys';
import { Banana, Cookie, Cupcake, JuiceBox, Sandwich } from '../../components/props';
import { KidActor } from '../../characters/KidActor';
import { PupActor } from '../../characters/Pup';
import { latestDrawing } from '../../components/drawingStore';
import { HideMarkers } from '../../components/HideSeek';

const S = { stroke: OUTLINE, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const R = 'kitchen';

/** Tall two-door fridge with magnets (and the kid's latest drawing stuck on it). */
const Fridge = ({ open, wink, art }: { open: boolean; wink: boolean; art: string | null }) => (
  <g>
    <ellipse cx={335} cy={654} rx={92} ry={8} fill="#000" opacity={0.12} />
    {/* inside (visible when open) */}
    <rect x={262} y={338} width={146} height={308} rx={8} fill={open ? '#eaf7ff' : '#c9e6e0'} {...S} />
    {open && (
      <g>
        <rect x={262} y={338} width={146} height={308} rx={8} fill="#fffbe0" opacity={0.5} />
        {[430, 520, 600].map((y) => (
          <rect key={y} x={268} y={y} width={134} height={6} rx={2} fill="#bfe3f2" stroke={OUTLINE} strokeWidth={1.5} />
        ))}
        {/* milk */}
        <path d="M 278 428 L 278 380 L 286 368 L 304 368 L 312 380 L 312 428 Z" fill="#fff" {...S} strokeWidth={2.5} />
        <rect x={282} y={392} width={26} height={14} fill="#5fb0e8" />
        <g transform="translate(345 418)"><JuiceBox /></g>
        <g transform="translate(380 420) scale(0.9)"><JuiceBox /></g>
        {/* cheese with a face (it winks if you open the fridge a lot) */}
        <g transform="translate(300 508)">
          <path d="M -24 10 L 24 10 L 24 -10 L -24 -18 Z" fill="#ffd23f" {...S} strokeWidth={2.5} />
          <circle cx={-8} cy={-4} r={3} fill="#e6b400" />
          <circle cx={12} cy={2} r={4} fill="#e6b400" />
          <circle cx={-12} cy={-8} r={2.4} fill={OUTLINE} />
          {wink ? <path d="M 0 -8 q 3 -3 6 0" stroke={OUTLINE} strokeWidth={2} fill="none" /> : <circle cx={3} cy={-7} r={2.4} fill={OUTLINE} />}
          <path d="M -8 2 q 5 4 10 0" stroke={OUTLINE} strokeWidth={2} fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(372 510)"><circle r={14} fill="#e8483f" {...S} strokeWidth={2.5} /><path d="M 0 -14 q 2 -6 6 -8" stroke={OUTLINE} strokeWidth={2.5} fill="none" /></g>
        <g transform="translate(300 592) scale(0.9)"><Banana /></g>
        <g transform="translate(368 592)"><Cupcake /></g>
        <rect x={330} y={626} width={30} height={12} rx={3} fill="#9be0a0" stroke={OUTLINE} strokeWidth={1.5} />
      </g>
    )}
    {/* freezer door */}
    <rect x={258} y={196} width={154} height={138} rx={12} fill="#a9dccf" {...S} />
    <rect x={390} y={240} width={8} height={56} rx={4} fill="#e9ecf1" {...S} strokeWidth={2} />
    {/* main door */}
    <g style={{ transform: open ? 'scaleX(-0.32)' : 'none', transformOrigin: '258px 0px', transition: 'transform 320ms cubic-bezier(.3,1.3,.5,1)' }}>
      <rect x={258} y={338} width={154} height={312} rx={12} fill="#b9e6da" {...S} />
      <rect x={390} y={360} width={8} height={90} rx={4} fill="#e9ecf1" {...S} strokeWidth={2} />
      {!open && (
        <g>
          {/* magnets + the kid's drawing */}
          <rect x={282} y={372} width={92} height={68} fill="#fffdf7" stroke={OUTLINE} strokeWidth={2} transform="rotate(-4 328 406)" />
          {art ? (
            <image href={art} x={286} y={376} width={84} height={60} preserveAspectRatio="xMidYMid slice" transform="rotate(-4 328 406)" />
          ) : (
            <path d="M 296 420 q 14 -24 28 0 t 28 0" stroke="#e2483f" strokeWidth={3} fill="none" transform="rotate(-4 328 406)" />
          )}
          <circle cx={292} cy={374} r={7} fill="#ff6f91" {...S} strokeWidth={2} />
          <circle cx={368} cy={370} r={7} fill="#5fd4ff" {...S} strokeWidth={2} />
          <path d="M 300 480 l 6 -16 l 6 16 Z" fill="#ffd23f" {...S} strokeWidth={2} />
          <rect x={330} y={470} width={24} height={16} rx={4} fill="#9b7bff" {...S} strokeWidth={2} />
          <circle cx={312} cy={512} r={8} fill="#6fbf4a" {...S} strokeWidth={2} />
        </g>
      )}
    </g>
  </g>
);

/** The long kitchen counter with oven, cupboards and the sink. */
const Counter = ({ ovenOn, tap }: { ovenOn: boolean; tap: boolean }) => (
  <g>
    <ellipse cx={755} cy={654} rx={330} ry={9} fill="#000" opacity={0.12} />
    <rect x={438} y={482} width={636} height={168} rx={4} fill="#f2e3c6" {...S} />
    {/* oven */}
    <rect x={452} y={496} width={124} height={140} rx={8} fill="#d9dee6" {...S} />
    <rect x={466} y={528} width={96} height={72} rx={8} fill={ovenOn ? '#ffb347' : '#3b3f46'} stroke={OUTLINE} strokeWidth={2.5} />
    {ovenOn && <rect x={466} y={528} width={96} height={72} rx={8} fill="#ffe28a" opacity={0.5} className="oven-glow" />}
    <rect x={480} y={508} width={68} height={8} rx={4} fill="#9aa6b8" stroke={OUTLINE} strokeWidth={1.5} />
    {[478, 514, 550].map((x) => (
      <circle key={x} cx={x} cy={618} r={6} fill="#5a6070" stroke={OUTLINE} strokeWidth={1.5} />
    ))}
    {/* cupboard doors */}
    {[590, 704, 818, 932].map((x) => (
      <g key={x}>
        <rect x={x} y={496} width={102} height={140} rx={6} fill="#f8ecd4" stroke={OUTLINE} strokeWidth={2.5} />
        <rect x={x + 44} y={556} width={14} height={8} rx={3} fill="#c48a56" stroke={OUTLINE} strokeWidth={1.5} />
      </g>
    ))}
    {/* worktop */}
    <rect x={426} y={464} width={660} height={22} rx={6} fill="#7fb5a5" {...S} />
    {/* sink */}
    <path d="M 742 470 L 862 470 L 852 486 L 752 486 Z" fill="#9aa6b8" stroke={OUTLINE} strokeWidth={2} />
    <path d="M 800 466 L 800 420 Q 800 404 818 404 L 830 404" fill="none" stroke={OUTLINE} strokeWidth={9} strokeLinecap="round" />
    <path d="M 800 466 L 800 420 Q 800 404 818 404 L 830 404" fill="none" stroke="#d9dee6" strokeWidth={5} strokeLinecap="round" />
    <circle cx={786} cy={456} r={6} fill="#e2483f" stroke={OUTLINE} strokeWidth={2} />
    <circle cx={814} cy={456} r={6} fill="#4fb0e8" stroke={OUTLINE} strokeWidth={2} />
    {tap && <path d="M 830 408 Q 834 440 830 474" stroke="#8fd0f0" strokeWidth={7} strokeLinecap="round" className="water-run" fill="none" />}
  </g>
);

const Table = () => (
  <g>
    <ellipse cx={1255} cy={748} rx={170} ry={12} fill="#000" opacity={0.12} />
    {/* chairs */}
    {[1118, 1392].map((x, i) => (
      <g key={x}>
        <rect x={x - 6} y={520} width={12} height={110} rx={4} fill="#c48a56" {...S} transform={`rotate(${i ? 6 : -6} ${x} 630)`} />
        <rect x={x - 34} y={624} width={68} height={14} rx={5} fill="#e9a23b" {...S} />
        <rect x={x - 28} y={636} width={8} height={100} rx={3} fill="#a66d3f" {...S} strokeWidth={2} />
        <rect x={x + 20} y={636} width={8} height={100} rx={3} fill="#a66d3f" {...S} strokeWidth={2} />
      </g>
    ))}
    <rect x={1150} y={604} width={14} height={140} rx={4} fill="#a66d3f" {...S} />
    <rect x={1346} y={604} width={14} height={140} rx={4} fill="#a66d3f" {...S} />
    <path d="M 1128 590 L 1382 590 L 1394 612 L 1116 612 Z" fill="#c48a56" {...S} />
    <path d="M 1150 590 L 1360 590" stroke="#fff" strokeWidth={3} strokeDasharray="10 8" opacity={0.5} />
  </g>
);

export const KitchenScene = memo(function KitchenScene() {
  const room = useGame((s) => s.kitchen);
  const period = useGame((s) => s.dayPeriod);
  const fx = useGame((s) => s.fx);
  useGame((s) => s.drawingVersion);
  const art = latestDrawing();
  const fridgeOpen = !!fx[R + ':fridgeOpen'];
  const darkness = ambientDarkness(period, room.lightOn, room.curtainsOpen);
  const glows = fridgeOpen ? [{ x: 335, y: 480, r: 220 }] : [];
  const sandwich = (fx[R + ':sandwich'] as number | undefined) ?? 0;
  const cake = !!fx[R + ':cake'];
  const popcorn = !!fx[R + ':popcorn'];

  return (
    <svg className="scene-svg" viewBox="0 0 1440 810" preserveAspectRatio="xMidYMid meet">
      <RoomShell id="kt" wall="#fff1c9" wallDeep="#f7e2a8" wainscot="#bfe3d6" pattern="dots" patternColor="#f6e3b0" />
      {/* tiled splashback behind the counter */}
      <g opacity={0.9}>
        {Array.from({ length: 13 }, (_, i) =>
          Array.from({ length: 3 }, (_, j) => (
            <rect key={i + ':' + j} x={432 + i * 50} y={344 + j * 40} width={48} height={38} rx={4} fill={(i + j) % 2 ? '#e6f6f1' : '#d4efe7'} />
          )),
        )}
      </g>

      {/* window over the sink */}
      <Hot id="window" label="Window" hit={{ x: 690, y: 130, w: 220, h: 200 }}>
        <WindowView id="kt-win" x={680} y={120} w={240} h={210} period={period} open={room.windowOpen} />
      </Hot>
      <Hot id="curtains" label="Curtains" hit={{ x: 650, y: 100, w: 46, h: 160 }}>
        <Curtains x={670} y={110} w={260} h={140} open={room.curtainsOpen} color="#ffb3c1" colorDark="#e98ca0" windy={room.windowOpen} />
        <rect x={910} y={100} width={40} height={160} fill="transparent" />
      </Hot>
      <Hot id="plant" label="Plant" hit={{ x: 860, y: 270, w: 70, h: 70 }}>
        <Plant x={895} y={336} s={0.45} pot="#e2705c" />
      </Hot>

      {/* upper cupboards */}
      {[[452, 130, 200], [952, 130, 120]].map(([x, y, w]) => (
        <g key={x}>
          <rect x={x} y={y} width={w} height={150} rx={6} fill="#f8ecd4" {...S} />
          <path d={`M ${x + w / 2} ${y} L ${x + w / 2} ${y + 150}`} stroke={OUTLINE} strokeWidth={2.5} />
          <rect x={x + w / 2 - 14} y={y + 110} width={8} height={18} rx={3} fill="#c48a56" stroke={OUTLINE} strokeWidth={1.5} />
          <rect x={x + w / 2 + 6} y={y + 110} width={8} height={18} rx={3} fill="#c48a56" stroke={OUTLINE} strokeWidth={1.5} />
        </g>
      ))}

      <Hot id="clock" label="Wall clock" hit={{ x: 1200, y: 110, w: 110, h: 110 }}>
        <WallClock x={1255} y={165} r={44} cuckoo={!!fx.cuckoo} />
      </Hot>
      {/* little family "menu" board */}
      <g>
        <rect x={1120} y={262} width={150} height={110} rx={8} fill="#3b4a40" {...S} />
        <text x={1195} y={298} textAnchor="middle" fontSize={22} fontWeight={700} fill="#fff">Today:</text>
        <text x={1195} y={330} textAnchor="middle" fontSize={20} fill="#ffd23f">hugs</text>
        <text x={1195} y={358} textAnchor="middle" fontSize={20} fill="#9be0a0">&amp; snacks</text>
      </g>

      <Hot id="switch" label="Light switch" hit={{ x: 205, y: 392, w: 40, h: 62 }}>
        <LightSwitch x={210} y={400} on={room.lightOn} />
      </Hot>

      <Hot id="door" label="Door to Papa's office" hit={{ x: 44, y: 232, w: 142, h: 210 }}>
        <RoomDoor
          x={40}
          y={230}
          w={150}
          h={410}
          hinge="left"
          open={!!fx[R + ':doorOpen']}
          color="#7fb5a5"
          peekLight="#d5e6c8"
          sign={
            <g transform="translate(115 300)">
              <rect x={-30} y={-26} width={60} height={46} rx={8} fill="#fff6d8" {...S} strokeWidth={2.5} />
              <rect x={-18} y={-12} width={36} height={22} rx={3} fill="#2c3340" stroke={OUTLINE} strokeWidth={2} />
              <rect x={-14} y={-8} width={28} height={14} fill="#bfe3f2" />
            </g>
          }
        />
      </Hot>

      <Hot id="fridge" label="Fridge" hit={{ x: 256, y: 196, w: 158, h: 456 }}>
        <Fridge open={fridgeOpen} wink={!!fx[R + ':cheeseWink']} art={art} />
      </Hot>

      <Counter ovenOn={!!fx[R + ':ovenOn']} tap={!!fx[R + ':tap']} />
      <Hot id="oven" label="Oven" hit={{ x: 452, y: 496, w: 124, h: 140 }}>
        <rect x={452} y={496} width={124} height={140} fill="transparent" />
      </Hot>
      <Hot id="sink" label="Sink" hit={{ x: 740, y: 396, w: 124, h: 92 }}>
        <rect x={740} y={396} width={124} height={92} fill="transparent" />
      </Hot>

      <Hot id="cookies" label="Cookie jar" hit={{ x: 470, y: 380, w: 70, h: 88 }}>
        <g transform="translate(505 466)">
          <path d="M -28 0 Q -32 -46 -22 -60 L 22 -60 Q 32 -46 28 0 Z" fill="#d9f0ff" opacity={0.9} {...S} />
          <g transform="translate(-8 -16) scale(0.7)"><Cookie /></g>
          <g transform="translate(10 -24) scale(0.7)"><Cookie /></g>
          <g transform="translate(0 -40) scale(0.65)"><Cookie /></g>
          <g style={{ transform: fx[R + ':jarOpen'] ? 'translate(18px, -18px) rotate(24deg)' : 'none', transition: 'transform 250ms', transformOrigin: '0px -62px' }}>
            <rect x={-26} y={-70} width={52} height={12} rx={5} fill="#e2705c" {...S} />
            <circle cx={0} cy={-74} r={6} fill="#e2705c" {...S} strokeWidth={2} />
          </g>
          <rect x={-14} y={-30} width={28} height={12} rx={3} fill="#fff" stroke={OUTLINE} strokeWidth={1.5} />
        </g>
      </Hot>

      <Hot id="fruit" label="Fruit bowl" hit={{ x: 580, y: 400, w: 96, h: 68 }}>
        <g transform="translate(628 466)">
          <g transform="translate(-14 -26) rotate(-20)"><Banana /></g>
          <circle cx={12} cy={-24} r={13} fill="#e8483f" {...S} strokeWidth={2.5} />
          <circle cx={-4} cy={-30} r={11} fill="#ff9f43" {...S} strokeWidth={2.5} />
          <path d="M -40 -16 Q 0 14 40 -16 Z" fill="#ffd9a8" {...S} />
        </g>
      </Hot>

      <Hot id="board" label="Sandwich board" hit={{ x: 890, y: 410, w: 104, h: 60 }}>
        <g transform="translate(942 466)">
          <rect x={-46} y={-8} width={92} height={10} rx={4} fill="#c48a56" {...S} strokeWidth={2.5} />
          <circle cx={46} cy={-3} r={5} fill="none" stroke={OUTLINE} strokeWidth={2.5} />
          {sandwich > 0 ? (
            <g transform="translate(0 -16) scale(1.3)"><Sandwich layers={sandwich} /></g>
          ) : (
            <g>
              <rect x={-30} y={-24} width={24} height={16} rx={4} fill="#f3d39b" stroke={OUTLINE} strokeWidth={2} />
              <rect x={4} y={-22} width={22} height={14} rx={3} fill="#ffd23f" stroke={OUTLINE} strokeWidth={2} />
            </g>
          )}
        </g>
      </Hot>

      <Hot id="microwave" label="Microwave" hit={{ x: 986, y: 380, w: 96, h: 88 }}>
        <g>
          <rect x={988} y={388} width={92} height={78} rx={8} fill="#d9dee6" {...S} />
          <rect x={996} y={398} width={58} height={56} rx={5} fill={fx[R + ':micro'] ? '#ffe28a' : '#3b3f46'} stroke={OUTLINE} strokeWidth={2} />
          {fx[R + ':micro'] && <circle cx={1025} cy={430} r={12} fill="#fff6d0" stroke={OUTLINE} strokeWidth={2} className="micro-spin" />}
          <circle cx={1066} cy={410} r={5} fill="#5a6070" />
          <circle cx={1066} cy={428} r={5} fill="#5a6070" />
          <rect x={1060} y={442} width={12} height={8} rx={2} fill={fx[R + ':micro'] ? '#6fe08a' : '#5a6070'} />
          {popcorn && (
            <g>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <circle key={i} cx={1030 + (i - 2.5) * 14} cy={380} r={6} fill="#fff6d0" stroke={OUTLINE} strokeWidth={1.5} className="pop-corn" style={{ animationDelay: `${i * 110}ms`, ['--dx' as string]: `${(i - 2.5) * 22}px` }} />
              ))}
            </g>
          )}
        </g>
      </Hot>

      <Hot id="table" label="Kitchen table" hit={{ x: 1110, y: 560, w: 300, h: 190 }}>
        <Table />
        {cake ? (
          <g transform="translate(1255 588)">
            <g className="pop-in">
              <path d="M -46 0 L 46 0 L 40 -40 L -40 -40 Z" fill="#ffb3d1" {...S} />
              <path d="M -40 -40 Q -30 -30 -20 -40 Q -10 -30 0 -40 Q 10 -30 20 -40 Q 30 -30 40 -40" fill="none" stroke="#fff" strokeWidth={5} />
              {[-20, 0, 20].map((dx) => (
                <g key={dx}>
                  <rect x={dx - 2} y={-60} width={4} height={20} fill="#5fd4ff" stroke={OUTLINE} strokeWidth={1.5} />
                  <path d={`M ${dx} -72 Q ${dx + 5} -66 ${dx} -62 Q ${dx - 5} -66 ${dx} -72 Z`} fill="#ffb347" className="flame" />
                </g>
              ))}
            </g>
          </g>
        ) : (
          <g transform="translate(1255 588)">
            <path d="M -16 0 L 16 0 L 12 -34 L -12 -34 Z" fill="#bfe3f2" {...S} strokeWidth={2.5} />
            <circle cx={-6} cy={-42} r={8} fill="#ff6f91" />
            <circle cx={8} cy={-46} r={8} fill="#ffd23f" />
            <path d="M 0 -34 L -6 -42 M 0 -34 L 8 -46" stroke="#4f9d69" strokeWidth={2} />
          </g>
        )}
      </Hot>

      {/* striped kitchen mat in front of the counter */}
      <path d="M 430 708 L 1070 708 L 1090 792 L 410 792 Z" fill="#7fb5a5" {...S} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <path key={i} d={`M ${462 + i * 80} 708 L ${452 + i * 82} 792`} stroke={i % 2 ? '#fff6e0' : '#ffb3c1'} strokeWidth={14} opacity={0.75} />
      ))}

      <PupActor room={R} />
      {fx[R + ':pupHearts'] && <Hearts x={useGame.getState().pup.x} y={useGame.getState().pup.y - 110} />}
      <KidActor room={R} layer="front" />
      {fx[R + ':juggle'] && (
        <g transform={`translate(${useGame.getState().kid.x} ${useGame.getState().kid.y - 300})`} pointerEvents="none">
          <g className="juggle"><circle cx={0} cy={-40} r={14} fill="#e8483f" {...S} strokeWidth={2.5} /></g>
          <g className="juggle" style={{ animationDelay: '-0.4s' }}><circle cx={0} cy={-40} r={14} fill="#ff9f43" {...S} strokeWidth={2.5} /></g>
          <g className="juggle" style={{ animationDelay: '-0.8s' }}><g transform="translate(0 -40) scale(0.6)"><Banana /></g></g>
        </g>
      )}
      {fx[R + ':hearts'] && <Hearts x={useGame.getState().kid.x} y={useGame.getState().kid.y - 260} />}

      {fx['hs:cover'] === 'table' && <g pointerEvents="none"><Table /></g>}
      {fx['hs:cover'] === 'fridge' && <g pointerEvents="none"><Fridge open={false} wink={false} art={art} /></g>}
      <HideMarkers room={R} />
      <Bubbles room={R} />
      <Projectile />
      <LightOverlay id="kt-light" darkness={darkness} period={period} glows={glows} windowRect={{ x: 680, y: 120, w: 240, h: 210 }} curtainsOpen={room.curtainsOpen} />
      <Sparkle />
    </svg>
  );
});

export default KitchenScene;
