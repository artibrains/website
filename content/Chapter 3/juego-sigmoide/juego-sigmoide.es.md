---
title: "El Clasificador: Función Sigmoide"
weight: 2
description: "Visualización interactiva para comprender cómo la función sigmoide transforma cualquier combinación lineal en una probabilidad entre 0 y 1, convirtiéndose en la pieza clave de la regresión logística."
date: 2025-04-17
draft: true
slug: "clasificador-funcion-sigmoide"
---

## Introducción

Comprende cómo la función sigmoide transforma cualquier combinación lineal en una probabilidad entre 0 y 1 y se convierte en la pieza clave de la regresión logística. En esta simulación interactiva jugarás a separar pacientes de alto y bajo riesgo ajustando la pendiente y la altura inicial de la curva.

{{< demo-intro 
    title="Simulador: Juego de la Función Sigmoide"
    algorithm_type="Clasificación logística"
    difficulty="intermediate"
    medical_scenario="Has creado un modelo que estima la **probabilidad de complicaciones post‑operatorias** a partir de la edad y la presión arterial de cada paciente (cada punto en el gráfico)." medical_highlight="Tu objetivo es ajustar la línea de decisión y **garantizar** decisiones terapéuticas seguras separando correctamente a los pacientes de *bajo* y *alto* riesgo."
    intro_text="Ajusta la **pendiente** y la **altura inicial** de la curva sigmoide para que tu modelo clasifique con la mayor precisión posible. Observa en tiempo real cómo cambian las métricas de desempeño."
    steps="Minimiza la Log‑Loss:Separa los puntos verdes (sin complicaciones) de los rojos (con complicaciones) ajustando los parámetros de la función sigmoide.|Usa los deslizadores:Modifica la curva sigmoide con los controles. La gráfica y las métricas se actualizarán al instante para mostrar el rendimiento.|Evalúa las métricas:Consulta la **exactitud** y la **pérdida logística** para evaluar la calidad de tu clasificación y encontrar el mejor ajuste."
>}}

## Demostración Interactiva

{{< demo-wrapper title="Simulador de Función Sigmoide" >}}

{{< sigmoid-legend >}}

{{< sigmoid-game >}}

{{< game-results >}}

{{< /demo-wrapper >}}

## Conceptos Fundamentales

### Función Sigmoide

{{% notice style="info" title="¿Qué es la Función Sigmoide?" %}}
La función sigmoide transforma la combinación de nuestros indicadores en una probabilidad entre 0 y 1. Se define como:

$$\sigma(z) = \frac{1}{1 + e^{-z}}, \quad z = w_1 \cdot \text{edad} + w_2 \cdot \text{presión} + b$$

Donde:
- **z** es la combinación lineal de las características
- **σ(z)** es la probabilidad resultante (0 a 1)
- **w₁, w₂** son los pesos de las características
- **b** es el sesgo (bias)
{{% /notice %}}

### Frontera de Decisión y Umbral

{{% notice style="tip" title="Interpretación de Resultados" %}}
La función sigmoide convierte el valor z en una probabilidad entre 0 y 1. El umbral (por defecto 0.5) determina cuándo un paciente se clasifica como "alto riesgo":

- Si la probabilidad > umbral → Clasificar como **"alto riesgo"** (rojo)
- Si la probabilidad ≤ umbral → Clasificar como **"bajo riesgo"** (verde)

Ajustar el umbral permite ser más o menos estricto en la clasificación. Un umbral más alto requiere más evidencia para clasificar a alguien como "alto riesgo".
{{% /notice %}}

{{< terminal >}}
