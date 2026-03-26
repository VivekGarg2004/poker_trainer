// ─────────────────────────────────────────────
//  Poker Trainer — app.js
//  9-player Texas Hold'em Tournament
//  Villain pool: mostly beginners, 2-3 competent
// ─────────────────────────────────────────────

const SUIT_SYMBOLS = { s: '♠', h: '♥', d: '♦', c: '♣' };
const SUIT_COLORS  = { s: 'black', h: 'red', d: 'red', c: 'black' };

const POSITIONS = ['UTG','UTG+1','MP','LJ','HJ','CO','BTN','SB','BB'];

// ── Scenario Library ──────────────────────────────────────────────────────────
// Each scenario:
//   type           : 'preflop' | 'flop' | 'turn' | 'river'
//   position       : hero's seat
//   heroCards      : ['As','Kd']  (rank + suit)
//   handName       : human-readable
//   board          : [] for preflop, or ['Ah','7d','2c'] etc.
//   stackBB        : hero's effective stack in big blinds
//   potBB          : pot size in BB at decision point
//   blinds         : e.g. '100/200'
//   actionHistory  : description shown in villain-action bar
//   availableActions: subset of ['fold','call','check','raise']
//   correctActions : which of availableActions are correct (array, at least one)
//   bestAction     : single label shown as "best play"
//   explanation    : detailed explanation string (supports <strong> tags)
const SCENARIOS = [
  // ─── PRE-FLOP ───────────────────────────────
  {
    id: 1,
    type: 'preflop',
    position: 'UTG',
    heroCards: ['7d','2c'],
    handName: '7-2 offsuit',
    board: [],
    stackBB: 50,
    potBB: 1.5,
    blinds: '100/200',
    actionHistory: 'All 8 players yet to act. Action is on you UTG (first to act).',
    availableActions: ['fold','call','raise'],
    correctActions: ['fold'],
    bestAction: 'Fold',
    explanation: `<strong>7-2 offsuit is the worst starting hand in poker</strong> — no pair potential, no flush draw potential, and very poor connectivity. 
    <br><br>In a 9-handed tournament, UTG must open <em>tight</em> because there are 8 players left to act behind you, any of whom could have a premium hand. 
    <br><br><strong>Beginner opponent context:</strong> Even against players who don't 3-bet often, opening 72o from UTG is never profitable. 
    It folds far too infrequently post-flop against any decent board, and even when it does, you've wasted chips. Just muck it confidently.`
  },
  {
    id: 2,
    type: 'preflop',
    position: 'BTN',
    heroCards: ['Kh','Qd'],
    handName: 'K-Q offsuit',
    board: [],
    stackBB: 60,
    potBB: 4.5,
    blinds: '100/200',
    actionHistory: 'Folds to you on the Button. Both blinds are beginner players who rarely 3-bet.',
    availableActions: ['fold','call','raise'],
    correctActions: ['raise'],
    bestAction: 'Raise (2.5–3x)',
    explanation: `<strong>KQo is a strong hand on the Button</strong> with all players folded to you. You have position and the initiative.
    <br><br><strong>Against beginner blinds</strong> who rarely 3-bet, you can open-raise comfortably. Even if they call, you'll play the hand in position with a strong range.
    <br><br>Open to <strong>2.5–3 BB</strong> (250–300 chips). Don't limp — limping with KQo surrenders initiative and is a beginner mistake. 
    A raise wins the blinds immediately a good portion of the time, and when called you'll have the best of it post-flop regularly.`
  },
  {
    id: 3,
    type: 'preflop',
    position: 'SB',
    heroCards: ['Ah','Jc'],
    handName: 'A-J offsuit',
    board: [],
    stackBB: 45,
    potBB: 5.5,
    blinds: '100/200',
    actionHistory: 'A UTG beginner limps. Two more players limp behind. Action folds to you in the SB.',
    availableActions: ['fold','call','raise'],
    correctActions: ['raise'],
    bestAction: 'Raise (4–5x)',
    explanation: `<strong>AJo is a strong hand vs. limpers</strong>, and you should punish the limpers by raising big.
    <br><br>With 3 limpers in front, a raise of <strong>4–5x the limp</strong> (800–1000 chips) isolates weak holdings and builds a pot where you're likely ahead. 
    <br><br><strong>Beginner limpers</strong> often have hands like T9s, 44, A3o — you dominate most of these. Calling and playing multi-way out of position is a mistake; it weakens AJ's edge. 
    Raise and take control. If everyone folds, great — you pick up a pot uncontested.`
  },
  {
    id: 4,
    type: 'preflop',
    position: 'BB',
    heroCards: ['9s','8s'],
    handName: '9-8 suited',
    board: [],
    stackBB: 55,
    potBB: 3,
    blinds: '100/200',
    actionHistory: 'A CO player (competent, raises 2.5x) opens. Everyone else folds to you in the BB.',
    availableActions: ['fold','call','raise'],
    correctActions: ['call'],
    bestAction: 'Call',
    explanation: `<strong>98s gets a great price to call from the BB</strong> against a single raiser in the CO.
    <br><br>You're closing the action, already have 1BB invested, and 98s has excellent post-flop playability — straights, flushes, two-pairs. The pot odds combined with implied odds make this an easy call.
    <br><br><strong>Should you 3-bet?</strong> Against a competent player from CO, 3-betting 98s as a bluff/semi-bluff is possible but risky at this stack depth. 
    Calling and playing in position-neutral spots post-flop is the cleaner line for most levels. 
    <br><br>Folding would be a mistake — you're getting roughly <strong>3:1 implied odds</strong> with a hand that hits hard.`
  },
  {
    id: 5,
    type: 'preflop',
    position: 'UTG',
    heroCards: ['Ac','Kc'],
    handName: 'Ace-King suited',
    board: [],
    stackBB: 70,
    potBB: 1.5,
    blinds: '100/200',
    actionHistory: 'First to act preflop. All 8 players yet to act behind you.',
    availableActions: ['fold','call','raise'],
    correctActions: ['raise'],
    bestAction: 'Raise (2.5–3x)',
    explanation: `<strong>AKs is a premium hand — always raise UTG.</strong>
    <br><br>This is one of the best starting hands in Texas Hold'em. Opening 2.5–3x builds value and defines your range. Limping with AKs is a trap move that lets opponents see cheap flops with junky hands.
    <br><br><strong>Against beginner opponents</strong> who don't 3-bet aggressively, you'll often win the blinds outright or build a great spot post-flop. Even if you're 3-bet, you have an easy decision — re-raise or call based on stack depth.`
  },
  {
    id: 6,
    type: 'preflop',
    position: 'CO',
    heroCards: ['5d','5h'],
    handName: 'Pocket Fives',
    board: [],
    stackBB: 30,
    potBB: 1.5,
    blinds: '100/200',
    actionHistory: 'UTG beginner limps. MP folds. Action to you in CO.',
    availableActions: ['fold','call','raise'],
    correctActions: ['raise','call'],
    bestAction: 'Raise (3.5–4x)',
    explanation: `<strong>55 is a solid hand vs. one limper from CO.</strong>
    <br><br>Both raising and calling are defensible here. <strong>Raising (3–4x)</strong> isolates the beginner limper and gives you a chance to win the pot right away or play heads-up. Calling is also fine — you're set-mining with implied odds.
    <br><br>With <strong>30 BB effective</strong>, set-mining is slightly riskier (need ~15:1 implied odds to profitably set-mine). Raising to take the pot down pre-flop or post-flop is slightly better.
    <br><br>Against beginners who don't fold to c-bets often, keep that in mind and don't over-bluff post-flop if you miss.`
  },
  {
    id: 7,
    type: 'preflop',
    position: 'MP',
    heroCards: ['Ks','Qs'],
    handName: 'K-Q suited',
    board: [],
    stackBB: 65,
    potBB: 1.5,
    blinds: '100/200',
    actionHistory: 'UTG folds. UTG+1 folds. Action to you in MP.',
    availableActions: ['fold','call','raise'],
    correctActions: ['raise'],
    bestAction: 'Raise (2.5x)',
    explanation: `<strong>KQs is a very strong hand from MP</strong> — suited broadways have excellent equity vs. everything except the top 5-8% of hands.
    <br><br>Open-raising 2.5x is standard. You'll get called by worse hands (KJ, Q-X, pocket pairs), and you're rarely dominated unless someone has AK or AA/KK.
    <br><br><strong>Against beginner players</strong> who might call with weak aces or mediocre K-X hands, you're in a great shape post-flop. Limp-calling or limping is incorrect — take the initiative and apply pressure.`
  },
  {
    id: 8,
    type: 'preflop',
    position: 'HJ',
    heroCards: ['Ad','3d'],
    handName: 'A-3 suited',
    board: [],
    stackBB: 40,
    potBB: 1.5,
    blinds: '100/200',
    actionHistory: 'Three players fold. UTG+1 (beginner) limps. MP folds. Action to you in HJ.',
    availableActions: ['fold','call','raise'],
    correctActions: ['raise','fold'],
    bestAction: 'Raise (3.5x) or Fold',
    explanation: `<strong>A3s is a borderline hand vs. a limper from HJ.</strong>
    <br><br>It has good flush potential and a nut-flush draw, but is easily dominated by stronger aces post-flop. 
    Against a beginner limper, <strong>raising to isolate</strong> (3.5x) is solid — you pick up the pot or play heads-up in position. Folding is also fine if you want to play conservatively.
    <br><br><strong>Calling the limp is the worst option</strong> — it makes the pot multi-way and you'll be in a dominated spot often (e.g., A-T calls behind and you flop top pair weak kicker).`
  },

  // ─── POST-FLOP: FLOP ────────────────────────
  {
    id: 9,
    type: 'flop',
    position: 'BTN',
    heroCards: ['Ah','Kd'],
    handName: 'Top two pair (A-K)',
    board: ['As','Ks','7h'],
    stackBB: 55,
    potBB: 6,
    blinds: '100/200',
    actionHistory: 'You raised BTN preflop. BB (beginner) called. Flop: A♠ K♠ 7♥. BB checks.',
    availableActions: ['check','raise'],
    correctActions: ['raise'],
    bestAction: 'Bet (50–75% pot)',
    explanation: `<strong>Top two pair is a monster — bet for value!</strong>
    <br><br>You have the near-nuts on this board (only KK/AA/77 beat you, and the board has two of each already). The <strong>flush draw on the board</strong> (two spades) means you should bet to charge any draws.
    <br><br>Against a beginner BB who called preflop, they might have Kx, Ax, spade draws, or random pairs. All of these are calls. Bet <strong>50–75% pot (~3–4.5 BB)</strong>.
    <br><br>Checking is a mistake here — you're giving free cards to spade draws, and beginners won't bet their marginal hands if you check behind. Extract max value now.`
  },
  {
    id: 10,
    type: 'flop',
    position: 'BB',
    heroCards: ['Jd','Tc'],
    handName: 'Open-ended straight draw',
    board: ['9h','8s','2d'],
    stackBB: 48,
    potBB: 5,
    blinds: '100/200',
    actionHistory: 'CO (competent) opened, you called from BB. Flop: 9♥ 8♠ 2♦. First to act.',
    availableActions: ['check','raise'],
    correctActions: ['check'],
    bestAction: 'Check (then call a bet)',
    explanation: `<strong>You have an open-ended straight draw (OESD) — 8 outs to a straight.</strong>
    <br><br>Out of position against a competent CO player who likely has overpairs, TP, or mid pairs on this board, leading out (donk betting) is not ideal. Check-calling is the right line.
    <br><br>If the CO bets around 50–60% pot, you're getting roughly <strong>2.5:1 pot odds</strong>, and with 8 outs twice you have ~32% equity — easily a call. 
    <br><br>Check-raising as a semi-bluff is too aggressive here out of position with a single draw and no made hand. Check and evaluate.`
  },
  {
    id: 11,
    type: 'flop',
    position: 'BTN',
    heroCards: ['Qs','Jh'],
    handName: 'Middle pair + overcard',
    board: ['Jd','8c','4h'],
    stackBB: 60,
    potBB: 6,
    blinds: '100/200',
    actionHistory: 'You raised BTN. HJ beginner calls (they limp-called, now check-calling stations). Flop: J♦ 8♣ 4♥. HJ checks to you.',
    availableActions: ['check','raise'],
    correctActions: ['raise'],
    bestAction: 'Bet (40–55% pot)',
    explanation: `<strong>Top pair decent kicker — bet for value against the beginner caller.</strong>
    <br><br>The board is relatively dry (no obvious flush draws, rainbow). Against a beginner check-calling station, you want to extract value from hands like 8-X, 4-X, pocket pairs below Jacks, and even random Jacks with worse kickers.
    <br><br>Bet <strong>40–55% pot (~2.4–3.3 BB)</strong>. Going too big might fold out weaker hands that you want to call. Keep the sizing modest and plan to bet turn if a blank comes.
    <br><br>Checking here is a mistake — you're giving free cards and leaving value on the table vs. a player who won't build the pot themselves.`
  },
  {
    id: 12,
    type: 'flop',
    position: 'MP',
    heroCards: ['Ac','Qd'],
    handName: 'Overcards (no pair)',
    board: ['Kh','9d','6s'],
    stackBB: 50,
    potBB: 8,
    blinds: '100/200',
    actionHistory: 'MP (you) raised. BB beginner called. Flop: K♥ 9♦ 6♠. Villain leads out for 4BB (pot-sized bet).',
    availableActions: ['fold','call','raise'],
    correctActions: ['fold'],
    bestAction: 'Fold',
    explanation: `<strong>Ace-high with no pair, no draw, facing a pot-sized bet — fold.</strong>
    <br><br>You have only 3 outs to top pair (remaining Aces) and no draws whatsoever. Against a beginner who leads pot-sized, they almost always have a King or better — beginners rarely bluff this big.
    <br><br>To call profitably, you need roughly 25% equity — <strong>you have less than 10% in most cases</strong> against K-X. Even if you hit an Ace on the turn, it might not save you if they have KA themselves.
    <br><br>Fold and preserve your chips. Never fall in love with a big preflop hand when you've missed the flop entirely.`
  },
  {
    id: 13,
    type: 'flop',
    position: 'CO',
    heroCards: ['7s','6s'],
    handName: 'Flush draw + gutshot',
    board: ['As','Ks','4d'],
    stackBB: 45,
    potBB: 7,
    blinds: '100/200',
    actionHistory: 'You raised CO. BTN (competent) called. Flop: A♠ K♠ 4♦. First to act.',
    availableActions: ['check','raise'],
    correctActions: ['check'],
    bestAction: 'Check (then semi-bluff raise or call).',
    explanation: `<strong>You have a flush draw (9 outs) but missed the board badly — check is safest.</strong>
    <br><br>The A-K-4 board is bad for your range as the CO pre-flop opener — BTN will assign you fewer Aces and Kings than they have. Firing a c-bet here gets called or raised by exactly the hands that crush you.
    <br><br>Checking keeps your range balanced and lets you see a free turn. If the BTN bets, a check-raise semi-bluff with the nut-flush draw is high variance but can work. Calling a bet is also fine given your equity (~36% vs. top pair).
    <br><br>Leading out into a competent BTN player is a leak — pick your spots more carefully out of position.`
  },

  // ─── POST-FLOP: TURN ────────────────────────
  {
    id: 14,
    type: 'turn',
    position: 'BTN',
    heroCards: ['Th','Ts'],
    handName: 'Overpair (TT)',
    board: ['9d','4c','2h','3s'],
    stackBB: 50,
    potBB: 14,
    blinds: '100/200',
    actionHistory: 'You c-bet flop, beginner BB called. Turn: 3♠ (brings a straight for A5). BB checks to you.',
    availableActions: ['check','raise'],
    correctActions: ['raise','check'],
    bestAction: 'Bet (35–50% pot) or Check',
    explanation: `<strong>The board is now 9-4-2-3: A5 makes a straight, and the board has gotten more connected.</strong>
    <br><br>Betting <strong>35–50% pot (~5–7 BB)</strong> as a value bet against the beginner makes sense — they often continue with 9-X, 4-X, or their random pair. But bet sizing should be smaller since the board got wetter.
    <br><br>Checking is also acceptable on this turn — the 3 completing a potential straight is scary, and you can re-evaluate on the river. 
    <br><br>Against a beginner who rarely has A5 (they might fold it preflop or not recognize the straight), betting is probably more profitable, but stay cautious if they raise.`
  },
  {
    id: 15,
    type: 'turn',
    position: 'BB',
    heroCards: ['As','5h'],
    handName: 'Two pair (A5 vs paired board)',
    board: ['Ah','5d','Qc','Ac'],
    stackBB: 38,
    potBB: 12,
    blinds: '100/200',
    actionHistory: 'You called BTN raise from BB. Flop: A♥ 5♦ Q♣ (you flopped two pair). You check-called. Turn: A♣. You now have a full house. BTN bets 6BB.',
    availableActions: ['fold','call','raise'],
    correctActions: ['raise','call'],
    bestAction: 'Raise (check-raise to ~18BB)',
    explanation: `<strong>A5 has turned a full house (A-A-5-A) — you're holding a monster.</strong>
    <br><br>Against a BTN bet, raising to build the pot is ideal. You have an incredibly strong hand. The BTN could have AQ (also full house but smaller), or Qx, pocket pairs, or a random Ace.
    <br><br>Raising to ~18 BB looks like a value raise/semi-bluff and will get called by many hands. If the BTN has AQ, they might go all-in — and you'd enjoy that.
    <br><br>Calling is fine too if you'd rather trap on the river, but against a player betting into you, raising extracts max value. Don't slow-play too hard.`
  },
  {
    id: 16,
    type: 'turn',
    position: 'CO',
    heroCards: ['Kc','Jc'],
    handName: 'Flush draw (K high)',
    board: ['Qc','8c','3h','Td'],
    stackBB: 42,
    potBB: 10,
    blinds: '100/200',
    actionHistory: 'Your c-bet was called by UTG beginner on flop. Turn: T♦. Beginner lead-donks 5BB into you.',
    availableActions: ['fold','call','raise'],
    correctActions: ['call','raise'],
    bestAction: 'Call (or raise as semi-bluff)',
    explanation: `<strong>You now have a flush draw (9 outs) + gut-shot to the straight on 9 (J-high straight needs a 9) — a solid semi-bluff spot.</strong>
    <br><br>When a beginner leads into you (donk bet), they typically have a pair — usually T-X now that the ten landed, or Q-X. You have live outs.
    <br><br><strong>Calling</strong> is safe — you're getting decent pot odds with strong draw equity. <strong>Raising</strong> as a semi-bluff can fold out pairs and give you the lead, but against calling stations who lead with marginal hands, calling and seeing the river is simpler.
    <br><br>Don't fold — you have too much equity with the flush draw.`
  },

  // ─── POST-FLOP: RIVER ───────────────────────
  {
    id: 17,
    type: 'river',
    position: 'BTN',
    heroCards: ['Qh','Qd'],
    handName: 'Overpair (QQ)',
    board: ['9s','4c','2d','Ak','Ks'],
    stackBB: 40,
    potBB: 18,
    blinds: '100/200',
    actionHistory: 'You bet flop and turn. Beginner BB called both. River: K♠. BB checks to you.',
    availableActions: ['check','raise'],
    correctActions: ['check'],
    bestAction: 'Check back',
    explanation: `<strong>The river K♠ is a dangerous card for pocket Queens.</strong>
    <br><br>The board now reads 9-4-2-A-K. Any K-X beats you. Any A-X beats you. Against a beginner who called flop and turn, they have <em>something</em> — a pair of 9s or 4s that might now be counterfeited, a K, or an Ace they were slow-playing.
    <br><br>Betting here for "value" on the river is a blunder: you only get called by hands that beat you (Kx, Ax). Beginners don't call river bets with busted-draw bluffs. Your hand is now a bluff-catcher.
    <br><br><strong>Check behind and go to showdown.</strong> You might still beat 9-X or 4-X, and you avoid being raised off the best hand.`
  },
  {
    id: 18,
    type: 'river',
    position: 'BB',
    heroCards: ['6h','5h'],
    handName: 'Straight (4-5-6-7-8)',
    board: ['8d','7c','4s','Jh','2d'],
    stackBB: 30,
    potBB: 16,
    blinds: '100/200',
    actionHistory: 'You called BTN raise from BB. You check-called flop and turn with your straight draw. River: 2♦ (blank). You hit your 6-high straight on the turn. BTN checks back the turn, now acts.',
    availableActions: ['check','raise'],
    correctActions: ['raise'],
    bestAction: 'Bet (60–80% pot)',
    explanation: `<strong>You have a 6-high straight on the river — bet for value.</strong>
    <br><br>The board is 8-7-4-J-2, and your 6-5 makes 4-5-6-7-8. This is a very strong hand that beats almost everything except 9-T (which would need the board). No flush is possible.
    <br><br>Against a beginner BTN who checked the turn (showing weakness), they might have top pair (J), middle pair (8 or 7), or a random pair. All of these hands might call a value bet.
    <br><br>Bet <strong>60–80% pot</strong> (~10–13 BB). Don't check — you have a monster and the BTN showed weakness. Beginners who "liked their hand" enough to call preflop often find it hard to fold pairs on the river.`
  },
  {
    id: 19,
    type: 'river',
    position: 'CO',
    heroCards: ['Ah','Kh'],
    handName: 'Ace high — missed flush draw',
    board: ['Js','9h','4c','2s','8d'],
    stackBB: 35,
    potBB: 12,
    blinds: '100/200',
    actionHistory: 'You c-bet flop, beginner BB called. You checked back the turn. River: 8♦. BB leads for 8BB (almost pot).',
    availableActions: ['fold','call','raise'],
    correctActions: ['fold'],
    bestAction: 'Fold',
    explanation: `<strong>Ace-high with no pair or draw on a 5-card board — fold.</strong>
    <br><br>The river 8 completes several potential straights (T-J, 7-8-9) and the beginner is leading pot-sized into you. Even accounting for random/weak leads from beginners, you have zero showdown value with ace-high.
    <br><br>Your hand has no pair on J-9-4-2-8, and the only hands you beat are pure bluffs. Beginners rarely bluff pot-sized on the river with total air.
    <br><br><strong>Fold and protect your stack.</strong> Calling here with ace-high is a chip-leak that compounds over a tournament. You need a pair minimum to continue.`
  },
  {
    id: 20,
    type: 'river',
    position: 'SB',
    heroCards: ['Kd','Kc'],
    handName: 'Top pair (KK on K-high board)',
    board: ['Ks','Qd','7h','3c','2s'],
    stackBB: 45,
    potBB: 20,
    blinds: '100/200',
    actionHistory: 'You 3-bet from SB. CO beginner called. Board: K♠ Q♦ 7♥ 3♣ 2♠. You bet flop, bet turn. River: 2♠. CO check-calls all the way.',
    availableActions: ['check','raise'],
    correctActions: ['raise'],
    bestAction: 'Bet (50–65% pot)',
    explanation: `<strong>Top set of Kings — extract maximum value on the river.</strong>
    <br><br>You have three Kings on a K-Q-7-3-2 board. The only hands that beat you are 22 (a set of twos, very unlikely vs. a beginner who called a 3-bet) or 33, 77 (same issue). 
    <br><br>A beginner who check-called flop and turn has hands like KJ, KT, Q-X, pocket pairs, or even 7-X. All of these lose to you but will call a river bet.
    <br><br><strong>Bet 50–65% pot (~10–13 BB)</strong> as a value bet. Don't check — you're too strong. Beginners who made top pair on this board often can't fold it. Take the pot.`
  },
  // ─── EXTRA SCENARIOS ────────────────────────
  {
    id: 21,
    type: 'preflop',
    position: 'BB',
    heroCards: ['2h','2d'],
    handName: 'Pocket Twos',
    board: [],
    stackBB: 22,
    potBB: 4,
    blinds: '100/200',
    actionHistory: 'UTG beginner limps. HJ raises to 3BB. Everyone folds to you in BB.',
    availableActions: ['fold','call','raise'],
    correctActions: ['fold'],
    bestAction: 'Fold',
    explanation: `<strong>22 with 22 BB effective vs. a raise — fold.</strong>
    <br><br>Set-mining math: to profitably set-mine you need implied odds of roughly 15:1. With only 22 BB and needing to call 2 BB more, you'd need to extract ~30 BB when you hit… which is nearly your whole remaining stack. That math doesn't work.
    <br><br>With deeper stacks (50+ BB) you could call profitably. At 22 BB, calling and missing (78% of the time) bleeds too many chips. Just fold 22 here — there will be better spots.`
  },
  {
    id: 22,
    type: 'flop',
    position: 'BB',
    heroCards: ['Ad','9s'],
    handName: 'Top pair (A9) vs. paired board',
    board: ['As','4h','4c'],
    stackBB: 50,
    potBB: 7,
    blinds: '100/200',
    actionHistory: 'You called UTG open from BB. Flop: A♠ 4♥ 4♣. You check, UTG (beginner) bets 4BB.',
    availableActions: ['fold','call','raise'],
    correctActions: ['call','raise'],
    bestAction: 'Call',
    explanation: `<strong>You have top pair + solid kicker, but the paired board is tricky.</strong>
    <br><br>A9 on A-4-4 is strong but not invulnerable. A beginner who bet here usually has an Ace (you beat them), or a 4 (unlikely, they would slow-play it), or they're betting with 9-X to see where they are.
    <br><br>Calling here is clean — you keep pot control and your hand has good showdown value. You beat AK-AJ? No. You beat A2-A8? Yes. 
    <br><br>Raising is aggressive and can work, but risks being called or re-raised by better aces. The call protects the hand while keeping the pot manageable.`
  },
  {
    id: 23,
    type: 'preflop',
    position: 'UTG',
    heroCards: ['Jd','Jh'],
    handName: 'Pocket Jacks',
    board: [],
    stackBB: 75,
    potBB: 1.5,
    blinds: '100/200',
    actionHistory: 'First to act preflop — 8 players behind. Two are known competent players (CO, BTN).',
    availableActions: ['fold','call','raise'],
    correctActions: ['raise'],
    bestAction: 'Raise (2.5–3x)',
    explanation: `<strong>Pocket Jacks are the 4th best starting hand — always raise, never limp.</strong>
    <br><br>JJ has huge equity against most hands — it's an ~80% favorite against random cards. Raise 2.5–3x preflop to build a pot and define the hand.
    <br><br><strong>If a competent player (CO or BTN) 3-bets:</strong> You face a tough spot. In a 75 BB tournament, flatting or 4-betting are both options. Folding to a single 3-bet from a competent player is generally too tight.
    <br><br>If a beginner 3-bets (which is rare), they almost certainly have AA, KK, or QQ. React accordingly — calling down carefully or folding to very large bet sizing.`
  },
  {
    id: 24,
    type: 'turn',
    position: 'BTN',
    heroCards: ['8c','7c'],
    handName: 'Two pair (8-7)',
    board: ['8h','7d','2s','Kc'],
    stackBB: 38,
    potBB: 11,
    blinds: '100/200',
    actionHistory: 'You raised preflop, BB beginner called. Flop: 8♥ 7♦ 2♠ (you flopped two pair). You bet, BB called. Turn: K♣. BB checks.',
    availableActions: ['check','raise'],
    correctActions: ['raise'],
    bestAction: 'Bet (55–70% pot)',
    explanation: `<strong>Two pair is still very strong — but the King is a scare card to manage.</strong>
    <br><br>The K complicates things since beginners who called preflop often have K-X hands. However, your two pair of 8s and 7s beats K-X unless they had two pair themselves (K-8, K-7) or hit a set.
    <br><br>Betting <strong>55–70% pot (~6–8 BB)</strong> keeps pressure on and extracts value from: pairs below kings, 8-X, 7-X, random pair+draw hands. Against a beginner who can't fold middle pair, this is very profitable.
    <br><br>If they raise the turn: re-evaluate. Beginners who raise the turn almost always have it (KK, 88, 77, K8, K7). You can fold two pair there.`
  },
  {
    id: 25,
    type: 'river',
    position: 'BTN',
    heroCards: ['Ac','9c'],
    handName: 'Flush (nut flush)',
    board: ['Kc','5c','2c','Jd','7h'],
    stackBB: 42,
    potBB: 10,
    blinds: '100/200',
    actionHistory: 'You called BB from BTN. Flop gave flush draw. You called two bets. River is blank. BB (beginner) checks.',
    availableActions: ['check','raise'],
    correctActions: ['raise'],
    bestAction: 'Bet big (75–100% pot)',
    explanation: `<strong>You rivered the nut flush — bet large for maximum value.</strong>
    <br><br>Ac-9c with K♣5♣2♣ on board gives you the nut flush (best possible flush). This is the strongest hand you can hold on a board with three clubs.
    <br><br>Against a beginner who check-called the flop and turn, they likely have a non-nut flush (like Q♣ or J♣ plus another club), a strong pair, or two pair. All of these will pay you off.
    <br><br>Bet <strong>75–100% pot</strong> — you have the nuts, make them pay. Beginners hate folding flushes (even non-nut ones). Small bets leave money on the table.`
  },
  {
    id: 26,
    type: 'preflop',
    position: 'SB',
    heroCards: ['Th','9h'],
    handName: 'T9 suited',
    board: [],
    stackBB: 55,
    potBB: 5.5,
    blinds: '100/200',
    actionHistory: 'CO opens to 2.5BB. BTN (beginner) calls. You\'re in SB. BB is typically tight.',
    availableActions: ['fold','call','raise'],
    correctActions: ['fold','call'],
    bestAction: 'Fold or Call',
    explanation: `<strong>T9s is a playable hand but tricky with 2 players in front and OOP.</strong>
    <br><br>You'll be out of position for the entire hand against the original raiser (CO). T9s plays well in multiway pots when in position — here you're at a significant positional disadvantage.
    <br><br><strong>Calling</strong> is fine if you accept the implied odds gamble — T9s can flop straights, flushes, two pairs. But <strong>folding</strong> is also perfectly valid to preserve equity and avoid playing a tricky hand OOP multiway.
    <br><br><strong>3-betting is not ideal</strong> here OOP multi-way — it's a high-variance play bloated without clear fold equity vs. the BTN beginner caller.`
  },
  {
    id: 27,
    type: 'flop',
    position: 'BTN',
    heroCards: ['Ks','Kh'],
    handName: 'Overpair — but ace on board',
    board: ['Ac','7d','3h'],
    stackBB: 60,
    potBB: 8,
    blinds: '100/200',
    actionHistory: 'You raised BTN. BB beginner called. Flop: A♣ 7♦ 3♥. BB leads into you for 5BB.',
    availableActions: ['fold','call','raise'],
    correctActions: ['fold','call'],
    bestAction: 'Fold or Call (small)',
    explanation: `<strong>Kings with an Ace on the board are in a tough spot vs. a beginner lead.</strong>
    <br><br>When a beginner leads into you on an Ace-high flop, they often have an Ace. Beginners love slow-playing, but leading on an ace-high board usually means they hit it.
    <br><br>The pot odds with a 5BB bet into 8BB (roughly 2.6:1) are NOT compelling when you have only 2 outs to improve (the remaining two Kings). Your equity vs. A-X is roughly <strong>11-13%</strong>.
    <br><br><strong>Folding is the disciplined play.</strong> Calling to "see what happens" is a common beginner mistake — you'll often just bleed chips. Pocket Kings lose to an Ace on board.`
  },
  {
    id: 28,
    type: 'preflop',
    position: 'BTN',
    heroCards: ['As','Ad'],
    handName: 'Pocket Aces',
    board: [],
    stackBB: 80,
    potBB: 1.5,
    blinds: '100/200',
    actionHistory: 'All 6 players fold to you on the Button. SB and BB are both beginners.',
    availableActions: ['fold','call','raise'],
    correctActions: ['raise'],
    bestAction: 'Raise (2.5–3x)',
    explanation: `<strong>Pocket Aces — never slow-play preflop, especially against beginners.</strong>
    <br><br>Raise your standard sizing (2.5–3x). Don't go crazy over-raising to "protect" them — if the blinds raise is too large, beginners will just fold, and you win nothing.
    <br><br>Beginners love calling raises from the blinds with random suited connectors and offsuit broadways. Build a pot and let them make mistakes on the flop.
    <br><br>Limping to "trap" is a classic mistake. If you limp, the SB might check and you're playing a multiway pot where Aces lose equity dramatically. <strong>Raise standard, build value.</strong>`
  },
  {
    id: 29,
    type: 'flop',
    position: 'UTG',
    heroCards: ['Ah','Ks'],
    handName: 'Top pair (AK) but wet board',
    board: ['As','Jd','Th'],
    stackBB: 55,
    potBB: 9,
    blinds: '100/200',
    actionHistory: 'You raised UTG. CO (beginner) called. BTN (competent) called. Flop: A♠ J♦ T♥. First to act multiway.',
    availableActions: ['check','raise'],
    correctActions: ['raise','check'],
    bestAction: 'Bet (30–40% pot)',
    explanation: `<strong>Top pair top kicker, but this board is extremely wet and dangerous.</strong>
    <br><br>A-J-T is one of the most dangerous boards in poker — QK makes a royal-straight, KQ makes Broadway, J-T makes two pair with many combos. You're in a multiway pot OOP against two players including a competent one.
    <br><br>A <strong>small c-bet (30–40% pot ~2.7–3.6 BB)</strong> probes the field and keeps the pot small. You learn information cheaply and might fold out weak holdings.
    <br><br>Betting large or check-raising are both risky — you're likely behind or in bad shape vs. at least one player. Don't go broke with top pair on this board multiway.`
  },
  {
    id: 30,
    type: 'river',
    position: 'CO',
    heroCards: ['5s','4s'],
    handName: 'Missed draw — pure bluff spot?',
    board: ['9h','8d','6c','Kh','2s'],
    stackBB: 28,
    potBB: 14,
    blinds: '100/200',
    actionHistory: 'You called BTN open. Flop had your straight draw (5-6-7-8-9). You missed. Turn: K♥. River: 2♠. BTN checks river.',
    availableActions: ['check','raise'],
    correctActions: ['check'],
    bestAction: 'Check back',
    explanation: `<strong>You missed your draw — but bluffing here vs. a beginner calling station is a trap.</strong>
    <br><br>Your hand is pure air: 5-4 on 9-8-6-K-2. You missed the straight completely. The BTN checked the river.
    <br><br>Against a <strong>beginner calling station</strong>, river bluffs have low success rates — they'll call with any pair, even bottom pair. Your bluff equity is near zero.
    <br><br><strong>Check behind and accept the loss.</strong> A river bluff here is lighting chips on fire. Good bluffs require: a player who folds to bets, a credible range, and a meaningful fold frequency. Beginners rarely give you that on rivers.`
  }
];

// ── State ─────────────────────────────────────────────────────────────────────
let state = {
  current: 0,
  order: [],
  score: 0,
  answered: false,
  chosenAction: null,
};

// ── Utilities ─────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeCard(code) {
  const rank = code.slice(0, -1);
  const suit = code.slice(-1);
  const div  = document.createElement('div');
  div.className = `card ${SUIT_COLORS[suit]}`;
  div.innerHTML = `<span class="rank">${rank}</span><span class="suit">${SUIT_SYMBOLS[suit]}</span>`;
  return div;
}

function makePlaceholderCard() {
  const div = document.createElement('div');
  div.className = 'card-placeholder';
  return div;
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  const scenario = SCENARIOS[state.order[state.current]];
  const total = state.order.length;

  // Progress
  document.getElementById('progress-fill').style.width = `${(state.current / total) * 100}%`;
  document.getElementById('counter-text').textContent = `Scenario ${state.current + 1} of ${total}`;

  // Header stats
  document.getElementById('stat-score').textContent = `${state.score}/${state.current}`;

  // Type badge
  const badge = document.getElementById('scenario-badge');
  badge.textContent = scenario.type.toUpperCase();
  badge.className = `scenario-type-badge badge-${scenario.type}`;

  // Position
  document.getElementById('hero-position').textContent = scenario.position;

  // Info grid
  document.getElementById('info-blinds').textContent   = scenario.blinds;
  document.getElementById('info-stack').textContent    = `${scenario.stackBB} BB`;
  document.getElementById('info-pot').textContent      = `${scenario.potBB} BB`;
  document.getElementById('info-players').textContent  = '9-handed';

  // Villain bar
  document.getElementById('villain-bar').innerHTML = scenario.actionHistory;

  // Hero cards
  const heroEl = document.getElementById('hero-cards');
  heroEl.innerHTML = '';
  scenario.heroCards.forEach(c => heroEl.appendChild(makeCard(c)));

  // Hero hand name
  document.getElementById('hero-hand-name').textContent = scenario.handName;

  // Board
  const boardSection = document.getElementById('board-section');
  const boardEl      = document.getElementById('board-cards');
  boardEl.innerHTML  = '';

  if (scenario.board.length > 0) {
    boardSection.style.display = 'block';
    scenario.board.forEach((c, i) => {
      const card = makeCard(c);
      card.style.animationDelay = `${i * 0.08}s`;
      boardEl.appendChild(card);
    });
    // placeholders up to 5
    for (let i = scenario.board.length; i < 5; i++) {
      boardEl.appendChild(makePlaceholderCard());
    }
  } else {
    boardSection.style.display = 'none';
  }

  // Seats visual
  renderSeats(scenario);

  // Action buttons
  renderActions(scenario);

  // Hide explanation
  const expPanel = document.getElementById('explanation-panel');
  expPanel.className = 'explanation-panel';
  expPanel.style.display = 'none';
  state.answered = false;
  state.chosenAction = null;
}

function renderSeats(scenario) {
  const positions = ['UTG','UTG+1','MP','LJ','HJ','CO','BTN','SB','BB'];
  const container = document.getElementById('seats-visual');
  container.innerHTML = '';

  const competentSeats = ['CO', 'BTN']; // simulated competent players

  positions.forEach((pos) => {
    const isHero    = pos === scenario.position;
    const isDead    = false;
    const isVillain = !isHero;

    const wrap = document.createElement('div');
    wrap.className = `seat ${isHero ? 'is-hero' : ''} ${isVillain && !isHero ? 'is-villain' : ''} ${isDead ? 'is-dead' : ''}`;

    const dot = document.createElement('div');
    dot.className = 'seat-dot';
    dot.title = isHero ? 'You' : (competentSeats.includes(pos) && !isHero ? 'Competent' : 'Beginner');
    dot.textContent = isHero ? '★' : (competentSeats.includes(pos) && !isHero ? '●' : '○');

    const label = document.createElement('div');
    label.textContent = pos;

    wrap.appendChild(dot);
    wrap.appendChild(label);
    container.appendChild(wrap);
  });
}

function renderActions(scenario) {
  const container = document.getElementById('action-buttons');
  container.innerHTML = '';

  const actionConfig = {
    fold:  { label: 'Fold',  cls: 'btn-fold',  icon: '✕' },
    call:  { label: 'Call',  cls: 'btn-call',  icon: '✓' },
    check: { label: 'Check', cls: 'btn-check', icon: '◇' },
    raise: { label: 'Raise / Bet', cls: 'btn-raise', icon: '↑' },
  };

  scenario.availableActions.forEach(action => {
    const cfg = actionConfig[action];
    const btn = document.createElement('button');
    btn.className = `btn ${cfg.cls}`;
    btn.id = `btn-${action}`;
    btn.innerHTML = `${cfg.icon} ${cfg.label}`;
    btn.addEventListener('click', () => handleAction(action, scenario));
    container.appendChild(btn);
  });
}

// ── Action handler ────────────────────────────────────────────────────────────
function handleAction(action, scenario) {
  if (state.answered) return;
  state.answered = true;
  state.chosenAction = action;

  const isCorrect = scenario.correctActions.includes(action);
  if (isCorrect) state.score++;

  document.getElementById('stat-score').textContent = `${state.score}/${state.current + 1}`;

  // Disable all buttons
  document.querySelectorAll('.action-buttons .btn').forEach(b => b.disabled = true);

  // Show explanation
  showExplanation(isCorrect, action, scenario);
}

function showExplanation(isCorrect, action, scenario) {
  const panel = document.getElementById('explanation-panel');
  panel.className = `explanation-panel show ${isCorrect ? 'correct' : 'incorrect'}`;
  panel.style.display = 'flex';

  document.getElementById('result-icon').textContent  = isCorrect ? '✅ Correct!' : '❌ Not Quite';
  document.getElementById('result-icon').parentElement.querySelector('.result-label').textContent =
    isCorrect
      ? 'Good read on that spot.'
      : `You chose: ${action.charAt(0).toUpperCase() + action.slice(1)}`;

  document.getElementById('best-action-value').textContent = scenario.bestAction;
  document.getElementById('explanation-text').innerHTML = scenario.explanation;

  // Scroll into view
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Next scenario ─────────────────────────────────────────────────────────────
function nextScenario() {
  state.current++;
  if (state.current >= state.order.length) {
    showEndScreen();
  } else {
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ── End screen ────────────────────────────────────────────────────────────────
function showEndScreen() {
  document.getElementById('game-area').style.display = 'none';
  const end = document.getElementById('end-screen');
  end.className = 'end-screen show';

  const total = state.order.length;
  const pct   = Math.round((state.score / total) * 100);

  end.querySelector('.end-title').textContent = '🃏 Session Complete!';
  end.querySelector('.end-score-text').textContent = `${state.score}/${total}`;
  end.querySelector('.end-score-circle').style.setProperty('--pct', `${pct}% 100%`);

  let gradeClass, gradeMsg;
  if (pct >= 85) {
    gradeClass = 'grade-A';
    gradeMsg = "Outstanding! You're reading these spots like a seasoned player. Your friends better watch out tomorrow! 🏆";
  } else if (pct >= 70) {
    gradeClass = 'grade-B';
    gradeMsg = "Solid work. You have a good understanding of fundamentals. Review the spots you missed before the game!";
  } else if (pct >= 55) {
    gradeClass = 'grade-C';
    gradeMsg = "Decent — but there are some gaps to tighten up. Re-read the explanations on the spots you missed.";
  } else {
    gradeClass = 'grade-D';
    gradeMsg = "A few chips to plug! Focus on hand strength vs. board texture, and position awareness. You've got this!";
  }

  const gradeEl = end.querySelector('.end-grade');
  gradeEl.textContent = gradeMsg;
  gradeEl.className = `end-grade ${gradeClass}`;
}

// ── Init / restart ────────────────────────────────────────────────────────────
function init() {
  state = {
    current: 0,
    order: shuffle(SCENARIOS.map((_, i) => i)),
    score: 0,
    answered: false,
    chosenAction: null,
  };
  document.getElementById('game-area').style.display = 'block';
  document.getElementById('end-screen').className = 'end-screen';
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Events ────────────────────────────────────────────────────────────────────
document.getElementById('btn-next').addEventListener('click', nextScenario);
document.getElementById('btn-restart').addEventListener('click', init);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (state.answered) {
    if (e.key === 'Enter' || e.key === 'ArrowRight') nextScenario();
    return;
  }
  const scenario = SCENARIOS[state.order[state.current]];
  if (!scenario) return;
  const keyMap = {
    'f': 'fold', 'F': 'fold',
    'c': 'call', 'C': 'call',
    'r': 'raise','R': 'raise',
    'k': 'check','K': 'check',
  };
  const action = keyMap[e.key];
  if (action && scenario.availableActions.includes(action)) {
    handleAction(action, scenario);
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
init();
