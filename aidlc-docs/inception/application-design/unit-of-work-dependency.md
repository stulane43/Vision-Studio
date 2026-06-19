# Unit of Work — Dependency Matrix

| Unit | Depends on | Blocks | Can build in parallel with |
|---|---|---|---|
| **U1** Foundation & Retro Kit | — | U5 | U2, U3 |
| **U2** Domain/Engine/Storage | — (pure) | U4, U6 | U1, U3 |
| **U3** Providers & Content | U2 (types) | U4, U6 | U1 |
| **U4** Service & API | U2, U3, U7-sec | U5 | — |
| **U5** Views & Integration | U1, U4 | U6 (browser/export UI) | — |
| **U6** Code Generation | U2, U3, U4, U5 | — | — |
| **U7** Tests/Build | tracks each unit | release | — |

## Notes
- **Critical path**: U2 → U3 → U4 → U5 (the functional spine). U1 (UI kit) can be built alongside U2/U3 and is required before U5.
- **Security kit (part of U2/U7)** is a dependency of U4 (validation) and U3/U4 (logging) — landed early in U2.
- **Parallelization opportunity**: U1 (presentational) and U2 (pure core) and U3 (adapters) have no runtime coupling and may be built concurrently; they converge at U4/U5.
- **U6** is intentionally last and isolated so the MVP loop (U1–U5) is shippable without it.

## Integration Checkpoints
1. After U2: engine + storage round-trip tested (create run → persist → reload).
2. After U3: Mock provider drives a stage end-to-end in isolation.
3. After U4: API returns a real `StageResult` for the first stage.
4. After U5: full UI loop (idea → vision → stages → gates) runs with Mock provider.
5. After U6: code-gen writes files + build/test feedback.
