---
title: "2.2 - Comparando Error Absoluto (L1) vs Error Cuadrático (L2)"
weight: 21
description: "Demostración interactiva para comprender las diferencias entre las funciones de error L1 y L2, y cómo afectan la evaluación de modelos de machine learning en contextos médicos."
date: 2025-04-17
draft: true
slug: "comparacion-error-l1-vs-l2"
---

## Introducción

Cuando desarrollamos modelos de machine learning para aplicaciones médicas, la elección de la función de error es crucial. Esta demostración te ayudará a comprender visualmente las diferencias entre el Error Absoluto Medio (L1) y el Error Cuadrático Medio (L2), y cómo cada uno responde de manera diferente a los valores atípicos o outliers.

{{< medical-context 
    type="research" 
    level="intermediate" 
    scenario="Estás desarrollando un modelo para predecir el nivel de glucosa en sangre en pacientes diabéticos a partir de variables como la dieta, el ejercicio y la dosis de insulina. Algunos pacientes presentan valores extremos o inconsistentes que podrían afectar la precisión del modelo."
    highlight="La elección entre L1 y L2 como función de error determina cómo el modelo responde a estos casos atípicos. L1 es más robusto ante outliers, mientras que L2 penaliza más severamente los errores grandes, lo que puede ser crucial para la seguridad del paciente."
>}}


{{< demo-wrapper title="Comparador de Funciones de Error L1 vs L2" >}}

{{< error-comparison-game >}}

{{< /demo-wrapper >}}

## Conceptos Fundamentales

{{% notice style="info" title="Error Absoluto Medio (L1 - MAE)" %}}
El Error Absoluto Medio mide la media de las diferencias absolutas entre los valores reales y los predichos:

**Fórmula**: `MAE = (1/n) × Σ|yi - ŷi|`

**Características:**
- **Robusto frente a outliers**: Los valores extremos no dominan el cálculo
- **Interpretación intuitiva**: Cada unidad de error cuenta por igual  
- **Lineal**: El error crece proporcionalmente con la desviación
- **Útil para**: Datos con errores de medición o casos excepcionales
{{% /notice %}}

{{% notice style="info" title="Error Cuadrático Medio (L2 - MSE)" %}}
El Error Cuadrático Medio mide la media de los cuadrados de las diferencias:

**Fórmula**: `MSE = (1/n) × Σ(yi - ŷi)²`

**Características:**
- **Sensible a outliers**: Los errores grandes se penalizan exponencialmente
- **Favorece precisión**: Minimiza desviaciones grandes agresivamente
- **Cuadrático**: El castigo crece exponencialmente con el error
- **Útil para**: Cuando errores grandes son especialmente costosos
{{% /notice %}}

### Guía de Selección

{{% notice style="tip" title="¿Cuándo usar L1?" %}}
- **Datos ruidosos**: Presencia de muchos outliers o errores de medición
- **Robustez**: Necesitas un modelo estable y predecible
- **Equidad en errores**: Errores pequeños y grandes tienen similar importancia
- **Interpretabilidad**: Quieres que las métricas sean fáciles de entender
{{% /notice %}}

{{% notice style="tip" title="¿Cuándo usar L2?" %}}
- **Errores críticos**: Los errores grandes son especialmente problemáticos
- **Datos limpios**: El conjunto de datos es relativamente confiable
- **Precisión extrema**: Necesitas penalizar fuertemente predicciones incorrectas
- **Optimización**: L2 es diferenciable y facilita algoritmos de optimización
{{% /notice %}}

{{% notice style="warning" title="Consideraciones en Medicina" %}}
En aplicaciones médicas, la elección es especialmente crítica:

- **Diagnóstico**: L2 puede ser preferible para evitar falsos negativos graves
- **Dosificación**: L1 puede ser más seguro ante datos inconsistentes del paciente
- **Monitoreo**: L2 para detectar cambios críticos rápidamente
- **Investigación**: L1 para análisis robustos de poblaciones heterogéneas
{{% /notice %}}

{{< terminal >}}
