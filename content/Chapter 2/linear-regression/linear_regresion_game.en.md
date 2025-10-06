---
title: "2.1 - Linear Regression Game"
description: "Learn linear regression interactively by finding the best line that predicts continuous outcomes."
weight: 11
draft: true
slug: "linear-regression-game"
---

## Introduction

Linear regression allows us to find the best relationship between different variables to predict continuous outcomes when the variables are linearly related. It is one of the fundamental algorithms in machine learning and the basis for understanding more complex methods.

{{< demo-intro
title="Interactive Linear Regression Game"
algorithm_type="Supervised Regression"
difficulty="beginner"
medical_scenario="A medical researcher wants to predict the optimal dose of a drug based on a patient's weight. Using historical data from previous patients, he needs to find the mathematical relationship that best describes this relationship."
medical_highlight="Linear regression allows you to find the 'line of best fit' that minimizes prediction errors. In medicine, this translates into more accurate dosing protocols, reducing both the risk of underdosing (ineffectiveness) and overdosing (toxicity)."
intro_text="Linear regression is one of the fundamental algorithms in machine learning. It finds the best straight line that passes as close as possible to all data points, allowing you to make accurate predictions about new cases."
steps="Adjust Parameters: Move the sliders to change the slope and intercept of the line. Observe how the total error and the quality of fit change. | Compare Error Metrics: Experiment with different metrics (L1 vs. L2) to understand how each evaluates model quality differently. | Find the Optimal Solution: Use the 'Find Best Fit' button to have the algorithm automatically calculate the optimal parameters that minimize error."
>}}

{{< demo-wrapper title="Linear Regression Optimizer" >}}

{{< game-results >}}

{{< linear-regression-game >}}

{{< /demo-wrapper >}}

## Fundamental Concepts

### Error Methods

{{% notice style="info" title="Types of Error Metrics" %}}
There are two main ways to measure how well our prediction line fits the data:

**Mean Absolute Error (L1)**
: Calculates the average of the absolute differences between predicted and actual values. It is more robust against outliers and is preferred when the data is noisy.

**Mean Squared Error (L2)**
: Calculates the average of the squared differences between predicted and actual values. It penalizes large errors more and is the most common method in linear regression.
{{% /notice %}}

{{% notice style="tip" title="Optimization Strategies" %}}
- **Manual Tuning**: Allows you to intuitively understand how parameters affect the fit
- **Automatic Optimization**: The algorithm finds the optimal parameters by minimizing the error function
- **Visual Validation**: Observe how the line fits the data to detect problems
{{% /notice %}}

{{< terminal >}}