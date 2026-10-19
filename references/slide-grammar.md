# Slide grammar

## Required internal metadata

```json
{
  "id": "index-focus",
  "type": "process",
  "contentRole": "explain a snapshot",
  "goal": "Understand that add copies the current content into the index",
  "primaryObject": "index-snapshot",
  "precedingRelationship": "overview-to-detail",
  "followingRelationship": "cause-to-effect",
  "interactionType": "stepper",
  "transitionIntent": "shared",
  "sharedElementIdentifiers": ["index-snapshot"],
  "source": "user material + technical verification"
}
```

IDs are stable logical names, not array indices. Headings, body, diagrams and notes stay outside the motion engine. `data-shared` corresponds to sharedElementIdentifiers. `data-transition` supplies a recipe. `data-layer` identifies semantic foreground/background for parallax. `data-reveal` identifies sequential content. Preserve a reading order independent of animated order.

## Layout families

1. Cinematic intro: short display title, supporting sentence, one relevant object.
2. Concept focus: a definition plus spatial representation.
3. Open comparison: two aligned columns with same criteria.
4. Process canvas: stable nodes, edges, state caption, bottom stepper.
5. Terminal walkthrough: dark code surface, expected outcome, next action.
6. Timeline: durable historical nodes and movable pointer; newest item does not erase history.
7. Architecture: overview, detail focus, explicit return path.
8. Evidence: authentic media with proportionate crop, source caption and full-size view.
9. Data statement: one large measure + units, source and context; labeled chart when comparison matters.
10. Closing map: reconnect the major objects to one result.

Use layout primitives in `core/tokens.css`, component constructors in `core/components.js`, and a separate deck-specific stylesheet for new compositions. The scaffold is a launch point; adding a new domain does not require editing core navigation. Facts in examples are not reusable defaults.

Do not duplicate all content into decorative windows. Limit the visual focus to one primary object plus its context. Reserve room for state captions so interaction does not change the whole page height. Static and reduced-motion frames must communicate the same information.
