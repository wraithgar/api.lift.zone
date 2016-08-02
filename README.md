# API server for lift.zone

Colors: http://clrs.cc

Schema
```
                     ┌───────────────┐     ┌────────────────────┐
                     │   workouts    │     │ workout_activities │
                     ├───────────────┤     ├────────────────────┤
┌───────────────┐    │      id       │     │         id         │
│     users     │    │    user_id    │     │     workout_id     │
├───────────────┤    │     name      │  ┌─▶│    activity_id     │───────────────────┐
│      id       │ ┌─▶│      raw      │──┘  │      comment       │                   │
│    active     │ │  │     date      │     │     timestamps     │                   │
│     hash      │ │  │  timestamps   │     └────────────────────┘                   │
│    logout     │ │  └───────────────┘                ▲                             │
│     name      │─┴───────┐                 ┌─────────┘                             │
│     email     │         │                 │              ┌─────────────────────┐  │
│   validated   │         │          ┌─────────────┐       │        sets         │  │
│  preferences  │         │          │ activities  │       ├─────────────────────┤  │
│  timestamps   │         │          ├─────────────┤       │         id          │  │
└───────────────┘         │          │     id      │       │ workout_activity_id │  │
        │                 │          │   user_id   │       │         pr          │  │
        │                 └─────────▶│ activity_id │◀─┐    │        reps         │  │
        │                            │    name     │  │    │       weight        │◀─┘
        │                            │ timestamps  │  │    │        unit         │
        │                            └─────────────┘  │    │      distance       │
        ├───────────────┬───────────────┐   │         │    │        time         │
        │               │               │   │         │    │     timestamps      │
        │               │               │   └─────────┘    └─────────────────────┘
        │               │               │
        │               │               │
        │               │               │
        ▼               ▼               ▼
┌───────────────┐┌─────────────┐┌───────────────┐
│  recoveries   ││ validations ││    invites    │
├───────────────┤├─────────────┤├───────────────┤
│     token     ││    token    ││     token     │
│     email     ││   user_id   ││    user_id    │
│  timestamps   ││ timestamps  ││  timestamps   │
└───────────────┘└─────────────┘└───────────────┘
```
