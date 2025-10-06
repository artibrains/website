---
title: "El Descubridor de Grupos Ocultos: K-Means Interactivo"
description: "Visualizador interactivo del algoritmo K-Means para descubrir perfiles de pacientes ocultos, inspirado en el proyecto del Hospital Minermont."
weight: 1
draft: true
slug: "kmeans-grupos-ocultos"
---

## Introducción

El algoritmo **K-Means** es una poderosa herramienta de aprendizaje no supervisado cuya misión es explorar un conjunto de datos y descubrir "grupos" o "clusters" ocultos sin necesidad de etiquetas previas. Funciona agrupando los puntos de datos que son más similares entre sí, permitiendo revelar la estructura inherente de la información.

{{< medical-context 
    type="hospital" 
    level="intermediate" 
    scenario="Un hospital necesita identificar perfiles de pacientes similares basándose en síntomas y características clínicas, sin saber de antemano cuántos grupos diferentes existen. El objetivo es descubrir subgrupos de pacientes que podrían beneficiarse de tratamientos especializados."
    highlight="K-Means revela grupos ocultos de pacientes con características similares, permitiendo al hospital desarrollar protocolos de tratamiento personalizados para cada subgrupo identificado, mejorando la eficacia del cuidado médico."
>}}

## Demostración Interactiva

{{< demo-wrapper title="Explorador de Clusters K-Means" >}}

{{< kmeans_intro_es >}}

{{< kmeans >}}

{{< /demo-wrapper >}}

## Conceptos Fundamentales

### El Método del Codo: Encontrando el K Óptimo

{{% notice style="info" title="¿Qué es el Método del Codo?" %}}
El Método del Codo es una técnica heurística fundamental para determinar el número óptimo de clusters (K) en un conjunto de datos. Funciona ejecutando K-Means para diferentes valores de K y calculando la suma de errores cuadrados (SSE) o "inercia" para cada valor.

**Proceso:**
1. **Ejecutar K-Means** para un rango de valores de K (de 1 a 10)
2. **Calcular la Inercia (SSE)** para cada K: `SSE = Σ(distancia² entre cada punto y su centroide)`
3. **Graficar la Curva** (K en eje X, inercia en eje Y)
4. **Encontrar el "Codo"** donde la tasa de disminución se ralentiza
{{% /notice %}}

{{% notice style="tip" title="Interpretación y Aplicación" %}}
- **Pocos clusters (K pequeño)**: Inercia alta, puntos lejos de centroides
- **Muchos clusters (K grande)**: Inercia baja, pero riesgo de sobreajuste
- **K óptimo**: Equilibrio entre compacidad y simplicidad del modelo

El punto óptimo está donde la curva forma un "codo", indicando que añadir más clusters no mejora significativamente la agrupación.
{{% /notice %}}

### Algoritmo K-Means Paso a Paso

{{% notice style="warning" title="Proceso Iterativo" %}}
K-Means utiliza un proceso iterativo de refinamiento:

1. **Inicialización**: Colocar K centroides aleatoriamente
2. **Asignación**: Asignar cada punto al centroide más cercano
3. **Actualización**: Recalcular posición de centroides como promedio de sus puntos
4. **Repetir** hasta convergencia (centroides dejan de moverse significativamente)
{{% /notice %}}

{{< terminal >}}
