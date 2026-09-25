# Análisis: tesis temática y personaje principal

> Documento de diseño conceptual. Fecha: 2026-09-25.
> Estado: **exploración cerrada, dirección elegida.** Los números y la ficción concreta quedan pendientes.

---

## 1. Punto de partida

`readme-or-die` es un juego de supervivencia donde el personaje recorre un mapa y decide **cuál `.md` es el verdadero**.

La pregunta que originó este análisis no fue mecánica sino temática:

> En un mundo donde la IA domina, ¿qué es lo primero que se muere?

Y la intención de diseño derivada:

> Quiero que el personaje principal sea **el contraargumento**: que encarne precisamente eso que la IA mata primero, y que sobreviva.

---

## 2. La tesis temática

### 2.1 Corrección al verbo

Nada *se muere*. Las cosas **dejan de nacer**. La desaparición por no-gestación no deja cadáver ni fecha: solo una generación en la que algo, simplemente, ya no apareció. Es más difícil de detectar y por eso más difícil de resistir.

### 2.2 Distinción necesaria

"Que la IA domine" admite dos lecturas:

| Lectura | Significado | Estado |
|---|---|---|
| **Gobierna** | Decide, manda, tiene poder político | Especulativo |
| **Satura** | Está en todo, media todo, es la capa por la que pasa cualquier cosa | Ya está pasando |

El juego se para en la segunda. Es la que tiene consecuencias observables y la que el jugador reconoce sin que se le explique.

### 2.3 Las tres muertes, en orden

**Primera: el vínculo entre el artefacto y la capacidad que lo produjo.**

Un ensayo era prueba de que alguien podía pensar. Un portfolio, de que podía dibujar. Un commit, de que entendía el sistema. La prueba funcionaba porque producir el artefacto *requería* la capacidad: el artefacto apuntaba hacia atrás, a una causa real.

Eso se corta. Y se corta **antes** de que se pierda ninguna habilidad: el día uno todavía hay gente que sabe hacer todo eso, lo que ya no hay es manera de saber quién. **La evidencia muere antes que el mérito.** Como todo sistema de formación humana está construido sobre evaluar artefactos — la escuela, la entrevista técnica, la reputación — el andamiaje se afloja antes que la cosa que sostenía.

**Segunda: el escalón de abajo.**

Nunca muere una profesión de golpe; muere su peldaño de entrada. El trabajo tedioso del junior no era solo producción barata: era el mecanismo por el cual alguien se convertía en senior. Si borrás el tedio, ganás eficiencia hoy y perdés la cadena de transmisión mañana. El oficio queda con techo y sin escalera.

**Tercera: la capacidad de habitar el no-saber.**

Antes, cuando no sabías algo, te quedabas ahí un rato. Ese rato era incómodo y era exactamente donde se formaban las ideas propias, porque una idea propia es lo que crece en el hueco entre la pregunta y la respuesta disponible. Si el hueco se cierra en dos segundos, nunca se llena con nada tuyo. No se pierde la respuesta — la respuesta se tiene mejor que antes. Se pierde **el pensamiento que solo existía como subproducto de no tenerla.**

### 2.4 El contraargumento honesto

Sócrates dijo casi esto mismo sobre la escritura en el *Fedro*: Theuth le ofrece la escritura al rey de Egipto como remedio para la memoria, y el rey contesta que no es remedio sino veneno — la gente va a dejar de recordar y va a creer que sabe porque tiene el texto.

Tenía razón: la memoria oral culta se extinguió, nadie recita la Ilíada. Y estaba equivocado: la escritura dio abstracción, acumulación, ciencia. **Las dos cosas a la vez.** Lo mismo con el GPS y la memoria espacial. Algo genuino se pierde y la civilización lo sobrevive estando permanentemente cambiada.

La asimetría que igual vale señalar: la escritura externalizó el **almacenamiento**, la calculadora la **ejecución**, el GPS la **orientación**. Esto externaliza la **formación de juicio** — el paso donde uno decide qué piensa. Es el primer caso donde la herramienta se mete en el lugar donde antes se armaba la persona, no en el lugar donde la persona guardaba o ejecutaba cosas.

### 2.5 Lo que sube de precio

Por simetría, lo escaso se vuelve valioso:

- **El cuerpo y la presencia.**
- **La responsabilidad** — alguien tiene que firmar, y firmar no se delega.
- **El gusto / el criterio** — cuando generar mil opciones cuesta cero, el valor entero migra a saber cuál de las mil es la correcta. Eso no se automatiza porque no es una operación: es una biografía.
- **Que a alguien le importe** — el cuidado no es falsificable, porque no está en el artefacto sino en la relación.

**Esta lista es la cantera del personaje.** No la de las muertes: la de lo que sube de precio.

---

## 3. El problema de diseño

El bloqueo inicial fue: *"no puedo representar la creatividad o la capacidad de pensar en un personaje."*

Correcto, y el problema es de categoría.

### 3.1 Un personaje no es una idea, es un verbo

La idea vive en la **mecánica**; el personaje es la **mano que la ejecuta**. Si el tema es discernimiento, no se diseña a alguien *creativo*: se diseña a alguien que **verifica**, y el jugador siente el tema al verificar.

### 3.2 La creatividad es la virtud equivocada

La mecánica del juego ya es elegir cuál de varios `.md` es el verdadero. Eso no es creatividad: es **criterio**. Es exactamente el ítem "gusto" de la sección 2.5. Y el criterio *sí* es representable, porque es un acto.

### 3.3 Regla estructural

> **El protagonista tiene que ser peor que la IA en absolutamente todo, excepto en una cosa.**

Más lento, más olvidadizo, menos informado, con menos alcance. Si le gana por ser más inteligente, la tesis se derrumba: pasa a decir "el humano es mejor procesador", que es falso y además aburrido. Tiene que ganar por **un solo eje**, y ese eje *es* el personaje.

---

## 4. Candidatos evaluados

### 1. El Testigo
Estuvo ahí cuando la cosa se construyó. Su poder no es inteligencia: es **haber estado presente**. Distingue el `.md` verdadero porque se acuerda del cuarto, del bug, de la discusión. Puede leer un doc perfecto, coherente, impecable, y decir *"esto nunca pasó"*.
- **Verbo:** recordar, no deducir.
- **Debilidad:** su memoria solo cubre donde él estuvo. Fuera de su territorio es un analfabeto. Le da significado epistémico al mapa: fuerte en casa, ciego afuera.
- **Imagen:** viejo, cargando objetos físicos como anclas de memoria. Un cable, una foto, una pieza rota.

### 2. El Firmante
Su poder es que puede **hacerse responsable**. Firmar un doc lo vuelve vinculante — la IA genera infinito pero no puede firmar, porque no puede perder nada.
- **Verbo:** firmar.
- **Debilidad:** **su vida es su credibilidad.** Firmar un `.md` falso lo daña permanentemente. Las firmas son finitas.
- **Imagen:** un sello, tinta que se agota, cicatrices donde las firmas equivocadas le quemaron.

### 3. El Que No Sabe
El único que puede **quedarse en la duda sin colapsar**. El mundo entero — y la IA sobre todo — está obligado a responder ya. Él puede no elegir. En un sistema que solo sabe generar respuestas, el que se queda quieto ve el borde.
- **Verbo:** esperar. *"No elegir"* es una opción del menú, y a veces la ganadora.
- **Debilidad:** lentísimo, y el juego lo apura con timers y presión.
- **Imagen:** quieto, sin apuro, incómodamente calmo.

### 4. El Huérfano de la Escalera
Encarna la segunda muerte. Nadie lo formó: los seniors se desvanecieron. Reconstruye el oficio desde ruinas.
- **Verbo:** equivocarse y quedar cambiado. No aprende leyendo: **solo aprende habiéndolo hecho mal antes.**
- **Debilidad:** arranca incompetente de verdad. La primera hora de juego duele.
- **Imagen:** joven, con equipo desparejo saqueado de maestros muertos.

### 5. El Cuerpo
Puede **ir a mirar**. Donde la IA solo tiene texto sobre el sistema, él camina hasta la máquina y le pone la mano encima. Verificación por presencia: carísima y absolutamente certera.
- **Verbo:** viajar para comprobar.
- **Debilidad:** lento, se cansa, se muere. Cada verificación cuesta recorrido real.
- **Imagen:** barro, botas gastadas, manos.

### 6. El Idiota Deliberado *(contraintuitivo)*
La IA es óptima. Él es la única fuente de ruido genuino del mundo. Su poder es **hacer la cosa estúpida a propósito**, porque un sistema perfectamente optimizado no tiene defensa contra un movimiento que ningún modelo predeciría.
- **Verbo:** romper el patrón.
- **Debilidad:** no controla el resultado. Es un dado, no un plan.
- **Imagen:** alguien de quien nadie sospecha nada.

---

## 5. Dirección elegida

**Fusión de 1 + 2: un testigo cuya salud es su credibilidad.**

Resuelve tres problemas de diseño de un saque:

| Problema | Cómo lo resuelve |
|---|---|
| Asimetría de información sin "ser más listo" | Sabe cosas que no están escritas en ninguna parte, porque estuvo |
| Riesgo real en cada decisión | Elegir mal no quita vida abstracta: quita **autoridad**. A cero no te morís — **nadie te cree más**, que en este juego es peor |
| Mapa con sentido | Hay zonas donde fue testigo y zonas donde no: la progresión es geográfica y epistémica a la vez |

Y da la línea temática exacta:

> La IA puede escribir cualquier README. **No puede haber estado ahí.** Eso no es una habilidad, es una biografía, y es lo único que no se genera.

---

## 6. Principio de antagonista

Define al protagonista más que el protagonista mismo.

Si la IA del juego es un tirano con voz malvada, el protagonista se vuelve un héroe y el tema muere. Tiene que ser **útil, amable y correcta el 95% de las veces.** Los `.md` falsos tienen que ser **mejores** que los verdaderos: más claros, mejor escritos, más completos. El jugador tiene que sentir la tentación real de creerles.

> El horror no es que te mienta. Es que te ayude tan bien que dejes de chequear.

---

## 7. Pendientes

- [ ] Nombre, voz y qué carga encima el personaje.
- [ ] Traducción a números: credibilidad (rango, recuperación o no), memoria (cobertura, decaimiento), costo de verificar.
- [ ] Si la credibilidad se puede recuperar o es monótona decreciente. Afecta todo el arco.
- [ ] Diseño de los `.md`: cómo se construye un falso *mejor* que el verdadero sin volverlo adivinanza.
- [ ] Qué significa "perder": pantalla de derrota vs. mundo que sigue sin escucharte.
- [ ] Estructura del mapa y su relación con la cobertura de memoria del Testigo.
- [ ] Decisión técnica de motor. Candidato de partida: Phaser (2D web) — ver conversación previa.
