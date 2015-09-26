# API server for lift.zone

Schema
```
┌───────────────┐     ┌───────────────┐    ┌───────────────┐   ┌───────────────┐
│     users     │     │   workouts    │    │  activities   │   │     sets      │
├───────────────┤     ├───────────────┤    ├───────────────┤   ├───────────────┤
│      id       │     │      id       │    │      id       │   │      id       │
│    active     │     │    user_id    │    │  workout_id   │   │  activity_id  │
│     login     │     │     name      │ ┌─▶│useractivity_id│─┐ │      pr       │
│ password_hash │  ┌─▶│      raw      │─┘  │    comment    │ │ │     reps      │
│  supertoken   │  │  │     date      │    │  timestamps   │ └▶│    weight     │
│     name      │  │  │  timestamps   │    └───────────────┘   │     unit      │
│     email     │  │  └───────────────┘            ▲           │   distance    │
│   validated   │──┴────────┐                   ┌──┘           │     time      │
│   smartmode   │           │                   │              │  timestamps   │
│    public     │           │           ┌───────────────┐      └───────────────┘
│  timestamps   │           │           │useractivities │◀─┐   ┌───────────────┐
└───────────────┘           │           ├───────────────┤  └───│ activitynames │
        │                   │           │      id       │      ├───────────────┤
        │                   │           │    user_id    │      │     docid     │
        │                   └──────────▶│useractivity_id│◀─┐   │     name      │
        │                               │     name      │  │   └───────────────┘
        │                               │  timestamps   │  │
        │                               └───────────────┘  │
        ├────────────────┬────────────────┐     │          │
        │                │                │     │          │
        │                │                │     └──────────┘
        │                │                │
        │                │                │
        │                │                │
        ▼                ▼                ▼
┌───────────────┐┌───────────────┐┌───────────────┐
│  recoveries   ││  validations  ││    invites    │
├───────────────┤├───────────────┤├───────────────┤
│    user_id    ││     code      ││     code      │
│     code      ││    user_id    ││    user_id    │
│  timestamps   ││  timestamps   ││  timestamps   │
└───────────────┘└───────────────┘└───────────────┘
```
