---
title: "1.4 Interactive Game: Mouse and Cheese (Reinforcement Learning)"
description: "An interactive simulation to understand how Artificial Intelligence learns through reinforcement."
date: 2023-10-27
weight: 51
slug: "mouse-cheese-reinforcement-learning"
---

## Introduction

Reinforcement Learning is a type of AI that learns to make decisions through trial and error, similar to how an animal learns to navigate a maze to find food. The "agent" (our mouse) explores an environment and receives "rewards" for actions that bring it closer to its goal.

{{< demo-intro 
    lang="en"
    title="Mouse and Cheese: Reinforcement Learning"
    medical_scenario="The mouse must learn to find the cheese on a board."
    medical_highlight="explores different strategies, focusing on actions that lead to getting cheese. When a sequence leads to success, that route is positively reinforced. Over time, it learns the most efficient strategy."
    intro_text="**Reinforcement Learning** allows AI to discover the best strategies by itself without needing pre-labeled examples, only through experience and environmental feedback."
    steps="The agent must choose a sequence of actions to reach an objective, navigating through a space of possible states.|Actions that lead to success are positively reinforced, becoming more likely in the future.|Extensive training allows finding consistently effective and robust strategies."
>}}

{{< raton-queso-game lang="en" >}} 

## Fundamental Theoretical Concepts

### Elements of Reinforcement Learning

{{% notice style="info" title="Basic Components" %}}
- **Agent:** The mouse that makes decisions
- **Environment:** The board with squares, cheese and traps
- **States:** Each position (row, column) on the board
- **Actions:** Possible movements (↑↓←→)
- **Rewards:** Positive feedback (cheese) or negative (trap)
- **Policy:** The learned strategy for choosing actions
{{% /notice %}}

### Learning Methodology

{{% notice style="tip" title="Reinforcement Process" %}}
1. **Initial exploration:** The agent takes semi-random actions based on equiprobable probabilities
2. **Experience:** Each trajectory generates a state-action-reward sequence
3. **Update:** Successful actions increase their selection probability
4. **Convergence:** Gradually, an optimal policy emerges
{{% /notice %}}

## Block Training: Statistical Robustness

{{% notice style="warning" title="Why Train in Independent Blocks?" %}}
Block training (10 experiments × 100 games) simulates a rigorous scientific process:

- **Cross-validation:** Each block is an independent experiment that should reach similar conclusions
- **Variance reduction:** Multiple experiments minimize the effect of initial randomness
- **Robust convergence:** Ensures learning doesn't depend on specific initial conditions
- **Knowledge aggregation:** The final result combines learning from multiple "virtual agents"
{{% /notice %}}

### Real-World Applications

This type of reinforcement learning has direct applications in:

- **Personalized medicine:** Optimization of treatment protocols
- **Robotics:** Autonomous navigation in complex environments  
- **Finance:** Adaptive trading strategies
- **Games:** Development of AI that surpasses human players (AlphaGo, OpenAI Five)

{{< terminal lang="en" >}}
