# API server for lift.zone

Schema
```

     ┌───────────────┐          ┌───────────────┐       ┌───────────────┐          ┌───────────────┐
     │     users     │          │   workouts    │       │  activities   │          │     sets      │
     ├───────────────┤          ├───────────────┤       ├───────────────┤          ├───────────────┤
     │      id       │          │      id       │       │      id       │          │      id       │
     │    active     │          │    user_id    │       │  workout_id   │          │  activity_id  │
     │     login     │          │     name      │   ┌──▶│useractivity_id│────┐     │      pr       │
     │ password_hash │    ┌────▶│      raw      │───┘   │    comment    │    │     │     reps      │
     │  supertoken   │    │     │     date      │       └───────────────┘    └────▶│    weight     │
     │     name      │────┴────┐│  timestamps   │               ▲                  │     unit      │
     │     email     │         │└───────────────┘ ┌─────────────┘                  │   distance    │
     │   validated   │         │                  │                                │     time      │
     │   smartmode   │         │                  │                                └───────────────┘
     │    public     │         │          ┌───────────────┐
     │  timestamps   │         │          │useractivities │◀────┐
     └───────────────┘         │          ├───────────────┤     │
             │                 │          │      id       │     │
             │                 │          │    user_id    │     │      ┌───────────────┐
             │                 └─────────▶│useractivity_id│◀─┐  └──────│ activitynames │
             │                            │     name      │  │         ├───────────────┤
             │                            │  timestamps   │  │         │     docid     │
             │                            └───────────────┘  │         │     name      │
         ┌───┴──────────────┬──────────────────┐  │          │         └───────────────┘
         │                  │                  │  │          │
         │                  │                  │  └──────────┘
         │                  │                  │
         │                  │                  │
         │                  │                  │
         ▼                  ▼                  ▼
 ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
 │  recoveries   │  │  validations  │  │    invites    │
 ├───────────────┤  ├───────────────┤  ├───────────────┤
 │    user_id    │  │     code      │  │     code      │
 │     code      │  │    user_id    │  │    user_id    │
 │  timestamps   │  │  timestamps   │  │  timestamps   │
 └───────────────┘  └───────────────┘  └───────────────┘
```
