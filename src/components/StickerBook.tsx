import { useGame, getGame } from '../state/gameStore';
import { AudioManager } from '../engine/AudioManager';
import { OUTLINE } from '../data/characters';
import { Cookie, Cupcake, Dino, Food, Guitar, Heart, Note, Phone, Teddy, ToyCar } from './props';

const S = { stroke: OUTLINE, strokeWidth: 4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** Every secret in the house. Hints are for grown-ups reading along. */
export const STICKERS: { id: string; title: string; hint: string }[] = [
  { id: 'daily-gift', title: 'Surprise gift', hint: 'A new box waits in Papa’s office every day.' },
  { id: 'hidden-dino', title: 'Papa’s old dino', hint: 'Papa’s bookshelf likes lots of taps.' },
  { id: 'family-photo', title: 'Family love', hint: 'Tap Papa’s little photo again and again.' },
  { id: 'funny-tune', title: 'Silly song', hint: 'The guitar has a funny song inside.' },
  { id: 'funny-notification', title: 'Banana message', hint: 'Papa’s phone gets a silly message.' },
  { id: 'kid-laugh', title: 'Giggle fit', hint: 'Tickle yourself lots!' },
  { id: 'both-lights', title: 'Dance party', hint: 'Lights off in both rooms, quickly!' },
  { id: 'twelve-oclock', title: '12 o’clock', hint: 'Tap a clock at exactly 12.' },
  { id: 'teddy-dance', title: 'Dancing teddy', hint: 'Squeeze the teddy while holding it.' },
  { id: 'mirror-wink', title: 'Winking mirror', hint: 'Make lots of faces in the mirror.' },
  { id: 'secret-note', title: 'Secret note', hint: 'Mummy hides something in her books.' },
  { id: 'car-crash', title: 'Monster truck', hint: 'Build a tower, then drive the car.' },
  { id: 'rainbow-bubble', title: 'Rainbow bubble', hint: 'Pop every bubble – one may be magic.' },
  { id: 'pup-tail-chase', title: 'Tail chase', hint: 'Biscuit loves lots of quick pats.' },
  { id: 'snack-papa', title: 'Snack for Papa', hint: 'Make something in the kitchen and take it to Papa.' },
  { id: 'snack-mummy', title: 'Snack for Mummy', hint: 'Mummy would love a snack too.' },
  { id: 'cookie-monster', title: 'Cookie monster', hint: 'The cookie jar likes lots of quick taps.' },
  { id: 'cheese-wink', title: 'Winking cheese', hint: 'Open the fridge again and again.' },
  { id: 'fruit-juggle', title: 'Juggler', hint: 'Tap the fruit bowl 3 times fast.' },
  { id: 'chef-cake', title: 'Chef’s cake', hint: 'Wear the chef hat and try the oven.' },
  { id: 'table-band', title: 'Kitchen band', hint: 'Drum on the kitchen table lots.' },
  { id: 'hide-seek', title: 'Hide-and-seek', hint: 'Press the peeking eyes and hide!' },
  { id: 'giggle-giveaway', title: 'Giggle gave it away', hint: 'Tap yourself while hiding...' },
  { id: 'found-biscuit', title: 'Found Biscuit', hint: 'Press the paw and look for his tail.' },
  { id: 'outfit-cape', title: 'Superhero', hint: 'Look in the costume chest.' },
  { id: 'outfit-crown', title: 'King', hint: 'Look in the costume chest.' },
  { id: 'outfit-pirate', title: 'Pirate', hint: 'Look in the costume chest.' },
  { id: 'outfit-dino', title: 'Dinosaur', hint: 'Look in the costume chest.' },
  { id: 'outfit-chef', title: 'Chef', hint: 'Look in the costume chest.' },
];

function Icon({ id }: { id: string }) {
  switch (id) {
    case 'daily-gift':
      return <g><rect x={-28} y={-14} width={56} height={40} rx={4} fill="#ff6f91" {...S} /><rect x={-32} y={-26} width={64} height={14} rx={4} fill="#ff9fb8" {...S} /><path d="M -6 -26 L -6 26 M 6 -26 L 6 26" stroke="#ffd23f" strokeWidth={6} /><path d="M 0 -26 C -20 -46 -30 -26 0 -26 C 30 -26 20 -46 0 -26 Z" fill="#ffd23f" {...S} strokeWidth={3} /></g>;
    case 'hidden-dino':
      return <g transform="scale(1.4)"><Dino /></g>;
    case 'family-photo':
      return <g><rect x={-30} y={-26} width={60} height={50} rx={4} fill="#e9a23b" {...S} /><rect x={-22} y={-18} width={44} height={34} fill="#bfe3f2" /><g transform="translate(0 0) scale(1.4)"><Heart /></g></g>;
    case 'funny-tune':
      return <g transform="rotate(30) scale(0.42) translate(0 -150)"><Guitar /></g>;
    case 'funny-notification':
      return <g transform="scale(1.3)"><Phone glow /></g>;
    case 'kid-laugh':
      return <g><circle r={30} fill="#d9a179" {...S} /><path d="M -14 -6 q 4 -6 8 0 M 6 -6 q 4 -6 8 0" stroke={OUTLINE} strokeWidth={4} fill="none" strokeLinecap="round" /><path d="M -14 6 Q 0 26 14 6 Z" fill="#c8283a" {...S} strokeWidth={3} /></g>;
    case 'both-lights':
      return <g><line x1={0} y1={-40} x2={0} y2={-22} stroke={OUTLINE} strokeWidth={4} /><circle r={24} fill="#d9dee6" {...S} /><path d="M -24 0 L 24 0 M 0 -24 L 0 24 M -17 -17 L 17 17 M 17 -17 L -17 17" stroke="#9aa6b8" strokeWidth={2} /><circle cx={-8} cy={-8} r={5} fill="#fff" /></g>;
    case 'twelve-oclock':
      return <g><circle r={30} fill="#fffaf2" {...S} /><path d="M 0 0 L 0 -20 M 0 0 L 0 -14" stroke={OUTLINE} strokeWidth={5} strokeLinecap="round" /><circle r={4} fill={OUTLINE} /></g>;
    case 'teddy-dance':
      return <g transform="translate(0 26) scale(0.7)"><Teddy /></g>;
    case 'mirror-wink':
      return <g><ellipse rx={24} ry={32} fill="#cfe8f5" stroke="#e9a23b" strokeWidth={8} /><path d="M -10 -4 q 4 -4 8 0" stroke={OUTLINE} strokeWidth={4} fill="none" strokeLinecap="round" /><circle cx={8} cy={-4} r={4} fill={OUTLINE} /><path d="M -8 10 q 8 8 16 0" stroke={OUTLINE} strokeWidth={4} fill="none" strokeLinecap="round" /></g>;
    case 'secret-note':
      return <g transform="scale(1.4)"><Note /></g>;
    case 'car-crash':
      return <g><rect x={-30} y={-6} width={16} height={16} rx={3} fill="#f2545b" {...S} strokeWidth={3} transform="rotate(-20 -22 2)" /><rect x={-16} y={-30} width={16} height={16} rx={3} fill="#4fb0e8" {...S} strokeWidth={3} transform="rotate(25 -8 -22)" /><g transform="translate(10 12) scale(1.1)"><ToyCar /></g></g>;
    case 'rainbow-bubble':
      return <g><circle r={28} fill="#ffd6f0" opacity={0.8} stroke="#ff9ad5" strokeWidth={4} /><path d="M -16 -6 A 18 18 0 0 1 -4 -18" stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" /><circle cx={10} cy={10} r={5} fill="#c8f0ff" /></g>;
    case 'pup-tail-chase':
      return <g fill="#b5793f" {...S} strokeWidth={3}><ellipse cx={0} cy={10} rx={18} ry={15} /><circle cx={-18} cy={-12} r={8} /><circle cx={-6} cy={-22} r={8} /><circle cx={8} cy={-22} r={8} /><circle cx={20} cy={-12} r={8} /></g>;
    case 'snack-papa':
      return <g><g transform="translate(-8 4) scale(1.6)"><Food item="sandwich" /></g><g transform="translate(22 -22) scale(0.9)"><Heart /></g></g>;
    case 'snack-mummy':
      return <g><g transform="translate(-6 6) scale(1.5)"><Food item="juice" /></g><g transform="translate(22 -22) scale(0.9)"><Heart color="#e2705c" /></g></g>;
    case 'cookie-monster':
      return <g><g transform="translate(-12 6) scale(1.4)"><Cookie /></g><g transform="translate(14 -8) scale(1.2)"><Cookie /></g></g>;
    case 'cheese-wink':
      return <g><path d="M -34 16 L 34 16 L 34 -12 L -34 -24 Z" fill="#ffd23f" {...S} /><circle cx={-14} cy={-6} r={4} fill={OUTLINE} /><path d="M 4 -8 q 5 -5 10 0" stroke={OUTLINE} strokeWidth={4} fill="none" /><path d="M -12 6 q 8 6 16 0" stroke={OUTLINE} strokeWidth={4} fill="none" strokeLinecap="round" /></g>;
    case 'fruit-juggle':
      return <g><circle cx={-20} cy={10} r={13} fill="#e8483f" {...S} /><circle cx={0} cy={-18} r={13} fill="#ff9f43" {...S} /><g transform="translate(20 12) scale(0.8)"><Food item="banana" /></g></g>;
    case 'chef-cake':
      return <g transform="translate(0 6) scale(1.8)"><Cupcake candle /></g>;
    case 'table-band':
      return <g><ellipse cx={0} cy={8} rx={30} ry={14} fill="#e2483f" {...S} /><rect x={-30} y={-6} width={60} height={14} fill="#e2483f" stroke="none" /><ellipse cx={0} cy={-6} rx={30} ry={12} fill="#fff6e0" {...S} /><path d="M -30 -40 L -8 -10 M 30 -40 L 8 -10" stroke="#c48a56" strokeWidth={6} strokeLinecap="round" /></g>;
    case 'hide-seek':
      return <g><path d="M -34 20 Q -34 -24 0 -24 Q 34 -24 34 20 Z" fill="#9fc7e8" {...S} /><ellipse cx={-10} cy={4} rx={7} ry={9} fill="#fff" stroke={OUTLINE} strokeWidth={3} /><ellipse cx={10} cy={4} rx={7} ry={9} fill="#fff" stroke={OUTLINE} strokeWidth={3} /><circle cx={-8} cy={6} r={4} fill={OUTLINE} /><circle cx={12} cy={6} r={4} fill={OUTLINE} /></g>;
    case 'giggle-giveaway':
      return <g><circle r={28} fill="#d9a179" {...S} /><path d="M -14 -4 q 5 -6 10 0 M 4 -4 q 5 -6 10 0" stroke={OUTLINE} strokeWidth={4} fill="none" strokeLinecap="round" /><path d="M -10 8 Q 0 20 10 8" stroke={OUTLINE} strokeWidth={4} fill="#c8283a" /><text x={22} y={-20} fontSize={18} fontWeight={700} fill="#e2705c">hee</text></g>;
    case 'found-biscuit':
      return <g><path d="M -30 24 Q -40 -10 -24 -30" fill="none" stroke={OUTLINE} strokeWidth={13} strokeLinecap="round" /><path d="M -30 24 Q -40 -10 -24 -30" fill="none" stroke="#e8b77a" strokeWidth={8} strokeLinecap="round" /><circle cx={12} cy={0} r={20} fill="#d9f0ff" {...S} /><path d="M 26 14 L 40 28" stroke={OUTLINE} strokeWidth={7} strokeLinecap="round" /></g>;
    case 'outfit-cape':
      return <path d="M -16 -28 Q -40 0 -30 30 Q 0 38 30 30 Q 40 0 16 -28 Q 0 -22 -16 -28 Z" fill="#e2483f" {...S} />;
    case 'outfit-crown':
      return <path d="M -30 18 L -34 -18 L -14 0 L 0 -26 L 14 0 L 34 -18 L 30 18 Z" fill="#ffd23f" {...S} />;
    case 'outfit-pirate':
      return <g><path d="M -40 12 Q -24 2 -20 -14 Q 0 -32 20 -14 Q 24 2 40 12 Q 0 2 -40 12 Z" fill="#2d2d3a" {...S} /><circle cx={0} cy={-8} r={5} fill="#fff" /></g>;
    case 'outfit-dino':
      return <g><ellipse rx={30} ry={28} fill="#6fbf4a" {...S} /><path d="M -22 -18 l 6 -14 l 6 14 M -4 -26 l 6 -14 l 6 14 M 14 -20 l 6 -14 l 6 14" fill="#ff9f43" {...S} strokeWidth={3} /><circle cx={-10} cy={0} r={4} fill={OUTLINE} /><circle cx={10} cy={0} r={4} fill={OUTLINE} /></g>;
    case 'outfit-chef':
      return <g><path d="M -22 14 Q -40 4 -30 -14 Q -26 -30 -10 -26 Q -2 -40 12 -30 Q 28 -34 30 -16 Q 40 0 22 14 Z" fill="#fff" {...S} /><rect x={-22} y={10} width={44} height={14} rx={3} fill="#fff" {...S} /></g>;
    default:
      return <circle r={26} fill="#ffd23f" {...S} />;
  }
}

/** A page of stickers – one for every secret found. No points, just collecting. */
export function StickerBook() {
  const found = useGame((s) => s.discoveredEasterEggs);
  const close = () => getGame().clearFx('ui:stickers');
  const count = STICKERS.filter((s) => found.includes(s.id)).length;
  return (
    <div className="draw-overlay" onPointerDown={(e) => e.stopPropagation()}>
      <div className="sticker-book">
        <div className="sticker-head">
          <h2>My Sticker Book</h2>
          <span className="sticker-count">
            {count} / {STICKERS.length}
          </span>
        </div>
        <div className="sticker-grid">
          {STICKERS.map((s) => {
            const got = found.includes(s.id);
            return (
              <div key={s.id} className={`sticker ${got ? 'got' : 'locked'}`} title={got ? s.title : s.hint}>
                <svg viewBox="-50 -50 100 100" aria-hidden>
                  {got ? <Icon id={s.id} /> : <text y={18} textAnchor="middle" fontSize={52} fontWeight={700} fill="#c9b8a6">?</text>}
                </svg>
                <span>{got ? s.title : s.hint}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="draw-actions">
        <button
          className="pill-btn go-btn"
          onPointerDown={() => {
            AudioManager.play('pageFlip');
            close();
          }}
        >
          Back to play
        </button>
      </div>
    </div>
  );
}
