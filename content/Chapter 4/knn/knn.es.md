---
title: "K-Nearest Neighbors (K-NN): Clasificación por Proximidad"
description: "Aprende cómo funciona el algoritmo K-NN para clasificación a través de una visualización interactiva"
weight: 1
draft: true
slug: "knn-clasificacion-proximidad"
---

## Introducción

El algoritmo **K-Nearest Neighbors** (K-NN) es uno de los algoritmos de aprendizaje automático más simples y efectivos para tareas de clasificación. Su funcionamiento se basa en una premisa intuitiva: "dime con quién andas y te diré quién eres".

{{< demo-intro 
    title="Clasificador K-NN Interactivo"
    algorithm_type="Clasificación supervisada"
    difficulty="beginner"
    medical_scenario="Un veterinario necesita clasificar automáticamente las radiografías de mascotas entre gatos y perros basándose en características anatómicas medidas. Dispone de un conjunto de radiografías ya etiquetadas como entrenamiento."
    medical_highlight="K-NN permite al veterinario clasificar nuevas radiografías comparándolas con las K radiografías más similares en su base de datos histórica, aprovechando patrones conocidos para diagnósticos rápidos y precisos."
    intro_text="El algoritmo **K-NN** clasifica nuevos datos basándose en la proximidad a datos conocidos. Es un método de **aprendizaje perezoso** que no construye un modelo explícito, sino que utiliza directamente los datos de entrenamiento."
    steps="Selecciona el valor de K:Elige cuántos vecinos cercanos considerar para la clasificación. Un K pequeño es más sensible al ruido, mientras que un K grande suaviza las decisiones.|Observa las distancias:Haz clic en cualquier punto para ver cómo se calculan las distancias a todos los puntos de entrenamiento y cuáles son los K vecinos más cercanos.|Analiza la clasificación:El punto se clasifica según la clase mayoritaria entre sus K vecinos más cercanos. Experimenta con diferentes valores de K para ver cómo cambia la clasificación."
>}}

## Demostración Interactiva

{{< demo-wrapper title="Clasificador K-NN: ¿Gato o Perro?" >}}

{{< knn_intro_es >}}

{{< knn >}}

{{< /demo-wrapper >}}

## Conceptos Fundamentales

{{% notice style="info" title="¿Cómo Funciona K-NN?" %}}
K-NN es un algoritmo de **aprendizaje perezoso** (lazy learning) que no construye un modelo explícito durante el entrenamiento. En su lugar, cuando necesita clasificar un nuevo punto:

1. **Calcula la distancia** entre el punto a clasificar y todos los puntos en el conjunto de entrenamiento.
2. **Selecciona los K vecinos más cercanos** basándose en esta distancia.
3. **Asigna la clase** que sea más común entre estos K vecinos (votación por mayoría).
{{% /notice %}}

{{% notice style="tip" title="Consideraciones Importantes" %}}
- **Valor de K**: Un K pequeño puede ser sensible al ruido, mientras que un K grande puede suavizar demasiado las fronteras de decisión.
- **Medida de distancia**: La distancia euclidiana es común, pero otras métricas pueden ser más apropiadas según el problema.
- **Normalización**: Es importante normalizar las características cuando tienen diferentes escalas.
{{% /notice %}}

{{< terminal >}}
