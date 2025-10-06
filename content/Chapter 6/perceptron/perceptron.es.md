---
title: "El Perceptrón: La Neurona Artificial"
description: "Simulador interactivo del Perceptrón, el bloque de construcción fundamental de las redes neuronales."
weight: 1
date: 2025-04-17
draft: true
slug: "perceptron-neurona-artificial"
---

## Introducción

El **Perceptrón** es el modelo más simple de una neurona artificial y el bloque de construcción histórico de las redes neuronales. Concebido en la década de 1950, es un clasificador lineal binario: toma varias entradas, las pondera, las suma y, si el resultado supera un cierto umbral, "dispara" una salida (normalmente 1); de lo contrario, emite otra (normalmente 0 o -1).

{{< medical-context 
    type="clinic" 
    level="beginner" 
    scenario="Un patólogo necesita clasificar células de una biopsia como \"benignas\" o \"malignas\" basándose en dos características medibles, como el tamaño del núcleo y la uniformidad de la célula."
    highlight="Un Perceptrón puede aprender una \"regla de decisión\" lineal a partir de estos dos marcadores. El objetivo es trazar una línea que separe de la mejor manera posible los dos tipos de células, creando un sistema de apoyo al diagnóstico rápido y automatizado."
>}}

## Demostración Interactiva

{{< demo-wrapper title="Simulador del Perceptrón" >}}

{{< perceptron >}}

{{< /demo-wrapper >}}

## Conceptos Fundamentales

{{% notice style="info" title="¿Cómo funciona el Perceptrón?" %}}
El perceptrón es la unidad computacional más básica de las redes neuronales:

1. **Recibe entradas**: Toma las características del caso a clasificar (x₁, x₂, ..., xₙ)
2. **Aplica pesos**: Multiplica cada entrada por su peso correspondiente (w₁, w₂, ..., wₙ)
3. **Suma ponderada**: Calcula `z = w₁x₁ + w₂x₂ + ... + wₙxₙ + b` (donde b es el sesgo)
4. **Función de activación**: Si z > 0, predice clase 1; si z ≤ 0, predice clase -1
{{% /notice %}}

{{% notice style="tip" title="Algoritmo de Aprendizaje" %}}
El perceptrón aprende mediante el **algoritmo de corrección de errores**:

- **Clasificación correcta**: No cambia nada, mantiene los pesos actuales
- **Error detectado**: Ajusta los pesos para corregir el error específico
- **Regla de actualización**: `w = w + η(y_real - y_predicho)x`
- **Convergencia**: Garantizada para datos linealmente separables

El **Pocket Perceptron** mejora esto manteniendo la mejor solución encontrada, útil para datos no separables.
{{% /notice %}}

{{% notice style="warning" title="Limitaciones Fundamentales" %}}
- **Separabilidad lineal**: Solo puede clasificar datos separables por una línea recta
- **Problemas no lineales**: No puede resolver funciones como XOR sin capas adicionales
- **Datos complejos**: Limitado para patrones que requieren fronteras de decisión curvas
- **Una sola neurona**: Necesita múltiples perceptrones para problemas más complejos
{{% /notice %}}

{{% notice style="tip" title="Fundamento Histórico" %}}
Aunque simple, el perceptrón es fundamental para entender las redes neuronales modernas. Es la unidad básica que, cuando se combina con otras en múltiples capas, puede resolver problemas mucho más complejos y crear sistemas de inteligencia artificial sofisticados.
{{% /notice %}}

{{< terminal >}}