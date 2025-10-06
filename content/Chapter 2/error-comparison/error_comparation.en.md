---
Title: "2.2 - Comparing Absolute Error (L1) vs. Mean Squared Error (L2)"
Weight: 21
Description: "Interactive demo to understand the differences between L1 and L2 error functions and how they affect the evaluation of machine learning models in medical contexts."
Date: 2025-04-17
draft: true
slug: "error-comparison-l1-vs-l2"
---

## Introduction

When developing machine learning models for medical applications, the choice of error function is crucial. This demo will help you visually understand the differences between Mean Absolute Error (L1) and Mean Squared Error (L2), and how each responds differently to outliers.

{{< medical-context
type="research"
level="intermediate"
scenario="You are developing a model to predict blood glucose levels in diabetic patients based on variables such as diet, exercise, and insulin dose. Some patients have extreme or inconsistent values that could affect the model's accuracy."
highlight="The choice between L1 and L2 as the error function determines how the model responds to these outliers. L1 is more robust to outliers, while L2 penalizes large errors more severely, which can be crucial for patient safety."
>}}

{{< demo-wrapper title="L1 vs L2 Error Function Comparison" >}}

{{< error-comparison-game >}}

{{< /demo-wrapper >}}

## Fundamental Concepts

{{% notice style="info" title="Mean Absolute Error (L1 - MAE)" %}}
Mean Absolute Error measures the average of the absolute differences between actual and predicted values:

**Formula**: `MAE = (1/n) × Σ|yi - ŷi|`

**Characteristics:**
- **Robust against outliers**: Extreme values do not dominate the calculation
- **Intuitive interpretation**: Every unit of error counts equally
- **Linear**: The error grows proportionally with the deviation
- **Useful for**: Data with measurement errors or exceptional cases
{{% /notice %}}

{{% notice style="info" title="Mean Squared Error (L2 - MSE)" %}}
The Mean Squared Error measures the average of the squares of the differences:

**Formula**: `MSE = (1/n) × Σ(yi - ŷi)²`

**Characteristics:**
- **Sensitive to outliers**: Large errors are penalized exponentially
- **Precision-boosting**: Aggressively minimizes large deviations
- **Quadratic**: The penalty grows exponentially with the error
- **Useful for**: When large errors are especially costly
{{% /notice %}}

### Selection Guide

{{% notice style="tip" title="When to use L1?" %}}
- **Noisy data**: Presence of many outliers or measurement errors
- **Robustness**: You need a stable and predictable model
- **Error fairness**: Small and large errors have similar importance
- **Interpretability**: You want metrics to be easy to understand
{{% /notice %}}

{{% notice style="tip" title="When to use L2?" %}}
- **Critical Errors**: Large errors are especially problematic
- **Clean Data**: The dataset is relatively reliable
- **Extreme Accuracy**: You need to heavily penalize incorrect predictions
- **Optimization**: L2 is differentiable and facilitates optimization algorithms
{{% /notice %}}

{{% notice style="warning" title="Considerations in Medicine" %}}
In medical applications, the choice is especially critical:

- **Diagnosis**: L2 may be preferable to avoid serious false negatives
- **Dosing**: L1 may be more reliable in the face of inconsistent patient data
- **Monitoring**: L2 to detect critical changes quickly
- **Research**: L1 for robust analysis of heterogeneous populations
{{% /notice %}}

{{< terminal >}}