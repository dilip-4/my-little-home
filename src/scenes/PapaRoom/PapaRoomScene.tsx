import { memo } from 'react';
import { useGame } from '../../state/gameStore';
import { OUTLINE } from '../../data/characters';
import { CAR_HOME, EASEL, GIFT_SPOT, PAPA_SEAT, TOWER_BASE } from '../../data/spots';
import { ArtFrame, Easel, GiftBox } from '../../components/HomeExtras';
import { PupActor } from '../../characters/Pup';
import { HideMarkers } from '../../components/HideSeek';
import { todayKey } from '../../state/gameStore';
import { BlockTower, ToyCarRunner } from '../../components/Toys';
import { InteractiveObject as Hot } from '../../components/InteractiveObject';
import { RoomShell, WindowView, Curtains, CeilingFan, Plant, LightSwitch, Frame, Outlet, FamilyMini } from '../../components/RoomParts';
import { RoomDoor } from '../../components/RoomDoor';
import { WallClock } from '../../components/WallClock';
import { LightOverlay, ambientDarkness } from '../../components/LightOverlay';
import { Projectile, Sparkle, DiscoLights, Hearts } from '../../components/Effects';
import { Ball, Barbell, Bottle, CurlRod, Dino, Dumbbell, Guitar, OfficeMouse, Phone, Robot } from '../../components/props';
import { Papa } from '../../characters/Papa';
import { KidActor } from '../../characters/KidActor';

const S = { stroke: OUTLINE, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const R = 'papa-room';

const Laptop = ({ screen, on }: { screen: string; on: boolean }) => (
  <g>
    <path d="M 990 492 L 1100 492 L 1108 498 L 984 498 Z" fill="#b7bec8" {...S} />
    <path d="M 1000 490 L 1096 490 L 1106 408 L 1020 402 Z" fill="#2c3340" {...S} />
    <path d="M 1006 484 L 1090 484 L 1099 414 L 1024 409 Z" fill={on ? '#eaf6ff' : '#1b2029'} />
    {on && screen === 'meeting' && (
      <g>
        {[[1030, 428, '#f2c9a0'], [1068, 430, '#c68a63'], [1028, 462, '#e8b48f'], [1066, 464, '#8d5a3b']].map(([x, y, c], i) => (
          <g key={i}>
            <rect x={(x as number) - 16} y={(y as number) - 14} width={34} height={28} fill={['#a7d3f2', '#ffd9a8', '#c7e8c2', '#f2c2d2'][i]} />
            <circle cx={x as number} cy={(y as number) - 2} r={7} fill={c as string} />
            <rect x={(x as number) - 8} y={(y as number) + 5} width={16} height={8} rx={4} fill="#6b7fa8" />
          </g>
        ))}
      </g>
    )}
    {on && screen === 'stars' && (
      <g className="screen-party">
        {[[1030, 430, '#ff6f91'], [1060, 450, '#ffd34d'], [1080, 425, '#5fd4ff'], [1040, 466, '#6fe08a'], [1075, 470, '#9b7bff']].map(([x, y, c], i) => (
          <path key={i} transform={`translate(${x} ${y})`} d="M 0 -9 L 3 -3 L 9 -2 L 4 2 L 6 9 L 0 5 L -6 9 L -4 2 L -9 -2 L -3 -3 Z" fill={c as string} />
        ))}
      </g>
    )}
    {on && screen === 'kid' && (
      <g>
        <rect x={1012} y={414} width={80} height={66} fill="#ffe9c7" />
        <circle cx={1052} cy={444} r={16} fill="#d9a179" />
        <path d="M 1036 440 q 16 -22 32 0" fill="#261c18" />
        <path d="M 1045 452 q 7 6 14 0" stroke="#5a3b2a" strokeWidth={2} fill="none" />
        <rect x={1040} y={460} width={24} height={20} rx={6} fill="#f5c343" />
      </g>
    )}
    {on && screen === 'work' && (
      <g className="screen-scroll">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={1030 - i * 0.6} y={420 + i * 10} width={[40, 56, 30, 50, 44, 24][i]} height={4} rx={2} fill={['#5b8def', '#9aa6b8', '#f29e4c', '#9aa6b8', '#5bb98c', '#9aa6b8'][i]} />
        ))}
      </g>
    )}
  </g>
);

export const PapaRoomScene = memo(function PapaRoomScene() {
  const room = useGame((s) => s.papaRoom);
  const period = useGame((s) => s.dayPeriod);
  const fx = useGame((s) => s.fx);
  const papa = useGame((s) => s.characters.papa);
  const kid = useGame((s) => s.kid);
  const kidHere = kid.room === R;
  const kidHas = (p: string) => kidHere && (kid.prop === p || kid.holding === p);

  const laptopScreen = (fx[R + ':laptop'] as string) ?? (papa.activity === 'meeting' ? 'meeting' : 'work');
  const darkness = ambientDarkness(period, room.lightOn, room.curtainsOpen);
  const glows = room.lampOn ? [{ x: 1320, y: 480, r: 260 }] : [];
  const guitarOff = !!fx[R + ':guitarOff'] || kidHas('guitar') || papa.activity === 'guitar';
  const robotOnKeyboard = !!fx[R + ':robotKeyboard'];
  const robotHome = !robotOnKeyboard && !kidHas('robot') && !fx[R + ':robotAway'];
  const ballHome = !fx[R + ':ballAway'] && !kidHas('ball');
  const mouseHome = !fx[R + ':mouseGone'] && !kidHas('mouse');
  const bottleHome = !kidHas('bottle') && papa.activity !== 'drink';
  const phoneHome = papa.activity !== 'phone';
  const ringing = !!fx[R + ':phoneRing'];
  const monitorText = fx[R + ':monitor'] as string | undefined;
  const giftDay = useGame((s) => s.lastGiftDay);
  const giftHere = giftDay !== todayKey() || !!fx[R + ':giftOpen'];

  return (
    <svg className="scene-svg" viewBox="0 0 1440 810" preserveAspectRatio="xMidYMid meet">
      <RoomShell id="pr" wall="#d5e6c8" wallDeep="#bcd5ad" wainscot="#aecb9d" pattern="leaf" patternColor="#c3dbb4" />

      {/* ---------- back wall ---------- */}
      <Hot id="window" label="Window" hit={{ x: 440, y: 120, w: 240, h: 260 }}>
        <WindowView id="pr-win" x={430} y={110} w={260} h={280} period={period} open={room.windowOpen} />
      </Hot>
      <Hot id="curtains" label="Curtains" hit={{ x: 400, y: 90, w: 50, h: 330 }} className="curtain-hit">
        <Curtains x={420} y={100} w={280} h={330} open={room.curtainsOpen} color="#e98c6b" colorDark="#c96a4c" windy={room.windowOpen} />
        <rect x={680} y={90} width={40} height={330} fill="transparent" />
      </Hot>

      <Hot id="painting" label="Painting" hit={{ x: 790, y: 112, w: 150, h: 116 }}>
        <g style={{ transformOrigin: '865px 112px', transform: room.paintingTilted ? 'rotate(-9deg)' : 'none', transition: 'transform 500ms cubic-bezier(.3,1.6,.5,1)' }}>
          <line x1={865} y1={100} x2={800} y2={122} stroke={OUTLINE} strokeWidth={2} />
          <line x1={865} y1={100} x2={930} y2={122} stroke={OUTLINE} strokeWidth={2} />
          <circle cx={865} cy={100} r={4} fill={OUTLINE} />
          <Frame x={795} y={118} w={140} h={106} color="#3f6f8f">
            <rect width={116} height={82} fill="#ffe7b8" />
            <circle cx={84} cy={24} r={14} fill="#ffb347" />
            <path d="M 0 82 L 30 40 L 56 70 L 78 48 L 116 82 Z" fill="#5f9e6e" />
            <path d="M 18 58 L 30 40 L 42 56 Z" fill="#fff" />
          </Frame>
        </g>
      </Hot>

      <Hot id="artwall" label="My drawing" hit={{ x: 970, y: 112, w: 150, h: 118 }}>
        <ArtFrame x={978} y={126} w={134} h={98} glow={!!fx[R + ':artGlow']} />
      </Hot>

      <Hot id="clock" label="Wall clock" hit={{ x: 1150, y: 92, w: 120, h: 118 }}>
        <WallClock x={1210} y={150} r={46} cuckoo={!!fx.cuckoo} />
      </Hot>

      <Hot id="guitar" label="Guitar" hit={{ x: 720, y: 140, w: 84, h: 306 }}>
        <g>
          <path d="M 754 140 L 766 140 L 766 152 L 754 152 Z" fill="#8a5a33" {...S} />
          {!guitarOff && (
            <g className={fx[R + ':guitarWiggle'] ? 'wiggle' : undefined} style={{ transformOrigin: '760px 150px' }}>
              <g transform="translate(760 330) scale(0.95)">
                <Guitar />
              </g>
            </g>
          )}
        </g>
      </Hot>

      <Hot id="switch" label="Light switch" hit={{ x: 205, y: 392, w: 40, h: 62 }}>
        <LightSwitch x={210} y={400} on={room.lightOn} />
      </Hot>
      <Outlet x={958} y={584} />
      <path d="M 971 600 Q 978 560 1000 520 L 1010 498" fill="none" stroke="#3b3f46" strokeWidth={4} />

      {/* ---------- door ---------- */}
      <Hot id="door" label="Door to Mummy's room" hit={{ x: 44, y: 232, w: 142, h: 210 }}>
        <RoomDoor
          x={40}
          y={230}
          w={150}
          h={410}
          hinge="left"
          open={!!fx[R + ':doorOpen']}
          color="#c98f5c"
          peekLight="#f7d9cb"
          sign={
            <g transform="translate(115 300)">
              <path d="M 0 -26 C -30 -50 -50 -10 0 20 C 50 -10 30 -50 0 -26 Z" fill="#ffb3c1" {...S} />
              <circle cx={0} cy={-8} r={11} fill="#d49a72" stroke={OUTLINE} strokeWidth={2} />
              <path d="M -12 -10 q 12 -18 24 0" fill="#231a18" />
              <circle cx={0} cy={-13} r={1.8} fill="#c8283a" />
            </g>
          }
        />
      </Hot>
      <Hot id="hanger" label="Door sign" hit={{ x: 150, y: 440, w: 52, h: 96 }}>
        <g className={fx[R + ':knock'] ? 'swing' : 'swing-idle'} style={{ transformOrigin: '170px 444px', opacity: fx[R + ':doorOpen'] ? 0 : 1, transition: 'opacity 200ms' }}>
          <path d="M 162 450 Q 170 440 178 450" fill="none" {...S} />
          <rect x={150} y={450} width={42} height={74} rx={8} fill="#fff4c9" {...S} />
          <circle cx={171} cy={473} r={10} fill="#c68a63" stroke={OUTLINE} strokeWidth={2} />
          <rect x={163} y={470} width={16} height={6} rx={2} fill="none" stroke={OUTLINE} strokeWidth={2} />
          <path d="M 160 500 L 182 500 M 160 510 L 176 510" stroke="#d9665b" strokeWidth={4} strokeLinecap="round" />
        </g>
      </Hot>

      <Hot id="easel" label="Drawing easel" hit={{ x: EASEL.x - 34, y: EASEL.y - 124, w: 68, h: 150 }}>
        <Easel x={EASEL.x} y={EASEL.y} />
      </Hot>

      {/* ---------- bookshelf ---------- */}
      <Hot id="bookshelf" label="Bookshelf" hit={{ x: 252, y: 300, w: 150, h: 340 }}>
        <g>
          <rect x={250} y={300} width={150} height={340} rx={6} fill="#a66d3f" {...S} />
          <rect x={262} y={312} width={126} height={318} fill="#7d4f2d" />
          {[392, 472, 552].map((y) => (
            <rect key={y} x={258} y={y} width={134} height={10} fill="#b97c4b" {...S} strokeWidth={2} />
          ))}
          <g className={fx[R + ':booksWiggle'] ? 'books-wiggle' : undefined}>
            {[
              [268, 340, 18, 52, '#e45b5b'], [288, 334, 16, 58, '#4f9d69'], [306, 344, 22, 48, '#f2b640'], [330, 330, 14, 62, '#5b8def'], [346, 340, 18, 52, '#9b7bff'],
              [268, 418, 24, 54, '#f29e4c'], [294, 412, 14, 60, '#e45b5b'], [310, 420, 18, 52, '#4fb0e8'], [354, 426, 30, 46, '#6fe08a'],
              [268, 500, 18, 52, '#5b8def'], [288, 494, 22, 58, '#f2b640'], [312, 506, 14, 46, '#e45b5b'], [330, 498, 20, 54, '#4f9d69'],
            ].map(([x, y, w, h, c], i) =>
              fx[R + ':bookOut'] && i === 3 ? null : <rect key={i} x={x as number} y={y as number} width={w as number} height={h as number} rx={2} fill={c as string} stroke={OUTLINE} strokeWidth={2} />,
            )}
          </g>
          {/* gym towel + trophy */}
          <path d="M 340 590 l 10 -30 l 10 30 Z" fill="#f2c34c" {...S} strokeWidth={2} />
          <rect x={336} y={588} width={28} height={8} fill="#c98a1c" stroke={OUTLINE} strokeWidth={2} />
          <rect x={272} y={572} width={50} height={52} rx={6} fill="#5bb0c9" {...S} strokeWidth={2} />
          {fx[R + ':dino'] && (
            <g transform="translate(372 438)"><g className="pop-in"><Dino /></g></g>
          )}
        </g>
      </Hot>
      <Hot id="photo" label="Family photo" hit={{ x: 282, y: 232, w: 92, h: 70 }}>
        <g className={fx[R + ':photoZoom'] ? 'photo-zoom' : undefined} style={{ transformOrigin: '326px 266px' }}>
          <Frame x={284} y={234} w={86} h={66} color="#e9a23b">
            <FamilyMini w={62} h={42} beach />
          </Frame>
        </g>
      </Hot>

      <KidActor room={R} layer="back" />
      {/* ---------- sofa ---------- */}
      <Hot id="sofa" label="Sofa" hit={{ x: 412, y: 470, w: 306, h: 178 }}>
        <g className={fx[R + ':sofaSquish'] ? 'squish' : undefined} style={{ transformOrigin: '565px 650px' }}>
          <ellipse cx={565} cy={652} rx={170} ry={10} fill="#000" opacity={0.12} />
          <rect x={420} y={474} width={290} height={120} rx={36} fill="#e3a43f" {...S} />
          <rect x={436} y={488} width={124} height={86} rx={24} fill="#eeb655" stroke="#c9892a" strokeWidth={3} />
          <rect x={570} y={488} width={124} height={86} rx={24} fill="#eeb655" stroke="#c9892a" strokeWidth={3} />
          <rect x={418} y={560} width={296} height={62} rx={22} fill="#e3a43f" {...S} />
          <rect x={404} y={520} width={44} height={104} rx={20} fill="#d4952f" {...S} />
          <rect x={682} y={520} width={44} height={104} rx={20} fill="#d4952f" {...S} />
          <path d="M 456 596 Q 500 606 560 596 M 570 596 Q 620 606 680 596" stroke="#c9892a" strokeWidth={3} fill="none" />
          <rect x={436} y={620} width={14} height={24} rx={3} fill="#7d4f2d" {...S} strokeWidth={2} />
          <rect x={680} y={620} width={14} height={24} rx={3} fill="#7d4f2d" {...S} strokeWidth={2} />
          <rect x={600} y={514} width={70} height={52} rx={12} fill="#5bb0c9" {...S} transform="rotate(-10 635 540)" />
          <path d="M 616 530 l 36 20 M 652 526 l -32 24" stroke="#fff" strokeWidth={3} opacity={0.5} transform="rotate(-10 635 540)" />
        </g>
      </Hot>

      {/* ---------- ceiling fan ---------- */}
      <Hot id="fan" label="Ceiling fan" hit={{ x: 600, y: 36, w: 200, h: 70 }}>
        <CeilingFan x={700} speed={room.fanSpeed} />
      </Hot>

      {/* ---------- desk ---------- */}
      <g>
        <ellipse cx={1190} cy={652} rx={230} ry={10} fill="#000" opacity={0.12} />
        <rect x={980} y={510} width={16} height={140} fill="#8d5a36" {...S} />
        <rect x={1250} y={508} width={152} height={142} rx={4} fill="#a66d3f" {...S} />
        {[522, 564, 606].map((y) => (
          <g key={y}>
            <rect x={1262} y={y} width={128} height={34} rx={4} fill="#b97c4b" stroke={OUTLINE} strokeWidth={2} />
            <rect x={1310} y={y + 14} width={32} height={6} rx={3} fill="#f0c44c" stroke={OUTLINE} strokeWidth={1.5} />
          </g>
        ))}
        <rect x={972} y={494} width={438} height={18} rx={5} fill="#c48a56" {...S} />
      </g>

      {/* monitor */}
      <g>
        <rect x={1200} y={460} width={14} height={34} fill="#5a6070" {...S} />
        <rect x={1180} y={488} width={54} height={8} rx={3} fill="#5a6070" {...S} />
        <rect x={1132} y={332} width={150} height={130} rx={8} fill="#2c3340" {...S} />
        <rect x={1142} y={342} width={130} height={110} rx={3} fill={room.laptopOn ? '#f4fbff' : '#1b2029'} />
        {monitorText ? (
          <text x={1150} y={400} fontSize={20} fontWeight={700} fill="#3c7fae" className="type-in">{monitorText}</text>
        ) : (
          <g className="screen-scroll">
            <rect x={1150} y={352} width={114} height={16} rx={3} fill="#cfe3f7" />
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={1150} y={376 + i * 14} width={[90, 110, 70, 100, 60][i]} height={6} rx={3} fill={i % 2 ? '#c9d2df' : '#9fb4cc'} />
            ))}
            <rect x={1232} y={410} width={30} height={34} rx={3} fill="#ffd9a8" />
          </g>
        )}
      </g>

      {/* desk lamp */}
      <Hot id="lamp" label="Desk lamp" hit={{ x: 1316, y: 380, w: 96, h: 116 }}>
        <g>
          {room.lampOn && <polygon points="1338,424 1296,496 1408,496 1366,420" fill="#ffe9a0" opacity={0.35} pointerEvents="none" />}
          <ellipse cx={1384} cy={492} rx={24} ry={7} fill="#3c7fae" {...S} />
          <path d="M 1384 488 L 1392 432 L 1352 400" fill="none" stroke={OUTLINE} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 1384 488 L 1392 432 L 1352 400" fill="none" stroke="#5a96c4" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={1392} cy={432} r={6} fill="#3c7fae" {...S} strokeWidth={2} />
          <path d="M 1330 392 L 1366 396 L 1376 426 L 1320 428 Z" fill="#3c7fae" {...S} />
          <ellipse cx={1348} cy={427} rx={14} ry={5} fill={room.lampOn ? '#fff3b0' : '#8a8f99'} />
        </g>
      </Hot>

      <Hot id="bottle" label="Water bottle" hit={{ x: 1306, y: 436, w: 34, h: 60 }}>
        {bottleHome && (
          <g transform="translate(1322 494) scale(0.9)">
            <Bottle />
          </g>
        )}
      </Hot>

      <Hot id="keyboard" label="Keyboard" hit={{ x: 1146, y: 480, w: 126, h: 22 }}>
        <g>
          <path d="M 1148 492 L 1268 492 L 1274 500 L 1142 500 Z" fill="#e9ecf1" {...S} strokeWidth={2.5} />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <rect key={i} x={1152 + i * 11.5} y={493} width={8} height={4} rx={1} fill="#b9c0cc" className={fx[R + ':keys'] ? 'key-press' : undefined} style={{ animationDelay: `${i * 40}ms` }} />
          ))}
          {robotOnKeyboard && (
            <g transform="translate(1210 486) scale(0.75)"><g className="robot-dance"><Robot /></g></g>
          )}
        </g>
      </Hot>

      <Hot id="mouse" label="Computer mouse" hit={{ x: 1278, y: 474, w: 36, h: 26 }}>
        <g>
          <rect x={1276} y={494} width={40} height={4} rx={2} fill="#3c7fae" />
          {mouseHome && (
            <g transform="translate(1296 488)">
              <OfficeMouse />
            </g>
          )}
        </g>
      </Hot>

      <Hot id="phone" label="Mobile phone" hit={{ x: 1110, y: 440, w: 40, h: 56 }}>
        <g>
          <path d="M 1116 494 L 1144 494 L 1138 470 L 1122 470 Z" fill="#5a6070" {...S} strokeWidth={2} />
          {phoneHome && (
            <g transform="translate(1130 470) rotate(-8)"><g className={ringing ? 'phone-ring' : undefined}>
              <Phone glow={ringing || !!fx[R + ':phoneFunny']} />
              {fx[R + ':phoneFunny'] && (
                <g transform="translate(0 -46)"><g className="pop-in">
                  <rect x={-50} y={-16} width={100} height={28} rx={10} fill="#fff" {...S} strokeWidth={2} />
                  <path d="M -38 -2 q 8 -10 16 0 q -8 10 -16 0 Z" fill="#ffd34d" stroke={OUTLINE} strokeWidth={1.5} />
                  <text x={-16} y={4} fontSize={12} fontWeight={700} fill="#5a3b2a">ready!</text>
                </g></g>
              )}
            </g></g>
          )}
        </g>
      </Hot>

      <Hot id="laptop" label="Laptop" hit={{ x: 990, y: 400, w: 118, h: 98 }}>
        <Laptop screen={laptopScreen} on={room.laptopOn} />
      </Hot>

      {/* ---------- Papa ---------- */}
      <Hot id="chair" label="Office chair" hit={{ x: 826, y: 384, w: 46, h: 276 }}>
        <rect x={826} y={384} width={46} height={276} fill="transparent" />
      </Hot>
      <g transform={`translate(${PAPA_SEAT.x} ${PAPA_SEAT.y})`}>
        <Hot id="papa" label="Papa" hit={{ x: -40, y: -250, w: 120, h: 300 }} origin="0px 0px">
          <Papa />
        </Hot>
      </g>
      {fx[R + ':papaHearts'] && <Hearts x={930} y={300} />}

      {/* ---------- floor things ---------- */}
      <path d="M 300 712 L 900 712 L 930 790 L 270 790 Z" fill="#7aa6c2" {...S} />
      <path d="M 320 722 L 882 722 L 906 780 L 294 780 Z" fill="none" stroke="#f3ead6" strokeWidth={4} strokeDasharray="10 8" />
      <path d="M 1000 752 L 1190 752 L 1204 792 L 990 792 Z" fill="#5c6bc0" {...S} />

      <Hot id="barbell" label="Barbell" hit={{ x: 245, y: 755, w: 170, h: 52 }}>
        {!kidHas('barbell') && (
          <g transform="translate(330 782)">
            <Barbell />
          </g>
        )}
      </Hot>
      <Hot id="dumbbell" label="Dumbbells" hit={{ x: 1004, y: 750, w: 96, h: 44 }}>
        <g>
          <g transform="translate(1030 776) scale(0.9)">
            <Dumbbell />
          </g>
          {!kidHas('dumbbell') && (
            <g transform="translate(1072 780) scale(0.9)">
              <Dumbbell />
            </g>
          )}
        </g>
      </Hot>
      <Hot id="curl" label="Curl bar" hit={{ x: 1088, y: 756, w: 108, h: 40 }}>
        {!kidHas('curl') && (
          <g transform="translate(1145 780)">
            <CurlRod w={100} />
          </g>
        )}
      </Hot>
      <Hot id="robot" label="Toy robot" hit={{ x: 428, y: 694, w: 66, h: 84 }}>
        {robotHome && (
          <g transform="translate(460 756)"><g className="idle-bob"><Robot /></g></g>
        )}
      </Hot>
      <Hot id="ball" label="Ball" hit={{ x: 664, y: 728, w: 56, h: 56 }}>
        {ballHome && (
          <g transform="translate(692 758)">
            <ellipse cx={0} cy={22} rx={18} ry={4} fill="#000" opacity={0.15} />
            <Ball r={20} />
          </g>
        )}
      </Hot>

      <Hot id="blocks" label="Building blocks" hit={{ x: TOWER_BASE.x - 66, y: 700, w: 140, h: 100 }}>
        <BlockTower room={R} x={TOWER_BASE.x} y={TOWER_BASE.y} />
      </Hot>
      <Hot id="car" label="Toy car" hit={{ x: CAR_HOME.x - 34, y: CAR_HOME.y - 34, w: 68, h: 52 }}>
        <rect x={CAR_HOME.x - 34} y={CAR_HOME.y - 34} width={68} height={52} fill="transparent" />
      </Hot>
      <ToyCarRunner room={R} homeX={CAR_HOME.x} y={CAR_HOME.y - 6} />

      {giftHere && (
        <Hot id="gift" label="Surprise gift" hit={{ x: GIFT_SPOT.x - 42, y: GIFT_SPOT.y - 96, w: 84, h: 100 }}>
          <GiftBox x={GIFT_SPOT.x} y={GIFT_SPOT.y} open={!!fx[R + ':giftOpen']} />
        </Hot>
      )}
      <PupActor room={R} />
      {fx[R + ':pupHearts'] && <Hearts x={useGame.getState().pup.x} y={useGame.getState().pup.y - 110} />}

      <KidActor room={R} layer="front" />

      <Hot id="plant" label="Plant" hit={{ x: 1340, y: 600, w: 100, h: 205 }}>
        <Plant x={1392} y={800} s={0.95} pot="#5c8fb8" />
      </Hot>

      <HideMarkers room={R} />
      <Projectile />
      <DiscoLights />
      <LightOverlay id="pr-light" darkness={darkness} period={period} glows={glows} windowRect={{ x: 430, y: 110, w: 260, h: 280 }} curtainsOpen={room.curtainsOpen} />
      <Sparkle />
    </svg>
  );
});

export default PapaRoomScene;
