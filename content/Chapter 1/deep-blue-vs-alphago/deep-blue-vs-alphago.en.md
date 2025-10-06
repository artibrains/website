---
title: "1.5 Deep Blue vs AlphaGo"
description: "Technical comparison between Deep Blue and AlphaGo, two milestones in the history of artificial intelligence."
weight: 71
date: 2025-04-18
slug: "deep-blue-vs-alphago"
---

# Deep Blue vs AlphaGo

## History of Deep Blue and AlphaGo

### Deep Blue

Deep Blue began as a project called "Deep Thought" at Carnegie Mellon University in 1985. It was developed by three graduate students: Feng-hsiung Hsu, Murray Campbell and Thomas Anatharaman. The project evolved with IBM's support, which invested 10 million dollars to turn it into a machine capable of competing against humans in chess.

In 1996, Deep Blue faced world chess champion Garry Kasparov, losing the match with a score of 4:2. However, after a year of improvements, Deep Blue managed to beat Kasparov in 1997, becoming the first machine to defeat a world champion in a standard match. This achievement was possible thanks to its ability to calculate 200 million positions per second, using 480 chess-specialized processors.

{{< youtube-video url="https://www.youtube.com/watch?v=KF6sLCeBj0s" id="KF6sLCeBj0s" alt="Deep Blue vs Kasparov" caption="An analysis of the historic confrontation between Deep Blue and Garry Kasparov in 1997." >}}

### AlphaGo

AlphaGo, developed by DeepMind, marked a completely different approach from Deep Blue. Instead of relying on predefined rules and brute force, AlphaGo used deep neural networks and reinforcement learning. Its supervised learning policy was based on millions of games played by humans, while its value network evaluated positions to determine the best moves.

AlphaGo surprised the world in 2016 by defeating Go world champion Lee Sedol, in a game that many considered too complex for machines due to its vast search space.

{{< youtube-video url="https://www.youtube.com/watch?v=NP8xt8o4_5Q" id="NP8xt8o4_5Q" alt="AlphaGo vs Lee Sedol" caption="A summary of the iconic match where AlphaGo defeated world champion Lee Sedol." >}}

Unlike Deep Blue, AlphaGo didn't try to predict all possible outcomes, but rather analyzed positions and made decisions based on success probabilities.

{{< youtube-video url="https://www.youtube.com/watch?v=WXuK6gekU1Y&t=1s" id="WXuK6gekU1Y" alt="How AlphaGo works" caption="A technical explanation about the algorithms behind AlphaGo." >}}

### Impact

While Deep Blue demonstrated machines' ability to surpass humans in specific tasks through brute force, AlphaGo represented a paradigm shift by showing how machines can learn and develop strategies beyond human understanding. Both milestones have inspired significant advances in artificial intelligence and machine learning.

## Technical comparison of two milestones in Artificial Intelligence history.

| Category             | Deep Blue (Chess)                       | AlphaGo (Go)                                  |
| -------------------- | --------------------------------------- | --------------------------------------------- |
| Board                | 8x8                                     | 19x19                                         |
| Moves per turn       | ~35                                     | ~250                                          |
| Possible games       | ~10¹²⁰  This number is known as the **Shannon Number**, a classic estimation of chess complexity.                                  | \>10⁷⁶⁰ The number of possible Go games is so large that it exceeds the number of atoms in the observable universe.                                  |
| Paradigm             | Search + human heuristics               | Deep learning + Monte Carlo search            |
| Decision model       | Deterministic (no learning)            | Data-based, learns through reinforcement     |
| Processing           | ~200 million positions/second           | Thousands of intelligent evaluations/second  |
| Key elements         | - Alpha-beta search - Manual evaluation - Opening/endgame databases | - Policy network - Value network - Monte Carlo Tree Search |
| Historical significance | Dominates with brute force a complex but manageable space | Learns emergent strategies in an unmanageable space |

In summary, Deep Blue and AlphaGo represent two distinct approaches to artificial intelligence: one based on brute force and expert knowledge, and the other on deep learning and exploration. Both achieved impressive milestones in their respective fields and have paved the way for future advances in AI. Both systems, although different in their approach, have demonstrated the potential of artificial intelligence to address complex problems. Deep Blue and AlphaGo not only marked milestones in their respective fields, but also opened the path for future innovations in machine learning and artificial intelligence.

## References

- [IBM's Deep Blue vs Google's AlphaGo - Rebellion Research](https://blog.rebellionresearch.com/blog/ibm-s-deep-blue-vs-google-s-alphago-gary-kasparov)
- [Deep Blue - IBM Research](https://www.ibm.com/ibm/history/ibm100/us/en/icons/deepblue/)
- [AlphaGo - DeepMind](https://deepmind.com/research/highlighted-research/alphago)
