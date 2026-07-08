// Workout preset library.
// type "reps" logs sets × reps × kg; type "time" logs sets × seconds.
const WORKOUT_PRESETS = [
  {
    id: "fullbody",
    name: "Full Body — Dumbbells",
    emoji: "🏋️",
    desc: "Hits every big muscle group with just a pair of dumbbells. Rest 60–90s between sets.",
    exercises: [
      { name: "Goblet Squat", target: "3×12", type: "reps",
        how: "Hold one dumbbell with both hands against your chest. Feet shoulder-width apart. Squat down until your thighs are parallel to the floor, chest up, then push through your heels to stand." },
      { name: "Floor Press", target: "3×10", type: "reps",
        how: "Lie on your back with knees bent, a dumbbell in each hand at chest level. Press straight up until your arms are extended, lower slowly until your upper arms touch the floor." },
      { name: "Bent-over Row", target: "3×10", type: "reps",
        how: "Hinge forward at the hips with a flat back, dumbbells hanging down. Pull them to your ribs, squeeze your shoulder blades together, lower with control." },
      { name: "Shoulder Press", target: "3×10", type: "reps",
        how: "Stand tall, dumbbells at shoulder height, palms forward. Press straight up until your arms are extended. Keep your core tight — don't arch your lower back." },
      { name: "Romanian Deadlift", target: "3×12", type: "reps",
        how: "Dumbbells in front of your thighs. Push your hips back with a flat back and soft knees until you feel a stretch in your hamstrings, then drive your hips forward to stand." },
      { name: "Bicep Curl", target: "3×12", type: "reps",
        how: "Elbows pinned to your sides. Curl the dumbbells up without swinging your body, squeeze at the top, lower slowly." }
    ]
  },
  {
    id: "upper",
    name: "Upper Body — Dumbbells",
    emoji: "💪",
    desc: "Chest, back, shoulders and arms. Rest 60–90s between sets.",
    exercises: [
      { name: "Floor Press", target: "4×10", type: "reps",
        how: "Lie on your back with knees bent. Press the dumbbells from chest level straight up, lower slowly until your upper arms touch the floor." },
      { name: "One-arm Row", target: "3×12 each side", type: "reps",
        how: "Support yourself with one hand on a chair or bench, back flat. Pull the dumbbell up to your hip in one line, lower with control. Switch sides." },
      { name: "Shoulder Press", target: "3×10", type: "reps",
        how: "Stand tall, dumbbells at shoulder height. Press up until your arms are extended, don't arch your back." },
      { name: "Lateral Raise", target: "3×15", type: "reps",
        how: "Stand with dumbbells at your sides, elbows slightly bent. Raise your arms out to the side up to shoulder height, then lower slowly. Use light weight — form beats ego." },
      { name: "Bicep Curl", target: "3×12", type: "reps",
        how: "Elbows at your sides, curl up without swinging, lower slowly." },
      { name: "Overhead Triceps Extension", target: "3×12", type: "reps",
        how: "Hold one dumbbell with both hands above your head. Lower it behind your head by bending your elbows, then extend your arms back up. Keep your elbows pointing forward." }
    ]
  },
  {
    id: "lower",
    name: "Lower Body — Dumbbells",
    emoji: "🦵",
    desc: "Legs and glutes. Your legs are half your body — train them. Rest 60–90s.",
    exercises: [
      { name: "Goblet Squat", target: "4×12", type: "reps",
        how: "Dumbbell against your chest, feet shoulder-width. Squat until thighs are parallel, chest up, push through your heels." },
      { name: "Walking Lunges", target: "3×10 each leg", type: "reps",
        how: "Dumbbells at your sides. Take a big step forward and lower your back knee toward the floor, then push off into the next step. Keep your torso upright." },
      { name: "Romanian Deadlift", target: "3×12", type: "reps",
        how: "Push your hips back with a flat back until your hamstrings stretch, then stand back up by driving your hips forward." },
      { name: "Bulgarian Split Squat", target: "3×8 each leg", type: "reps",
        how: "Rear foot up on a couch or chair, front foot far forward. Lower straight down until your front thigh is parallel, then push back up. Brutal but effective." },
      { name: "Glute Bridge", target: "3×15", type: "reps",
        how: "Lie on your back, knees bent, dumbbell resting on your hips. Drive your hips up until your body is a straight line, squeeze your glutes hard at the top." },
      { name: "Calf Raises", target: "3×20", type: "reps",
        how: "Stand with dumbbells at your sides. Rise up onto your toes as high as you can, pause, lower slowly." }
    ]
  },
  {
    id: "core",
    name: "Core & Planks",
    emoji: "🧱",
    desc: "A strong core protects your back and shows discipline like nothing else. Rest 30–45s.",
    exercises: [
      { name: "Plank", target: "3×30–60s", type: "time",
        how: "Forearms on the floor, elbows under your shoulders. Your body is one straight line from head to heels — squeeze your abs and glutes, don't let your hips sag or pike up. Breathe." },
      { name: "Side Plank", target: "3×20–30s each side", type: "time",
        how: "On one forearm, feet stacked, hips lifted so your body forms a straight line. Hold, then switch sides." },
      { name: "Plank Shoulder Taps", target: "3×20 taps", type: "reps",
        how: "In a high plank (on your hands), tap your left shoulder with your right hand and alternate. Keep your hips completely still — that's the whole exercise." },
      { name: "Dead Bug", target: "3×10 each side", type: "reps",
        how: "Lie on your back, arms straight up, knees bent 90°. Slowly lower your opposite arm and leg toward the floor while pressing your lower back down. Return and switch." },
      { name: "Russian Twist", target: "3×20", type: "reps",
        how: "Sit with knees bent, lean back slightly, hold a dumbbell with both hands. Rotate your torso side to side with control — the movement comes from your core, not your arms." },
      { name: "Leg Raises", target: "3×12", type: "reps",
        how: "Lie flat, hands under your hips. Raise your straight legs to vertical, then lower them slowly without letting your lower back arch off the floor." },
      { name: "Mountain Climbers", target: "3×30s", type: "time",
        how: "In a high plank, drive your knees toward your chest one at a time, fast but controlled. Keep your hips low." }
    ]
  },
  {
    id: "cardio",
    name: "Cardio & Conditioning",
    emoji: "🔥",
    desc: "No equipment needed. Short, sweaty, done. Rest 30–60s between rounds.",
    exercises: [
      { name: "Jumping Jacks", target: "3×45s", type: "time",
        how: "Jump your feet out while raising your arms overhead, jump back in. Steady rhythm, light on your feet." },
      { name: "High Knees", target: "3×30s", type: "time",
        how: "Run in place driving your knees up to hip height. Pump your arms. Stay on the balls of your feet." },
      { name: "Burpees", target: "3×10", type: "reps",
        how: "Squat down, kick your feet back into a plank, jump your feet back in, jump up with arms overhead. The exercise everyone hates because it works." },
      { name: "Shadow Boxing", target: "3×60s", type: "time",
        how: "Fists up, light bounce on your feet. Throw combinations — jab, cross, hook — with rotation from your hips. Move around like there's an opponent." },
      { name: "Squat Jumps", target: "3×12", type: "reps",
        how: "Squat down to parallel, then explode up into a jump. Land soft with bent knees straight into the next rep." }
    ]
  }
];
