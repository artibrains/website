---
title: "Árbol de Decisión: El Juego del Triaje"
description: "Visualización interactiva de cómo un árbol de decisión construye reglas para clasificar, inspirado en el juego 'Quién es Quién'."
weight: 2
draft: true
slug: "arbol-decision-triaje"
---

## Introducción

Un **Árbol de Decisión** es un modelo predictivo que aprende una serie de reglas simples, similares a un diagrama de flujo, para llegar a una conclusión. Al igual que en el juego 'Quién es Quién', el algoritmo busca la secuencia de preguntas más eficiente para clasificar un caso con la menor cantidad de pasos posible.

{{< demo-intro 
    title="Visualizador de Árbol de Decisión: ¿Qué Paciente Es?"
    algorithm_type="Clasificación interpretable"
    difficulty="beginner"
    medical_scenario="Un médico de urgencias necesita un sistema de triaje que le ayude a clasificar pacientes rápidamente. Basándose en síntomas y datos básicos, debe determinar la prioridad de atención sin revisar historiales completos."
    medical_highlight="Un Árbol de Decisión construye el 'protocolo de preguntas' perfecto. Aprende qué características son las más distintivas para clasificar a los pacientes, permitiendo al médico tomar decisiones rápidas y fundamentadas siguiendo un camino claro y explicable."
    intro_text="Un **Árbol de Decisión** es un modelo que crea una secuencia de preguntas para llegar a una conclusión, funcionando como un juego de '¿Qué Paciente Es?'. Su gran ventaja es la **interpretabilidad**: cada decisión se puede explicar paso a paso."
    steps="Define el Grupo de Pacientes:Elige el conjunto de pacientes que el modelo debe aprender a diferenciar. Cada uno tiene un perfil único con distintos síntomas, historial y datos demográficos.|Construye el Protocolo de Preguntas:Pulsa 'Entrenar Árbol'. El algoritmo encontrará la secuencia de preguntas más eficiente, colocando la que mejor distingue a los pacientes en la raíz del árbol.|Sigue la Ruta de Identificación:Explora el árbol generado. Cada nodo es una pregunta clínica. Sigue las respuestas ('sí' o 'no') para ver cómo el modelo te guía hasta identificar al paciente correcto."
>}}
    
## Demostración Interactiva

{{< demo-wrapper title="Constructor de Árboles de Decisión" >}}

{{< decision-tree >}}

{{< /demo-wrapper >}}

## Conceptos Fundamentales

### ¿Cómo Construye las Preguntas?

{{% notice style="info" title="División Óptima" %}}
En cada nodo del árbol, el algoritmo busca la pregunta que mejor separe los datos en grupos más "puros" (homogéneos). Esto se mide usando métricas como:

- **Entropía**: Mide el desorden en los datos
- **Índice de Gini**: Probabilidad de clasificar incorrectamente
- **Ganancia de información**: Cuánto reduce la incertidumbre una pregunta
{{% /notice %}}

### Ventajas y Limitaciones

{{% notice style="tip" title="Interpretabilidad" %}}
**Ventajas principales:**
- Fáciles de interpretar y explicar
- No requieren normalización de datos
- Manejan tanto variables numéricas como categóricas
- Pueden modelar relaciones no lineales

**Limitaciones importantes:**
- Propensos al sobreajuste con datos complejos
- Inestables (pequeños cambios pueden generar árboles muy diferentes)
- Pueden crear sesgos hacia variables con más niveles
{{% /notice %}}

{{% notice style="warning" title="Prevención del Sobreajuste" %}}
Para evitar que el árbol memorice los datos de entrenamiento:
- **Poda**: Eliminar ramas que no mejoran la generalización
- **Profundidad máxima**: Limitar cuántos niveles puede tener
- **Mínimo de muestras**: Requerir un número mínimo de casos por hoja
{{% /notice %}}


{{< terminal >}}

{{% notice style="warning" title="Control de la Complejidad" %}}
Los árboles pueden crecer demasiado y sobreajustarse a los datos de entrenamiento. Por eso es importante controlar su profundidad máxima y el número mínimo de muestras por nodo.
{{% /notice %}}

{{< terminal >}}
