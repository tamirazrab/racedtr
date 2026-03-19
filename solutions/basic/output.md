Here's the output:

=== LEVEL 1: PitGPT Lap Analysis ===
{
  "problemSector": 2,
  "issue": "traction_loss",
  "timeLost": 1.198,
  "coachingMessage": "Sector 2 is where the lap falls apart — 1.198 lost. TC is fighting you, tyres are sliding. Smooth the throttle on exit. Don't ask for grip that isn't there."
}

--- Validation ---
✅ problemSector
✅ issue
✅ timeLost
✅ coachingMessage

✅ Analysis correct.

=== LEVEL 2: Stint Analysis ===

--- Per-Lap Breakdown ---

Stint Lap 1 | Total delta: +1.655s
  Worst sector: S2 | Issue: traction_loss | Lost: +1.198s
  Coach: "Sector 2 is where the lap falls apart — 1.198 lost. TC is fighting you, tyres are sliding. Smooth the throttle on exit. Don't ask for grip that isn't there."
  All findings:
    S2 (+1.198s) — traction_loss: TC active, peak slip 0.134, full throttle only 62%
    S1 (+0.387s) — late_braking: No single clear cause — general time loss through sector
    S3 (+0.070s) — late_braking: No single clear cause — general time loss through sector

Stint Lap 14 | Total delta: +3.429s
  Worst sector: S2 | Issue: traction_loss | Lost: +2.316s
  Coach: "Sector 2 is where the lap falls apart — 2.316 lost. TC is fighting you, tyres are sliding. Smooth the throttle on exit. Don't ask for grip that isn't there."
  All findings:
    S2 (+2.316s) — traction_loss: TC active, peak slip 0.168, full throttle only 49%
    S1 (+0.902s) — early_lift: Throttle lift detected before braking zone. Full throttle: 71%
    S3 (+0.211s) — early_lift: Throttle lift detected before braking zone. Full throttle: 68%

--- Stint Patterns ---
  S1: late_braking | trend: worsening | delta change: +0.515s
    S1 late braking — L1: +0.387s, L14: +0.902s
  S2: traction_loss | trend: worsening | delta change: +1.118s
    S2 traction loss — L1: +1.198s, L14: +2.316s
  S3: late_braking | trend: worsening | delta change: +0.141s
    S3 late braking — L1: +0.070s, L14: +0.211s

--- Stint Summary ---
Stint laps 1–14. Total delta went from +1.655s to +3.429s. That's +1.774s of degradation across the stint. Sector 2 is where it's falling apart. traction loss on lap 1 (+1.198s) has become traction loss by lap 14 (+2.316s). TC is fighting through both Raidillon and Pouhon. The tyre isn't giving grip on exit anymore. The damage is spreading. S1 shifted from late braking → early lift by stint lap 14. S3 shifted from late braking → early lift by stint lap 14. That's the driver managing — they know the rear is gone, so they're lifting earlier in other sectors to protect the tyres into the high-speed stuff. That's discipline, but it's not a fix. Box this lap. The tyre is done. Pushing further is pace you won't get back.

Recommendation: BOX