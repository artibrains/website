---
title: "1.5 Deep Blue vs AlphaGo"
description: "Comparación técnica entre Deep Blue y AlphaGo, dos hitos en la historia de la inteligencia artificial."
weight: 71
date: 2025-04-18
slug: "deep-blue-vs-alphago"
---

# Deep Blue vs AlphaGo

## Historia de Deep Blue y AlphaGo

### Deep Blue

Deep Blue comenzó como un proyecto llamado "Deep Thought" en la Universidad Carnegie Mellon en 1985. Fue desarrollado por tres estudiantes de posgrado: Feng-hsiung Hsu, Murray Campbell y Thomas \Anatharaman. El proyecto evolucionó con el apoyo de IBM, que invirtió 10 millones de dólares para convertirlo en una máquina capaz de competir contra humanos en ajedrez.

En 1996, Deep Blue enfrentó al campeón mundial de ajedrez Garry Kasparov, perdiendo el encuentro con un marcador de 4:2. Sin embargo, tras un año de mejoras, Deep Blue logró vencer a Kasparov en 1997, convirtiéndose en la primera máquina en derrotar a un campeón mundial en un partido estándar. Este logro fue posible gracias a su capacidad para calcular 200 millones de posiciones por segundo, utilizando 480 procesadores especializados en ajedrez.

{{< youtube-video url="https://www.youtube.com/watch?v=KF6sLCeBj0s" id="KF6sLCeBj0s" alt="Deep Blue vs Kasparov" caption="Un análisis del histórico enfrentamiento entre Deep Blue y Garry Kasparov en 1997." >}}

### AlphaGo

AlphaGo, desarrollado por DeepMind, marcó un enfoque completamente diferente al de Deep Blue. En lugar de depender de reglas predefinidas y fuerza bruta, AlphaGo utilizó redes neuronales profundas y aprendizaje por refuerzo. Su política de aprendizaje supervisado se basó en millones de partidas jugadas por humanos, mientras que su red de valor evaluaba posiciones para determinar las mejores jugadas.

AlphaGo sorprendió al mundo en 2016 al derrotar al campeón mundial de Go, Lee Sedol, en un juego que muchos consideraban demasiado complejo para las máquinas debido a su vasto espacio de búsqueda.

{{< youtube-video url="https://www.youtube.com/watch?v=NP8xt8o4_5Q" id="NP8xt8o4_5Q" alt="AlphaGo vs Lee Sedol" caption="Un resumen del icónico partido donde AlphaGo derrotó al campeón mundial Lee Sedol." >}}

A diferencia de Deep Blue, AlphaGo no intentaba predecir todos los resultados posibles, sino que analizaba las posiciones y tomaba decisiones basadas en probabilidades de éxito.

{{< youtube-video url="https://www.youtube.com/watch?v=WXuK6gekU1Y&t=1s" id="WXuK6gekU1Y" alt="Cómo funciona AlphaGo" caption="Una explicación técnica sobre los algoritmos detrás de AlphaGo." >}}

### Impacto

Mientras que Deep Blue demostró la capacidad de las máquinas para superar a los humanos en tareas específicas mediante fuerza bruta, AlphaGo representó un cambio de paradigma al mostrar cómo las máquinas pueden aprender y desarrollar estrategias más allá de la comprensión humana. Ambos hitos han inspirado avances significativos en inteligencia artificial y aprendizaje automático.

## Comparación técnica de dos hitos en la historia de la Inteligencia Artificial.

| Categoría            | Deep Blue (Ajedrez)                      | AlphaGo (Go)                                  |
| -------------------- | --------------------------------------- | --------------------------------------------- |
| Tablero              | 8x8                                     | 19x19                                         |
| Jugadas por turno    | ~35                                     | ~250                                          |
| Partidas posibles    | ~10¹²⁰  Este número se conoce como el **Shannon Number**, una estimación clásica de la complejidad del ajedrez.                                  | \>10⁷⁶⁰ El número de posibles partidas de Go es tan grande que supera el número de átomos en el universo observable.                                  |
| Paradigma            | Búsqueda + heurísticas humanas          | Aprendizaje profundo + búsqueda Monte Carlo   |
| Modelo de decisión   | Determinista (sin aprendizaje)          | Basado en datos, aprende por refuerzo         |
| Procesamiento        | ~200 millones de posiciones/segundo     | Miles de evaluaciones inteligentes/segundo    |
| Elementos clave      | - Búsqueda alfa-beta - Evaluación manual - Bases de datos de aperturas/finales | - Red de política - Red de valor - Monte Carlo Tree Search |
| Significado histórico | Domina con fuerza bruta un espacio complejo pero manejable | Aprende estrategias emergentes en un espacio inabarcable |

En resumen, Deep Blue y AlphaGo representan dos enfoques distintos para la inteligencia artificial: uno basado en la fuerza bruta y el conocimiento experto, y el otro en el aprendizaje profundo y la exploración. Ambos lograron hitos impresionantes en sus respectivos campos y han allanado el camino para futuros avances en la IA.Ambos sistemas, aunque diferentes en su enfoque, han demostrado el potencial de la inteligencia artificial para abordar problemas complejos. Deep Blue y AlphaGo no solo marcaron hitos en sus respectivos campos, sino que también abrieron el camino para futuras innovaciones en el aprendizaje automático y la inteligencia artificial.

## Referencias

- [IBM's Deep Blue vs Google's AlphaGo - Rebellion Research](https://blog.rebellionresearch.com/blog/ibm-s-deep-blue-vs-google-s-alphago-gary-kasparov)
- [Deep Blue - IBM Research](https://www.ibm.com/ibm/history/ibm100/us/en/icons/deepblue/)
- [AlphaGo - DeepMind](https://deepmind.com/research/highlighted-research/alphago)