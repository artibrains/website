---
title: "3 - Sistemas de clasificación y evaluación de modelos"
type: "chapter"
weight: 3
draft: true
slug: "clasificacion-evaluacion-modelos"
---

Con el éxito del modelo de regresión lineal, el equipo del hospital ha ganado confianza y credibilidad. Ahora, se enfrentan a un nuevo tipo de desafío: no solo predecir cantidades, sino clasificar resultados. Su nuevo objetivo es predecir si un paciente faltará a su cita, un problema de **clasificación binaria** con un gran impacto económico y operativo.

Este capítulo te sumerge en las técnicas y dilemas que el equipo debe resolver para construir un modelo de clasificación fiable. Aprenderás que crear el modelo es solo el principio; evaluarlo correctamente y asegurar que generalice bien a nuevos casos es igual de importante.

A lo largo de las siguientes secciones interactivas, explorarás:

1.  **[El Traductor de Probabilidades]({{< relref "Chapter 3/probabilities_translator/probabilities_translator.es.md" >}})**: Descubrirás la **regresión logística**, el motor del nuevo modelo del equipo. Verás cómo transforma los datos de un paciente en una probabilidad de ausencia.
2.  **[El clasificador]({{< relref "Chapter 3/juego-sigmoide/juego-sigmoide.es.md" >}})**: Aprenderás a encontrar la frontera de clasificación óptima ajustando los diferentes parámetros del modelo. Experimentarás con el **umbral de decisión** y cómo afecta a las predicciones.
3.  **[El Gestor de Riesgos]({{< relref "Chapter 3/risk_gestor/risk_gestor.es.md" >}})**: Te pondrás en la piel de un gestor y ajustarás el **umbral de decisión** del modelo. Experimentarás el equilibrio crítico entre el coste de los falsos positivos y los falsos negativos.
4.  **[El Validador Honesto]({{< relref "Chapter 3/k_fold_validator/k_fold_validator.es.md" >}})**: Entenderás por qué una simple prueba no es suficiente. Compararás la validación simple con la **validación cruzada (K-Fold)**, el método que el equipo elige para obtener una medida de error estable y fiable.
5.  **[El Domador de Complejidad]({{< relref "Chapter 3/complexity/complexity.es.md" >}})**: Lucharás contra el **sobreajuste (overfitting)**. Ajustarás la complejidad y la **regularización** para crear un modelo que aprenda patrones reales sin memorizar el ruido, asegurando que funcione bien con los futuros pacientes.

Prepárate para profundizar en el arte de la clasificación y la evaluación, dos pilares fundamentales para cualquier aplicación de inteligencia artificial en el mundo real.