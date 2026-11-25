# My Little Home

**A Little World. A Lot of Mischief.**

A cozy, click-and-tap browser game for children aged about 3–7. A little boy (Atharv) lives in a
house with Papa, who works from his home office, and Mummy, who works at a desk beside her bed.
Explore two connected rooms, poke at everyday things, play gentle pranks, and watch Papa and
Mummy react.

There are no levels, timers, scores, ads, accounts or tracking. The fun comes from
**explore → discover → interact → see the reaction → try something else**.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Type-check (`tsc -b`), then a production build into `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm test` | Unit tests (Vitest): the three-tap state machine, time/day-period, cooldowns, the interaction manager's locking and the catalogue sanity checks |

Useful URLs:

* `/?fresh` clears saved preferences and room state, then starts clean.
* `/#sheet` shows the **character reference sheet**: Papa, Mummy and the kid in their poses and expressions, with their colour palettes.

## Deploying to Vercel (or any static host)

The game is a static site with no backend, database or API keys.

1. Push the project to a Git repository.
2. On vercel.com, choose **Add New → Project** and import the repository.
3. Vercel picks up the Vite settings automatically (`vercel.json` also pins them):
   build command `npm run build`, output directory `dist`.
4. Click **Deploy**.

Or from the CLI: `npx vercel --prod`.

Any other static host works the same way: run `npm run build` and upload `dist/`.

---

## Project structure

```
src/
  app/            App.tsx, GameShell.tsx (scaling, HUD, lifecycle), Intro.tsx, CharacterSheet.tsx, registry.ts
  scenes/
    PapaRoom/     PapaRoomScene.tsx (layered SVG room), interactions.ts (its catalogue)
    MummyRoom/    MummyRoomScene.tsx (lazy-loaded), interactions.ts
    shared.ts     reusable definitions (lights, curtains, window, fan, clock, ball, kid taps…)
  characters/     parts.tsx (limb rig + shared Face), Kid.tsx, KidActor.tsx, SeatedAdult.tsx, Papa.tsx, Mummy.tsx
  components/     InteractiveObject (hotspot), DialogueBubble, WallClock, RoomDoor, RoomParts
                  (shell, window, curtains, fan, plant…), LightOverlay, Effects (projectiles, sparkles,
                  hearts, party lights), SoundControl, props.tsx (all small object art)
  engine/         InteractionManager, DialogueManager, AudioManager, RoomManager, IdleDirector,
                  EventManager, papaTapMachine, cooldowns, clock, time, random (+ engine.test.ts)
  state/          gameTypes.ts (typed state), gameStore.ts (Zustand store + persistence)
  data/           characters.ts (reference sheet), dialogues.ts, spots.ts (scene coordinates)
  styles/         global.css, scenes.css, animations.css
```

### How it works

* **Rendering.** Each room is one 1440×810 SVG built from independent, reusable layers: wall
  shell, window (sky reflects the real time of day), curtains, furniture, props, characters,
  effects and a lighting overlay. Every object is its own `<InteractiveObject>` with a large hit
  area (at least 44 px), a hover glow, a bounce on tap and double-tap protection. The stage keeps
  its aspect ratio and scales to any screen.
* **Characters.** Papa and Mummy share one seated rig (`SeatedAdult`) that is mirrored for Mummy.
  The kid has his own standing rig. Limbs are two-segment joints animated with CSS transitions, and
  faces come from one shared `Face` component with 16 expressions. Colours and proportions live
  in `data/characters.ts`, so the characters look the same everywhere.
* **Interaction pipeline.** A tap calls `InteractionManager.trigger(id)`, which:
  1. finds the matching definitions. Contextual ones win, for example "holding a toy" or "Papa is
     in a meeting"; otherwise plain variants rotate.
  2. checks cooldowns and **locks**: every definition declares the characters it `uses` and a
     `priority`. A lesser interaction can never cancel a more important one (a laptop tap won't
     erase Papa's reaction to a ball), while a re-tap on the same object restarts it.
  3. emits the unique event id (`BALL_THROWN_AT_PAPA`, `GUITAR_PLAYED`…) on the `EventBus`.
  4. runs the script: walk, animate, speak, play sound, update state.
  5. always cleans up (abort-safe timers), so no character can get stuck.

  New objects are added through configuration: append an `InteractionDefinition` to a room's
  `interactions.ts` and wrap the art in `<InteractiveObject id="…">`.
* **Papa's three-tap dialogue** is a pure timestamp finite-state machine
  (`engine/papaTapMachine.ts`, unit-tested). Animation timing can't affect it, and taps on other
  objects never advance it.
* **Dialogue.** All lines are in `data/dialogues.ts`. There is one bubble per character, with
  priorities, a small queue and automatic dismissal (or tap to dismiss), and the same line never
  plays twice in a row.
* **Idle life.** `IdleDirector` starts priority-0 activities at controlled random intervals: Papa
  stretches, drinks water, checks his phone or joins a video meeting; Mummy sips tea, reads, rests
  her eyes or joins a meeting; the kid yawns, giggles or dances. Any player action cancels them,
  and they never start while a character is busy.
* **Time.** The real device clock updates every second. Day periods are morning 6–11,
  afternoon 11–16, evening 16–19 and night 19–6. They change the sky, sun or moon, stars, the
  sunbeam and the room's ambient light. Lamps cut warm pools out of the darkness.
* **Audio.** Every sound is synthesised with the Web Audio API: a Karplus–Strong plucked guitar,
  chimes, a phone ring, boings and more. There are no audio files and no copyrighted music. Audio
  starts only after the first tap. Repeats of the same sound are rate-limited, simultaneous voices
  are capped, a compressor keeps the volume gentle, and the mute setting is remembered.
* **Persistence.** `localStorage` keeps the sound setting, the durable room state (lamps,
  curtains, window, fan, wardrobe, painting, alarm tone) and discovered easter eggs. The main
  ceiling lights always start on, so a new session never opens on a dark room. Dialogue,
  animations and the kid's position are never saved, so every session starts with Papa working
  and the kid asleep. Switching rooms keeps everything exactly as you left it.
* **Performance.** About 92 kB of gzipped JavaScript plus fonts, with no images. The second room is
  lazy-loaded and preloaded in the background. Animations pause and audio suspends while the tab
  is hidden. The clock lives in its own tiny store so its ticks don't re-render the world.

---

## Completed interactions

Seventy interaction definitions are in place; 64 of them are things the player can trigger
(the rest are idle activities). Each one produces a visible and/or audible result.

### Papa's office
| # | Object | What happens |
|---|---|---|
| 1 | Papa | **Three-tap dialogue.** Tap 1: he looks back, annoyed: *"I'm working, beta. Please don't disturb me."* Tap 2 (within 5 s): more irritated: *"What happened now?"* Tap 3 (within 5 s): he turns around fully: *"Okay, tell me. What do you want?"* The kid then asks for a hug (*"Come here, my little champion!"*, with hearts) or to play (high five). Waiting longer than 5 s resets it. |
| 2 | Papa + carried toy | He stops working and plays briefly |
| 3 | Laptop | The screen fills with stars and Papa complains. During his video meeting the kid waves into the camera instead. |
| 4 | Desk lamp | On/off, with a warm light pool |
| 5 | Wall switch | Lights off: Papa stops and looks around: *"Who switched off the lights?"* Lights on: *"Ah, much better."* |
| 6 | Guitar | The kid strums an original riff and Papa reacts: *"Who's playing music during my work?"* The 3rd tap: Papa plays it himself. |
| 7 | Dumbbells | The kid strains, then lifts one: *"I'm super strong!"* |
| 8 | Barbell | The kid can't budge it and plops down. Papa laughs. |
| 9 | EZ curl bar | Three counted bicep curls and *"Look, muscles!"* |
| 10–12 | Sofa (rotates) | Bouncing on the cushions · pretending to sleep (Papa checks on him, the kid opens one eye) · **hiding behind the sofa** (*"Where did my little monkey go?"*, then *"Boo!"*) |
| 13 | Office chair | The kid spins Papa's chair. Papa ends up dizzy: *"Hey! That's my chair!"* |
| 14 | Keyboard | Typing sounds and gibberish on the monitor (*"you just typed jjjjkkkk to my boss!"*). With a toy in hand, the toy goes on the keyboard and Papa discovers it. |
| 15 | Mouse | The kid hides it. Papa searches (*"Where did my mouse go?"*), then the kid gives it back. |
| 16 | Water bottle | The kid drinks (gulps) |
| 17 | Family photo | The photo pops forward and Papa shares a warm memory |
| 18 | Bookshelf | Books wobble and one tumbles safely onto the rug |
| 19 | Curtains | Open / close |
| 20 | Window | Opens (curtains flutter); birds chirp by day, crickets at night |
| 21 | Wall clock | A cuckoo pops out and the kid announces the real time |
| 22 | Phone | It rings and vibrates. Papa answers: *"Hello? …Nobody's there!"* |
| 23 | Door | Through to Mummy's room |
| 24 | Ball | Thrown in an arc, it bonks Papa: *"Hey! What was that?"* |
| 25 | Toy robot | The kid picks it up (bring it to Papa, or put it on his keyboard) |
| 26 | "Meeting" door sign | **Knock and hide.** Knocking, then the kid ducks; Papa looks at the door. |
| 27 | Plant | The kid hides and goes *"Moooo!"*: *"Was that… a cow?"* |
| 28 | Ceiling fan | Off / slow / fast, with a quiet whoosh |
| 29 | Painting | Tilts crooked / straightens |
| 30 | Kid | Sneaks behind Papa to make funny faces, and gets caught |

### Mummy's bedroom & workspace
| # | Object | What happens |
|---|---|---|
| 31 | Bed | **Wake-up sequence** while the kid sleeps: yawn, sit up, *"Good morning!"*, hop down. Mummy: *"Good morning, sleepyhead!"* Once awake, the kid **jumps on the bed** (it squishes) and Mummy objects. |
| 32 | Pillow | **Pillow fight**: the kid throws it at Mummy, and she throws it back |
| 33–34 | Blanket | Hide under it (*"Why is the blanket giggling?"*) · pretend to sleep when Mummy looks. While the kid is asleep, he mumbles in his sleep instead. |
| 35–39 | Mummy | Talk · ask her to play · hug · sneak up for a surprise hug · wake her when she's resting her eyes · interrupt her video meeting |
| 40 | Mummy + teddy | She cuddles the teddy and hearts float up |
| 41 | Mummy + toy | A quick game together |
| 42 | Laptop | She reacts to the interruption. Carrying the teddy puts **teddy on her desk**; carrying the duck puts the toy on the laptop; during a meeting the kid waves to her colleagues. |
| 43 | Tea mug | *"That's my tea, mister!"* and she rescues it |
| 44 | Bedside lamp | On/off |
| 45 | Wall switch | Lights off: *"Hey! Who turned off the lights?"* |
| 46 | Wardrobe | Opens. Tap again and the kid hides inside (the door stays ajar); Mummy searches, then he pops out. |
| 47 | Mirror | Funny faces, reflected live in the mirror |
| 48 | Hairbrush | Combs his hair flat, then the tuft springs back up |
| 49 | Handbag | A different surprise each time: sunglasses (he wears them), a lollipop, keys, a love note |
| 50 | Teddy | Picked up and hugged (squeak) |
| 51 | Alarm clock | A new alarm sound each tap (bell, birds, rooster, trumpet). It wakes the sleeping kid. |
| 52 | Toy basket | Toys pop out and the kid grabs the rubber duck |
| 53 | Book shelf | A storybook drops into his hands and opens |
| 54 | Water bottle | The kid drinks |
| 55 | Photos | A memory from his first birthday |
| 56 | Pouf | He sits beside Mummy and "works" too |
| 57 | Ball | Mummy **catches** it and throws it back |
| 58–63 | Curtains, window, wall clock, plant (*"Meow!"*), fan, door | Same behaviour as in Papa's office, with Mummy's own lines |
| 64 | Kid | Funny faces behind Mummy (she catches him) |

### Combinations (object + target)
Ball + Papa, Ball + Mummy, Guitar + Papa (3rd tap), Teddy + Mummy, Toy + Laptop (both rooms),
Pillow + Parent, Blanket + Kid, Water bottle + Kid, Chair + Kid, Dumbbell + Kid. Carried toys
(robot, duck, teddy) stay in the kid's hands until you tap a parent, a laptop or keyboard. If you
don't, after about 9 seconds he plays with the toy and puts it back.

### Mischief collection
Lights off (both rooms), ball at Papa, ball at Mummy, knock and hide, hide behind the sofa, toy on
the keyboard, ring the phone, loud guitar, spin the chair, pillow fight, hide under the blanket,
funny faces behind Papa, funny faces behind Mummy, jump on the bed, hide the mouse, teddy on
Mummy's desk, animal noises from behind the plant, interrupt a meeting (either parent), surprise
hug. Each one cools down and then returns everyone to their normal activity.

### Hidden surprises (not hinted at in the game)
1. Tap Papa's family photo 4 times quickly: a special message and hearts.
2. Tap the guitar 5 times: a silly tune and a dance.
3. Tap a wall clock at exactly 12:00: a special chime.
4. Squeeze the teddy 4 times while carrying it: Mr. Fluff dances.
5. Tap Papa's bookshelf 5 times: his old toy dinosaur appears.
6. Tap Papa's phone 4 times: a funny notification.
7. Flick the light switches in **both** rooms within 15 seconds: a gentle dance party.
8. Tap the kid 5 times quickly: a giggle fit.
9. Tap Mummy's books 4 times: her secret love note.
10. Make 5 faces in the mirror: the reflection winks back.
11. Build a block tower (3+ blocks) and then wind up the toy car: monster-truck crash.
12. Blow bubbles: sometimes one is a rainbow bubble. Pop it for magic.

### The kitchen (third room)
Reach it with the new **room buttons** at the top of the screen (office, bedroom, kitchen). Its
door leads back to Papa's office. It is the kid's own room: no parent works there, but Biscuit
follows him in.
* **Fridge:** take a juice box, or peek inside ("Brrr!"). The kid's newest drawing is stuck on the
  fridge door with magnets.
* **Cookie jar:** sneak a cookie ("Shhh... just one").
* **Fruit bowl:** take a banana.
* **Sandwich board:** each tap adds a layer (bread, cheese, tomato, lettuce, bread), then the kid
  picks it up.
* **Microwave:** popcorn pops, then *ding!*
* **Sink:** wash hands and pop the soap bubbles.
* **Table:** drum on it, or eat a snack there while Biscuit begs.
* **Oven:** wearing the **chef hat** from the costume chest, the kid bakes a cake that appears on
  the table with candles. Without the hat he says he needs it first.
* **Take snacks to Papa or Mummy:** carry any snack to their room and tap them. They stop, eat it,
  and react ("A cookie? Shh, don't tell Mummy!"). Tap Biscuit while holding food and he sits pretty
  for his own dog treat. If the kid waits too long, he eats the snack himself.
* **Kitchen secrets:** open the fridge 5 times (the cheese winks), tap the cookie jar 5 times
  (cookie monster), tap the fruit bowl 3 times (juggling), drum on the table 6 times (kitchen
  band with Biscuit).

### Hide-and-seek (two games)
Two new buttons at the top right: the **peeking eyes** and the **paw**.
* **You hide (peeking eyes):** Papa or Mummy covers their eyes and counts to ten. Glowing spots
  appear, and the child taps where to hide: behind the sofa, behind Papa's desk or behind the plant
  in the office; under the blanket, in the wardrobe, behind the costume chest or the toy basket in
  the bedroom; under the table or behind the fridge in the kitchen. If nobody chooses, the kid
  picks a spot himself. The seeker then guesses wrong places first ("Is he behind the plant?
  ...No!"). **Tap the kid while he's hiding and he giggles, giving himself away.** Hide in the same
  spot twice and they go straight there ("I know your favourite spot!"). In the kitchen, Biscuit
  is the seeker and sniffs the kid out.
* **Find Biscuit (paw):** Biscuit hides with just his wagging tail poking out. Tap the magnifier
  spots to search ("Not here!"), or spot his tail and tap it. If nobody finds him, he gets bored
  and pops out.
* Papa and Mummy sometimes suggest either game themselves.
* Three new stickers: hide-and-seek, giggle gave it away, and found Biscuit.

### Grown-ups corner, privacy and installing
* **Boy or girl:** chosen on the first screen next to the name. It changes a few words (he/she,
  boy/girl, mister/missy, king/queen) and gives a girl pigtails and a bow.
* **Grown-ups corner:** tap the house logo at the top left. A sum (for example 17 + 13) keeps
  little fingers out. Inside: change the name or boy/girl, sound on/off and volume, full screen,
  how to add the game to the home screen, the privacy note, and *Start over* (tap twice), which
  erases the name, stickers, drawings and settings from the device.
* **Full-screen button:** the expand icon at the top right, like on video sites. Tap it (or press
  **F** on a keyboard) to go full screen; tap again or press **Esc** to leave. On Android it also
  keeps the screen sideways. iPhone Safari doesn't allow full screen for websites, so there the
  button explains how to add the game to the home screen. The button hides itself when the game
  is opened from the home screen, since it is already full screen.
* **Privacy:** `/privacy.html`. Nothing is collected or sent anywhere, and there are no ads,
  accounts, analytics or cookies.
* **Install like an app:** a web app manifest, home-screen icons and a service worker
  (`public/sw.js`). Added to the home screen, the game opens full screen in landscape and works
  offline after the first visit. The service worker only runs in production builds.

### Your own name
The first screen asks the child's name ("What's your name?"). Papa, Mummy and Biscuit use it
everywhere ("{name}! You're back! I missed you!"). It is saved on the device; tap
*Not {name}? Change name* on the title screen to change it.

### Biscuit the puppy
A puppy who follows the kid from room to room, wanders, naps, wags and reacts to the family (barks
at a ball fight, jumps when the tower crashes, spins at dance parties).
* Tap him: petting with hearts, roll-over trick, fetch with the ball, puppy kisses. If he's
  napping, the kid tiptoes over and he wakes up wagging.
* Tap his **bowl** (Mummy's room): the kid pours food and Biscuit races in to munch.
* Family moment: Biscuit steals Papa's sock and the kid chases him to get it back.
* Secret: tap him 6 times quickly and he chases his own tail.

### Dress-up
The **costume chest** in Mummy's room: superhero cape, crown, pirate hat, dino hood, chef hat, and
back to normal. Each costume has its own lines from the kid and Mummy, and the outfit is
remembered next time.

### Drawing that stays
Tap the **easel** in Papa's office to open a crayon board (10 colours, 3 sizes, star and heart
stamps, eraser). *Hang it up!* shows the picture to Papa, who hangs it in the frame on his wall.
The newest drawing stays on the wall and the easel between visits.

### Sticker book and daily surprise
* The book button (top right) opens **My Sticker Book**: one sticker for every secret and
  costume found, with gentle hints for grown-ups reading along. No points.
* Every day a **surprise box** waits on Papa's sofa. Opening it gives a balloon that the kid
  carries all day.
* Returning players are greeted by name.

### New toys
* **Building blocks** (Papa's rug): each tap stacks one block. Tall towers wobble, and one block
  too many sends them tumbling. Papa cheers on the builder.
* **Toy car** (under Papa's desk): wind it up and it zooms into Papa's chair ("Ow, my toe!"),
  then reverses home.
* **Soap bubbles** (Mummy's rug): the kid blows eight bubbles that float around the room. Tap them
  to pop. Pop every one and Mummy claps.

### Parents remember
Parents keep count of what happened this session. The 3rd and 5th time (and every 3rd time after
that) the same prank happens, they react to the repetition instead of repeating themselves
("Five bonks! I am putting this in my calendar: ball o'clock."). This covers the ball, the mouse,
the laptop, the lights, the guitar, the chair spin, the keyboard, knocking, funny faces, the
pillow fight, bed jumping, the blanket, Mummy's laptop and her tea.

### Family moments (parents take the initiative)
Every minute or two, and only after the player has been quiet for a few seconds, a parent may
start something on their own. Any tap cancels it at once, so the child stays in charge.
* Papa: a game of catch (with a funny miss), a guitar jam where the kid sings, a stretch-and-water
  break, or calling the kid in from the other room.
* Mummy: a snack (an apple), a short story on the pouf, a dance break, or calling the kid in for a
  hug.
* Time-aware: at night, Mummy's story becomes a **bedtime story**. The kid yawns, goes to bed and
  the lights go down to the lamp. In the morning, if he is still asleep, Mummy opens the curtains
  and wakes him.

---

## Accessibility & child safety

* Large tap targets, no hover required, and protection against accidental double taps.
* No flashing: the party lights drift slowly and stars twinkle gently. `prefers-reduced-motion`
  turns off ambient loops.
* Volume is limited by a compressor and can be muted at any time.
* No external links, ads, accounts, chat, personal data, analytics or network calls at runtime.
  Fonts are bundled locally.
* Pranks are gentle. The kid hides in the wardrobe with the door left ajar and pops straight out;
  Papa reminds him to lift with his knees.
* Portrait phones get a friendly "turn your device sideways" prompt, with a *Play anyway* option.

## Test results

* `npm run build`: type-check and production build pass.
* `npm test`: 27/27 unit tests pass (boy/girl words with no leftover tokens, hide-and-seek spots and giveaways, kitchen wiring and snack delivery, player name in dialogue, outfits, puppy and sticker
  wiring, family memory tiers, moment eligibility by time of day,
  the new toys, three-tap FSM including timeouts, day periods, 12:00
  detection, cooldowns, tap windows, non-repeating dialogue, interaction locking and priorities,
  cooldown enforcement, unique event ids, and the catalogue size).
* In-browser sweep: every object in both rooms was triggered through the game's own QA hook
  (`window.__mlh`). None got stuck and the console stayed clean.

## Known limitations

* The game is click/tap only by design. There is no free walking; the kid makes short contextual
  walks to objects.
* Character turns are stylised 3/4 views (face features shift, the body swaps between side and
  front poses) rather than fully redrawn angles.
* Only the two rooms from version 1.0 exist. The doors and `RoomManager` are ready for more rooms.
