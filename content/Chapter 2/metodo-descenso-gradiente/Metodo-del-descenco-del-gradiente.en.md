---
title: "2.5 - The Gradient Descent Method"
description: "Learn how the gradient descent algorithm finds minimum points of complex functions to optimize machine learning models."
weight: 51
draft: true
slug: "gradient-descent-method"
---

## Introduction

The **Gradient Descent Method** is the fundamental algorithm that allows machine learning models to "learn" by finding optimal values for their parameters. It works like an explorer searching for the lowest point on a mountain by always following the direction of greatest descent.

{{< demo-intro
title="Gradient Descent Algorithm"
algorithm_type="Optimization"
difficulty="intermediate"
medical_scenario="A medical researcher needs to adjust multiple parameters of a model that predicts the effectiveness of treatments. They must find the optimal combination that minimizes prediction error among thousands of possibilities."
medical_highlight="Gradient descent allows you to automatically find the optimal parameter settings for your medical model, optimizing the accuracy of predictions without having to manually test every possible combination."
intro_text="**Gradient descent** is like having a GPS that always points 'downhill' in the mathematical landscape of your problem. The algorithm follows this direction step by step until it finds the deepest valley."
steps="Observe the Exploration: See how the algorithm moves across the surface of the function, always following the direction of greatest descent according to the gradient.|Adjust the Parameters: Experiment with the learning rate to see how it affects the speed and stability of convergence.|Analyze the Convergence: Observe how the gradient norm decreases, indicating that it is approaching the minimum, and when the algorithm decides to stop."
>}}

## Interactive Demo

{{< demo-wrapper title="Explorador del Descenso del Gradiente" >}}

{{< descenso-gradiente_intro_es >}}

{{< descenso-gradiente >}}

{{< /demo-wrapper >}}

## Fundamental Concepts

### What is the Gradient?

{{% notice style="info" title="The Gradient as a Mathematical Compass" %}}
The **gradient** (∇f) is a vector that points in the direction of greatest growth of a function. In optimization:

- **Direction**: Indicates where the function grows most rapidly
- **Magnitude**: Its length indicates how steep the gradient is
- **Descent**: To minimize, we go in the **opposite** direction of the gradient
{{% /notice %}}

### Stopping Criterion

{{% notice style="tip" title="When to Stop?" %}}
#### Gradient Norm (|∇f|)

Think of the gradient as an arrow indicating the steepest climb. The **norm** is simply the length of that arrow:

- **Long arrow** → Steep slope → Continue optimizing
- **Short arrow** → Flat terrain → Near the minimum
- **Criterion**: Stop when |∇f| < tolerance (e.g., 0.001)

This tells us that we've reached the "valley" where the terrain is almost flat.
{{% /notice %}}

### Key Parameters

{{% notice style="warning" title="Learning Rate" %}}
- **Too high**: The algorithm may "jump" over the minimum

- **Too low**: Very slow convergence

- **Optimal**: Balance between speed and accuracy
{{% /notice %}}

{{< terminal >}}