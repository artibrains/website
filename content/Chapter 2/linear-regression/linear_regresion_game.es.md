---
title: "2.1 - Juego de Regresión Lineal"
description: "Aprende regresión lineal de forma interactiva encontrando la mejor línea que prediga resultados continuos."
weight: 11
draft: true
slug: "juego-regresion-lineal"
---

## Introducción

La regresión lineal nos permite encontrar la mejor relación entre diferentes variables para predecir resultados continuos cuando las variables están relacionadas linealmente. Es uno de los algoritmos fundamentales en machine learning y la base para entender métodos más complejos.

{{< medical-context 
    type="research"  
    difficulty="beginner"
    scenario="Un investigador médico quiere predecir la dosis óptima de un medicamento basándose en el peso del paciente. Usando datos históricos de pacientes anteriores, necesita encontrar la relación matemática que mejor describa esta relación."
    highlight="La regresión lineal permite encontrar la 'línea de mejor ajuste' que minimiza los errores de predicción. En medicina, esto se traduce en protocolos de dosificación más precisos, reduciendo tanto el riesgo de subdosificación (ineficacia) como de sobredosificación (toxicidad)."
    intro_text="La **regresión lineal** es uno de los algoritmos fundamentales en machine learning. Encuentra la mejor línea recta que pase lo más cerca posible de todos los puntos de datos, permitiendo hacer predicciones precisas sobre nuevos casos."
    steps="Ajusta los Parámetros:Mueve los controles deslizantes para cambiar la pendiente y la intersección de la línea. Observa cómo cambia el error total y la calidad del ajuste.|Compara Métricas de Error:Experimenta con diferentes métricas (L1 vs L2) para entender cómo cada una evalúa la calidad del modelo de manera diferente.|Encuentra la Solución Óptima:Usa el botón 'Encontrar Mejor Ajuste' para que el algoritmo calcule automáticamente los parámetros óptimos que minimizan el error."
>}}

{{< demo-wrapper title="Optimizador de Regresión Lineal" >}}

{{< game-results >}}

{{< linear-regression-game >}}

{{< /demo-wrapper >}}

## Conceptos Fundamentales

### Métodos de Error

{{% notice style="info" title="Tipos de Métricas de Error" %}}
Hay dos formas principales de medir qué tan bien nuestra línea de predicción se ajusta a los datos:

**Error Medio Absoluto (L1)**
: Calcula el promedio de las diferencias absolutas entre valores predichos y reales. Es más robusto contra valores atípicos y se prefiere cuando los datos tienen ruido.

**Error Cuadrático Medio (L2)**
: Calcula el promedio de las diferencias al cuadrado entre valores predichos y reales. Penaliza más los errores grandes y es el método más común en regresión lineal.
{{% /notice %}}

{{% notice style="tip" title="Estrategias de Optimización" %}}
- **Ajuste manual**: Permite entender intuitivamente cómo los parámetros afectan al ajuste
- **Optimización automática**: El algoritmo encuentra los parámetros óptimos minimizando la función de error
- **Validación visual**: Observa cómo la línea se ajusta a los datos para detectar problemas
{{% /notice %}}

{{< terminal >}}
