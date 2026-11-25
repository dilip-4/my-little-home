import { memo } from 'react';
import { useGame } from '../../state/gameStore';
import { OUTLINE } from '../../data/characters';
import { BUBBLE_BOTTLE, COSTUME_CHEST, MUMMY_SEAT, PUP_BOWL } from '../../data/spots';
import { CostumeChest, DogBowl } from '../../components/HomeExtras';
import { PupActor } from '../../characters/Pup';
import { BasketCover, HideMarkers } from '../../components/HideSeek';
import { Bubbles } from '../../components/Toys';
import { InteractiveObject as Hot } from '../../components/InteractiveObject';
import { RoomShell, WindowView, Curtains, CeilingFan, Plant, LightSwitch, Frame, FamilyMini } from '../../components/RoomParts';
import { RoomDoor } from '../../components/RoomDoor';
import { WallClock } from '../../components/WallClock';
import { LightOverlay, ambientDarkness } from '../../components/LightOverlay';
import { Projectile, Sparkle, DiscoLights, Hearts } from '../../components/Effects';
import { Ball, Blocks, Bottle, BubbleBottle, Duck, Hairbrush, Keys, Lollipop, Mug, Note, Pillow, Sunglasses, Teddy, ToyCar } from '../../components/props';
import { Mummy } from '../../characters/Mummy';
import { KidActor } from '../../characters/KidActor';
import { KidFigure } from '../../characters/Kid';
import type { Expression } from '../../state/gameTypes';

const S = { stroke: OUTLINE, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const R = 'mummy-room';

export const MummyRoomScene = memo(function MummyRoomScene() {
  const room = useGame((s) => s.mummyRoom);
  const period = useGame((s) => s.dayPeriod);
  const fx = useGame((s) => s.fx);
  const mummy = useGame((s) => s.characters.mummy);
  const kid = useGame((s) => s.kid);
  const kidHere = kid.room === R;
  const kidHas = (p: string) => kidHere && (kid.prop === p || kid.holding === p);
  const kidInBed = kidHere && kid.layer === 'back';

  const darkness = ambientDarkness(period, room.lightOn, room.curtainsOpen);
  const glows = room.lampOn ? [{ x: 528, y: 500, r: 250 }] : [];
  const screen = (fx[R + ':laptop'] as string) ?? (mummy.activity === 'meeting' ? 'meeting' : 'doc');
  const teddyHome = !kidHas('teddy') && !fx[R + ':teddyDesk'] && mummy.activity !== 'holdTeddy';
  const pillowHome = !fx[R + ':pillowAway'] && !kidHas('pillow');
  const ballHome = !fx[R + ':ballAway'];
  const mugHome = mummy.activity !== 'drink';
  const bagItem = fx[R + ':bagItem'] as string | undefined;
  const mirrorFace = fx[R + ':mirrorFace'] as Expression | undefined;
  const blanketHide = !!fx[R + ':blanketHide'];
  const kidSleeping = kidInBed && (kid.pose === 'sleep' || kid.pose === 'lie');

  return (
    <svg className="scene-svg" viewBox="0 0 1440 810" preserveAspectRatio="xMidYMid meet">
      <RoomShell id="mr" wall="#f8dccf" wallDeep="#f0c7b5" wainscot="#eab8a3" pattern="dots" patternColor="#f3cbbb" />

      {/* ---------- window above the bed ---------- */}
      <Hot id="window" label="Window" hit={{ x: 150, y: 110, w: 240, h: 210 }}>
        <WindowView id="mr-win" x={140} y={100} w={260} h={230} period={period} open={room.windowOpen} />
      </Hot>
      <Hot id="curtains" label="Curtains" hit={{ x: 110, y: 80, w: 50, h: 290 }}>
        <Curtains x={130} y={90} w={280} h={280} open={room.curtainsOpen} color="#9fc7e8" colorDark="#7aa6cf" windy={room.windowOpen} />
        <rect x={390} y={80} width={40} height={290} fill="transparent" />
      </Hot>

      <Hot id="photo" label="Family photos" hit={{ x: 470, y: 150, w: 130, h: 190 }}>
        <g className={fx[R + ':photoZoom'] ? 'photo-zoom' : undefined} style={{ transformOrigin: '535px 240px' }}>
          <Frame x={476} y={156} w={86} h={70} color="#e2705c">
            <FamilyMini w={62} h={46} />
          </Frame>
          <Frame x={512} y={238} w={74} h={92} color="#f2b640">
            <rect width={50} height={68} fill="#ffe1ec" />
            <circle cx={25} cy={30} r={13} fill="#d9a179" />
            <path d="M 12 28 q 13 -20 26 0" fill="#261c18" />
            <path d="M 20 36 q 5 5 10 0" stroke="#5a3b2a" strokeWidth={2} fill="none" />
            <path d="M 15 60 L 25 46 L 35 60 Z" fill="#f5c343" />
            <path d="M 18 12 l 3 -8 l 4 6 l 4 -6 l 3 8 Z" fill="#ffd34d" stroke="#c98a1c" strokeWidth={1} />
          </Frame>
        </g>
      </Hot>

      <Hot id="clock" label="Wall clock" hit={{ x: 680, y: 70, w: 110, h: 110 }}>
        <WallClock x={735} y={124} r={42} rim="#9fc7e8" cuckoo={!!fx.cuckoo} />
      </Hot>

      {/* ---------- book shelf ---------- */}
      <Hot id="books" label="Book shelf" hit={{ x: 618, y: 226, w: 230, h: 84 }}>
        <g>
          <rect x={612} y={298} width={236} height={12} rx={3} fill="#b97c4b" {...S} />
          <path d="M 630 310 l 0 16 l 14 0 Z M 820 310 l 0 16 l -14 0 Z" fill="#8d5a36" {...S} strokeWidth={2} />
          <g className={fx[R + ':booksWiggle'] ? 'books-wiggle' : undefined}>
            {[[628, 246, 18, 52, '#9b7bff'], [648, 240, 14, 58, '#4fb0e8'], [664, 250, 20, 48, '#e45b5b'], [688, 244, 16, 54, '#6fe08a'], [728, 254, 22, 44, '#f29e4c'], [752, 246, 16, 52, '#e2705c'], [772, 240, 18, 58, '#5b8def']].map(([x, y, w, h, c], i) =>
              fx[R + ':bookOut'] && i === 2 ? null : <rect key={i} x={x as number} y={y as number} width={w as number} height={h as number} rx={2} fill={c as string} stroke={OUTLINE} strokeWidth={2} />,
            )}
            <path d="M 702 298 L 724 252 L 732 256 L 712 298 Z" fill="#ffd23f" stroke={OUTLINE} strokeWidth={2} />
            <g transform="translate(812 284)">
              <path d="M -16 14 L 16 14 L 12 -8 L -12 -8 Z" fill="#d9785a" {...S} strokeWidth={2} />
              <circle cx={-6} cy={-16} r={9} fill="#5fae5c" stroke={OUTLINE} strokeWidth={2} />
              <circle cx={7} cy={-18} r={10} fill="#4d9a50" stroke={OUTLINE} strokeWidth={2} />
            </g>
          </g>
          {fx[R + ':note'] && (
            <g transform="translate(740 200)"><g className="pop-in"><Note /></g></g>
          )}
        </g>
      </Hot>

      {/* ---------- dressing table + mirror ---------- */}
      <Hot id="mirror" label="Mirror" hit={{ x: 968, y: 372, w: 100, h: 160 }}>
        <g>
          <rect x={1010} y={514} width={14} height={46} fill="#b97c4b" {...S} />
          <ellipse cx={1017} cy={448} rx={50} ry={76} fill="#e9b949" {...S} />
          <ellipse cx={1017} cy={448} rx={40} ry={66} fill="#d6ecf5" stroke={OUTLINE} strokeWidth={2} />
          <clipPath id="mirror-clip">
            <ellipse cx={1017} cy={448} rx={40} ry={66} />
          </clipPath>
          <g clipPath="url(#mirror-clip)">
            {mirrorFace && kidHere && (
              <g transform="translate(1017 560) scale(0.62)">
                <KidFigure pose="stand" expr={mirrorFace} />
              </g>
            )}
            <path d="M 990 400 l 30 -26 M 994 430 l 44 -40" stroke="#fff" strokeWidth={6} opacity={0.6} />
          </g>
        </g>
      </Hot>
      <g>
        <rect x={958} y={556} width={120} height={14} rx={4} fill="#f2e3cf" {...S} />
        <rect x={966} y={570} width={104} height={50} fill="#e9d3b6" {...S} />
        <rect x={980} y={580} width={76} height={26} rx={4} fill="#f2e3cf" stroke={OUTLINE} strokeWidth={2} />
        <circle cx={1018} cy={593} r={4} fill="#e9b949" stroke={OUTLINE} strokeWidth={1.5} />
        <rect x={968} y={620} width={10} height={30} fill="#c9a77f" {...S} strokeWidth={2} />
        <rect x={1058} y={620} width={10} height={30} fill="#c9a77f" {...S} strokeWidth={2} />
      </g>
      <Hot id="brush" label="Hairbrush" hit={{ x: 966, y: 522, w: 44, h: 38 }}>
        {!kidHas('brush') && (
          <g transform="translate(986 548) rotate(-80) scale(0.8)">
            <Hairbrush />
          </g>
        )}
      </Hot>
      <Hot id="bag" label="Handbag" hit={{ x: 1022, y: 500, w: 60, h: 60 }}>
        <g>
          <path d="M 1034 518 Q 1052 486 1070 518" fill="none" stroke={OUTLINE} strokeWidth={7} />
          <path d="M 1034 518 Q 1052 486 1070 518" fill="none" stroke="#9c4a7a" strokeWidth={3} />
          <path d="M 1026 518 L 1078 518 L 1074 556 L 1030 556 Z" fill="#c75d95" {...S} />
          <path d="M 1026 518 L 1078 518 L 1070 532 L 1034 532 Z" fill={fx[R + ':bagOpen'] ? '#5a2c47' : '#b04f84'} stroke={OUTLINE} strokeWidth={2} />
          <circle cx={1052} cy={530} r={4} fill="#e9b949" stroke={OUTLINE} strokeWidth={1.5} />
          {bagItem && (
            <g transform="translate(1052 496)"><g className="pop-up">
              {bagItem === 'sunglasses' && <Sunglasses />}
              {bagItem === 'lollipop' && <Lollipop />}
              {bagItem === 'keys' && <Keys />}
              {bagItem === 'note' && <Note />}
            </g></g>
          )}
        </g>
      </Hot>

      <Hot id="painting" label="Painting" hit={{ x: 966, y: 160, w: 104, h: 104 }}>
        <Frame x={966} y={160} w={104} h={104} color="#7aa6cf">
          <rect width={80} height={80} fill="#fff1d6" />
          <circle cx={40} cy={40} r={22} fill="#ff8fa3" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <ellipse key={a} cx={40} cy={18} rx={9} ry={14} fill="#ffc2cf" transform={`rotate(${a} 40 40)`} />
          ))}
          <circle cx={40} cy={40} r={9} fill="#ffd34d" />
        </Frame>
      </Hot>

      {/* ---------- wardrobe ---------- */}
      <Hot id="wardrobe" label="Wardrobe" hit={{ x: 1090, y: 220, w: 130, h: 430 }}>
        <g>
          <ellipse cx={1155} cy={652} rx={80} ry={8} fill="#000" opacity={0.12} />
          <rect x={1088} y={218} width={134} height={432} rx={6} fill="#c48a56" {...S} />
          <rect x={1100} y={232} width={110} height={400} fill="#5b3a26" />
          <rect x={1104} y={260} width={102} height={6} fill="#9aa0a8" />
          {[['#e2705c', 1112], ['#5b8def', 1136], ['#f2b640', 1162], ['#6fe08a', 1186]].map(([c, x]) => (
            <g key={x as number}>
              <path d={`M ${x} 262 l -2 8 l -10 6 l 4 70 l 26 0 l 4 -70 l -10 -6 l -2 -8`} fill={c as string} stroke={OUTLINE} strokeWidth={2} />
            </g>
          ))}
        </g>
      </Hot>
      <KidActor room={R} layer="inside" />
      <g>
        <g pointerEvents="none">
          <g style={{ transformOrigin: '1100px 0px', transform: room.wardrobeOpen ? 'scaleX(0.12)' : 'none', transition: 'transform 500ms ease' }}>
            <rect x={1100} y={230} width={55} height={404} fill="#d39a64" {...S} />
            <rect x={1110} y={250} width={35} height={160} rx={6} fill="none" stroke="#000" strokeOpacity={0.12} strokeWidth={3} />
            <rect x={1110} y={430} width={35} height={180} rx={6} fill="none" stroke="#000" strokeOpacity={0.12} strokeWidth={3} />
            <rect x={1146} y={410} width={5} height={30} rx={2} fill="#e9b949" stroke={OUTLINE} strokeWidth={1.5} />
          </g>
          <g style={{ transformOrigin: '1210px 0px', transform: room.wardrobeOpen ? 'scaleX(0.12)' : fx[R + ':wardrobeAjar'] ? 'scaleX(0.82)' : 'none', transition: 'transform 500ms ease' }}>
            <rect x={1155} y={230} width={55} height={404} fill="#d39a64" {...S} />
            <rect x={1165} y={250} width={35} height={160} rx={6} fill="none" stroke="#000" strokeOpacity={0.12} strokeWidth={3} />
            <rect x={1165} y={430} width={35} height={180} rx={6} fill="none" stroke="#000" strokeOpacity={0.12} strokeWidth={3} />
            <rect x={1159} y={410} width={5} height={30} rx={2} fill="#e9b949" stroke={OUTLINE} strokeWidth={1.5} />
          </g>
        </g>
      </g>
      <Hot id="plant" label="Plant" hit={{ x: 1110, y: 120, w: 90, h: 100 }}>
        <Plant x={1155} y={218} s={0.48} pot="#e2705c" />
      </Hot>

      {/* ---------- door + switch ---------- */}
      <Hot id="switch" label="Light switch" hit={{ x: 1222, y: 392, w: 36, h: 62 }}>
        <LightSwitch x={1224} y={400} on={room.lightOn} />
      </Hot>
      <Hot id="door" label="Door to Papa's office" hit={{ x: 1272, y: 232, w: 142, h: 210 }}>
        <RoomDoor
          x={1270}
          y={230}
          w={146}
          h={410}
          hinge="right"
          open={!!fx[R + ':doorOpen']}
          color="#c98f5c"
          peekLight="#d5e6c8"
          sign={
            <g transform="translate(1343 300)">
              <rect x={-34} y={-30} width={68} height={50} rx={10} fill="#cfe8ff" {...S} />
              <rect x={-18} y={-16} width={36} height={22} rx={3} fill="#2c3340" stroke={OUTLINE} strokeWidth={2} />
              <rect x={-14} y={-12} width={28} height={14} fill="#bfe8ff" />
              <path d="M -24 10 L 24 10" stroke={OUTLINE} strokeWidth={4} strokeLinecap="round" />
            </g>
          }
        />
      </Hot>

      {/* ---------- ceiling fan ---------- */}
      <Hot id="fan" label="Ceiling fan" hit={{ x: 750, y: 36, w: 200, h: 70 }}>
        <CeilingFan x={850} speed={room.fanSpeed} />
      </Hot>

      {/* ---------- bed ---------- */}
      <Hot id="bed" label="Bed" hit={{ x: 40, y: 380, w: 450, h: 270 }}>
        <g className={fx[R + ':bedBounce'] ? 'squish' : undefined} style={{ transformOrigin: '270px 650px' }}>
          <ellipse cx={270} cy={652} rx={240} ry={10} fill="#000" opacity={0.12} />
          <path d="M 36 650 L 36 400 Q 36 370 66 370 L 84 370 Q 104 370 104 400 L 104 650 Z" fill="#a66d3f" {...S} />
          <path d="M 52 640 L 52 410 Q 52 390 70 390 Q 88 390 88 410 L 88 640 Z" fill="#b97c4b" />
          <rect x={80} y={588} width={410} height={50} rx={8} fill="#a66d3f" {...S} />
          <rect x={466} y={520} width={28} height={130} rx={8} fill="#a66d3f" {...S} />
          <rect x={96} y={636} width={16} height={16} fill="#7d4f2d" {...S} strokeWidth={2} />
          <rect x={450} y={636} width={16} height={16} fill="#7d4f2d" {...S} strokeWidth={2} />
          <path d="M 84 548 Q 84 532 104 532 L 470 532 Q 486 532 486 548 L 486 596 L 84 596 Z" fill="#fffaf3" {...S} />
        </g>
      </Hot>
      <g transform="translate(118 516)">
        <Pillow w={110} h={46} color="#fff1f6" />
      </g>
      <Hot id="pillow" label="Pillow" hit={{ x: 120, y: 494, w: 120, h: 50 }}>
        {pillowHome && (
          <g transform="translate(182 526)">
            <Pillow w={116} h={42} color="#d9ecff" />
          </g>
        )}
      </Hot>

      <KidActor room={R} layer="back" />

      <Hot id="blanket" label="Blanket" hit={{ x: 230, y: 480, w: 250, h: 120 }}>
        <g className={blanketHide ? 'blanket-wiggle' : kidSleeping ? 'blanket-breathe' : undefined} style={{ transformOrigin: '350px 600px' }}>
          {blanketHide ? (
            <path d="M 120 598 Q 110 470 230 462 Q 320 440 400 470 Q 476 486 482 598 Z" fill="#f29e9e" {...S} />
          ) : kidInBed ? (
            <path d="M 232 598 Q 226 486 300 482 Q 400 474 470 500 Q 488 520 486 598 Z" fill="#f29e9e" {...S} />
          ) : (
            <path d="M 300 598 Q 300 540 340 536 L 470 532 Q 488 540 486 598 Z" fill="#f29e9e" {...S} />
          )}
          <g opacity={0.5}>
            <circle cx={360} cy={560} r={8} fill="#fff" />
            <circle cx={420} cy={545} r={6} fill="#fff" />
            <circle cx={440} cy={580} r={8} fill="#fff" />
            {(blanketHide || kidInBed) && <circle cx={300} cy={530} r={7} fill="#fff" />}
          </g>
          <path d={blanketHide || kidInBed ? 'M 236 596 L 484 596' : 'M 302 596 L 484 596'} stroke="#d97b7b" strokeWidth={6} />
        </g>
      </Hot>

      <Hot id="teddy" label="Teddy bear" hit={{ x: 400, y: 440, w: 84, h: 100 }}>
        {teddyHome && (
          <g transform="translate(440 528) scale(0.85)"><g className={fx[R + ':teddyDance'] ? 'teddy-dance' : fx[R + ':teddyWiggle'] ? 'wiggle' : undefined}><Teddy /></g></g>
        )}
      </Hot>

      {/* ---------- bedside table ---------- */}
      <g>
        <rect x={496} y={558} width={92} height={92} rx={6} fill="#c48a56" {...S} />
        <rect x={506} y={574} width={72} height={30} rx={4} fill="#d39a64" stroke={OUTLINE} strokeWidth={2} />
        <circle cx={542} cy={589} r={4} fill="#e9b949" stroke={OUTLINE} strokeWidth={1.5} />
        <rect x={490} y={552} width={104} height={12} rx={4} fill="#d39a64" {...S} />
      </g>
      <Hot id="lamp" label="Bedside lamp" hit={{ x: 496, y: 460, w: 66, h: 94 }}>
        <g>
          <rect x={522} y={510} width={10} height={42} fill="#e9b949" {...S} strokeWidth={2} />
          <ellipse cx={527} cy={552} rx={18} ry={5} fill="#e9b949" {...S} strokeWidth={2} />
          <path d="M 504 512 L 550 512 L 540 468 L 514 468 Z" fill={room.lampOn ? '#fff0b8' : '#f2d3c0'} {...S} />
          {room.lampOn && <ellipse cx={527} cy={512} rx={22} ry={4} fill="#fff9d6" />}
        </g>
      </Hot>
      <Hot id="alarm" label="Alarm clock" hit={{ x: 548, y: 514, w: 44, h: 40 }}>
        <g className={fx[R + ':alarmRing'] ? 'alarm-shake' : undefined} style={{ transformOrigin: '570px 552px' }}>
          <circle cx={560} cy={524} r={6} fill="#e2705c" {...S} strokeWidth={2} />
          <circle cx={580} cy={524} r={6} fill="#e2705c" {...S} strokeWidth={2} />
          <circle cx={570} cy={536} r={15} fill="#e2705c" {...S} />
          <circle cx={570} cy={536} r={10} fill="#fffaf0" />
          <path d="M 570 536 L 570 529 M 570 536 L 575 538" stroke={OUTLINE} strokeWidth={2} strokeLinecap="round" />
          {fx[R + ':alarmRing'] && (
            <g stroke="#e2705c" strokeWidth={3} strokeLinecap="round">
              <path d="M 546 512 l -8 -6 M 594 512 l 8 -6 M 548 540 l -10 0 M 592 540 l 10 0" />
            </g>
          )}
        </g>
      </Hot>

      {/* ---------- Mummy's desk ---------- */}
      <g>
        <ellipse cx={735} cy={652} rx={140} ry={9} fill="#000" opacity={0.12} />
        <rect x={616} y={530} width={14} height={120} fill="#f2e3cf" {...S} />
        <rect x={840} y={530} width={14} height={120} fill="#f2e3cf" {...S} />
        <rect x={630} y={540} width={100} height={46} rx={4} fill="#f6ece0" {...S} strokeWidth={2} />
        <rect x={668} y={558} width={26} height={6} rx={3} fill="#e9b949" stroke={OUTLINE} strokeWidth={1.5} />
        <rect x={606} y={518} width={256} height={16} rx={5} fill="#fff6ea" {...S} />
      </g>
      <Hot id="bottle" label="Water bottle" hit={{ x: 616, y: 456, w: 36, h: 64 }}>
        {!kidHas('bottle') && (
          <g transform="translate(634 518) scale(0.92)">
            <Bottle color="#f29ec0" />
          </g>
        )}
      </Hot>
      <Hot id="mug" label="Tea mug" hit={{ x: 652, y: 478, w: 44, h: 42 }}>
        {mugHome && (
          <g transform="translate(674 518)">
            <Mug />
            <g className="steam">
              <path d="M -4 -36 q -6 -8 0 -16 q 6 -8 0 -16" fill="none" stroke="#fff" strokeWidth={3} opacity={0.8} strokeLinecap="round" />
              <path d="M 6 -34 q -6 -8 0 -16" fill="none" stroke="#fff" strokeWidth={3} opacity={0.7} strokeLinecap="round" />
            </g>
          </g>
        )}
      </Hot>
      <Hot id="laptop" label="Mummy's laptop" hit={{ x: 704, y: 420, w: 120, h: 100 }}>
        <g>
          <path d="M 708 514 L 822 514 L 828 520 L 702 520 Z" fill="#d9c2e8" {...S} />
          <path d="M 712 512 L 810 512 L 816 428 L 728 434 Z" fill="#8f6bb3" {...S} />
          <path d="M 718 506 L 804 506 L 809 436 L 732 441 Z" fill="#f7f3ff" />
          {screen === 'meeting' || screen === 'kidwave' ? (
            <g>
              {[[748, 456, '#ffd9a8', '#e8b48f'], [786, 455, '#a7d3f2', '#8d5a3b'], [748, 488, '#c7e8c2', '#c68a63'], [786, 488, '#f2c2d2', '#f2c9a0']].map(([x, y, bg, sk], i) => (
                <g key={i} className={screen === 'kidwave' ? 'meeting-wave' : undefined} style={{ animationDelay: `${i * 120}ms` }}>
                  <rect x={(x as number) - 17} y={(y as number) - 14} width={34} height={28} fill={bg as string} />
                  <circle cx={x as number} cy={(y as number) - 2} r={7} fill={sk as string} />
                  <rect x={(x as number) - 8} y={(y as number) + 5} width={16} height={8} rx={4} fill="#7b5ea7" />
                </g>
              ))}
            </g>
          ) : (
            <g className="screen-scroll">
              {[0, 1, 2, 3, 4].map((i) => (
                <rect key={i} x={740 - i * 0.5} y={448 + i * 11} width={[56, 44, 60, 36, 50][i]} height={4} rx={2} fill={i === 0 ? '#e2705c' : '#b9aecf'} />
              ))}
            </g>
          )}
          {fx[R + ':teddyDesk'] && (
            <g transform="translate(850 516) scale(0.5)"><g className="pop-in"><Teddy /></g></g>
          )}
          {fx[R + ':duckDesk'] && (
            <g transform="translate(765 508)"><g className="pop-in"><Duck /></g></g>
          )}
        </g>
      </Hot>

      {/* ---------- Mummy ---------- */}
      <g transform={`translate(${MUMMY_SEAT.x} ${MUMMY_SEAT.y}) scale(-1 1)`}>
        <Hot id="mummy" label="Mummy" hit={{ x: -40, y: -250, w: 120, h: 300 }} origin="0px 0px">
          <Mummy />
        </Hot>
      </g>
      {fx[R + ':hearts'] && <Hearts x={900} y={300} />}

      {/* ---------- floor ---------- */}
      <ellipse cx={690} cy={748} rx={250} ry={42} fill="#c9a0d6" {...S} />
      <ellipse cx={690} cy={748} rx={210} ry={30} fill="none" stroke="#fff" strokeWidth={4} strokeDasharray="12 9" opacity={0.7} />

      <Hot id="basket" label="Toy basket" hit={{ x: 330, y: 680, w: 104, h: 110 }}>
        <g>
          {fx[R + ':basketOpen'] && (
            <g>
              <g transform="translate(360 700)"><g className="toy-pop" style={{ animationDelay: '0ms' }}><Blocks /></g></g>
              <g transform="translate(404 700)"><g className="toy-pop" style={{ animationDelay: '120ms' }}><ToyCar /></g></g>
            </g>
          )}
          <path d="M 330 712 L 434 712 L 424 786 L 340 786 Z" fill="#e9b96a" {...S} />
          {[728, 746, 764].map((y) => (
            <path key={y} d={`M 334 ${y} L 430 ${y}`} stroke="#c9913f" strokeWidth={3} />
          ))}
          {[352, 372, 392, 412].map((x) => (
            <path key={x} d={`M ${x} 714 L ${x - 1} 784`} stroke="#c9913f" strokeWidth={2} />
          ))}
          <rect x={326} y={704} width={112} height={12} rx={5} fill="#d9a552" {...S} />
          {!kidHas('duck') && !fx[R + ':duckDesk'] && (
            <g transform="translate(372 696)">
              <Duck />
            </g>
          )}
          <circle cx={412} cy={698} r={12} fill="#5fd4ff" {...S} strokeWidth={2} />
        </g>
      </Hot>
      <Hot id="ball" label="Ball" hit={{ x: 470, y: 736, w: 54, h: 54 }}>
        {ballHome && (
          <g transform="translate(496 764)">
            <ellipse cx={0} cy={20} rx={16} ry={4} fill="#000" opacity={0.15} />
            <Ball r={18} />
          </g>
        )}
      </Hot>
      <Hot id="pouf" label="Pouf" hit={{ x: 790, y: 700, w: 110, h: 70 }}>
        <g>
          <ellipse cx={845} cy={760} rx={54} ry={10} fill="#000" opacity={0.12} />
          <path d="M 793 724 Q 793 704 845 704 Q 897 704 897 724 L 895 752 Q 845 770 795 752 Z" fill="#6fbf9a" {...S} />
          <ellipse cx={845} cy={712} rx={48} ry={10} fill="#8fd4b2" stroke={OUTLINE} strokeWidth={2} />
          <path d="M 810 730 Q 845 742 880 730" stroke="#4f9d7a" strokeWidth={3} fill="none" />
        </g>
      </Hot>

      <Hot id="bubbles" label="Bubble bottle" hit={{ x: BUBBLE_BOTTLE.x - 26, y: BUBBLE_BOTTLE.y - 84, w: 56, h: 88 }}>
        <g transform={`translate(${BUBBLE_BOTTLE.x} ${BUBBLE_BOTTLE.y})`}>
          <ellipse cx={0} cy={0} rx={16} ry={4} fill="#000" opacity={0.15} />
          <BubbleBottle wand={!(kidHere && kid.prop === 'wand')} />
        </g>
      </Hot>

      <Hot id="chest" label="Costume chest" hit={{ x: COSTUME_CHEST.x - 60, y: COSTUME_CHEST.y - 92, w: 120, h: 96 }}>
        <CostumeChest x={COSTUME_CHEST.x} y={COSTUME_CHEST.y} open={!!fx[R + ':chestOpen']} />
      </Hot>
      <Hot id="bowl" label="Biscuit's bowl" hit={{ x: PUP_BOWL.x - 36, y: PUP_BOWL.y - 40, w: 72, h: 46 }}>
        <DogBowl x={PUP_BOWL.x} y={PUP_BOWL.y} full={!!fx[R + ':bowlFull']} />
      </Hot>
      <PupActor room={R} />
      {fx[R + ':pupHearts'] && <Hearts x={useGame.getState().pup.x} y={useGame.getState().pup.y - 110} />}

      <KidActor room={R} layer="front" />

      {fx['hs:cover'] === 'chest' && <g pointerEvents="none"><CostumeChest x={COSTUME_CHEST.x} y={COSTUME_CHEST.y} open={false} /></g>}
      {fx['hs:cover'] === 'basket' && <BasketCover />}
      <HideMarkers room={R} />
      <Bubbles room={R} />
      <Projectile />
      <DiscoLights />
      <LightOverlay id="mr-light" darkness={darkness} period={period} glows={glows} windowRect={{ x: 140, y: 100, w: 260, h: 230 }} curtainsOpen={room.curtainsOpen} />
      <Sparkle />
    </svg>
  );
});

export default MummyRoomScene;
